import Link from "next/link";
import { Badge, Card, Dot, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { EventStatusBadge } from "@/components/badges";
import AnimatedNumber from "@/components/AnimatedNumber";
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
        subtitle="All routing is event-driven. When an event lands, the orchestrator routes it to the responsible agent; exceptions emit their own events to recovery flows or human review."
        action={<EventBusControls pendingCount={pending.length} />}
      />

      <section className="stagger mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events" value={<AnimatedNumber value={all.length} />} tone="info" />
        <StatCard label="Pending" value={<AnimatedNumber value={pending.length} />} tone="warning" />
        <StatCard label="Processed" value={<AnimatedNumber value={processed.length} />} tone="success" />
        <StatCard label="Exceptions" value={<AnimatedNumber value={exceptions.length} />} tone="danger" />
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Routing table */}
        <Card>
          <SectionTitle title="Routing Table" subtitle="event type → responsible agent" />
          <div className="space-y-1.5">
            {Object.entries(routingTable).map(([evt, mod]) => (
              <div
                key={evt}
                className="flex items-center justify-between gap-2 rounded-lg border border-border-soft bg-panel-2 px-3 py-2 font-mono text-xs"
              >
                <span className="truncate text-muted">{evt}</span>
                <span className="shrink-0 font-medium text-brand-soft">
                  → {moduleMap[mod!]?.name ?? titleCase(mod!)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live event stream (terminal style) */}
        <Card className="lg:col-span-2 p-0">
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success live-dot" />
              <span className="eyebrow">Live Event Stream</span>
            </div>
            <span className="font-mono text-[11px] text-faint">newest first</span>
          </div>
          <div className="stagger max-h-[520px] divide-y divide-border-soft overflow-y-auto">
            {all.map((e) => {
              const lead = leadStore.byId(e.lead_id);
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-panel-2/50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-ink">{e.event_type}</span>
                      <Badge tone="muted" mono>
                        → {e.routed_to ? titleCase(e.routed_to) : "unrouted"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-faint">
                      <Link href={`/leads/${e.lead_id}`} className="hover:text-brand-soft">
                        {lead?.business_name ?? e.lead_id}
                      </Link>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-faint">{relativeTime(e.created_at)}</span>
                    <EventStatusBadge status={e.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
