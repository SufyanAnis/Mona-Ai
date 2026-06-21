import { NextResponse } from "next/server";
import { query } from "@/lib/ai/productExpert";
import type { Channel } from "@/lib/data/types";

/**
 * POST /api/product-expert/query  (spec §5.4)
 *
 * The Product Expert shared-service endpoint. Any module calls it with
 * { lead_id, question, context }. Returns a grounded answer + sources, and
 * flags escalation when the knowledge base can't answer confidently.
 */
export async function POST(request: Request) {
  let body: {
    lead_id?: string;
    question?: string;
    context?: string;
    channel?: Channel;
    persist?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.question || typeof body.question !== "string") {
    return NextResponse.json({ error: "`question` is required" }, { status: 400 });
  }

  const result = await query({
    lead_id: body.lead_id,
    question: body.question,
    context: body.context,
    channel: body.channel,
    persist: body.persist ?? false,
  });

  return NextResponse.json(result);
}
