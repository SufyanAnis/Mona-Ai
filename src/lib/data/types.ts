/**
 * Central data layer — type definitions.
 *
 * These mirror the SQL schema in `schema.sql` exactly (see MONA_J_AI_BUILD_SPEC §3).
 * Every module reads/writes through these shapes. No module-to-module state passing.
 */

// ─── Lead Store ────────────────────────────────────────────────────────────

export type LeadSource = "lead_hunter" | "csv_import" | "inbound" | "referral";

export type BusinessType = "salon" | "distributor" | "store" | "individual";

export type LeadStage =
  | "new"
  | "contacted"
  | "engaged"
  | "meeting_booked"
  | "purchase_intent"
  | "customer"
  | "churned"
  | "suppressed";

export type ConsentStatus = "opted_in" | "opted_out" | "pending";

export interface Lead {
  id: string;
  source: LeadSource;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  business_type: BusinessType;
  /** 0–100 qualification score. */
  score: number;
  stage: LeadStage;
  consent_status: ConsentStatus;
  enrichment_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Conversation Store ────────────────────────────────────────────────────

export type Channel =
  | "whatsapp"
  | "linkedin"
  | "email"
  | "instagram"
  | "web_chat";

export type Direction = "inbound" | "outbound";

export type DetectedIntent =
  | "interest"
  | "objection"
  | "meeting_intent"
  | "purchase_intent"
  | "support"
  | "complaint"
  | "none";

export type ModuleId =
  | "lead_hunter"
  | "outreach"
  | "appointment_setter"
  | "product_expert"
  | "sales_closer"
  | "customer_support"
  | "account_manager";

export interface Conversation {
  id: string;
  lead_id: string;
  channel: Channel;
  direction: Direction;
  message_body: string;
  detected_intent: DetectedIntent;
  handled_by_module: ModuleId | null;
  created_at: string;
}

// ─── Order & Payment Store ─────────────────────────────────────────────────

export type OrderStatus =
  | "cart"
  | "pending_payment"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod = "stripe" | "paypal" | "bank_transfer";

export interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  unit_price_pkr: number;
}

export interface Order {
  id: string;
  lead_id: string;
  status: OrderStatus;
  items: OrderItem[];
  total_pkr: number;
  payment_method: PaymentMethod;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Event Bus ─────────────────────────────────────────────────────────────

/** Canonical event types that drive module orchestration (spec §3.4). */
export type EventType =
  | "lead_qualified"
  | "purchase_intent_detected"
  | "meeting_intent_detected"
  | "meeting_booked"
  | "no_show"
  | "payment_failed"
  | "abandoned_cart"
  | "order_paid"
  | "complaint_raised"
  | "churn_risk"
  | "reengagement_trigger"
  | "consent_opted_out"
  | "duplicate_lead";

export type EventStatus = "pending" | "processed" | "exception";

export interface BusEvent {
  id: string;
  lead_id: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  /** The module the orchestrator routed this event to. */
  routed_to: ModuleId | "human_review" | null;
  status: EventStatus;
  created_at: string;
}

// ─── Audit log (cross-cutting, spec §9) ────────────────────────────────────

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: Record<string, unknown>;
  created_at: string;
}
