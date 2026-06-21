"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface AgentInfo {
  id: string;
  name: string;
  tagline: string;
  actionLabel: string;
  sharedService?: boolean;
}

type Status = "idle" | "running" | "done" | "skipped";
type Tone = "info" | "act" | "ok" | "warn";

interface LogLine {
  key: number;
  agent: string;
  text: string;
  tone: Tone;
  ts: string;
}

const ICON: Record<string, string> = {
  lead_hunter: "◎",
  outreach: "➤",
  appointment_setter: "◷",
  product_expert: "✷",
  sales_closer: "◈",
  customer_support: "◍",
  account_manager: "♺",
};

const toneClass: Record<Tone, string> = {
  info: "text-faint",
  act: "text-accent-soft",
  ok: "text-success",
  warn: "text-warning",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AgentAutopilot({ agents }: { agents: AgentInfo[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, Status>>(
    Object.fromEntries(agents.map((a) => [a.id, "idle"])),
  );
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [affected, setAffected] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [totalActions, setTotalActions] = useState(0);
  const keyRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function log(agent: string, text: string, tone: Tone = "info") {
    keyRef.current += 1;
    setLogs((l) => [
      ...l,
      { key: keyRef.current, agent, text, tone, ts: new Date().toLocaleTimeString("en-GB") },
    ]);
  }

  async function runAgent(a: AgentInfo): Promise<number> {
    if (a.sharedService) {
      setStatus((s) => ({ ...s, [a.id]: "skipped" }));
      log(a.name, "Shared service — on standby, callable by any agent.", "info");
      return 0;
    }
    setStatus((s) => ({ ...s, [a.id]: "running" }));
    log(a.name, `▶ ${a.actionLabel}…`, "act");
    try {
      const res = await fetch(`/api/modules/${a.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      const r = data.result as { summary: string; details: string[]; affected: number };
      setSummary((m) => ({ ...m, [a.id]: r.summary }));
      setAffected((m) => ({ ...m, [a.id]: r.affected }));
      setStatus((s) => ({ ...s, [a.id]: "done" }));
      for (const d of r.details.slice(0, 6)) {
        await wait(110);
        log(a.name, d, "info");
      }
      log(a.name, `✔ ${r.summary}`, r.affected > 0 ? "ok" : "info");
      return r.affected;
    } catch {
      setStatus((s) => ({ ...s, [a.id]: "done" }));
      log(a.name, "✖ Run failed.", "warn");
      return 0;
    }
  }

  async function runAll() {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setTotalActions(0);
    setStatus(Object.fromEntries(agents.map((a) => [a.id, "idle"])));
    log("Autopilot", "⏻ Engaging autopilot — dispatching all agents…", "act");
    let total = 0;
    for (const a of agents) {
      await wait(350);
      total += await runAgent(a);
      setTotalActions(total);
    }
    log("Autopilot", `■ Cycle complete — ${total} actions across the data layer.`, "ok");
    setRunning(false);
    router.refresh();
  }

  async function runSingle(a: AgentInfo) {
    if (running) return;
    setRunning(true);
    const n = await runAgent(a);
    setTotalActions((t) => t + n);
    setRunning(false);
    router.refresh();
  }

  const doneCount = agents.filter((a) => status[a.id] === "done").length;
  const progress = running ? Math.round((doneCount / agents.length) * 100) : doneCount ? 100 : 0;

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/60 via-brand/50 to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-xl text-canvas ${running ? "agent-running" : ""}`}
            >
              ⏻
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                Autopilot
                <span className={`inline-flex items-center gap-1.5 text-xs ${running ? "text-accent-soft" : "text-faint"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-accent live-dot" : "bg-faint"}`} />
                  {running ? "RUNNING" : "STANDBY"}
                </span>
              </p>
              <p className="text-xs text-faint">
                {totalActions > 0 ? `${totalActions} actions this session` : "Dispatch all agents in one cycle"}
              </p>
            </div>
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-brand px-5 py-2.5 text-sm font-semibold text-canvas shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-60"
          >
            {running ? <span className="spinner" /> : "⏻"}
            {running ? "Agents working…" : "Run Autopilot"}
          </button>
        </div>
        {/* Progress */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => {
          const st = status[a.id];
          return (
            <div
              key={a.id}
              className={`card p-4 transition ${st === "running" ? "agent-running" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                    st === "done"
                      ? "bg-success/15 text-success"
                      : st === "running"
                        ? "bg-accent/15 text-accent-soft"
                        : "bg-panel-2 text-faint"
                  }`}
                >
                  {ICON[a.id] ?? "✦"}
                </span>
                <StatusPill status={st} count={affected[a.id]} />
              </div>
              <Link href={`/modules/${a.id}`} className="mt-3 block">
                <p className="text-sm font-semibold text-ink hover:text-brand-soft">{a.name}</p>
                <p className="text-[11px] text-faint">{a.tagline}</p>
              </Link>

              <div className="mt-2 min-h-[32px] text-[11px] leading-snug">
                {st === "running" ? (
                  <span className="text-accent-soft cursor-blink">{a.actionLabel}</span>
                ) : summary[a.id] ? (
                  <span className="text-muted">{summary[a.id]}</span>
                ) : a.sharedService ? (
                  <span className="text-faint">Shared service · on standby</span>
                ) : (
                  <span className="text-faint">Idle</span>
                )}
              </div>

              {!a.sharedService && (
                <button
                  onClick={() => runSingle(a)}
                  disabled={running}
                  className="mt-2 w-full rounded-lg border border-border bg-panel-2 px-2 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-accent-soft disabled:opacity-50"
                >
                  Run agent
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity console */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${running ? "bg-accent live-dot" : "bg-success"}`} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
              Agent Activity
            </span>
          </div>
          <span className="text-[11px] text-faint">{logs.length} events</span>
        </div>
        <div className="h-72 overflow-y-auto p-4 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-faint">
              Autopilot on standby. Press <span className="text-accent-soft">Run Autopilot</span> to dispatch the agent fleet.
            </p>
          ) : (
            logs.map((l) => (
              <div key={l.key} className="console-line flex gap-2 py-0.5">
                <span className="shrink-0 text-faint/70">{l.ts}</span>
                <span className="shrink-0 text-faint">{l.agent}</span>
                <span className={`${toneClass[l.tone]} break-words`}>{l.text}</span>
              </div>
            ))
          )}
          {running && <span className="text-accent cursor-blink" />}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status, count }: { status: Status; count?: number }) {
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-2 py-0.5 text-[10px] font-medium text-accent-soft">
        <span className="spinner" style={{ width: 10, height: 10 }} /> working
      </span>
    );
  if (status === "done")
    return (
      <span className="rounded-full border border-success/30 bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
        ✓ done{typeof count === "number" ? ` · ${count}` : ""}
      </span>
    );
  if (status === "skipped")
    return (
      <span className="rounded-full border border-border bg-panel-2 px-2 py-0.5 text-[10px] font-medium text-faint">
        standby
      </span>
    );
  return (
    <span className="rounded-full border border-border bg-panel-2 px-2 py-0.5 text-[10px] font-medium text-faint">
      idle
    </span>
  );
}
