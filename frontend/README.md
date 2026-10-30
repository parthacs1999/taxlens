# TaxLens

TaxLens is an AI-powered tax document review tool I built to explore how LLMs can help automate document processing while keeping validation predictable and explainable.

The goal is to reduce the manual effort involved in reviewing tax documents and identifying inconsistencies across multiple forms.

## Features

- **Document Review:** Extracts structured information from W-2, 1099-INT, and 1042-S PDFs using Gemini.
- **Smart Reconciliation:** Compares multiple documents to identify mismatched taxpayer names, tax years, and missing critical fields.
- **Validation:** Uses rule-based checks to flag missing information and unsupported documents.
- **International Student Hub:** Provides a basic document checklist based on student-provided information.
- **Evidence:** Displays extracted values, source references, and recommended actions for flagged issues.

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **AI:** Google Gemini
- **PDF Processing:** PyMuPDF
- **Testing:** Pytest

## Running Locally

Clone the repository and start the backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key
```

Start the API:

```bash
uvicorn app.main:app --reload
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the application at `http://localhost:3000`.

## Testing

Run the backend tests:

```bash
cd backend
python -m pytest tests/ -v
```

The current test suite contains 18 passing tests.

The repository also includes synthetic PDF examples for testing successful extraction, missing fields, unsupported documents, and reconciliation mismatches.

## Limitations

TaxLens is a prototype, not a tax filing application. It currently supports text-based PDFs, and AI-extracted information requires human verification. Scanned documents are not supported without OCR.

The application is intended for demonstration purposes using synthetic data only.