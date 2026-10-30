from typing import Literal

from pydantic import BaseModel, Field

DocumentType = Literal["W-2", "1099-INT", "1042-S", "UNKNOWN"]


class TaxField(BaseModel):
    name: str = Field(description="Canonical field name, such as employee_name")

    value: str | None = Field(
        default=None, description="Extracted value or null if unavailable"
    )

    source_page: int | None = Field(
        default=None, description="Page number containing the extracted value"
    )


class TaxDocument(BaseModel):
    document_type: DocumentType

    tax_year: int | None = None

    fields: list[TaxField] = Field(default_factory=list)
