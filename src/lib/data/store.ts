/**
 * In-memory implementation of the central data layer (spec §3).
 *
 * This is the single source of truth at runtime. Modules never pass state to
 * each other — they read and write here. Swap these repositories for the
 * Postgres schema in `schema.sql` when DATABASE_URL is configured; the public
 * method signatures are designed to stay identical.
 *
 * A `globalThis` singleton keeps data stable across Next.js dev hot-reloads.
 */
import {
  seedAudit,
  seedConversations,
  seedEvents,
  seedLeads,
  seedOrders,
} from "./seed";
import type {
  AuditEntry,
  BusEvent,
  Conversation,
  Lead,
  Order,
} from "./types";

interface DataStore {
  leads: Lead[];
  conversations: Conversation[];
  orders: Order[];
  events: BusEvent[];
  audit: AuditEntry[];
}

const SEEDED: () => DataStore = () => ({
  // structuredClone so runtime mutations never corrupt the frozen seed.
  leads: structuredClone(seedLeads),
  conversations: structuredClone(seedConversations),
  orders: structuredClone(seedOrders),
  events: structuredClone(seedEvents),
  audit: structuredClone(seedAudit),
});

const globalForStore = globalThis as unknown as { __monaStore?: DataStore };

const db: DataStore = (globalForStore.__monaStore ??= SEEDED());

const now = () => new Date().toISOString();
const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;

// ─── Lead repository ─────────────────────────────────────────────────────────

export const leads = {
  all: (): Lead[] => db.leads,
  byId: (id: string): Lead | undefined => db.leads.find((l) => l.id === id),
  byStage: (stage: Lead["stage"]): Lead[] =>
    db.leads.filter((l) => l.stage === stage),
  create: (data: Omit<Lead, "id" | "created_at" | "updated_at">): Lead => {
    const lead: Lead = { ...data, id: uid("lead"), created_at: now(), updated_at: now() };
    db.leads.unshift(lead);
    return lead;
  },
  update: (id: string, patch: Partial<Lead>): Lead | undefined => {
    const lead = db.leads.find((l) => l.id === id);
    if (!lead) return undefined;
    Object.assign(lead, patch, { updated_at: now() });
    return lead;
  },
};

// ─── Conversation repository ─────────────────────────────────────────────────

export const conversations = {
  all: (): Conversation[] => db.conversations,
  byLead: (leadId: string): Conversation[] =>
    db.conversations
      .filter((c) => c.lead_id === leadId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  create: (data: Omit<Conversation, "id" | "created_at">): Conversation => {
    const conv: Conversation = { ...data, id: uid("conv"), created_at: now() };
    db.conversations.unshift(conv);
    return conv;
  },
};

// ─── Order repository ────────────────────────────────────────────────────────

export const orders = {
  all: (): Order[] => db.orders,
  byId: (id: string): Order | undefined => db.orders.find((o) => o.id === id),
  byLead: (leadId: string): Order[] =>
    db.orders.filter((o) => o.lead_id === leadId),
  create: (data: Omit<Order, "id" | "created_at" | "updated_at">): Order => {
    const order: Order = { ...data, id: uid("order"), created_at: now(), updated_at: now() };
    db.orders.unshift(order);
    return order;
  },
  update: (id: string, patch: Partial<Order>): Order | undefined => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return undefined;
    Object.assign(order, patch, { updated_at: now() });
    return order;
  },
};

// ─── Event bus repository ────────────────────────────────────────────────────

export const events = {
  all: (): BusEvent[] =>
    [...db.events].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  byLead: (leadId: string): BusEvent[] =>
    db.events.filter((e) => e.lead_id === leadId),
  pending: (): BusEvent[] => db.events.filter((e) => e.status === "pending"),
  create: (data: Omit<BusEvent, "id" | "created_at">): BusEvent => {
    const evt: BusEvent = { ...data, id: uid("evt"), created_at: now() };
    db.events.unshift(evt);
    return evt;
  },
  update: (id: string, patch: Partial<BusEvent>): BusEvent | undefined => {
    const evt = db.events.find((e) => e.id === id);
    if (!evt) return undefined;
    Object.assign(evt, patch);
    return evt;
  },
};

// ─── Audit log repository (spec §9) ──────────────────────────────────────────

export const audit = {
  all: (): AuditEntry[] =>
    [...db.audit].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  log: (data: Omit<AuditEntry, "id" | "created_at">): AuditEntry => {
    const entry: AuditEntry = { ...data, id: uid("audit"), created_at: now() };
    db.audit.unshift(entry);
    return entry;
  },
};

/** Test/demo helper — wipe runtime mutations and restore seed state. */
export function resetStore() {
  Object.assign(db, SEEDED());
}
