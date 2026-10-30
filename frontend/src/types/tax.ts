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

export type VisaStatus = "F-1" | "J-1" | "Other";
export type IncomeStatus = "yes" | "no" | "unsure";
export type StudentDocument = "W-2" | "1042-S" | "1099-INT";

export interface StudentProfile {
    visa_status: VisaStatus;
    tax_year: number;
    us_income: IncomeStatus;
    documents: StudentDocument[];
}

export interface ChecklistItem {
    title: string;
    description: string;
    status: "recommended" | "check_if_applicable";
    source_url: string;
}

export interface StudentChecklistResponse {
    items: ChecklistItem[];
    disclaimer: string;
}

export interface ReconciliationEvidence {
    document: string;
    field: string;
    value: string | null;
    page: number | null;
}

export interface ReconciliationFinding {
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
    evidence: ReconciliationEvidence[];
    recommendation: string;
}

export interface ReconciliationResponse {
    status: "review_complete" | "needs_review";
    documents_analyzed: number;
    findings_count: number;
    findings: ReconciliationFinding[];
}