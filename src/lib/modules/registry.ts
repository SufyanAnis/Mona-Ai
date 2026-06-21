/**
 * The seven modules (spec §5) as structured metadata. Drives the Modules UI,
 * the orchestrator routing table, and the architecture views.
 */
import type { EventType, ModuleId } from "@/lib/data/types";

export type Phase = 1 | 2 | 3;
export type ModuleStatus = "live" | "coming_next" | "future";

export interface ModuleSpec {
  id: ModuleId;
  name: string;
  tagline: string;
  phase: Phase;
  status: ModuleStatus;
  /** Product Expert is a shared service, not a funnel step. */
  shared_service?: boolean;
  responsibilities: string[];
  apis: string[];
  reads: string[];
  writes: string[];
  gate: string;
  exception: string;
  /** Event types this module is responsible for handling. */
  handles: EventType[];
}

export const modules: ModuleSpec[] = [
  {
    id: "lead_hunter",
    name: "Lead Hunter AI",
    tagline: "Autonomous Prospecting Engine",
    phase: 3,
    status: "future",
    responsibilities: [
      "Scrape Google Maps & business directories",
      "Enrich with Apollo / Clay data",
      "Score & qualify leads 0–100",
      "Identify salons, distributors, stores",
    ],
    apis: ["Apollo.io", "Clay.com", "Google Places", "LinkedIn API"],
    reads: ["Control center config (target market, cities, business types)"],
    writes: ["Lead Store (new qualified leads)"],
    gate: "Manager review → approve. Rejected leads → suppression.",
    exception: "Low score / duplicate / opt-out → suppress & log, never enters funnel.",
    // Lead Hunter PRODUCES lead_qualified (handed to Outreach). It only
    // subscribes to its own exception type.
    handles: ["duplicate_lead"],
  },
  {
    id: "outreach",
    name: "Outreach AI",
    tagline: "Multi-Channel Communication",
    phase: 2,
    status: "coming_next",
    responsibilities: [
      "Personalize outreach per lead profile",
      "Send via WhatsApp / LinkedIn / Email",
      "Monitor replies & engagement rates",
      "Auto-escalate interested prospects",
    ],
    apis: ["WhatsApp Business API", "LinkedIn Messaging", "SendGrid / SMTP", "Instagram Graph API"],
    reads: ["Lead Store (qualified leads)"],
    writes: ["Conversation Store (sent messages + replies)"],
    gate: "Consent & rate-limit check before every send.",
    exception: "Bounce / unsubscribe / no-reply (3x) → stop sequence, flag to suppression.",
    handles: ["lead_qualified", "consent_opted_out", "reengagement_trigger"],
  },
  {
    id: "appointment_setter",
    name: "Appointment Setter AI",
    tagline: "Intelligent Scheduling",
    phase: 2,
    status: "coming_next",
    responsibilities: [
      "Detect meeting intent in replies",
      "Check calendar availability",
      "Send booking link to prospect",
      "Remind 24h & 1h before meeting",
    ],
    apis: ["Google Calendar", "Outlook Calendar", "Calendly", "Zoom / Google Meet"],
    reads: ["Conversation Store (positive replies)"],
    writes: ["Event Bus (meeting booked)", "Conversation Store (meeting context)"],
    gate: "Slot confirmed.",
    exception: "No-show / cancel → auto-reschedule once, then return to Outreach nurture.",
    handles: ["meeting_intent_detected", "meeting_booked", "no_show"],
  },
  {
    id: "product_expert",
    name: "Product Expert AI",
    tagline: "Knowledge-Driven Consultation",
    phase: 1,
    status: "live",
    shared_service: true,
    responsibilities: [
      "Answer ingredient & benefit questions",
      "Recommend products per hair type",
      "Compare Mona J product options",
      "Handle technical FAQs & objections",
    ],
    apis: ["Product Catalog DB", "Ingredient Database", "Competitive Intel", "FAQ & Objection Library"],
    reads: ["Knowledge base + calling module's context"],
    writes: ["Conversation Store (answers served)"],
    gate: "Confident answer served.",
    exception: "Unknown / out-of-scope → escalate to human + log gap to knowledge base.",
    handles: [],
  },
  {
    id: "sales_closer",
    name: "Sales Closer AI",
    tagline: "Conversion Optimization",
    phase: 1,
    status: "live",
    responsibilities: [
      "Detect buying signals in conversations",
      "Handle price & timing objections",
      "Bundle & upsell recommendations",
      "Guide customer through checkout",
    ],
    apis: ["Stripe Checkout", "PayPal", "Bank Transfer (PKR)", "Invoice Generation"],
    reads: ["Event Bus (purchase intent signal)", "Conversation Store"],
    writes: ["Order & Payment Store"],
    gate: "High-value check → human review for large orders.",
    exception: "Payment fail / abandoned cart → recovery sequence; high-value → human review.",
    handles: ["purchase_intent_detected", "payment_failed", "abandoned_cart", "order_paid"],
  },
  {
    id: "customer_support",
    name: "Customer Support AI",
    tagline: "Post-Purchase Excellence",
    phase: 1,
    status: "live",
    responsibilities: [
      "Product usage guidance & tips",
      "Troubleshoot issues & complaints",
      "Order tracking & return assistance",
      "Escalate complex cases to human",
    ],
    apis: ["Helpdesk Ticketing", "Shipping Tracker", "Return Management", "Knowledge Base Access"],
    reads: ["Order & Payment Store", "Conversation Store", "Lead Store"],
    writes: ["Conversation Store", "Lead Store (updated customer history)"],
    gate: "Resolved / ticket closed.",
    exception: "Angry sentiment / refund / legal → immediate human handoff with full context.",
    handles: ["complaint_raised"],
  },
  {
    id: "account_manager",
    name: "Account Manager AI",
    tagline: "Retention & Growth",
    phase: 3,
    status: "future",
    responsibilities: [
      "Send satisfaction surveys (Day 7)",
      "Collect reviews & testimonials (Day 30)",
      "Trigger reorder reminders (Day 60)",
      "Launch loyalty & win-back campaigns",
    ],
    apis: ["Customer 360 Profile", "Purchase History", "NPS / CSAT Tracking", "Campaign Automation"],
    reads: ["Lead Store", "Order & Payment Store"],
    writes: ["Event Bus (re-engagement triggers)", "Conversation Store"],
    gate: "Re-engagement → Outreach.",
    exception: "Churn risk detected → re-engagement trigger loops back into Outreach AI.",
    handles: ["churn_risk", "reengagement_trigger"],
  },
];

export const moduleMap: Record<ModuleId, ModuleSpec> = Object.fromEntries(
  modules.map((m) => [m.id, m]),
) as Record<ModuleId, ModuleSpec>;

export function getModule(id: string): ModuleSpec | undefined {
  return moduleMap[id as ModuleId];
}

export const phaseInfo: Record<Phase, { label: string; status: string; note: string }> = {
  1: { label: "Phase 1", status: "Live now", note: "Product Expert, Sales Closer, Customer Support — proves value on existing inbound traffic." },
  2: { label: "Phase 2", status: "Coming next", note: "Outreach AI, Appointment Setter — leads imported via CSV until Lead Hunter is live." },
  3: { label: "Phase 3", status: "Future", note: "Lead Hunter, Account Manager — full outbound prospecting + retention." },
};
