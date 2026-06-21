import { Badge, Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { getIntegrationStatus } from "@/lib/integrations/registry";
import { aiEnabled } from "@/lib/ai/client";
import { phaseInfo, type Phase } from "@/lib/modules/registry";

export default function IntegrationsPage() {
  const all = getIntegrationStatus();
  const live = all.filter((i) => i.live);
  const phases: Phase[] = [1, 2, 3];

  return (
    <>
      <PageHeader
        eyebrow="Adapters"
        title="Integrations"
        subtitle="Every external service the platform talks to. Each runs in MOCK mode until its env vars are set — then it flips to LIVE with no code change. This is the shopping list for going live, by phase."
        action={<Badge tone={aiEnabled() ? "success" : "warning"}>AI: {aiEnabled() ? "Live" : "Mock"}</Badge>}
      />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Adapters" value={all.length} tone="info" />
        <StatCard label="Live" value={live.length} tone="success" />
        <StatCard label="Mock (need keys)" value={all.length - live.length} tone="warning" />
      </section>

      <div className="space-y-8">
        {phases.map((phase) => {
          const items = all.filter((i) => i.phase === phase);
          if (items.length === 0) return null;
          return (
            <section key={phase}>
              <SectionTitle title={`${phaseInfo[phase].label} — ${phaseInfo[phase].status}`} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((i) => (
                  <Card key={i.name} className="h-full">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-ink">{i.name}</h3>
                        <p className="text-xs text-faint">{i.module}</p>
                      </div>
                      <Badge tone={i.live ? "success" : "warning"}>{i.live ? "Live" : "Mock"}</Badge>
                    </div>
                    {i.note && <p className="mb-3 text-xs text-muted">{i.note}</p>}
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">
                      Required env vars
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {i.env_vars.map((v) => (
                        <span
                          key={v}
                          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
                            i.missing.includes(v)
                              ? "border-warning/30 bg-warning/10 text-warning"
                              : "border-success/30 bg-success/10 text-success"
                          }`}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Card className="mt-8">
        <SectionTitle title="How to go live" />
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted">
          <li>Add the required keys to <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-brand-soft">.env.local</code>.</li>
          <li>Restart the dev server — the adapter detects the env var and switches to LIVE automatically.</li>
          <li>
            For the data layer, set <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-brand-soft">DATABASE_URL</code> and run{" "}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-brand-soft">schema.sql</code> to swap the in-memory store for Postgres.
          </li>
        </ol>
      </Card>
    </>
  );
}
