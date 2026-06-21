import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { EventStatusBadge, ModuleStatusBadge } from "@/components/badges";
import { getModule, modules } from "@/lib/modules/registry";
import { MODULE_ACTIONS } from "@/lib/modules/engine";
import ModuleConsole from "@/components/ModuleConsole";
import { conversations as convStore, events as eventStore, leads as leadStore } from "@/lib/data/store";
import { relativeTime, titleCase } from "@/lib/format";

export function generateStaticParams() {
  return modules.map((m) => ({ id: m.id }));
}

export default async function ModuleDetail({ params }: PageProps<"/modules/[id]">) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) notFound();

  const routedEvents = eventStore
    .all()
    .filter((e) => e.routed_to === mod.id)
    .slice(0, 6);
  const handledMessages = convStore
    .all()
    .filter((c) => c.handled_by_module === mod.id)
    .slice(0, 6);

  return (
    <>
      <Link href="/modules" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-soft">
        ← All modules
      </Link>
      <PageHeader
        eyebrow={`Phase ${mod.phase} · ${mod.tagline}`}
        title={mod.name}
        action={
          <div className="flex items-center gap-2">
            {mod.shared_service && <Badge tone="accent">✷ Shared service</Badge>}
            <ModuleStatusBadge status={mod.status} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ModuleConsole
            moduleId={mod.id}
            actions={MODULE_ACTIONS[mod.id] ?? []}
            sharedService={mod.shared_service}
          />

          <Card>
            <SectionTitle title="Responsibilities" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {mod.responsibilities.map((r) => (
                <li key={r} className="flex items-start gap-2 rounded-lg border border-border-soft bg-panel-2 p-3 text-sm text-muted">
                  <span className="mt-0.5 text-brand">✦</span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <SectionTitle title="Gate" />
              <p className="rounded-lg border border-success/25 bg-success/8 p-3 text-sm text-ink">
                {mod.gate}
              </p>
              <SectionTitle title="Exception Path" />
              <p className="rounded-lg border border-danger/25 bg-danger/8 p-3 text-sm text-ink">
                {mod.exception}
              </p>
            </Card>

            <Card>
              <SectionTitle title="Data Layer I/O" />
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">Reads</p>
              <ul className="mb-4 space-y-1.5">
                {mod.reads.map((r) => (
                  <li key={r} className="text-sm text-muted">↘ {r}</li>
                ))}
              </ul>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">Writes</p>
              <ul className="space-y-1.5">
                {mod.writes.map((w) => (
                  <li key={w} className="text-sm text-muted">↗ {w}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Live activity */}
          <Card>
            <SectionTitle title="Recent Activity" subtitle="Events routed here & messages handled" />
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Events</p>
                {routedEvents.length === 0 ? (
                  <p className="text-sm text-faint">None yet.</p>
                ) : (
                  <div className="space-y-2">
                    {routedEvents.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-soft bg-panel-2 px-3 py-2">
                        <span className="truncate text-xs text-ink">{titleCase(e.event_type)}</span>
                        <EventStatusBadge status={e.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Messages</p>
                {handledMessages.length === 0 ? (
                  <p className="text-sm text-faint">None yet.</p>
                ) : (
                  <div className="space-y-2">
                    {handledMessages.map((c) => {
                      const lead = leadStore.byId(c.lead_id);
                      return (
                        <div key={c.id} className="rounded-lg border border-border-soft bg-panel-2 px-3 py-2">
                          <p className="truncate text-xs text-ink">{c.message_body}</p>
                          <p className="mt-0.5 text-[10px] text-faint">
                            {lead?.business_name} · {relativeTime(c.created_at)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* APIs + handled events */}
        <div className="space-y-5">
          <Card>
            <SectionTitle title="Integrated APIs" />
            <div className="space-y-2">
              {mod.apis.map((a) => (
                <div key={a} className="flex items-center gap-2 rounded-lg border border-border-soft bg-panel-2 px-3 py-2 text-sm text-muted">
                  <span className="text-faint">⊕</span>
                  {a}
                </div>
              ))}
            </div>
          </Card>

          {mod.handles.length > 0 && (
            <Card>
              <SectionTitle title="Subscribes To" subtitle="Event types this module owns" />
              <div className="flex flex-wrap gap-1.5">
                {mod.handles.map((h) => (
                  <Badge key={h} tone="brand">{titleCase(h)}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle title="Orchestration" />
            <p className="text-sm text-muted">
              {mod.shared_service
                ? "Callable by any module at any stage via the Product Expert endpoint — it is a shared service, not a funnel step."
                : "Subscribes to event types on the bus. The orchestrator routes matching events here; exceptions emit their own events to recovery flows or human review."}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
