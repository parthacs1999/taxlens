from app.reconciliation import reconcile_documents


def make_document(
    filename,
    document_type="W-2",
    tax_year=2025,
    name="John Doe",
    missing=None,
):
    missing = missing or []

    field_values = {
        "employee_name": name,
        "employer_name": "Example Technologies LLC",
        "box_1_wages": "52000.00",
        "box_2_federal_tax_withheld": "6200.00",
    }

    if document_type == "1099-INT":
        field_values = {
            "payer_name": "Sample Community Bank",
            "recipient_name": name,
            "box_1_interest_income": "184.73",
        }

    if document_type == "1042-S":
        field_values = {
            "recipient_name": name,
            "income_code": "16",
            "gross_income": "12500.00",
            "federal_tax_withheld": "1750.00",
        }

    for field in missing:
        field_values[field] = None

    return {
        "filename": filename,
        "document": {
            "document_type": document_type,
            "tax_year": tax_year,
            "fields": [
                {
                    "name": field,
                    "value": value,
                    "source_page": 1,
                }
                for field, value in field_values.items()
            ],
        },
    }


def finding_codes(result):
    return {finding["code"] for finding in result["findings"]}


def test_matching_documents():
    documents = [
        make_document("w2.pdf", "W-2", 2025, "John Doe"),
        make_document("1099.pdf", "1099-INT", 2025, "JOHN DOE"),
    ]

    result = reconcile_documents(documents)

    assert result["status"] == "review_complete"
    assert result["findings_count"] == 0


def test_name_mismatch():
    documents = [
        make_document("w2.pdf", "W-2", 2025, "John Doe"),
        make_document("1099.pdf", "1099-INT", 2025, "Jon Doe"),
    ]

    result = reconcile_documents(documents)

    assert "TAXPAYER_NAME_MISMATCH" in finding_codes(result)


def test_tax_year_mismatch():
    documents = [
        make_document("w2.pdf", "W-2", 2025),
        make_document("1099.pdf", "1099-INT", 2024),
    ]

    result = reconcile_documents(documents)

    assert "TAX_YEAR_MISMATCH" in finding_codes(result)


def test_missing_taxpayer_name():
    documents = [
        make_document("w2.pdf", "W-2"),
        make_document(
            "1099.pdf",
            "1099-INT",
            missing=["recipient_name"],
        ),
    ]

    result = reconcile_documents(documents)

    assert "MISSING_TAXPAYER_NAME" in finding_codes(result)


def test_missing_critical_field():
    documents = [
        make_document("w2.pdf", "W-2"),
        make_document(
            "w2_missing.pdf",
            "W-2",
            missing=["box_2_federal_tax_withheld"],
        ),
    ]

    result = reconcile_documents(documents)

    assert "MISSING_CRITICAL_FIELD" in finding_codes(result)
    assert result["status"] == "needs_review"


def test_missing_tax_year():
    documents = [
        make_document("w2.pdf", "W-2"),
        make_document(
            "1099.pdf",
            "1099-INT",
            tax_year=None,
        ),
    ]

    result = reconcile_documents(documents)

    assert "MISSING_TAX_YEAR" in finding_codes(result)


def test_unsupported_document():
    documents = [
        make_document("w2.pdf", "W-2"),
        {
            "filename": "unknown.pdf",
            "document": {
                "document_type": "UNKNOWN",
                "tax_year": None,
                "fields": [],
            },
        },
    ]

    result = reconcile_documents(documents)

    assert "UNSUPPORTED_DOCUMENT" in finding_codes(result)


def test_zero_is_valid_value():
    documents = [
        make_document("w2.pdf", "W-2"),
        make_document(
            "1099.pdf",
            "1099-INT",
        ),
    ]

    documents[1]["document"]["fields"].append(
        {
            "name": "box_4_federal_tax_withheld",
            "value": "0.00",
            "source_page": 1,
        }
    )

    result = reconcile_documents(documents)

    assert result["status"] == "review_complete"


def test_requires_multiple_documents():
    try:
        reconcile_documents([make_document("w2.pdf")])
        assert False, "Expected ValueError"
    except ValueError:
        pass
