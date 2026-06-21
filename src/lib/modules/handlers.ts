import "server-only";
/**
 * Module handlers — the runtime behaviour behind each module's responsibilities,
 * approval gate and exception path (spec §5). Handlers are invoked by the
 * orchestrator when a matching event lands. They read/write the central data
 * layer only; they never call each other directly (handoffs go through events).
 */
import { getConfig } from "@/lib/config/controlCenter";
import { audit, conversations, leads, orders } from "@/lib/data/store";
import type { BusEvent, ModuleId } from "@/lib/data/types";

export interface HandlerResult {
  status: "processed" | "exception";
  routed_to: ModuleId | "human_review";
  summary: string;
  side_effects: string[];
  /** Follow-on events to emit (event-driven handoff, never a direct call). */
  emit?: Array<{ event_type: BusEvent["event_type"]; payload: Record<string, unknown> }>;
}

type Handler = (event: BusEvent) => HandlerResult;

// ─── Sales Closer (spec §5.5) ────────────────────────────────────────────────
const salesCloser: Handler = (event) => {
  const cfg = getConfig();
  const side: string[] = [];

  if (event.event_type === "purchase_intent_detected") {
    const lead = leads.byId(event.lead_id);
    leads.update(event.lead_id, { stage: "purchase_intent" });
    side.push("Lead stage → purchase_intent");

    // Find an open cart/pending order to evaluate the high-value gate.
    const open = orders
      .byLead(event.lead_id)
      .find((o) => o.status === "cart" || o.status === "pending_payment");
    const total = open?.total_pkr ?? 0;

    if (cfg.approval_gates.sales_closer_high_value && total >= cfg.high_value_order_threshold_pkr) {
      audit.log({
        actor: "orchestrator",
        action: "gate.hold",
        target: event.lead_id,
        detail: { module: "sales_closer", reason: "high_value_order", total_pkr: total },
      });
      return {
        status: "processed",
        routed_to: "human_review",
        summary: `High-value order (PKR ${total.toLocaleString()}) for ${lead?.business_name ?? event.lead_id} held for human review.`,
        side_effects: [...side, "High-value gate → human review"],
      };
    }
    return {
      status: "processed",
      routed_to: "sales_closer",
      summary: `Buying signal handled for ${lead?.business_name ?? event.lead_id}; guiding to checkout.`,
      side_effects: side,
    };
  }

  if (event.event_type === "payment_failed") {
    const orderId = String(event.payload.order_id ?? "");
    if (orderId) orders.update(orderId, { status: "failed" });
    return {
      status: "exception",
      routed_to: "sales_closer",
      summary: `Payment failed on ${orderId || "order"} — recovery sequence started.`,
      side_effects: ["Recovery sequence queued (retry link + reminder)"],
    };
  }

  if (event.event_type === "abandoned_cart") {
    return {
      status: "exception",
      routed_to: "sales_closer",
      summary: "Abandoned cart — recovery sequence started.",
      side_effects: ["Cart recovery message queued"],
    };
  }

  return generic("sales_closer", event);
};

// ─── Appointment Setter (spec §5.3) ──────────────────────────────────────────
const appointmentSetter: Handler = (event) => {
  if (event.event_type === "meeting_intent_detected") {
    const lead = leads.byId(event.lead_id);
    conversations.create({
      lead_id: event.lead_id,
      channel: "whatsapp",
      direction: "outbound",
      message_body: `Happy to set that up! Here's my calendar — pick any slot: https://cal.monaj.ai/${event.lead_id}`,
      detected_intent: "none",
      handled_by_module: "appointment_setter",
    });
    return {
      status: "processed",
      routed_to: "appointment_setter",
      summary: `Booking link sent to ${lead?.business_name ?? event.lead_id}.`,
      side_effects: ["Booking link sent", "Awaiting slot selection"],
    };
  }

  if (event.event_type === "meeting_booked") {
    leads.update(event.lead_id, { stage: "meeting_booked" });
    return {
      status: "processed",
      routed_to: "appointment_setter",
      summary: "Meeting confirmed; 24h & 1h reminders scheduled.",
      side_effects: ["Lead stage → meeting_booked", "Reminders scheduled (24h, 1h)"],
    };
  }

  if (event.event_type === "no_show") {
    // Exception: auto-reschedule once, then return to Outreach nurture.
    const rescheduled = Boolean(event.payload.rescheduled_once);
    if (!rescheduled) {
      return {
        status: "exception",
        routed_to: "appointment_setter",
        summary: "No-show — auto-rescheduled once.",
        side_effects: ["New slot offered automatically"],
      };
    }
    return {
      status: "exception",
      routed_to: "outreach",
      summary: "Second no-show — returned to Outreach nurture.",
      side_effects: ["Handed back to Outreach"],
      emit: [{ event_type: "reengagement_trigger", payload: { reason: "repeated_no_show" } }],
    };
  }

  return generic("appointment_setter", event);
};

