import "server-only";
/**
 * Module engine — the PROACTIVE side of each module (what it does when running
 * autonomously, as opposed to the reactive handlers.ts that fire on events).
 *
 * Every operation reads/writes the central data layer only and hands off via
 * the event bus. In MOCK mode (no channel keys) the actual "send" is simulated
 * by writing to the Conversation Store; the orchestration is fully real.
 */
import { getConfig } from "@/lib/config/controlCenter";
import { audit, conversations, leads, orders } from "@/lib/data/store";
import { emit } from "@/lib/eventBus/orchestrator";
import { products } from "@/lib/knowledge/catalog";
import type { BusinessType, Channel, ModuleId } from "@/lib/data/types";

export interface ModuleRunResult {
  module: ModuleId;
  action: string;
  summary: string;
  details: string[];
  affected: number;
}

const DAY = 86_400_000;
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

// ─── Lead Hunter — prospect new leads (mock scrape + enrich + score) ─────────
const PROSPECT_TEMPLATES: Array<{ name: string; contact: string; type: BusinessType }> = [
  { name: "Rose Petal Salon", contact: "Areeba Khan", type: "salon" },
  { name: "Crown Beauty Distribution", contact: "Tariq Mehmood", type: "distributor" },
  { name: "Luxe Locks Studio", contact: "Sadia Iqbal", type: "salon" },
  { name: "City Cosmetics Mart", contact: "Faisal Raza", type: "store" },
  { name: "Bridal Glow Salon", contact: "Mehwish Ali", type: "salon" },
  { name: "Prime Beauty Wholesale", contact: "Kamran Shah", type: "distributor" },
];

function prospect(count: number): ModuleRunResult {
  const cfg = getConfig();
  const cities = cfg.cities.length ? cfg.cities : ["Karachi"];
  const types = cfg.business_types.length ? cfg.business_types : ["salon"];
  const supervised = cfg.operating_mode === "human_supervised" && cfg.approval_gates.lead_hunter;
  const details: string[] = [];
  let n = 0;

  for (let i = 0; i < count; i++) {
    const t = pick(PROSPECT_TEMPLATES, i);
    if (!types.includes(t.type)) continue;
    const score =
      (t.type === "distributor" ? 70 : t.type === "salon" ? 62 : 55) + Math.floor(Math.random() * 18);
    const city = pick(cities, i);
    const lead = leads.create({
      source: "lead_hunter",
      business_name: `${t.name} (${city})`,
      contact_name: t.contact,
      email: `${t.contact.toLowerCase().replace(/\s+/g, ".")}@example.pk`,
      phone: "+92 3" + (10 + (i % 80)) + " " + (1000000 + Math.floor(Math.random() * 8999999)),
      whatsapp: "",
      city,
      business_type: t.type,
      score,
      stage: "new",
      consent_status: "pending",
      enrichment_data: { discovered_via: "google_maps", enriched_by: "apollo+clay" },
    });
    n++;
    if (supervised) {
      audit.log({ actor: "lead_hunter", action: "gate.pending", target: lead.id, detail: { score } });
      details.push(`Found ${lead.business_name} — score ${score} (awaiting manager approval)`);
    } else {
      emit("lead_qualified", lead.id, { score, source: "lead_hunter" });
      details.push(`Qualified ${lead.business_name} — score ${score} → handed to Outreach`);
    }
  }
  return {
    module: "lead_hunter",
    action: "prospect",
    summary: supervised
      ? `Prospected ${n} leads — awaiting manager approval (human-supervised mode).`
      : `Prospected & qualified ${n} leads — handed to Outreach.`,
    details,
    affected: n,
  };
}

function approveProspects(): ModuleRunResult {
  const pending = leads
    .all()
    .filter((l) => l.source === "lead_hunter" && l.stage === "new" && l.consent_status === "pending");
  pending.forEach((l) => {
    audit.log({ actor: "manager", action: "gate.approve", target: l.id, detail: { score: l.score } });
    emit("lead_qualified", l.id, { score: l.score, approved: true });
  });
  return {
    module: "lead_hunter",
    action: "approve",
    summary: `Approved ${pending.length} leads at the manager gate — handed to Outreach.`,
    details: pending.map((l) => `Approved ${l.business_name}`),
    affected: pending.length,
  };
}

