import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ModuleStatusBadge } from "@/components/badges";
import { modules, phaseInfo, type Phase } from "@/lib/modules/registry";

const ICON: Record<string, string> = {
  lead_hunter: "◎",
  outreach: "➤",
  appointment_setter: "◷",
  product_expert: "✷",
  sales_closer: "◈",
  customer_support: "◍",
  account_manager: "♺",
};

export default function ModulesPage() {
  const phases: Phase[] = [1, 2, 3];

  return (
    <>
      <PageHeader
        eyebrow="AI Modules"
        title="The Agent Fleet"
        subtitle="One platform, seven AI agents moving customers through acquire → engage → convert → support → retain. Every handoff goes through the central data layer — no agent calls another directly."
      />

      <div className="space-y-8">
        {phases.map((phase) => {
          const info = phaseInfo[phase];
          const phaseModules = modules.filter((m) => m.phase === phase);
          return (
            <section key={phase}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="eyebrow !text-[0.66rem]">
                  {info.label} · {info.status}
                </h2>
                <div className="h-px flex-1 bg-border-soft" />
              </div>
              <p className="mb-4 max-w-3xl text-sm text-muted">{info.note}</p>

              <div className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {phaseModules.map((m) => {
                  const planned = m.status !== "live";
                  const extraApis = m.apis.slice(3);
                  return (
                    <Link key={m.id} href={`/modules/${m.id}`}>
                      <Card className={`lift h-full ${planned ? "opacity-65" : ""}`}>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                                planned ? "bg-elevated text-faint" : "bg-brand/12 text-brand-soft breathe"
                              }`}
                            >
                              {ICON[m.id] ?? "✦"}
                            </span>
                            <div>
                              <h3 className="font-semibold text-ink">{m.name}</h3>
                              <p className="text-xs text-faint">{m.tagline}</p>
                            </div>
                          </div>
                          <ModuleStatusBadge status={m.status} />
                        </div>
                        {m.shared_service && (
                          <Badge tone="accent" mono className="mb-3">
                            ✷ Shared service
                          </Badge>
                        )}
                        <ul className="space-y-1.5">
                          {m.responsibilities.slice(0, 3).map((r) => (
                            <li key={r} className="flex gap-2 text-xs text-muted">
                              <span className="text-brand">·</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {m.apis.slice(0, 3).map((a) => (
                            <span
                              key={a}
                              className="rounded-md border border-border-soft bg-panel-2 px-2 py-0.5 font-mono text-[10px] text-faint"
                            >
                              {a}
                            </span>
                          ))}
                          {extraApis.length > 0 && (
                            <span
                              title={extraApis.join(", ")}
                              className="rounded-md border border-brand/25 bg-brand/10 px-2 py-0.5 font-mono text-[10px] text-brand-soft"
                            >
                              +{extraApis.length} more
                            </span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
