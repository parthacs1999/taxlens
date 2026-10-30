import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.models import TaxDocument

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

synthetic_document = """
SYNTHETIC TEST DOCUMENT

Form W-2
Tax Year: 2025

Employee Name: John Doe
Employer Name: Example Technologies

Box 1 - Wages: 52000.00
Box 2 - Federal Income Tax Withheld: 6200.00
"""

try:
    response = client.models.generate_content(
        model=model,
        contents=f"""
        Extract structured tax information from this document.

        Return:
        - document_type
        - tax_year
        - fields containing extracted values and source pages

        Use page 1 for extracted fields.
        Do not invent missing information.

        DOCUMENT:
        {synthetic_document}
        """,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TaxDocument,
            temperature=0,
        ),
    )

    print("RAW RESPONSE:")
    print(response.text)

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    document = TaxDocument.model_validate_json(response.text)

    print("\nVALIDATED DOCUMENT:")
    print(document.model_dump_json(indent=2))

except Exception as exc:
    print("\nERROR TYPE:", type(exc).__name__)
    print("ERROR DETAILS:", str(exc)[:1500])
