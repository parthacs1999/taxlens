"use client";

import { useState } from "react";
import { generateStudentChecklist } from "@/lib/api";
import type {
    StudentProfile,
    StudentDocument,
    StudentChecklistResponse,
} from "@/types/tax";

const DOCUMENTS: StudentDocument[] = [
    "W-2",
    "1042-S",
    "1099-INT",
];

export default function StudentTaxHub() {
    const [profile, setProfile] = useState<StudentProfile>({
        visa_status: "F-1",
        tax_year: 2025,
        us_income: "unsure",
        documents: [],
    });

    const [result, setResult] =
        useState<StudentChecklistResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function toggleDocument(document: StudentDocument) {
        setResult(null);

        setProfile((previous) => ({
            ...previous,
            documents: previous.documents.includes(document)
                ? previous.documents.filter((item) => item !== document)
                : [...previous.documents, document],
        }));
    }

    async function handleGenerate() {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await generateStudentChecklist(profile);
            setResult(response);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-7">
            <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    International Student Hub
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Your tax readiness checklist
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Answer a few questions to receive an educational checklist
                    tailored to your situation. This tool does not determine
                    tax residency or filing obligations.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="mb-7 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Student profile
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Information used to generate your checklist
                            </p>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            Step 1 of 1
                        </span>
                    </div>

                    <div className="space-y-7">
                        <div>
                            <label className="mb-3 block text-sm font-semibold text-slate-800">
                                What is your visa status?
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                                {(["F-1", "J-1", "Other"] as const).map((visa) => (
                                    <button
                                        key={visa}
                                        type="button"
                                        onClick={() => {
                                            setProfile((p) => ({
                                                ...p,
                                                visa_status: visa,
                                            }));
                                            setResult(null);
                                        }}
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${profile.visa_status === visa
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                                            }`}
                                    >
                                        {visa}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="tax-year"
                                className="mb-3 block text-sm font-semibold text-slate-800"
                            >
                                Tax year
                            </label>

                            <select
                                id="tax-year"
                                value={profile.tax_year}
                                onChange={(e) => {
                                    setProfile((p) => ({
                                        ...p,
                                        tax_year: Number(e.target.value),
                                    }));
                                    setResult(null);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
                            >
                                {[2025, 2024, 2023, 2022].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-semibold text-slate-800">
                                Did you receive U.S. income?
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                                {(
                                    [
                                        ["yes", "Yes"],
                                        ["no", "No"],
                                        ["unsure", "Not sure"],
                                    ] as const
                                ).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setProfile((p) => ({
                                                ...p,
                                                us_income: value,
                                            }));
                                            setResult(null);
                                        }}
                                        className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${profile.us_income === value
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                                                : "border-slate-200 text-slate-600 hover:border-indigo-300"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-semibold text-slate-800">
                                Which tax documents do you have?
                            </label>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {DOCUMENTS.map((document) => {
                                    const selected = profile.documents.includes(document);

                                    return (
                                        <button
                                            key={document}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => toggleDocument(document)}
                                            className={`flex items-center justify-between rounded-xl border px-4 py-4 text-sm font-semibold transition ${selected
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                                    : "border-slate-200 text-slate-600 hover:border-indigo-300"
                                                }`}
                                        >
                                            {document}
                                            <span>{selected ? "✓" : "+"}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? "Generating checklist..." : "Generate my checklist →"}
                        </button>

                        {error && (
                            <p role="alert" className="text-sm text-red-600">
                                {error}
                            </p>
                        )}
                    </div>
                </section>

                <aside className="space-y-5">
                    <div className="rounded-2xl bg-slate-900 p-7 text-white">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                            🎓
                        </div>

                        <h3 className="text-xl font-bold">
                            Built for international students
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-slate-300">
                            U.S. tax documentation can be confusing for students
                            studying on F-1 or J-1 visas.
                        </p>

                        <p className="mt-4 text-sm leading-7 text-slate-300">
                            TaxLens helps you organize documents, understand
                            terminology, and identify questions to verify
                            using official guidance.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                        <h3 className="font-bold text-amber-900">
                            Important reminder
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-amber-800">
                            Immigration status and tax residency are not the same.
                            Your tax classification depends on additional facts,
                            including your history of U.S. presence.
                        </p>
                    </div>
                </aside>
            </div>

            {result && (
                <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Your checklist
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {result.items.length} items to review
                            </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Generated
                        </span>
                    </div>

                    <div className="space-y-4">
                        {result.items.map((item, index) => (
                            <div
                                key={`${item.title}-${index}`}
                                className="rounded-xl border border-slate-200 p-5 transition hover:border-indigo-200"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                        {index + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900">
                                            {item.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {item.description}
                                        </p>

                                        <a
                                            href={item.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                        >
                                            Read official guidance ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                        {result.disclaimer}
                    </p>
                </section>
            )}
        </div>
    );
}