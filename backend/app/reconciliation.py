from typing import Any

NAME_FIELDS = {
    "W-2": "employee_name",
    "1099-INT": "recipient_name",
    "1042-S": "recipient_name",
}

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
        "federal_tax_withheld",
    ],
}

FIELD_ALIASES = {
    "wages_tips_other_compensation": "box_1_wages",
    "federal_income_tax_withheld": "box_2_federal_tax_withheld",
    "interest_income": "box_1_interest_income",
    "box_4_federal_income_tax_withheld": "box_4_federal_tax_withheld",
    "box_4_federal_tax_withheld": "box_4_federal_tax_withheld",
    "total_withholding_credit": "federal_tax_withheld",
}


def normalize_name(value: str) -> str:
    return " ".join(value.casefold().split())


def normalize_field_name(name: str) -> str:
    normalized = name.strip().lower().replace(" ", "_").replace("-", "_")
    return FIELD_ALIASES.get(normalized, normalized)


def get_field(document: dict[str, Any], name: str) -> dict | None:
    target = normalize_field_name(name)

    for field in document.get("fields", []):
        if normalize_field_name(field.get("name", "")) == target:
            return field

    return None


def get_field_value(document: dict[str, Any], name: str) -> str | None:
    field = get_field(document, name)

    if not field:
        return None

    value = field.get("value")

    if value is None:
        return None

    value = str(value).strip()

    if value.lower() in {
        "",
        "null",
        "none",
        "unknown",
        "unreadable",
        "[unreadable]",
        "not extracted",
        "n/a",
    }:
        return None

    return value


def make_evidence(
    filename: str,
    field: str,
    value: str | None,
    page: int | None,
) -> dict:
    return {
        "document": filename,
        "field": field,
        "value": value,
        "page": page,
    }


def make_finding(
    code: str,
    severity: str,
    message: str,
    evidence: list[dict],
    recommendation: str,
) -> dict:
    return {
        "code": code,
        "severity": severity,
        "message": message,
        "evidence": evidence,
        "recommendation": recommendation,
    }


def reconcile_documents(documents: list[dict[str, Any]]) -> dict:
    if len(documents) < 2:
        raise ValueError("At least two documents are required.")

    findings = []
    years = []
    names = []

    for item in documents:
        filename = item["filename"]
        document = item["document"]
        document_type = document.get("document_type", "UNKNOWN")
        tax_year = document.get("tax_year")

        if document_type == "UNKNOWN":
            findings.append(
                make_finding(
                    code="UNSUPPORTED_DOCUMENT",
                    severity="high",
                    message=f"{filename} is not a supported tax document.",
                    evidence=[
                        make_evidence(
                            filename,
                            "document_type",
                            "UNKNOWN",
                            None,
                        )
                    ],
                    recommendation=(
                        "Upload a supported tax document or review "
                        "this file manually."
                    ),
                )
            )
            continue

        if tax_year is None or str(tax_year).strip() == "":
            findings.append(
                make_finding(
                    code="MISSING_TAX_YEAR",
                    severity="medium",
                    message=f"Tax year could not be verified in {filename}.",
                    evidence=[
                        make_evidence(
                            filename,
                            "tax_year",
                            None,
                            None,
                        )
                    ],
                    recommendation=(
                        "Verify the tax year against the original document."
                    ),
                )
            )
        else:
            years.append((filename, str(tax_year)))

        name_field = NAME_FIELDS.get(document_type)

        if name_field:
            field = get_field(document, name_field)
            value = get_field_value(document, name_field)

            if value:
                names.append(
                    (
                        filename,
                        name_field,
                        value,
                        field.get("source_page") if field else None,
                    )
                )
            else:
                findings.append(
                    make_finding(
                        code="MISSING_TAXPAYER_NAME",
                        severity="medium",
                        message=(
                            f"Taxpayer name could not be verified " f"in {filename}."
                        ),
                        evidence=[
                            make_evidence(
                                filename,
                                name_field,
                                None,
                                None,
                            )
                        ],
                        recommendation=(
                            "Verify taxpayer identity against " "the original document."
                        ),
                    )
                )

        required = REQUIRED_FIELDS.get(document_type, [])

        for required_field in required:
            if required_field == name_field:
                continue

            field = get_field(document, required_field)
            value = get_field_value(document, required_field)

            if value is None:
                findings.append(
                    make_finding(
                        code="MISSING_CRITICAL_FIELD",
                        severity="medium",
                        message=(
                            f"Critical field '{required_field}' "
                            f"could not be extracted from {filename}."
                        ),
                        evidence=[
                            make_evidence(
                                filename,
                                required_field,
                                None,
                                field.get("source_page") if field else None,
                            )
                        ],
                        recommendation=(
                            "Review the original document and verify "
                            "the missing information before proceeding."
                        ),
                    )
                )

    unique_years = {year for _, year in years}

    if len(unique_years) > 1:
        findings.append(
            make_finding(
                code="TAX_YEAR_MISMATCH",
                severity="high",
                message="Documents contain different tax years.",
                evidence=[
                    make_evidence(filename, "tax_year", year, None)
                    for filename, year in years
                ],
                recommendation=(
                    "Verify that all documents belong to the "
                    "intended tax filing year."
                ),
            )
        )

    distinct_names = {normalize_name(value) for _, _, value, _ in names}

    if len(distinct_names) > 1:
        findings.append(
            make_finding(
                code="TAXPAYER_NAME_MISMATCH",
                severity="medium",
                message="Possible taxpayer name mismatch.",
                evidence=[
                    make_evidence(filename, field, value, page)
                    for filename, field, value, page in names
                ],
                recommendation=(
                    "Verify taxpayer identity against the original documents."
                ),
            )
        )

    return {
        "status": "needs_review" if findings else "review_complete",
        "documents_analyzed": len(documents),
        "findings_count": len(findings),
        "findings": findings,
    }
