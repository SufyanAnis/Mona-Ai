import { NextResponse } from "next/server";
import { runModule } from "@/lib/modules/engine";
import { getModule } from "@/lib/modules/registry";
import type { ModuleId } from "@/lib/data/types";

/**
 * POST /api/modules/[id]/run
 *
 * Triggers a module's proactive operation (autonomous side). The orchestration
 * is real; external sends are simulated in MOCK mode (no channel keys).
 *
 * Body: { action?: string, params?: object }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) {
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });
  }

  let body: { action?: string; params?: Record<string, unknown> } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — use the default action
  }

  const result = runModule(id as ModuleId, body.action, body.params ?? {});
  return NextResponse.json({ result });
}
