"use client";

import { useRef, useState } from "react";
import { reconcileTaxDocuments } from "@/lib/api";
import type { ReconciliationResponse } from "@/types/tax";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatField(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SmartReconciliation() {
    const [files, setFiles] = useState<File[]>([]);
    const [result, setResult] = useState<ReconciliationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    function addFiles(selected: FileList | File[]) {
        const incoming = Array.from(selected);

        if (incoming.some((file) => !file.name.toLowerCase().endsWith(".pdf"))) {
            setError("Only PDF files are supported.");
            return;
        }

        if (incoming.some((file) => file.size === 0)) {
            setError("Empty PDF files are not supported.");
            return;
        }

        if (incoming.some((file) => file.size > MAX_FILE_SIZE)) {
            setError("Each PDF must be smaller than 5 MB.");
            return;
        }

        const combined = [...files];

        for (const file of incoming) {
            const duplicate = combined.some(
                (existing) =>
                    existing.name === file.name &&
                    existing.size === file.size &&
                    existing.lastModified === file.lastModified
            );

            if (!duplicate) {
                combined.push(file);
            }
        }

        if (combined.length > MAX_FILES) {
            setError("You can upload a maximum of five documents.");
            return;
        }

        setFiles(combined);
        setResult(null);
        setError(null);
    }

    function removeFile(index: number) {
        setFiles((current) => current.filter((_, position) => position !== index));
        setResult(null);
        setError(null);
    }

    async function handleReconcile() {
        if (files.length < 2) {
            setError("Select at least two PDF documents.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await reconcileTaxDocuments(files);
            setResult(response);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong during reconciliation."
            );
        } finally {
            setLoading(false);
        }
    }

    function exportJSON() {
        if (!result) return;

        const blob = new Blob([JSON.stringify(result, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "taxlens-reconciliation.json";
        link.click();

        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-8">
            <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Cross-Document Intelligence
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Smart Reconciliation
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Compare multiple tax documents and identify possible inconsistencies
                    in taxpayer names, tax years, and document information.
                </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                            Evidence-Based Review
                        </p>

                        <h2 className="mt-2 text-lg font-bold text-slate-900">
                            One taxpayer. Multiple documents. One review.
                        </h2>

                        <p className="mt-2 text-sm text-slate-600">
                            TaxLens uses AI to extract information and deterministic checks
                            to identify differences that may require human verification.
                        </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-indigo-600">2–5</div>
                        <div className="text-xs font-medium text-slate-500">
                            Documents
                        </div>
                    </div>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Upload documents
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Upload 2–5 PDF files. Maximum 5 MB per document.
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                        {files.length} / {MAX_FILES} selected
                    </span>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                        if (event.target.files) {
                            addFiles(event.target.files);
                        }

                        event.target.value = "";
                    }}
                />

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => inputRef.current?.click()}
                    className="mt-6 flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-50"
                >
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">
                        ↑
                    </span>

                    <span className="mt-4 text-base font-bold text-slate-900">
                        Select tax documents
                    </span>

                    <span className="mt-2 text-sm text-slate-500">
                        Choose multiple PDFs from your computer
                    </span>
                </button>

                {files.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-sm font-bold text-slate-800">
                            Selected documents
                        </h3>

                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-xl">
                                        📄
                                    </span>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {file.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => removeFile(index)}
                                    className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        Use synthetic documents only. Do not upload real taxpayer data.
                    </p>

                    <button
                        type="button"
                        disabled={files.length < 2 || loading}
                        onClick={handleReconcile}
                        className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Reconciling documents..." : "Run Reconciliation →"}
                    </button>
                </div>
            </section>

            {result && (
                <section className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Reconciliation results
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Cross-document consistency review
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={exportJSON}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-indigo-300"
                        >
                            ↓ Export JSON
                        </button>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                        <Metric
                            label="Documents analyzed"
                            value={String(result.documents_analyzed)}
                            icon="▤"
                        />

                        <Metric
                            label="Consistency findings"
                            value={String(result.findings_count)}
                            icon="◇"
                        />

                        <Metric
                            label="Review status"
                            value={
                                result.status === "review_complete"
                                    ? "Complete"
                                    : "Needs review"
                            }
                            icon="✓"
                        />
                    </div>

                    {result.findings.length === 0 ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
                            <div className="text-3xl text-emerald-600">✓</div>

                            <h3 className="mt-3 text-lg font-bold text-emerald-900">
                                No inconsistencies detected
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-emerald-700">
                                The implemented consistency checks did not identify
                                mismatches. This does not verify taxpayer identity or
                                establish tax-return accuracy.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {result.findings.map((finding, index) => (
                                <div
                                    key={`${finding.code}-${index}`}
                                    className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                            {finding.severity} severity
                                        </span>

                                        <span className="rounded-full bg-amber-50 px-3 py-1 font-mono text-[11px] text-amber-800">
                                            {finding.code}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 text-base font-bold text-slate-900">
                                        {finding.message}
                                    </h3>

                                    <div className="mt-5 space-y-3">
                                        {finding.evidence.map((item, evidenceIndex) => (
                                            <div
                                                key={`${item.document}-${evidenceIndex}`}
                                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {item.document}
                                                    </p>

                                                    <span className="text-xs text-slate-500">
                                                        {item.page
                                                            ? `Page ${item.page}`
                                                            : "Page unavailable"}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {formatField(item.field)}
                                                </p>

                                                <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
                                                    {item.value ?? "Not extracted"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                                            Recommended action
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-indigo-900">
                                            {finding.recommendation}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs leading-6 text-slate-500">
                        TaxLens is an educational prototype. All findings require
                        human verification. No tax or filing advice is provided.
                    </p>
                </section>
            )}
        </div>
    );
}

function Metric({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{label}</p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                    {icon}
                </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}