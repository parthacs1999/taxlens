from app.models import TaxDocument, TaxField
from app.validators import normalize_fields, validate_document


def test_field_normalization():
    document = TaxDocument(
        document_type="W-2",
        tax_year=2025,
        fields=[
            TaxField(
                name="wages_tips_other_compensation", value="52000.00", source_page=1
            )
        ],
    )

    normalized = normalize_fields(document)

    assert normalized.fields[0].name == "box_1_wages"


def test_valid_w2():
    document = TaxDocument(
        document_type="W-2",
        tax_year=2025,
        fields=[
            TaxField(name="employee_name", value="John Doe"),
            TaxField(name="employer_name", value="Example Technologies"),
            TaxField(name="box_1_wages", value="52000.00"),
            TaxField(name="box_2_federal_tax_withheld", value="6200.00"),
        ],
    )

    findings = validate_document(document)

    assert len(findings) == 0


def test_missing_w2_field():
    document = TaxDocument(
        document_type="W-2",
        tax_year=2025,
        fields=[
            TaxField(name="employee_name", value="John Doe"),
            TaxField(name="box_1_wages", value="52000.00"),
        ],
    )

    findings = validate_document(document)

    missing_fields = {finding.field for finding in findings}

    assert "employer_name" in missing_fields
    assert "box_2_federal_tax_withheld" in missing_fields


def test_unsupported_document():
    document = TaxDocument(document_type="UNKNOWN", fields=[])

    findings = validate_document(document)

    assert findings[0].code == "UNSUPPORTED_DOCUMENT"
