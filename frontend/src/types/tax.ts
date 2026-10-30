export interface TaxField {
    name: string;
    value: string | null;
    source_page: number | null;
}

export interface TaxDocument {
    document_type: "W-2" | "1099-INT" | "1042-S" | "UNKNOWN";
    tax_year: number | null;
    fields: TaxField[];
}

export interface ValidationFinding {
    code: string;
    field: string;
    severity: "low" | "medium" | "high";
    message: string;
    recommendation: string;
}

export interface ReviewResponse {
    filename: string;
    status: "review_complete" | "needs_review";
    page_count: number;
    document: TaxDocument;
    findings: ValidationFinding[];
}