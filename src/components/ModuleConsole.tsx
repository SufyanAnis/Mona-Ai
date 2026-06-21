"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";

interface RunResult {
  module: string;
  action: string;
  summary: string;
  details: string[];
  affected: number;
}

export default function ModuleConsole({
  moduleId,
  actions,
  sharedService,
}: {
  moduleId: string;
  actions: Array<{ action: string; label: string }>;
  sharedService?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  async function run(action: string) {
    setBusy(action);
    setResult(null);
    try {
      const res = await fetch(`/api/modules/${moduleId}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setResult(data.result);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (sharedService) {
    return (
      <Card>
        <SectionTitle title="Console" subtitle="Shared service — query from any module" />
        <Link
          href="/product-expert"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-brand-soft"
        >
          Open Product Expert console →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Run Module" subtitle="Trigger this module's autonomous operation" />
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.action}
            onClick={() => run(a.action)}
            disabled={busy !== null}
            className="rounded-lg border border-brand/40 bg-brand/12 px-3.5 py-2 text-sm font-medium text-brand-soft transition hover:bg-brand/20 disabled:opacity-50"
          >
            {busy === a.action ? "Running…" : a.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-border-soft bg-panel-2 p-3">
          <p className="text-sm font-medium text-ink">{result.summary}</p>
          {result.details.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {result.details.slice(0, 10).map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">·</span>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="mt-3 text-[11px] text-faint">
        Orchestration is live; external sends are simulated until channel keys are added.
      </p>
    </Card>
  );
}
