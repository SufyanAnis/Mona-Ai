/**
 * Control Center configuration layer (spec §4).
 *
 * A CEO/Sales-Manager config consumed by every module. Stored versioned and
 * auditable: each update bumps the version and writes an audit entry. Persisted
 * via the globalThis singleton so edits survive dev hot-reloads.
 */
import { audit } from "@/lib/data/store";
import type { BusinessType, Channel } from "@/lib/data/types";

export type OperatingMode = "human_supervised" | "autonomous";

export interface ControlCenterConfig {
  target_market: string[];
  cities: string[];
  business_types: BusinessType[];
  outreach: {
    channels: Channel[];
    cadence_days: number;
    tone: "professional" | "friendly" | "concise";
    daily_send_limit: number;
    max_no_reply_followups: number;
  };
  daily_lead_target: number;
  /** Orders above this PKR value require human review at the Sales Closer gate. */
  high_value_order_threshold_pkr: number;
  operating_mode: OperatingMode;
  /** Per-module approval gates: true = human approval required. */
  approval_gates: {
    lead_hunter: boolean;
    outreach: boolean;
    sales_closer_high_value: boolean;
  };
}

export const defaultConfig: ControlCenterConfig = {
  target_market: ["Premium salons", "Regional distributors", "Beauty retail stores"],
  cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"],
  business_types: ["salon", "distributor", "store", "individual"],
  outreach: {
    channels: ["whatsapp", "email", "instagram"],
    cadence_days: 3,
    tone: "friendly",
    daily_send_limit: 200,
    max_no_reply_followups: 3,
  },
  daily_lead_target: 50,
  high_value_order_threshold_pkr: 100000,
  operating_mode: "human_supervised",
  approval_gates: {
    lead_hunter: true,
    outreach: true,
    sales_closer_high_value: true,
  },
};

interface ConfigState {
  version: number;
  document: ControlCenterConfig;
  updated_at: string;
}

const globalForConfig = globalThis as unknown as { __monaConfig?: ConfigState };

const state: ConfigState = (globalForConfig.__monaConfig ??= {
  version: 1,
  document: structuredClone(defaultConfig),
  updated_at: new Date().toISOString(),
});

export function getConfig(): ControlCenterConfig {
  return state.document;
}

export function getConfigMeta() {
  return { version: state.version, updated_at: state.updated_at };
}

export function updateConfig(
  patch: Partial<ControlCenterConfig>,
  actor = "sales.manager@monaj.ai",
): ConfigState {
  state.document = { ...state.document, ...patch };
  state.version += 1;
  state.updated_at = new Date().toISOString();
  audit.log({
    actor,
    action: "config.update",
    target: "control_center",
    detail: { version: state.version, changed: Object.keys(patch) },
  });
  return state;
}
