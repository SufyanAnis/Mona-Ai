"use client";

import { useState } from "react";

interface Result {
  answer: string;
  confidence: number;
  sources: string[];
  escalated: boolean;
  used_live_ai: boolean;
}

interface Turn {
  question: string;
  result?: Result;
  loading?: boolean;
}

const SUGGESTIONS = [
  "Is the Argan Repair Serum safe for color-treated hair?",
  "What do you recommend for frizzy, unmanageable hair?",
  "Your prices are higher than the brand we carry — why?",
  "Do you offer distributor or salon pricing?",
];

export default function ProductExpertPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  async function ask(question: string) {
    if (!question.trim()) return;
    setInput("");
    const idx = turns.length;
    setTurns((t) => [...t, { question, loading: true }]);
    try {
      const res = await fetch("/api/product-expert/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const result: Result = await res.json();
      setTurns((t) => t.map((turn, i) => (i === idx ? { question, result } : turn)));
    } catch {
      setTurns((t) =>
        t.map((turn, i) =>
          i === idx
            ? { question, result: { answer: "Request failed.", confidence: 0, sources: [], escalated: true, used_live_ai: false } }
            : turn,
        ),
      );
    }
  }

  return (
    <>
      <div className="mb-7">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-faint">
          Phase 1 · Live · Shared Service
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Product Expert AI</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          RAG over the Mona J knowledge base (catalog, ingredients, FAQ & objections). Callable by
          any module via <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-brand-soft">POST /api/product-expert/query</code>.
          Low-confidence answers escalate to a human and log the knowledge gap.
        </p>
      </div>

      <div className="card flex h-[60vh] flex-col p-0">
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {turns.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-xl text-canvas">
                ✷
              </div>
              <p className="mt-3 text-sm text-muted">Ask a product, ingredient or objection question.</p>
            </div>
          )}
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2.5">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl border border-brand/25 bg-brand/8 px-4 py-2.5 text-sm text-ink">
                  {turn.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-border-soft bg-panel-2 px-4 py-3">
                  {turn.loading ? (
                    <p className="text-sm text-faint">Thinking…</p>
                  ) : turn.result ? (
                    <>
                      <p className="text-sm text-ink">{turn.result.answer}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span
                          className={`rounded-full border px-2 py-0.5 ${
                            turn.result.escalated
                              ? "border-warning/30 bg-warning/12 text-warning"
                              : "border-success/30 bg-success/12 text-success"
                          }`}
                        >
                          {turn.result.escalated ? "⚠ Escalated to human" : "✓ Confident"} ·{" "}
                          {Math.round(turn.result.confidence * 100)}%
                        </span>
                        <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-faint">
                          {turn.result.used_live_ai ? "Claude (live)" : "Mock RAG"}
                        </span>
                        {turn.result.sources.map((s) => (
                          <span key={s} className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-accent-soft">
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border-soft p-4">
          {turns.length === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border bg-panel-2 px-3 py-1 text-xs text-muted transition hover:border-brand/40 hover:text-brand-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Product Expert…"
              className="flex-1 rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-brand-soft"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
