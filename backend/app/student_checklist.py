from typing import Literal
from pydantic import BaseModel, Field

VisaStatus = Literal["F-1", "J-1", "Other"]
IncomeStatus = Literal["yes", "no", "unsure"]
DocumentName = Literal["W-2", "1042-S", "1099-INT"]


class StudentProfile(BaseModel):
    visa_status: VisaStatus
    tax_year: int = Field(ge=2020, le=2100)
    us_income: IncomeStatus
    documents: list[DocumentName] = Field(default_factory=list)


class ChecklistItem(BaseModel):
    title: str
    description: str
    status: Literal["recommended", "check_if_applicable"]
    source_url: str


class StudentChecklistResponse(BaseModel):
    items: list[ChecklistItem]
    disclaimer: str


def generate_student_checklist(
    profile: StudentProfile,
) -> StudentChecklistResponse:
    items = []

    if profile.visa_status in ("F-1", "J-1"):
        items.append(
            ChecklistItem(
                title="Review Form 8843 requirements",
                description=(
                    "Determine whether you qualify to exclude days "
                    "of presence for the substantial presence test. "
                    "If so, Form 8843 generally must be filed."
                ),
                status="recommended",
                source_url=(
                    "https://www.irs.gov/individuals/"
                    "international-taxpayers/substantial-presence-test"
                ),
            )
        )

    items.append(
        ChecklistItem(
            title="Determine tax residency",
            description=(
                "Tax residency depends on your immigration history, "
                "days of presence, and applicable exceptions. "
                "Visa status alone is not sufficient."
            ),
            status="recommended",
            source_url=(
                "https://www.irs.gov/individuals/"
                "international-taxpayers/substantial-presence-test"
            ),
        )
    )

    if profile.us_income in ("yes", "unsure"):
        items.append(
            ChecklistItem(
                title="Review federal income tax filing requirements",
                description=(
                    "If you are a nonresident alien for tax purposes, "
                    "review whether Form 1040-NR is required. "
                    "Different rules may apply to tax residents."
                ),
                status="recommended",
                source_url="https://www.irs.gov/instructions/i1040nr",
            )
        )

    if "W-2" in profile.documents:
        items.append(
            ChecklistItem(
                title="Review Form W-2",
                description=(
                    "Check wages and federal income tax withholding "
                    "against your employer's records."
                ),
                status="recommended",
                source_url=(
                    "https://www.irs.gov/individuals/"
                    "international-taxpayers/aliens-employed-in-the-us"
                ),
            )
        )

    if "1042-S" in profile.documents:
        items.append(
            ChecklistItem(
                title="Review Form 1042-S",
                description=(
                    "Check reported income, withholding, and any "
                    "tax treaty treatment against your records."
                ),
                status="recommended",
                source_url=(
                    "https://www.irs.gov/individuals/"
                    "international-taxpayers/aliens-employed-in-the-us"
                ),
            )
        )

    if "1099-INT" in profile.documents:
        items.append(
            ChecklistItem(
                title="Review Form 1099-INT",
                description=(
                    "Check the interest income reported and determine "
                    "whether it is taxable based on your tax status "
                    "and the nature of the income."
                ),
                status="recommended",
                source_url=(
                    "https://www.irs.gov/individuals/"
                    "international-taxpayers/taxation-of-nonresident-aliens"
                ),
            )
        )

    if not profile.documents:
        items.append(
            ChecklistItem(
                title="Gather your tax documents",
                description=(
                    "Check whether your employer, university, or "
                    "financial institution issued any tax forms."
                ),
                status="check_if_applicable",
                source_url=(
                    "https://www.irs.gov/individuals/"
                    "international-taxpayers/"
                    "foreign-students-scholars-teachers-"
                    "researchers-and-exchange-visitors"
                ),
            )
        )

    return StudentChecklistResponse(
        items=items,
        disclaimer=(
            "Educational checklist only. This does not determine "
            "tax residency, filing obligations, or eligibility "
            "for tax treaty benefits."
        ),
    )
