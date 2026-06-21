import { NextResponse } from "next/server";
import { events } from "@/lib/data/store";
import { emit } from "@/lib/eventBus/orchestrator";
import type { EventType } from "@/lib/data/types";

const VALID_EVENTS: EventType[] = [
  "lead_qualified",
  "purchase_intent_detected",
  "meeting_intent_detected",
  "meeting_booked",
  "no_show",
  "payment_failed",
  "abandoned_cart",
  "order_paid",
  "complaint_raised",
  "churn_risk",
  "reengagement_trigger",
  "consent_opted_out",
  "duplicate_lead",
];

/** GET /api/events — list all events (most recent first). */
export async function GET() {
  return NextResponse.json({ events: events.all() });
}

/** POST /api/events — emit a new event; the orchestrator routes + processes it. */
export async function POST(request: Request) {
  let body: { event_type?: EventType; lead_id?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.event_type || !VALID_EVENTS.includes(body.event_type)) {
    return NextResponse.json(
      { error: `event_type must be one of: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }
  if (!body.lead_id) {
    return NextResponse.json({ error: "`lead_id` is required" }, { status: 400 });
  }

  const event = emit(body.event_type, body.lead_id, body.payload ?? {});
  return NextResponse.json({ event });
}
