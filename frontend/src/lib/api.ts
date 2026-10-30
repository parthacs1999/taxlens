import type { ReviewResponse } from "@/types/tax";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function reviewTaxDocument(
    file: File
): Promise<ReviewResponse> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/review`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        let message = "Unable to review document.";

        try {
            const error = await response.json();

            if (typeof error.detail === "string") {
                message = error.detail;
            }
        } catch {

        }

        throw new Error(message);
    }

    return (await response.json()) as ReviewResponse;
}


import type {
    StudentProfile,
    StudentChecklistResponse,
} from "@/types/tax";

export async function generateStudentChecklist(
    profile: StudentProfile
): Promise<StudentChecklistResponse> {
    const response = await fetch(
        `${API_URL}/api/student-checklist`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(profile),
        }
    );

    if (!response.ok) {
        throw new Error("Unable to generate student checklist.");
    }

    return response.json();
}