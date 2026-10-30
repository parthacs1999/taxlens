"use client";

import { useState } from "react";
import { reviewTaxDocument } from "@/lib/api";
import type { ReviewResponse } from "@/types/tax";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview() {
    if (!file) {
      setError("Please select a PDF document.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await reviewTaxDocument(file);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-12">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            AI-Powered Document Review
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            TaxLens
          </h1>

          <p className="mt-4 max-w-2xl text-slate-400">
            Upload a supported tax document to extract key
            information and identify items requiring human review.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-xl font-semibold">
            Upload Tax Document
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Supported: W-2, 1099-INT, and 1042-S.
            PDF only, maximum 5 MB.
          </p>

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const selectedFile =
                event.target.files?.[0] ?? null;

              setFile(selectedFile);
              setResult(null);
              setError(null);
            }}
            className="mt-6 block w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300"
          />

          {file && (
            <p className="mt-3 text-sm text-slate-400">
              Selected: {file.name}
            </p>
          )}

          <button
            onClick={handleReview}
            disabled={!file || loading}
            className="mt-6 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing document..." : "Review Document"}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300"
            >
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Review Results
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {result.filename}
                </p>
              </div>

              <button
                onClick={downloadJSON}
                className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-400 hover:bg-cyan-950"
              >
                Download JSON
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Document Type"
                value={result.document.document_type}
              />

              <InfoCard
                label="Tax Year"
                value={String(result.document.tax_year ?? "Unknown")}
              />

              <InfoCard
                label="Review Status"
                value={
                  result.status === "review_complete"
                    ? "Checks Complete"
                    : "Needs Review"
                }
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-5 text-lg font-semibold">
                Extracted Information
              </h3>

              <div className="divide-y divide-slate-800">
                {result.document.fields.map((field, index) => (
                  <div
                    key={`${field.name}-${index}`}
                    className="flex flex-wrap justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        {field.name.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Source page: {field.source_page ?? "Unknown"}
                      </p>
                    </div>

                    <p className="font-mono text-sm text-white">
                      {field.name === "employee_ssn"
                        ? "•••-••-••••"
                        : field.value ?? "Not extracted"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold">
                Validation Findings
              </h3>

              {result.findings.length === 0 ? (
                <p className="mt-4 text-sm text-emerald-400">
                  No issues detected by the implemented checks.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {result.findings.map((finding, index) => (
                    <div
                      key={`${finding.code}-${index}`}
                      className="rounded-lg border border-amber-800 bg-amber-950/30 p-4"
                    >
                      <p className="font-semibold text-amber-300">
                        {finding.message}
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {finding.recommendation}
                      </p>

                      <p className="mt-2 text-xs uppercase text-slate-500">
                        Severity: {finding.severity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              TaxLens is a prototype. AI-extracted values and source
              references require human verification. This review is
              not tax advice or confirmation of filing accuracy.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}