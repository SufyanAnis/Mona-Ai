/**
 * Analytics (spec §6). Reads from the central data layer ONLY — never queries
 * modules directly. Feeds the dashboard, and the conversion/revenue numbers are
 * what close the feedback loop back into Lead Hunter scoring + Outreach targeting.
 */
import { conversations, events, leads, orders } from "@/lib/data/store";
import type { Channel, LeadStage } from "@/lib/data/types";
import { knowledgeBase } from "@/lib/knowledge/kb";

export interface Kpis {
  new_leads: number;
  contacted: number;
  meetings: number;
  closed: number;
  revenue_pkr: number;
  csat: number;
}

export function getKpis(): Kpis {
  const all = leads.all();
  const paid = orders.all().filter((o) => o.status === "paid");
  return {
    new_leads: all.length,
    contacted: all.filter((l) =>
      ["contacted", "engaged", "meeting_booked", "purchase_intent", "customer"].includes(l.stage),
    ).length,
    meetings: all.filter((l) =>
      ["meeting_booked", "purchase_intent", "customer"].includes(l.stage),
    ).length,
    closed: all.filter((l) => l.stage === "customer").length,
    revenue_pkr: paid.reduce((sum, o) => sum + o.total_pkr, 0),
    csat: 4.6,
  };
}

/** Funnel conversion tracking — stage-to-stage drop-off (spec §6). */
export interface FunnelStage {
  stage: LeadStage;
  label: string;
  count: number;
}

export function getFunnel(): FunnelStage[] {
  const all = leads.all();
  // Cumulative funnel: each stage counts leads that reached it or beyond.
  const order: LeadStage[] = [
    "new",
    "contacted",
    "engaged",
    "meeting_booked",
    "purchase_intent",
    "customer",
  ];
  const labels: Record<string, string> = {
    new: "New Leads",
    contacted: "Contacted",
    engaged: "Engaged",
    meeting_booked: "Meetings",
    purchase_intent: "Purchase Intent",
    customer: "Closed",
  };
  const rank = (s: LeadStage) => order.indexOf(s);
  return order.map((stage) => ({
    stage,
    label: labels[stage],
    // exclude churned/suppressed from the active funnel
    count: all.filter((l) => rank(l.stage) >= rank(stage) && rank(l.stage) >= 0).length,
  }));
}

/** Channel performance analysis (spec §6). */
export interface ChannelStat {
  channel: Channel;
  inbound: number;
  outbound: number;
  total: number;
}

export function getChannelStats(): ChannelStat[] {
  const conv = conversations.all();
  const channels: Channel[] = ["whatsapp", "instagram", "email", "linkedin", "web_chat"];
  return channels
    .map((channel) => {
      const inThisChannel = conv.filter((c) => c.channel === channel);
      return {
        channel,
        inbound: inThisChannel.filter((c) => c.direction === "inbound").length,
        outbound: inThisChannel.filter((c) => c.direction === "outbound").length,
        total: inThisChannel.length,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Product query intelligence — what Product Expert gets asked (spec §6). */
export function getProductQueryIntel(): Array<{ topic: string; count: number }> {
  const peConvos = conversations
    .all()
    .filter((c) => c.handled_by_module === "product_expert" || c.detected_intent === "interest");
  const topics: Record<string, number> = {};
  for (const chunk of knowledgeBase) {
    const hits = peConvos.filter((c) =>
      chunk.tags.some((t) => c.message_body.toLowerCase().includes(t)),
    ).length;
    if (hits > 0) topics[chunk.title] = (topics[chunk.title] ?? 0) + hits;
  }
  return Object.entries(topics)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

/** AI module activity monitor (spec §6). */
export function getModuleActivity(): Array<{ module: string; events: number; messages: number }> {
  const conv = conversations.all();
  const evts = events.all();
  const byModule: Record<string, { events: number; messages: number }> = {};
  for (const c of conv) {
    if (!c.handled_by_module) continue;
    byModule[c.handled_by_module] ??= { events: 0, messages: 0 };
    byModule[c.handled_by_module].messages += 1;
  }
  for (const e of evts) {
    if (!e.routed_to || e.routed_to === "human_review") continue;
    byModule[e.routed_to] ??= { events: 0, messages: 0 };
    byModule[e.routed_to].events += 1;
  }
  return Object.entries(byModule)
    .map(([module, v]) => ({ module, ...v }))
    .sort((a, b) => b.events + b.messages - (a.events + a.messages));
}

/** Order & revenue analytics (spec §6). */
export function getRevenueAnalytics() {
  const all = orders.all();
  const paid = all.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.total_pkr, 0);
  const pipeline = all
    .filter((o) => o.status === "cart" || o.status === "pending_payment")
    .reduce((s, o) => s + o.total_pkr, 0);
  return {
    revenue_pkr: revenue,
    pipeline_pkr: pipeline,
    paid_orders: paid.length,
    avg_order_pkr: paid.length ? Math.round(revenue / paid.length) : 0,
    by_status: {
      cart: all.filter((o) => o.status === "cart").length,
      pending_payment: all.filter((o) => o.status === "pending_payment").length,
      paid: paid.length,
      failed: all.filter((o) => o.status === "failed").length,
      refunded: all.filter((o) => o.status === "refunded").length,
    },
  };
}
