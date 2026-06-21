import { NextResponse } from "next/server";
import {
  getConfig,
  getConfigMeta,
  updateConfig,
  type ControlCenterConfig,
} from "@/lib/config/controlCenter";

/** GET /api/control-center — current config + version metadata. */
export async function GET() {
  return NextResponse.json({ config: getConfig(), meta: getConfigMeta() });
}

/** PATCH /api/control-center — update config (versioned + audited). */
export async function PATCH(request: Request) {
  let patch: Partial<ControlCenterConfig>;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const state = updateConfig(patch);
  return NextResponse.json({ config: state.document, meta: { version: state.version, updated_at: state.updated_at } });
}
