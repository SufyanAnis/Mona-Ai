import Link from "next/link";
import { Badge, Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { EventStatusBadge } from "@/components/badges";
import EventBusControls from "@/components/EventBusControls";
import { events as eventStore, leads as leadStore } from "@/lib/data/store";
import { routingTable } from "@/lib/eventBus/orchestrator";
import { moduleMap } from "@/lib/modules/registry";
import { relativeTime, titleCase } from "@/lib/format";

export default function EventBusPage() {
  const all = eventStore.all();
  const pending = all.filter((e) => e.status === "pending");
  const exceptions = all.filter((e) => e.status === "exception");
  const processed = all.filter((e) => e.status === "processed");

  return (
    <>
      <PageHeader
        eyebrow="Orchestration"
        title="Event Bus"
        subtitle="All routing is event-driven. When an event lands, the orchestrator routes it to the responsible module; exceptions emit their own events to recovery flows or human review."
        action={<EventBusControls pendingCount={pending.length} />}
      />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events" value={all.length} tone="info" />
        <StatCard label="Pending" value={pending.length} tone="warning" />
        <StatCard label="Processed" value={processed.length} tone="success" />
        <StatCard label="Exceptions" value={exceptions.length} tone="danger" />
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Routing table */}
        <Card>
          <SectionTitle title="Routing Table" subtitle="event type → responsible module" />
          <div className="space-y-1.5">
            {Object.entries(routingTable).map(([evt, mod]) => (
              <div
                key={evt}
                className="flex items-center justify-between gap-2 rounded-lg border border-border-soft bg-panel-2 px-3 py-2 text-xs"
              >
                <span className="truncate text-muted">{titleCase(evt)}</span>
                <span className="shrink-0 font-medium text-brand-soft">
                  {moduleMap[mod!]?.name ?? titleCase(mod!)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Event stream */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Event Stream" subtitle="Most recent first" />
          <div className="space-y-2">
            {all.map((e) => {
              const lead = leadStore.byId(e.lead_id);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-panel-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{titleCase(e.event_type)}</p>
                      <Badge tone="muted">→ {e.routed_to ? titleCase(e.routed_to) : "unrouted"}</Badge>
                    </div>
                    <p className="truncate text-xs text-faint">
                      <Link href={`/leads/${e.lead_id}`} className="hover:text-brand-soft">
                        {lead?.business_name ?? e.lead_id}
                      </Link>{" "}
                      · {relativeTime(e.created_at)}
                    </p>
                  </div>
                  <EventStatusBadge status={e.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
