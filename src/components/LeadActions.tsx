"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { EventType } from "@/lib/data/types";

interface Outcome {
  intent?: string;
  action?: string;
  event?: { type: string; routed_to: string; status: string };
  product_expert?: { answer: string; escalated: boolean; confidence: number; sources: string[] };
  summary?: string;
}

const EXAMPLES = [
  "Ready to place a wholesale order — send me the invoice.",
  "Can we set up a call next week?",
  "Is the keratin shampoo safe for color-treated hair?",
  "The serum bottle arrived broken — I want a refund.",
];

const QUICK_EVENTS: Array<{ label: string; type: EventType; payload?: Record<string, unknown>; tone: string }> = [
  { label: "Run outreach", type: "lead_qualified", payload: { manual: true }, tone: "brand" },
  { label: "Mark churn risk", type: "churn_risk", payload: { signal: "manual" }, tone: "danger" },
  { label: "Opt out (STOP)", type: "consent_opted_out", payload: { keyword: "STOP" }, tone: "danger" },
  { label: "Payment failed", type: "payment_failed", payload: { reason: "manual" }, tone: "danger" },
];

export default function LeadActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function sendInbound(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    setOutcome(null);
    setMessage("");
    try {
      const res = await fetch("/api/conversations/inbound", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, message: text }),
      });
      setOutcome(await res.json());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function fireEvent(type: EventType, payload?: Record<string, unknown>) {
    setBusy(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event_type: type, lead_id: leadId, payload: payload ?? {} }),
      });
      const data = await res.json();
      setOutcome({
        action: "event_emitted",
        event: {
          type: data.event.event_type,
          routed_to: data.event.routed_to,
          status: data.event.status,
        },
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle title="Simulate Activity" subtitle="Inbound message → intent detection → routing" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendInbound(message);
        }}
        className="flex gap-2"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type an inbound message from this lead…"
          className="flex-1 rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-brand-soft disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => sendInbound(ex)}
            disabled={busy}
            className="rounded-full border border-border bg-panel-2 px-2.5 py-1 text-[11px] text-muted transition hover:border-brand/40 hover:text-brand-soft disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-border-soft pt-4">
        <p className="mb-2 text-xs font-medium text-faint">Quick events</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_EVENTS.map((q) => (
            <button
              key={q.label}
              onClick={() => fireEvent(q.type, q.payload)}
              disabled={busy}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                q.tone === "brand"
                  ? "border-brand/40 bg-brand/12 text-brand-soft hover:bg-brand/20"
                  : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {outcome && (
        <div className="mt-4 rounded-lg border border-border-soft bg-panel-2 p-3 text-sm">
          {outcome.intent && (
            <p className="text-xs text-faint">
              Detected intent: <span className="font-medium text-accent-soft">{titleCase(outcome.intent)}</span>
            </p>
          )}
          {outcome.event && (
            <p className="mt-1 text-ink">
              Event <span className="font-medium">{titleCase(outcome.event.type)}</span> →{" "}
              <span className="text-brand-soft">{titleCase(outcome.event.routed_to)}</span>{" "}
              <span className="text-faint">({outcome.event.status})</span>
            </p>
          )}
          {outcome.product_expert && (
            <div className="mt-1">
              <p className="text-ink">{outcome.product_expert.answer}</p>
              <p className="mt-1.5 text-[11px] text-faint">
                {outcome.product_expert.escalated ? "⚠ Escalated to human" : "✓ Product Expert"} ·{" "}
                {Math.round(outcome.product_expert.confidence * 100)}%
                {outcome.product_expert.sources.length > 0 &&
                  ` · ${outcome.product_expert.sources.join(", ")}`}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