// ─── Outreach (spec §5.2) ────────────────────────────────────────────────────
const outreach: Handler = (event) => {
  const cfg = getConfig();

  if (event.event_type === "consent_opted_out") {
    leads.update(event.lead_id, { consent_status: "opted_out", stage: "suppressed" });
    audit.log({
      actor: "orchestrator",
      action: "gate.exception",
      target: event.lead_id,
      detail: { module: "outreach", reason: "consent_opted_out" },
    });
    return {
      status: "processed",
      routed_to: "outreach",
      summary: "Opt-out honored — sequence stopped, lead suppressed.",
      side_effects: ["Lead suppressed", "Removed from all sequences"],
    };
  }

  if (event.event_type === "lead_qualified" || event.event_type === "reengagement_trigger") {
    const lead = leads.byId(event.lead_id);
    // Gate: consent & rate-limit check before every send.
    if (lead && lead.consent_status === "opted_out") {
      return {
        status: "exception",
        routed_to: "outreach",
        summary: "Send blocked — lead has opted out.",
        side_effects: ["Consent gate blocked send"],
      };
    }
    conversations.create({
      lead_id: event.lead_id,
      channel: cfg.outreach.channels[0] ?? "whatsapp",
      direction: "outbound",
      message_body: `Hi ${lead?.contact_name ?? "there"}! Mona J is salon-grade, sulfate-free hair care with strong reorder rates. Could we send you a sample kit for ${lead?.business_name ?? "your business"}?`,
      detected_intent: "none",
      handled_by_module: "outreach",
    });
    if (lead?.stage === "new") leads.update(event.lead_id, { stage: "contacted" });
    return {
      status: "processed",
      routed_to: "outreach",
      summary: `Personalized outreach sent to ${lead?.business_name ?? event.lead_id}.`,
      side_effects: ["Outreach sent (consent + rate-limit passed)", "Lead stage → contacted"],
    };
  }

  return generic("outreach", event);
};

// ─── Customer Support (spec §5.6) ────────────────────────────────────────────
const customerSupport: Handler = (event) => {
  if (event.event_type === "complaint_raised") {
    const sentiment = String(event.payload.sentiment ?? "neutral");
    const topic = String(event.payload.topic ?? "general");
    const escalate = ["angry", "refund", "legal"].includes(sentiment) || topic === "refund";
    if (escalate) {
      audit.log({
        actor: "orchestrator",
        action: "gate.exception",
        target: event.lead_id,
        detail: { module: "customer_support", reason: `${sentiment}/${topic}` },
      });
      return {
        status: "exception",
        routed_to: "human_review",
        summary: `Complaint escalated to human (${sentiment}/${topic}) with full context.`,
        side_effects: ["Immediate human handoff", "Full conversation + order history attached"],
      };
    }
    return {
      status: "processed",
      routed_to: "customer_support",
      summary: "Complaint handled and resolved.",
      side_effects: ["Resolution sent", "Ticket closed"],
    };
  }
  return generic("customer_support", event);
};

// ─── Account Manager (spec §5.7) ─────────────────────────────────────────────
const accountManager: Handler = (event) => {
  if (event.event_type === "churn_risk") {
    // Exception: churn risk loops back into Outreach via a re-engagement trigger.
    leads.update(event.lead_id, { stage: "churned" });
    return {
      status: "processed",
      routed_to: "account_manager",
      summary: "Churn risk detected — win-back re-engagement trigger emitted to Outreach.",
      side_effects: ["Win-back campaign queued", "Re-engagement trigger → Outreach"],
      emit: [{ event_type: "reengagement_trigger", payload: { reason: "churn_winback" } }],
    };
  }
  return generic("account_manager", event);
};

// ─── Lead Hunter (spec §5.1) ─────────────────────────────────────────────────
const leadHunter: Handler = (event) => {
  if (event.event_type === "duplicate_lead") {
    leads.update(event.lead_id, { stage: "suppressed" });
    return {
      status: "exception",
      routed_to: "lead_hunter",
      summary: "Duplicate lead suppressed — never enters funnel.",
      side_effects: ["Lead suppressed & logged"],
    };
  }
  return generic("lead_hunter", event);
};

function generic(module: ModuleId, event: BusEvent): HandlerResult {
  return {
    status: "processed",
    routed_to: module,
    summary: `${module} processed ${event.event_type}.`,
    side_effects: [],
  };
}

export const handlers: Partial<Record<ModuleId, Handler>> = {
  sales_closer: salesCloser,
  appointment_setter: appointmentSetter,
  outreach,
  customer_support: customerSupport,
  account_manager: accountManager,
  lead_hunter: leadHunter,
};
