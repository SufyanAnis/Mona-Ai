import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai/client";
import { conversations, events, leads, orders } from "@/lib/data/store";

/** GET /api/health — liveness + data-layer counts + AI mode. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    ai_mode: aiEnabled() ? "live" : "mock",
    data_layer: {
      leads: leads.all().length,
      conversations: conversations.all().length,
      orders: orders.all().length,
      events: events.all().length,
    },
  });
}
