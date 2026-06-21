"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import type { ControlCenterConfig, OperatingMode } from "@/lib/config/controlCenter";
import type { BusinessType, Channel } from "@/lib/data/types";
import { titleCase } from "@/lib/format";

const ALL_CHANNELS: Channel[] = ["whatsapp", "email", "instagram", "linkedin", "web_chat"];
const ALL_TYPES: BusinessType[] = ["salon", "distributor", "store", "individual"];

export default function ControlCenterForm({
  initial,
  initialVersion,
}: {
  initial: ControlCenterConfig;
  initialVersion: number;
}) {
  const [cfg, setCfg] = useState<ControlCenterConfig>(initial);
  const [version, setVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ControlCenterConfig>(key: K, value: ControlCenterConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  function toggleArray<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/control-center", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setVersion(data.meta.version);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Targeting */}
        <Card>
          <SectionTitle title="Targeting" subtitle="Who the platform pursues" />
          <Field label="Cities (comma-separated)">
            <input
              className="input"
              value={cfg.cities.join(", ")}
              onChange={(e) => set("cities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Target market segments">
            <input
              className="input"
              value={cfg.target_market.join(", ")}
              onChange={(e) => set("target_market", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Business types">
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => (
                <Chip key={t} active={cfg.business_types.includes(t)} onClick={() => set("business_types", toggleArray(cfg.business_types, t))}>
                  {titleCase(t)}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label={`Daily lead target — ${cfg.daily_lead_target}`}>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={cfg.daily_lead_target}
              onChange={(e) => set("daily_lead_target", Number(e.target.value))}
              className="w-full accent-[var(--color-brand)]"
            />
          </Field>
        </Card>

        {/* Outreach rules */}
        <Card>
          <SectionTitle title="Outreach Rules" subtitle="Channels, cadence, tone, limits" />
          <Field label="Channels">
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((ch) => (
                <Chip
                  key={ch}
                  active={cfg.outreach.channels.includes(ch)}
                  onClick={() => set("outreach", { ...cfg.outreach, channels: toggleArray(cfg.outreach.channels, ch) })}
                >
                  {titleCase(ch)}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadence (days)">
              <input
                type="number"
                min={1}
                className="input"
                value={cfg.outreach.cadence_days}
                onChange={(e) => set("outreach", { ...cfg.outreach, cadence_days: Number(e.target.value) })}
              />
            </Field>
            <Field label="Daily send limit">
              <input
                type="number"
                min={1}
                className="input"
                value={cfg.outreach.daily_send_limit}
                onChange={(e) => set("outreach", { ...cfg.outreach, daily_send_limit: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Message tone">
            <div className="flex flex-wrap gap-2">
              {(["professional", "friendly", "concise"] as const).map((t) => (
                <Chip key={t} active={cfg.outreach.tone === t} onClick={() => set("outreach", { ...cfg.outreach, tone: t })}>
                  {titleCase(t)}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Max no-reply follow-ups before suppression">
            <input
              type="number"
              min={1}
              max={10}
              className="input"
              value={cfg.outreach.max_no_reply_followups}
              onChange={(e) => set("outreach", { ...cfg.outreach, max_no_reply_followups: Number(e.target.value) })}
            />
          </Field>
        </Card>
      </div>

      {/* Gates & mode */}
      <Card>
        <SectionTitle title="Operating Mode & Approval Gates" subtitle="Human-supervised ramps down to autonomous as trust builds" />
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Field label="Operating mode">
              <div className="flex gap-2">
                {(["human_supervised", "autonomous"] as OperatingMode[]).map((m) => (
                  <Chip key={m} active={cfg.operating_mode === m} onClick={() => set("operating_mode", m)}>
                    {titleCase(m)}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="High-value order threshold (PKR) — orders above need human review">
              <input
                type="number"
                step={10000}
                className="input"
                value={cfg.high_value_order_threshold_pkr}
                onChange={(e) => set("high_value_order_threshold_pkr", Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="space-y-3">
            <Toggle
              label="Lead Hunter — manager approval required"
              checked={cfg.approval_gates.lead_hunter}
              onChange={(v) => set("approval_gates", { ...cfg.approval_gates, lead_hunter: v })}
            />
            <Toggle
              label="Outreach — consent gate before every send"
              checked={cfg.approval_gates.outreach}
              onChange={(v) => set("approval_gates", { ...cfg.approval_gates, outreach: v })}
            />
            <Toggle
              label="Sales Closer — human review on high-value orders"
              checked={cfg.approval_gates.sales_closer_high_value}
              onChange={(v) => set("approval_gates", { ...cfg.approval_gates, sales_closer_high_value: v })}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-border-soft bg-panel-2 px-4 py-3">
        <span className="text-xs text-faint">
          Config version <span className="font-semibold text-ink">v{version}</span> · changes are versioned & audited
        </span>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-success">✓ Saved</span>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-brand-soft disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-canvas);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-ink);
          outline: none;
        }
        .input:focus { border-color: var(--color-brand); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-xs font-medium text-faint">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-brand/40 bg-brand/15 text-brand-soft"
          : "border-border bg-panel-2 text-muted hover:border-brand/30"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border-soft bg-canvas px-3 py-2.5 text-left"
    >
      <span className="text-sm text-ink">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-brand" : "bg-elevated"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
