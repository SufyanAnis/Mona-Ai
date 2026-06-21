import { NextResponse } from "next/server";
import { processPending } from "@/lib/eventBus/orchestrator";

/** POST /api/events/process — drain all pending events through the orchestrator. */
export async function POST() {
  const outcomes = processPending();
  return NextResponse.json({
    processed: outcomes.length,
    outcomes: outcomes.map((o) => ({
      event_type: o.event.event_type,
      lead_id: o.event.lead_id,
      status: o.event.status,
      routed_to: o.event.routed_to,
      summary: o.result?.summary ?? null,
      side_effects: o.result?.side_effects ?? [],
    })),
  });
}
