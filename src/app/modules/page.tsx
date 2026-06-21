import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ModuleStatusBadge } from "@/components/badges";
import { modules, phaseInfo, type Phase } from "@/lib/modules/registry";

export default function ModulesPage() {
  const phases: Phase[] = [1, 2, 3];

  return (
    <>
      <PageHeader
        eyebrow="AI Modules"
        title="The Seven Modules"
        subtitle="One platform, seven AI modules moving customers through acquire → engage → convert → support → retain. Every handoff goes through the central data layer — no module calls another directly."
      />

      <div className="space-y-8">
        {phases.map((phase) => {
          const info = phaseInfo[phase];
          const phaseModules = modules.filter((m) => m.phase === phase);
          return (
            <section key={phase}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
                  {info.label} · {info.status}
                </h2>
                <div className="h-px flex-1 bg-border-soft" />
              </div>
              <p className="mb-4 max-w-3xl text-sm text-muted">{info.note}</p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {phaseModules.map((m) => (
                  <Link key={m.id} href={`/modules/${m.id}`}>
                    <Card className="h-full transition hover:border-brand/40">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-ink">{m.name}</h3>
                          <p className="text-xs text-faint">{m.tagline}</p>
                        </div>
                        <ModuleStatusBadge status={m.status} />
                      </div>
                      {m.shared_service && (
                        <Badge tone="accent" className="mb-3">
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
                            className="rounded-md border border-border-soft bg-panel-2 px-2 py-0.5 text-[10px] text-faint"
                          >
                            {a}
                          </span>
                        ))}
                        {m.apis.length > 3 && (
                          <span className="px-1 py-0.5 text-[10px] text-faint">+{m.apis.length - 3}</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
