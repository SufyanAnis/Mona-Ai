import Link from "next/link";
import { Badge, Bar, Card, LinkButton, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { EventStatusBadge } from "@/components/badges";
import { events as eventStore, leads as leadStore } from "@/lib/data/store";
import {
  getChannelStats,
  getFunnel,
  getKpis,
  getModuleActivity,
  getProductQueryIntel,
  getRevenueAnalytics,
} from "@/lib/analytics/kpis";
import { getConfig } from "@/lib/config/controlCenter";
import { moduleMap, modules } from "@/lib/modules/registry";
import { pkr, relativeTime, titleCase } from "@/lib/format";

export default function Dashboard() {
  const kpis = getKpis();
  const funnel = getFunnel();
  const channels = getChannelStats();
  const productIntel = getProductQueryIntel();
  const activity = getModuleActivity();
  const revenue = getRevenueAnalytics();
  const cfg = getConfig();
  const recentEvents = eventStore.all().slice(0, 6);

  const funnelMax = funnel[0]?.count || 1;
  const channelMax = Math.max(...channels.map((c) => c.total), 1);
  const intelMax = Math.max(...productIntel.map((p) => p.count), 1);

  return (
    <>
      <PageHeader
        eyebrow="Analytics Dashboard"
        title="Revenue Command Center"
        subtitle="Real-time view of the full acquire → engage → convert → support → retain lifecycle, read from the central data layer."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              {modules.filter((m) => m.status === "live").length}/{modules.length} modules live
            </Badge>
            <Badge tone="muted">{titleCase(cfg.operating_mode)}</Badge>
          </div>
        }
      />

      {/* Agentic hero CTA */}
      <Link href="/agents" className="group mb-6 block">
        <div className="card relative flex flex-wrap items-center justify-between gap-4 overflow-hidden p-5 transition group-hover:border-accent/40">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-48 rounded-full bg-brand/10 blur-3xl" />
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-2xl text-canvas">
              ⏻
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                Agent Autopilot
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
                  {modules.filter((m) => m.status === "live").length} agents online
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Dispatch the full agent fleet and watch them work in real time.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-brand px-4 py-2.5 text-sm font-semibold text-canvas shadow-lg shadow-accent/20 transition group-hover:opacity-90">
            Open Mission Control →
          </span>
        </div>
      </Link>

      {/* Headline KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="New Leads" value={kpis.new_leads} sub="across all sources" tone="info" />
        <StatCard label="Contacted" value={kpis.contacted} sub="in active funnel" tone="accent" />
        <StatCard label="Meetings" value={kpis.meetings} sub="booked or beyond" tone="accent" />
        <StatCard label="Closed" value={kpis.closed} sub="paying customers" tone="success" />
        <StatCard label="Revenue" value={pkr(kpis.revenue_pkr, true)} sub="paid orders" tone="brand" />
        <StatCard label="CSAT" value={`${kpis.csat}/5`} sub="post-purchase" tone="success" />
      </section>

      {/* Funnel + Revenue */}
      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Funnel Conversion"
            subtitle="Stage-to-stage drop-off across the lifecycle"
          />
          <div className="space-y-3">
            {funnel.map((stage, i) => {
              const prev = i === 0 ? stage.count : funnel[i - 1].count;
              const conv = prev > 0 ? Math.round((stage.count / prev) * 100) : 0;
              return (
                <div key={stage.stage} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
                  <span className="text-sm text-muted">{stage.label}</span>
                  <Bar value={stage.count} max={funnelMax} tone={i >= 4 ? "success" : "brand"} />
                  <span className="w-20 text-right text-sm">
                    <span className="font-semibold text-ink">{stage.count}</span>
                    {i > 0 && <span className="ml-1.5 text-xs text-faint">{conv}%</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Revenue & Orders" />
          <div className="space-y-4">
            <div>
              <p className="text-xs text-faint">Closed revenue</p>
              <p className="text-2xl font-bold brand-text">{pkr(revenue.revenue_pkr)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border-soft bg-panel-2 p-3">
                <p className="text-xs text-faint">Pipeline</p>
                <p className="mt-0.5 font-semibold text-ink">{pkr(revenue.pipeline_pkr, true)}</p>
              </div>
              <div className="rounded-lg border border-border-soft bg-panel-2 p-3">
                <p className="text-xs text-faint">Avg. order</p>
                <p className="mt-0.5 font-semibold text-ink">{pkr(revenue.avg_order_pkr, true)}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {Object.entries(revenue.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-muted">{titleCase(status)}</span>
                  <span className="font-medium text-ink">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Channel + Product intel */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Channel Performance" subtitle="Conversations by channel" />
          <div className="space-y-3">
            {channels.map((c) => (
              <div key={c.channel} className="grid grid-cols-[110px_1fr_auto] items-center gap-3">
                <span className="text-sm text-muted">{titleCase(c.channel)}</span>
                <Bar value={c.total} max={channelMax} tone="accent" />
                <span className="w-24 text-right text-xs text-faint">
                  <span className="font-semibold text-ink">{c.total}</span> · {c.inbound} in / {c.outbound} out
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Product Query Intelligence"
            subtitle="What the Product Expert gets asked"
          />
          {productIntel.length === 0 ? (
            <p className="text-sm text-faint">No product queries yet.</p>
          ) : (
            <div className="space-y-3">
              {productIntel.map((p) => (
                <div key={p.topic} className="grid grid-cols-[1fr_90px_auto] items-center gap-3">
                  <span className="truncate text-sm text-muted">{p.topic}</span>
                  <Bar value={p.count} max={intelMax} tone="brand" />
                  <span className="w-6 text-right text-sm font-semibold text-ink">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Module activity + recent events */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="AI Module Activity"
            subtitle="Events routed + messages handled"
            action={<LinkButton href="/modules">View modules</LinkButton>}
          />
          <div className="space-y-2">
            {activity.map((a) => {
              const mod = moduleMap[a.module as keyof typeof moduleMap];
              return (
                <Link
                  key={a.module}
                  href={`/modules/${a.module}`}
                  className="flex items-center justify-between rounded-lg border border-border-soft bg-panel-2 px-3 py-2.5 transition hover:border-brand/40"
                >
                  <span className="text-sm font-medium text-ink">{mod?.name ?? titleCase(a.module)}</span>
                  <span className="text-xs text-faint">
                    {a.events} events · {a.messages} msgs
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Recent Events"
            subtitle="Event bus orchestration"
            action={<LinkButton href="/events">Event bus</LinkButton>}
          />
          <div className="space-y-2">
            {recentEvents.map((e) => {
              const lead = leadStore.byId(e.lead_id);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-panel-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{titleCase(e.event_type)}</p>
                    <p className="truncate text-xs text-faint">
                      {lead?.business_name ?? e.lead_id} ·{" "}
                      {e.routed_to ? titleCase(e.routed_to) : "unrouted"} · {relativeTime(e.created_at)}
                    </p>
                  </div>
                  <EventStatusBadge status={e.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-5 text-xs text-faint">
        <span>
          Mona J AI · Architecture v4 — central data layer · shared Product Expert · event-driven
          orchestration · analytics feedback loop
        </span>
        <span>Single source of truth · {kpis.new_leads} leads tracked</span>
      </footer>
    </>
  );
}
