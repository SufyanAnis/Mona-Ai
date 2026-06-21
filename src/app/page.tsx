import Link from "next/link";
import { Badge, Bar, Card, Dot, LinkButton, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { EventStatusBadge, ModuleStatusBadge } from "@/components/badges";
import AnimatedNumber from "@/components/AnimatedNumber";
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
import { modules } from "@/lib/modules/registry";
import { pkr, plural, relativeTime, titleCase } from "@/lib/format";

const ICON: Record<string, string> = {
  lead_hunter: "◎",
  outreach: "➤",
  appointment_setter: "◷",
  product_expert: "✷",
  sales_closer: "◈",
  customer_support: "◍",
  account_manager: "♺",
};

export default function Dashboard() {
  const kpis = getKpis();
  const funnel = getFunnel();
  const channels = getChannelStats();
  const productIntel = getProductQueryIntel();
  const activity = getModuleActivity();
  const revenue = getRevenueAnalytics();
  const cfg = getConfig();
  const recentEvents = eventStore.all().slice(0, 6);

  const liveCount = modules.filter((m) => m.status === "live").length;
  const funnelMax = funnel[0]?.count || 1;
  const channelMax = Math.max(...channels.map((c) => c.total), 1);
  const intelMax = Math.max(...productIntel.map((p) => p.count), 1);

  const activityMap = new Map(activity.map((a) => [a.module, a]));

  return (
    <>
      <PageHeader
        eyebrow="Analytics Dashboard"
        title="Revenue Command Center"
        subtitle="Real-time view of the acquire → engage → convert → support → retain lifecycle, read from the central data layer."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="success" mono>
              <Dot tone="success" pulse />
              {liveCount} live
            </Badge>
            <Badge tone="warning" mono>
              {titleCase(cfg.operating_mode)}
            </Badge>
          </div>
        }
      />

      {/* Agentic hero CTA */}
      <Link href="/agents" className="group mb-6 block">
        <div className="card lift relative flex flex-wrap items-center justify-between gap-4 overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-2xl text-canvas">
              ⏻
            </span>
            <div>
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
                Agent Autopilot
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/12 px-2 py-0.5 font-mono text-[10px] font-medium text-success">
                  <Dot tone="success" pulse />
                  {plural(liveCount, "agent")} online
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Dispatch the agent fleet and watch them work in real time.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-canvas shadow-lg shadow-brand/20 transition group-hover:opacity-90">
            Open Mission Control →
          </span>
        </div>
      </Link>

      {/* Headline KPIs */}
      <section className="stagger grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="New Leads" value={<AnimatedNumber value={kpis.new_leads} />} sub="all sources" />
        <StatCard label="Contacted" value={<AnimatedNumber value={kpis.contacted} />} sub="in funnel" />
        <StatCard label="Meetings" value={<AnimatedNumber value={kpis.meetings} />} sub="booked +" />
        <StatCard label="Closed" value={<AnimatedNumber value={kpis.closed} />} sub="customers" tone="success" />
        <StatCard
          label="Revenue"
          value={<AnimatedNumber value={kpis.revenue_pkr} format="pkr" />}
          sub="paid orders"
          tone="brand"
          primary
        />
        <StatCard
          label="CSAT"
          value={
            <>
              <AnimatedNumber value={kpis.csat} format="decimal1" />
              <span className="text-base text-muted">/5</span>
            </>
          }
          sub="post-purchase"
        />
      </section>

      {/* Funnel + Revenue */}
      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Funnel Conversion" subtitle="Stage-to-stage progression and drop-off" />
          <div className="space-y-3.5">
            {funnel.map((stage, i) => {
              const prev = i === 0 ? stage.count : funnel[i - 1].count;
              const conv = i === 0 || prev === 0 ? null : Math.round((stage.count / prev) * 100);
              return (
                <div key={stage.stage} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 sm:grid-cols-[140px_1fr_auto]">
                  <span className="truncate text-sm text-muted">{stage.label}</span>
                  <Bar value={stage.count} max={funnelMax} tone={i >= 4 ? "success" : "brand"} />
                  <div className="flex w-24 items-baseline justify-end gap-2">
                    <span className="font-data text-base font-semibold text-ink">{stage.count}</span>
                    <span className="w-11 text-right font-mono text-[11px] text-faint">
                      {conv === null ? "entry" : `${conv}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 font-mono text-[11px] text-faint">% = conversion from previous stage</p>
        </Card>

        <Card>
          <SectionTitle title="Revenue & Orders" />
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Closed revenue</p>
              <p className="mt-1 font-data text-2xl font-semibold brand-text">{pkr(revenue.revenue_pkr)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border-soft bg-panel-2 p-3">
                <p className="eyebrow">Pipeline</p>
                <p className="mt-0.5 font-data font-semibold text-ink">{pkr(revenue.pipeline_pkr)}</p>
              </div>
              <div className="rounded-lg border border-border-soft bg-panel-2 p-3">
                <p className="eyebrow">Avg order</p>
                <p className="mt-0.5 font-data font-semibold text-ink">{pkr(revenue.avg_order_pkr)}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {Object.entries(revenue.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-muted">{titleCase(status)}</span>
                  <span className="font-data font-medium text-ink">{count}</span>
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
              <div key={c.channel} className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
                <span className="text-sm text-muted">{titleCase(c.channel)}</span>
                <Bar value={c.total} max={channelMax} tone="accent" />
                <span className="w-24 text-right font-mono text-[11px] text-faint">
                  <span className="font-semibold text-ink">{c.total}</span> · {c.inbound}in/{c.outbound}out
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Product Query Intelligence" subtitle="What the Product Expert gets asked" />
          {productIntel.length === 0 ? (
            <p className="text-sm text-faint">No product queries yet.</p>
          ) : (
            <div className="space-y-3">
              {productIntel.map((p) => (
                <div key={p.topic} className="grid grid-cols-[1fr_80px_auto] items-center gap-3">
                  <span className="truncate text-sm text-muted">{p.topic}</span>
                  <Bar value={p.count} max={intelMax} tone="brand" />
                  <span className="w-6 text-right font-data text-sm font-semibold text-ink">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Fleet activity + recent events */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="AI Module Activity"
            subtitle="Agent fleet status"
            action={<LinkButton href="/modules">View modules</LinkButton>}
          />
          <div className="stagger grid grid-cols-1 gap-2 sm:grid-cols-2">
            {modules.map((m) => {
              const a = activityMap.get(m.id);
              const planned = m.status !== "live";
              return (
                <Link
                  key={m.id}
                  href={`/modules/${m.id}`}
                  className={`lift flex items-center gap-3 rounded-xl border border-border-soft bg-panel-2 p-3 ${
                    planned ? "opacity-55" : ""
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                      planned ? "bg-elevated text-faint" : "bg-brand/12 text-brand-soft"
                    } ${m.status === "live" ? "breathe" : ""}`}
                  >
                    {ICON[m.id] ?? "✦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="font-mono text-[11px] text-faint">
                      {plural(a?.events ?? 0, "event")} · {plural(a?.messages ?? 0, "msg")}
                    </p>
                  </div>
                  <ModuleStatusBadge status={m.status} />
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
                    <p className="truncate font-mono text-sm text-ink">{titleCase(e.event_type)}</p>
                    <p className="truncate font-mono text-[11px] text-faint">
                      {lead?.business_name ?? e.lead_id} → {e.routed_to ? titleCase(e.routed_to) : "unrouted"} ·{" "}
                      {relativeTime(e.created_at)}
                    </p>
                  </div>
                  <EventStatusBadge status={e.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-5 font-mono text-[11px] text-faint">
        <span>
          Mona J AI · v4 — central data layer · shared Product Expert · event-driven orchestration ·
          analytics feedback loop
        </span>
        <span>Single source of truth · {plural(kpis.new_leads, "lead")} tracked</span>
      </footer>
    </>
  );
}
