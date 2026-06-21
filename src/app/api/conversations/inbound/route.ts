import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/ai/intent";
import { query as productExpertQuery } from "@/lib/ai/productExpert";
import { conversations, leads } from "@/lib/data/store";
import { emit } from "@/lib/eventBus/orchestrator";
import type { Channel, DetectedIntent, EventType } from "@/lib/data/types";

/**
 * POST /api/conversations/inbound
 *
 * Simulates a real inbound message. Runs intent detection, stores the inbound
 * conversation, then either:
 *   • emits the matching event onto the bus (orchestrator routes to a module), or
 *   • calls the Product Expert shared service to answer (interest/objection/FAQ).
 *
 * This is the single entry point that demonstrates the whole event-driven flow.
 */

const INTENT_EVENT: Partial<Record<DetectedIntent, EventType>> = {
  purchase_intent: "purchase_intent_detected",
  meeting_intent: "meeting_intent_detected",
  complaint: "complaint_raised",
};

export async function POST(request: Request) {
  let body: { lead_id?: string; message?: string; channel?: Channel };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.lead_id || !body.message) {
    return NextResponse.json({ error: "`lead_id` and `message` are required" }, { status: 400 });
  }
  if (!leads.byId(body.lead_id)) {
    return NextResponse.json({ error: "Unknown lead_id" }, { status: 404 });
  }

  const channel = body.channel ?? "whatsapp";
  const intent = await detectIntent(body.message);

  // 1. Store the inbound message.
  conversations.create({
    lead_id: body.lead_id,
    channel,
    direction: "inbound",
    message_body: body.message,
    detected_intent: intent,
    handled_by_module: null,
  });

  // 2. Route. Purchase / meeting / complaint → event bus. Otherwise the Product
  //    Expert shared service answers directly (interest, objection, support, FAQ).
  const eventType = INTENT_EVENT[intent];
  if (eventType) {
    const payload =
      intent === "complaint"
        ? { sentiment: /refund|legal|angry|terrible|furious/i.test(body.message) ? "angry" : "neutral", topic: "general", channel }
        : { channel };
    const event = emit(eventType, body.lead_id, payload);
    return NextResponse.json({
      intent,
      action: "event_emitted",
      event: { type: event.event_type, routed_to: event.routed_to, status: event.status },
    });
  }

  const pe = await productExpertQuery({
    lead_id: body.lead_id,
    question: body.message,
    channel,
    persist: true,
  });
  return NextResponse.json({
    intent,
    action: "product_expert_answered",
    product_expert: {
      answer: pe.answer,
      escalated: pe.escalated,
      confidence: pe.confidence,
      sources: pe.sources,
    },
  });
}
