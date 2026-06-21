/**
 * Integration adapter registry. Every external service the platform talks to,
 * with the env var that flips it from MOCK → LIVE. This is the single place to
 * see "what's needed to go live", grouped by rollout phase.
 *
 * Server-only env reads (process.env.*) resolve to undefined in the browser, so
 * status is computed on the server and passed to client components as props.
 */
import type { Phase } from "@/lib/modules/registry";

export interface Integration {
  name: string;
  module: string;
  phase: Phase;
  env_vars: string[];
  note?: string;
}

export const integrations: Integration[] = [
  // Phase 1
  { name: "Claude API", module: "All AI modules", phase: 1, env_vars: ["ANTHROPIC_API_KEY"], note: "Intent detection, RAG, generation" },
  { name: "Stripe", module: "Sales Closer", phase: 1, env_vars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { name: "PayPal", module: "Sales Closer", phase: 1, env_vars: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"] },
  { name: "Helpdesk / Ticketing", module: "Customer Support", phase: 1, env_vars: ["HELPDESK_API_KEY"], note: "Zendesk / Freshdesk" },
  { name: "Shipping Tracker", module: "Customer Support", phase: 1, env_vars: ["SHIPPING_API_KEY"], note: "TCS / Leopards" },
  // Phase 2
  { name: "WhatsApp Business API", module: "Outreach", phase: 2, env_vars: ["WHATSAPP_PHONE_ID", "WHATSAPP_ACCESS_TOKEN"], note: "Requires pre-approved templates" },
  { name: "Email (SendGrid/SMTP)", module: "Outreach", phase: 2, env_vars: ["SENDGRID_API_KEY"] },
  { name: "Instagram Graph API", module: "Outreach", phase: 2, env_vars: ["INSTAGRAM_ACCESS_TOKEN"] },
  { name: "LinkedIn Messaging", module: "Outreach", phase: 2, env_vars: ["LINKEDIN_ACCESS_TOKEN"], note: "⚠ Automated DMs against LinkedIn ToS — needs a bridge or skip" },
  { name: "Google Calendar", module: "Appointment Setter", phase: 2, env_vars: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"] },
  { name: "Calendly", module: "Appointment Setter", phase: 2, env_vars: ["CALENDLY_API_TOKEN"] },
  // Phase 3
  { name: "Apollo.io", module: "Lead Hunter", phase: 3, env_vars: ["APOLLO_API_KEY"] },
  { name: "Clay.com", module: "Lead Hunter", phase: 3, env_vars: ["CLAY_API_KEY"] },
  { name: "Google Places", module: "Lead Hunter", phase: 3, env_vars: ["GOOGLE_PLACES_API_KEY"] },
  // Cross-cutting
  { name: "PostgreSQL", module: "Central Data Layer", phase: 1, env_vars: ["DATABASE_URL"], note: "Swaps in-memory store → Postgres (schema.sql)" },
  { name: "Auth (Clerk/Auth0)", module: "Control Center", phase: 1, env_vars: ["CLERK_SECRET_KEY"], note: "Admin/manager access" },
];

export interface IntegrationStatus extends Integration {
  live: boolean;
  missing: string[];
}

/** Compute live/mock status from process.env. Call on the server only. */
export function getIntegrationStatus(): IntegrationStatus[] {
  return integrations.map((i) => {
    const missing = i.env_vars.filter((v) => !process.env[v]);
    return { ...i, live: missing.length === 0, missing };
  });
}
