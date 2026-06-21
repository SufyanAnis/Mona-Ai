"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface ImportResult {
  imported: number;
  skipped: Array<{ row: number; reason: string }>;
  error?: string;
}

export default function ImportLeads({ sample }: { sample: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function importCsv() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.imported > 0) router.refresh();
    } catch {
      setResult({ imported: 0, skipped: [], error: "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCsv(await file.text());
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            Paste CSV (header row: <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-brand-soft">business_name, contact_name, email, phone, whatsapp, city, business_type</code>)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCsv(sample)}
              className="rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-xs text-muted transition hover:border-brand/40 hover:text-brand-soft"
            >
              Load sample
            </button>
            <label className="cursor-pointer rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-xs text-muted transition hover:border-brand/40 hover:text-brand-soft">
              Upload .csv
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
          </div>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="business_name,contact_name,email,phone,whatsapp,city,business_type&#10;..."
          spellCheck={false}
          className="h-56 w-full resize-y rounded-lg border border-border bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink outline-none focus:border-brand"
        />
        <div className="mt-3 flex items-center justify-between">
          <Link href="/leads" className="text-sm text-muted hover:text-brand-soft">
            ← Back to leads
          </Link>
          <button
            onClick={importCsv}
            disabled={busy || !csv.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-brand-soft disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import to Lead Store"}
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-5">
          {result.error ? (
            <p className="text-sm text-danger">{result.error}</p>
          ) : (
            <>
              <p className="text-sm text-ink">
                <span className="font-semibold text-success">{result.imported}</span> leads imported
                {result.skipped.length > 0 && (
                  <span className="text-muted"> · {result.skipped.length} skipped</span>
                )}
              </p>
              {result.skipped.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-faint">
                  {result.skipped.slice(0, 8).map((s, i) => (
                    <li key={i}>Row {s.row}: {s.reason}</li>
                  ))}
                </ul>
              )}
              {result.imported > 0 && (
                <Link href="/leads" className="mt-3 inline-block text-sm text-brand-soft hover:underline">
                  View imported leads →
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
