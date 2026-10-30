"use client";

import { useRef, useState } from "react";
import StudentTaxHub from "@/components/StudentTaxHub";
import { reviewTaxDocument } from "@/lib/api";
import type { ReviewResponse } from "@/types/tax";

type Tab = "overview" | "documents" | "students";

const navigation: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "documents", label: "Document Review", icon: "▤" },
  { id: "students", label: "International Students", icon: "◇" },
];

const SAMPLE_DOCUMENTS = [
  {
    name: "Valid W-2",
    filename: "demo_valid_w2.pdf",
    description: "Successful extraction",
    category: "Success",
  },
  {
    name: "Missing Box 2",
    filename: "demo_missing_withholding.pdf",
    description: "Missing withholding test",
    category: "Validation",
  },
  {
    name: "Form 1099-INT",
    filename: "demo_1099_int.pdf",
    description: "Interest income",
    category: "Tax Form",
  },
  {
    name: "Form 1042-S",
    filename: "demo_1042_s.pdf",
    description: "International tax document",
    category: "Tax Form",
  },
  {
    name: "Unsupported",
    filename: "demo_unsupported.pdf",
    description: "Unsupported document test",
    category: "Failure",
  },
  {
    name: "Scanned W-2",
    filename: "demo_scanned_w2.pdf",
    description: "OCR limitation test",
    category: "Failure",
  },
];

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong while processing the document.";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectFile(selected: File | null) {
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF document.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("PDF file must be smaller than 5 MB.");
      return;
    }

    if (selected.size === 0) {
      setError("The selected PDF is empty.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError(null);
  }

  async function selectSample(filename: string) {
    setSampleLoading(filename);
    setError(null);

    try {
      const response = await fetch(`/samples/${filename}`);

      if (!response.ok) {
        throw new Error(
          `Unable to load ${filename}. Check frontend/public/samples/.`
        );
      }

      const blob = await response.blob();

      const sampleFile = new File([blob], filename, {
        type: "application/pdf",
      });

      selectFile(sampleFile);
      setTab("documents");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSampleLoading(null);
    }
  }

  async function handleReview() {
    if (!file) {
      setError("Please select a document first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await reviewTaxDocument(file);
      setResult(response);
    } catch (err) {
      const message = getErrorMessage(err);

      if (
        message.toLowerCase().includes("extractable text") ||
        message.toLowerCase().includes("scanned")
      ) {
        setError(
          "This PDF contains no extractable text. TaxLens currently supports text-based PDFs. Scanned documents require OCR, which is not included in this prototype."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function downloadJSON() {
    if (!result) return;

    const blob = new Blob(
      [JSON.stringify(result, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "taxlens-review.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  const documentCount = result ? 1 : 0;
  const findingCount = result?.findings.length ?? 0;

  const reviewStatus = result
    ? result.status === "review_complete"
      ? "Complete"
      : "Needs review"
    : "Not started";

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 lg:flex">
      <aside className="flex w-full flex-col bg-[#111b35] text-white lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex items-center gap-3 border-b border-white/10 px-7 py-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-xl font-black">
            T
          </div>

          <div>
            <div className="text-xl font-bold tracking-tight">
              TaxLens
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              AI Tax Intelligence
            </div>
          </div>
        </div>

        <div className="px-4 py-8">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === item.id
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="w-6 text-center text-lg">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto hidden px-5 pb-6 lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Workspace ready
            </div>

            <p className="text-xs leading-5 text-slate-400">
              Document extraction and validation powered by Gemini.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            TaxLens • Prototype v1.0
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10">
          <div className="text-sm font-semibold text-slate-500">
            Workspace <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-900">
              {navigation.find((item) => item.id === tab)?.label}
            </span>
          </div>

          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
            ✦ AI Powered
          </span>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-6 py-9 lg:px-10">
          {tab === "students" ? (
            <StudentTaxHub />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Document Intelligence
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {tab === "overview"
                      ? "Your tax workspace"
                      : "Document review"}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Extract, validate, and review tax documents in one place.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTab("documents");
                    fileInputRef.current?.click();
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
                >
                  + New Review
                </button>
              </div>

              {tab === "overview" && (
                <>
                  <section className="grid gap-5 md:grid-cols-3">
                    <StatCard
                      label="Documents reviewed"
                      value={String(documentCount)}
                      description="Current session"
                      icon="▤"
                    />

                    <StatCard
                      label="Validation findings"
                      value={String(findingCount)}
                      description="Items flagged for review"
                      icon="◇"
                    />

                    <StatCard
                      label="Review status"
                      value={reviewStatus}
                      description="Latest document"
                      icon="✓"
                    />
                  </section>

                  <div className="rounded-2xl bg-gradient-to-r from-[#253b82] to-[#6254d8] p-8 text-white shadow-lg">
                    <div className="max-w-2xl">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                        Powered by AI
                      </span>

                      <h2 className="mt-5 text-2xl font-bold">
                        Smarter document review starts here.
                      </h2>

                      <p className="mt-3 text-sm leading-7 text-indigo-100">
                        Upload a tax document and let TaxLens extract
                        structured information, apply deterministic
                        checks, and surface items that need attention.
                      </p>

                      <button
                        onClick={() => setTab("documents")}
                        className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Start reviewing →
                      </button>
                    </div>
                  </div>
                </>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Interactive Demo
                  </span>

                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Try TaxLens with sample documents
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Select a synthetic document to explore AI extraction,
                    validation, and failure handling.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {SAMPLE_DOCUMENTS.map((sample) => {
                    const selected = file?.name === sample.filename;

                    return (
                      <button
                        key={sample.filename}
                        type="button"
                        disabled={sampleLoading !== null || loading}
                        onClick={() => selectSample(sample.filename)}
                        className={`rounded-xl border p-5 text-left transition-all disabled:opacity-60 ${selected
                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white hover:shadow-md"
                          }`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                            📄
                          </span>

                          <span
                            className={`text-xs font-semibold ${selected
                                ? "text-indigo-600"
                                : "text-slate-400"
                              }`}
                          >
                            {sampleLoading === sample.filename
                              ? "Loading..."
                              : selected
                                ? "✓ Selected"
                                : "Select →"}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900">
                          {sample.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {sample.description}
                        </p>

                        <span className="mt-4 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {sample.category}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-5 text-xs text-slate-400">
                  All examples contain synthetic information and are not
                  valid tax documents for filing.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Upload a document
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Supported formats: W-2, 1099-INT, 1042-S.
                    PDF only, up to 5 MB.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    selectFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    selectFile(event.dataTransfer.files[0] ?? null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${dragging
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">
                    ↑
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    {file ? file.name : "Drop your PDF here"}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB • Ready to review`
                      : "or click to browse your files"}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Prototype: use synthetic documents only.
                  </p>

                  <button
                    onClick={handleReview}
                    disabled={!file || loading || sampleLoading !== null}
                    className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Analyzing document..."
                      : "Analyze Document →"}
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}
              </section>

              {result && (
                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Analysis results
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {result.filename}
                      </p>
                    </div>

                    <button
                      onClick={downloadJSON}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      ↓ Export JSON
                    </button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <StatCard
                      label="Document type"
                      value={result.document.document_type}
                      description="AI classification"
                      icon="▤"
                    />

                    <StatCard
                      label="Tax year"
                      value={String(result.document.tax_year ?? "Unknown")}
                      description="Extracted from document"
                      icon="◷"
                    />

                    <StatCard
                      label="Findings"
                      value={String(result.findings.length)}
                      description="Validation results"
                      icon="◇"
                    />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">
                        Extracted information
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        AI-extracted fields requiring human verification
                      </p>

                      <div className="mt-6 divide-y divide-slate-100">
                        {result.document.fields.map((field, index) => (
                          <div
                            key={`${field.name}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-4 py-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                {formatLabel(field.name)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Page {field.source_page ?? "unknown"}
                              </p>
                            </div>

                            <span className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                              {field.name === "employee_ssn"
                                ? "•••-••-••••"
                                : field.value ?? "Not extracted"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">
                        Validation findings
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Results from deterministic checks
                      </p>

                      {result.findings.length === 0 ? (
                        <div className="mt-7 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                          <div className="text-2xl text-emerald-600">
                            ✓
                          </div>

                          <h4 className="mt-3 font-bold text-emerald-900">
                            No issues detected
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-emerald-700">
                            The implemented validation checks did not
                            identify missing extraction targets.
                            This does not verify tax accuracy.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6 space-y-4">
                          {result.findings.map((finding, index) => (
                            <div
                              key={`${finding.code}-${index}`}
                              className="rounded-xl border border-amber-200 bg-amber-50 p-5"
                            >
                              <span className="text-xs font-bold uppercase text-amber-700">
                                {finding.severity} severity
                              </span>

                              <h4 className="mt-2 font-semibold text-amber-900">
                                {finding.message}
                              </h4>

                              <p className="mt-2 text-sm leading-6 text-amber-800">
                                {finding.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-6 text-slate-500">
                    TaxLens is an educational prototype. AI output,
                    source references, and review results must be
                    verified by a qualified human reviewer. Not tax advice.
                  </p>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {label}
        </p>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}