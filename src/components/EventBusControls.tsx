"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventBusControls({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function processPending() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/events/process", { method: "POST" });
      const data = await res.json();
      setMsg(`Processed ${data.processed} event(s) through the orchestrator.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={processPending}
        disabled={busy || pendingCount === 0}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-brand-soft disabled:opacity-50"
      >
        {busy ? "Processing…" : `Process ${pendingCount} pending`}
      </button>
      {msg && <span className="text-xs text-success">{msg}</span>}
    </div>
  );
}
