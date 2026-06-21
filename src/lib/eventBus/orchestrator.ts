import "server-only";
/**
 * Event bus orchestrator (spec §3.4, §7).
 *
 *   modules subscribe to event types → when an event lands the orchestrator
 *   routes it to the responsible module → handler processes it or raises an
 *   exception. Exceptions emit their own event types that route to recovery
 *   flows or human review.
 *
 * No module calls another module directly. All handoffs go through here.
 */
import { events } from "@/lib/data/store";
import type { BusEvent, EventType, ModuleId } from "@/lib/data/types";
import { modules } from "@/lib/modules/registry";
import { handlers, type HandlerResult } from "@/lib/modules/handlers";

/** Routing table: event_type → responsible module (built from the registry). */
export const routingTable: Partial<Record<EventType, ModuleId>> = (() => {
  const table: Partial<Record<EventType, ModuleId>> = {};
  for (const m of modules) {
    for (const evt of m.handles) {
      // First module that declares it owns the type wins; lead_qualified is
      // owned by Lead Hunter (the producer/approver) ahead of Outreach.
      if (!table[evt]) table[evt] = m.id;
    }
  }
  return table;
})();

export function routeOf(eventType: EventType): ModuleId | "human_review" {
  return routingTable[eventType] ?? "human_review";
}

export interface ProcessOutcome {
  event: BusEvent;
  result: HandlerResult | null;
}

/** Process a single pending event: route → invoke handler → record outcome. */
export function processEvent(eventId: string, depth = 0): ProcessOutcome | null {
  const event = events.all().find((e) => e.id === eventId);
  if (!event) return null;

  const target = event.routed_to ?? routeOf(event.event_type);
  const handler = target !== "human_review" ? handlers[target] : undefined;

  if (!handler) {
    events.update(eventId, { routed_to: target, status: "exception" });
    return { event, result: null };
  }

  const result = handler(event);
  events.update(eventId, { routed_to: result.routed_to, status: result.status });

  // Follow-on events (event-driven handoff). Guard against deep cascades.
  if (result.emit && depth < 3) {
    for (const next of result.emit) {
      const child = emit(next.event_type, event.lead_id, next.payload, false);
      processEvent(child.id, depth + 1);
    }
  }

  return { event: events.all().find((e) => e.id === eventId)!, result };
}

/** Emit a new event onto the bus, routed to its responsible module. */
export function emit(
  eventType: EventType,
  leadId: string,
  payload: Record<string, unknown> = {},
  autoProcess = true,
): BusEvent {
  const routed_to = routeOf(eventType);
  const event = events.create({
    lead_id: leadId,
    event_type: eventType,
    payload,
    routed_to,
    status: "pending",
  });
  if (autoProcess) processEvent(event.id);
  return event;
}

/** Drain every pending event through the orchestrator (manual "tick"). */
export function processPending(): ProcessOutcome[] {
  return events
    .pending()
    .map((e) => processEvent(e.id))
    .filter((o): o is ProcessOutcome => o !== null);
}