// ─── Outreach — run a personalized send sequence (consent + rate-limit gate) ──
function runSequence(): ModuleRunResult {
  const cfg = getConfig();
  const channel: Channel = cfg.outreach.channels[0] ?? "whatsapp";
  // Nurture leads already in the funnel. First contact of a brand-new lead
  // happens only via the lead_qualified handoff (so the approval gate holds);
  // proactive sequencing follows up on contacted/engaged leads.
  const candidates = leads
    .all()
    .filter((l) => ["contacted", "engaged"].includes(l.stage) && l.consent_status !== "opted_out")
    .slice(0, cfg.outreach.daily_send_limit);

  const details: string[] = [];
  candidates.forEach((l) => {
    conversations.create({
      lead_id: l.id,
      channel,
      direction: "outbound",
      message_body: `Hi ${l.contact_name || "there"}! Mona J is salon-grade, sulfate-free hair care with 60%+ reorder rates. Can we send ${l.business_name} a sample kit?`,
      detected_intent: "none",
      handled_by_module: "outreach",
    });
    if (l.stage === "new") leads.update(l.id, { stage: "contacted" });
    details.push(`Sent ${channel} outreach to ${l.business_name}`);
  });
  return {
    module: "outreach",
    action: "run_sequence",
    summary: `Sent ${candidates.length} personalized messages via ${channel} (consent + rate-limit gate passed).`,
    details,
    affected: candidates.length,
  };
}

// ─── Appointment Setter — send 24h/1h reminders for booked meetings ──────────
function sendReminders(): ModuleRunResult {
  const booked = leads.all().filter((l) => l.stage === "meeting_booked");
  booked.forEach((l) => {
    conversations.create({
      lead_id: l.id,
      channel: "whatsapp",
      direction: "outbound",
      message_body: `Reminder: your Mona J consultation is coming up. Reply RESCHEDULE if the time no longer works.`,
      detected_intent: "none",
      handled_by_module: "appointment_setter",
    });
  });
  return {
    module: "appointment_setter",
    action: "send_reminders",
    summary: `Sent reminders for ${booked.length} upcoming meeting(s).`,
    details: booked.map((l) => `Reminder → ${l.business_name}`),
    affected: booked.length,
  };
}

// ─── Sales Closer — cart & payment recovery sequence ─────────────────────────
function recoverOrders(): ModuleRunResult {
  const open = orders.all().filter((o) => ["cart", "pending_payment", "failed"].includes(o.status));
  const details: string[] = [];
  open.forEach((o) => {
    const lead = leads.byId(o.lead_id);
    conversations.create({
      lead_id: o.lead_id,
      channel: "whatsapp",
      direction: "outbound",
      message_body:
        o.status === "failed"
          ? `Your payment didn't go through — here's a fresh secure link to complete your PKR ${o.total_pkr.toLocaleString()} order.`
          : `You left items in your cart. Here's your invoice to complete the PKR ${o.total_pkr.toLocaleString()} order — need anything before checkout?`,
      detected_intent: "none",
      handled_by_module: "sales_closer",
    });
    details.push(`Recovery → ${lead?.business_name ?? o.lead_id} (${o.status}, PKR ${o.total_pkr.toLocaleString()})`);
  });
  return {
    module: "sales_closer",
    action: "recover",
    summary: `Ran recovery on ${open.length} open/failed order(s).`,
    details,
    affected: open.length,
  };
}

// ─── Customer Support — triage open inbound support/complaints ───────────────
function runTriage(): ModuleRunResult {
  const convs = conversations.all();
  // Inbound support/complaint messages with no later outbound reply from support.
  const open = convs.filter((c) => {
    if (c.direction !== "inbound") return false;
    if (!["support", "complaint"].includes(c.detected_intent)) return false;
    const replied = convs.some(
      (r) =>
        r.lead_id === c.lead_id &&
        r.direction === "outbound" &&
        r.handled_by_module === "customer_support" &&
        r.created_at > c.created_at,
    );
    return !replied;
  });

  const details: string[] = [];
  open.forEach((c) => {
    const angry = /refund|legal|angry|terrible|furious|broken/i.test(c.message_body);
    if (angry) {
      emit("complaint_raised", c.lead_id, { sentiment: "angry", topic: "refund" });
      details.push(`Escalated ${leads.byId(c.lead_id)?.business_name ?? c.lead_id} to human`);
    } else {
      conversations.create({
        lead_id: c.lead_id,
        channel: c.channel,
        direction: "outbound",
        message_body: "Thanks for reaching out — here's how to resolve that. Let me know if it persists and I'll open a ticket.",
        detected_intent: "none",
        handled_by_module: "customer_support",
      });
      details.push(`Resolved support query for ${leads.byId(c.lead_id)?.business_name ?? c.lead_id}`);
    }
  });
  return {
    module: "customer_support",
    action: "triage",
    summary: `Triaged ${open.length} open support item(s).`,
    details,
    affected: open.length,
  };
}

