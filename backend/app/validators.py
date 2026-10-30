# 1. Imports
from typing import Literal
from pydantic import BaseModel
from app.models import TaxDocument


FIELD_ALIASES = {
    "W-2": {
        "wages_tips_other_compensation": "box_1_wages",
        "federal_income_tax_withheld": "box_2_federal_tax_withheld",
        "box_1_wages": "box_1_wages",
        "box_2_federal_tax_withheld": "box_2_federal_tax_withheld",
    }
}

def normalize_fields(document: TaxDocument) -> TaxDocument:
    aliases = FIELD_ALIASES.get(document.document_type, {})

    for field in document.fields:
        field.name = aliases.get(field.name, field.name)

    return document


REQUIRED_FIELDS = {
    "W-2": [
        "employee_name",
        "employer_name",
        "box_1_wages",
        "box_2_federal_tax_withheld",
    ],
    "1099-INT": [
        "payer_name",
        "recipient_name",
        "box_1_interest_income",
    ],
    "1042-S": [
        "recipient_name",
        "income_code",
        "gross_income",
    ],
}


class ValidationFinding(BaseModel):
    code: str
    field: str
    severity: Literal["low", "medium", "high"]
    message: str
    recommendation: str


def validate_document(document: TaxDocument) -> list[ValidationFinding]:
    findings = []

    if document.document_type == "UNKNOWN":
        findings.append(
            ValidationFinding(
                code="UNSUPPORTED_DOCUMENT",
                field="document_type",
                severity="high",
                message="This document type is not supported.",
                recommendation="Upload a supported tax document."
            )
        )
        return findings

    extracted_fields = {
        field.name: field.value
        for field in document.fields
    }

    required = REQUIRED_FIELDS.get(
        document.document_type,
        []
    )

    for field_name in required:
        value = extracted_fields.get(field_name)

        if value is None or not str(value).strip():
            findings.append(
                ValidationFinding(
                    code="FIELD_NOT_EXTRACTED",
                    field=field_name,
                    severity="medium",
                    message=f"Could not extract {field_name}.",
                    recommendation=(
                        "Verify the information against "
                        "the original document."
                    )
                )
            )

    return findings