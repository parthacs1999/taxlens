# TaxLens

TaxLens is an AI-powered tax document review tool I built to explore how LLMs can help automate document processing while keeping validation predictable and explainable.

The goal is to reduce the manual effort involved in reviewing tax documents and identifying inconsistencies across multiple forms.

**Live Demo:** https://taxlens-eta.vercel.app

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

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your_api_key
```

Start the API:

```bash
uvicorn app.main:app --reload
```

In another terminal, start the frontend from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the application at `http://localhost:3000`.

By default, the frontend connects to `http://localhost:8000`. For a different backend URL, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

## Sample Documents

The project includes synthetic PDF files for testing. No real taxpayer information is required.

| File | Description | Expected Result |
|---|---|---|
| `demo_valid_w2.pdf` | Valid 2025 W-2 for John Doe | Successful extraction, no findings |
| `demo_missing_withholding.pdf` | W-2 missing federal tax withholding | Missing Box 2 finding |
| `demo_1099_int.pdf` | Valid 2025 1099-INT for John Doe | Successful extraction, no findings |
| `demo_1042_s.pdf` | Valid 2025 1042-S | Successful extraction |
| `demo_unsupported.pdf` | University enrollment document | Unsupported document finding |
| `demo_scanned_w2.pdf` | Image-only PDF | Error explaining that OCR is not supported |
| `demo_mismatched_1099_int.pdf` | 2024 1099-INT for Jon Doe | Name and tax-year mismatches when compared with the valid W-2 |

Sample PDFs are stored in `frontend/public/samples/`.

## Example Tests

### 1. Document Review

Open **Document Review** and upload `demo_valid_w2.pdf`.

Expected output:
- Document type: `W-2`
- Tax year: `2025`
- Employee name: `John Doe`
- Wages: `$52,000`
- Federal income tax withheld: `$6,200`
- Validation findings: `0`

To test missing-field detection, upload `demo_missing_withholding.pdf`.

Expected output:
- A finding for missing federal income tax withholding (`box_2_federal_tax_withheld`).

### 2. Smart Reconciliation

Open **Smart Reconciliation** and upload:

- `demo_valid_w2.pdf`
- `demo_1099_int.pdf`

Click **Run Reconciliation**.

Expected output:
- Documents analyzed: `2`
- Consistency findings: `0`
- Status: `review_complete`

Next, upload:

- `demo_valid_w2.pdf`
- `demo_mismatched_1099_int.pdf`

Expected output:
- Documents analyzed: `2`
- Consistency findings: `2`
- `TAX_YEAR_MISMATCH`: 2025 vs. 2024
- `TAXPAYER_NAME_MISMATCH`: John Doe vs. Jon Doe
- Status: `needs_review`

### 3. Missing Critical Field During Reconciliation

Upload:

- `demo_valid_w2.pdf`
- `demo_missing_withholding.pdf`

Expected output:
- `MISSING_CRITICAL_FIELD` for `box_2_federal_tax_withheld`.

## Testing

Run the backend tests:

```bash
cd backend
python -m pytest tests/ -v
```

The current test suite contains 18 passing tests covering API behavior, validation, and reconciliation.

## Limitations

TaxLens is a prototype, not a tax filing application. It currently supports text-based PDFs, and AI-extracted information requires human verification.

Scanned documents are not supported without OCR. The system does not calculate tax liability or determine filing eligibility.

The application is intended for demonstration purposes using synthetic data only.