// ─── Account Manager — lifecycle campaigns (Day 7/30/60) + churn detection ───
function runLifecycle(): ModuleRunResult {
  const customers = leads.all().filter((l) => l.stage === "customer");
  const details: string[] = [];
  let n = 0;

  customers.forEach((l) => {
    const paid = orders.byLead(l.id).filter((o) => o.status === "paid");
    if (paid.length === 0) return;
    const lastPaid = paid.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const age = daysSince(lastPaid.updated_at);

    let msg: string | null = null;
    if (age >= 60) msg = "It's been a while since your last order — reorder your best-sellers now at 10% off?";
    else if (age >= 30) msg = "Loving your Mona J results? We'd be grateful for a quick review or testimonial.";
    else if (age >= 7) msg = "Quick check-in: how are you finding your Mona J products? (1-min satisfaction survey)";

    if (msg) {
      conversations.create({
        lead_id: l.id,
        channel: "whatsapp",
        direction: "outbound",
        message_body: msg,
        detected_intent: "none",
        handled_by_module: "account_manager",
      });
      details.push(`Day ${age >= 60 ? "60 reorder" : age >= 30 ? "30 review" : "7 survey"} → ${l.business_name}`);
      n++;
    }
  });

  // Churn detection: customers with no paid order in 90+ days → re-engagement loop.
  customers.forEach((l) => {
    const paid = orders.byLead(l.id).filter((o) => o.status === "paid");
    const lastPaid = paid.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    if (lastPaid && daysSince(lastPaid.updated_at) >= 90) {
      emit("churn_risk", l.id, { last_order_days_ago: daysSince(lastPaid.updated_at) });
      details.push(`Churn risk → ${l.business_name} (re-engagement loop to Outreach)`);
      n++;
    }
  });

  return {
    module: "account_manager",
    action: "lifecycle",
    summary: `Ran lifecycle campaigns — ${n} touchpoint(s) sent / triggered.`,
    details,
    affected: n,
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
const DEFAULT_ACTION: Record<ModuleId, string> = {
  lead_hunter: "prospect",
  outreach: "run_sequence",
  appointment_setter: "send_reminders",
  product_expert: "info",
  sales_closer: "recover",
  customer_support: "triage",
  account_manager: "lifecycle",
};

export function runModule(
  moduleId: ModuleId,
  action?: string,
  params: Record<string, unknown> = {},
): ModuleRunResult {
  const act = action || DEFAULT_ACTION[moduleId];
  switch (moduleId) {
    case "lead_hunter":
      return act === "approve" ? approveProspects() : prospect(Number(params.count) || 3);
    case "outreach":
      return runSequence();
    case "appointment_setter":
      return sendReminders();
    case "sales_closer":
      return recoverOrders();
    case "customer_support":
      return runTriage();
    case "account_manager":
      return runLifecycle();
    case "product_expert":
      return {
        module: "product_expert",
        action: "info",
        summary: "Product Expert is a shared service — query it from the console or POST /api/product-expert/query.",
        details: [],
        affected: 0,
      };
  }
}

/** Actions exposed in each module's console UI. */
export const MODULE_ACTIONS: Partial<Record<ModuleId, Array<{ action: string; label: string }>>> = {
  lead_hunter: [
    { action: "prospect", label: "Prospect new leads" },
    { action: "approve", label: "Approve pending leads" },
  ],
  outreach: [{ action: "run_sequence", label: "Run outreach sequence" }],
  appointment_setter: [{ action: "send_reminders", label: "Send meeting reminders" }],
  sales_closer: [{ action: "recover", label: "Run cart & payment recovery" }],
  customer_support: [{ action: "triage", label: "Triage open support items" }],
  account_manager: [{ action: "lifecycle", label: "Run lifecycle campaigns" }],
};
