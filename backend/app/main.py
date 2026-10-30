from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from app.gemini_service import extract_tax_document, GeminiExtractionError
from app.pdf_extractor import extract_pdf_text, PDFExtractionError
from app.validators import normalize_fields, validate_document

app = FastAPI(
    title="TaxLens API", description="AI-powered tax document review", version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024


@app.get("/")
def root():
    return {"message": "Welcome to TaxLens API"}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "taxlens"}


@app.post("/api/review")
async def review_document(file: UploadFile = File(...)):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        pdf_bytes = await file.read(MAX_FILE_SIZE + 1)
    finally:
        await file.close()

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds the 5 MB limit.")

    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF file.")

    try:
        result = extract_pdf_text(pdf_bytes)

    except PDFExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        tax_document = await run_in_threadpool(extract_tax_document, result["pages"])
        tax_document = normalize_fields(tax_document)
        findings = validate_document(tax_document)

    except GeminiExtractionError as exc:
        raise HTTPException(
            status_code=502, detail="AI document extraction is temporarily unavailable."
        ) from exc

    return {
        "filename": file.filename,
        "status": ("needs_review" if findings else "review_complete"),
        "page_count": result["page_count"],
        "document": tax_document.model_dump(),
        "findings": [finding.model_dump() for finding in findings],
    }
