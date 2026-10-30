import pymupdf
from fastapi.testclient import TestClient
from app.main import app
from app.models import TaxDocument, TaxField
from unittest.mock import patch

client = TestClient(app)


def create_sample_pdf(text: str) -> bytes:
    document = pymupdf.open()

    page = document.new_page()
    page.insert_text((72, 72), text)

    pdf_bytes = document.tobytes()
    document.close()

    return pdf_bytes


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_valid_pdf():
    pdf_bytes = create_sample_pdf("Synthetic W-2 Tax Document")

    mock_document = TaxDocument(
        document_type="W-2",
        tax_year=2025,
        fields={"employee_name": TaxField(value="John Doe", source_page=1)},
    )

    with patch("app.main.extract_tax_document", return_value=mock_document):
        response = client.post(
            "/api/review", files={"file": ("sample.pdf", pdf_bytes, "application/pdf")}
        )

    assert response.status_code == 200

    data = response.json()

    assert data["document"]["document_type"] == "W-2"
    assert data["document"]["fields"]["employee_name"]["value"] == "John Doe"


def test_invalid_pdf():
    response = client.post(
        "/api/review",
        files={"file": ("invalid.pdf", b"not a real PDF", "application/pdf")},
    )

    assert response.status_code == 400


def test_oversized_pdf():
    response = client.post(
        "/api/review",
        files={
            "file": (
                "large.pdf",
                b"%PDF-" + b"x" * (5 * 1024 * 1024),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 413


def test_empty_pdf():
    document = pymupdf.open()
    document.new_page()

    pdf_bytes = document.tobytes()
    document.close()

    response = client.post(
        "/api/review", files={"file": ("empty.pdf", pdf_bytes, "application/pdf")}
    )

    assert response.status_code == 422
