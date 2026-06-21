import "server-only";
import type { DetectedIntent } from "@/lib/data/types";
import { MODELS, generate } from "./client";

/**
 * Intent detection for inbound messages (used by Outreach + the orchestrator).
 * High-volume → Haiku in live mode; deterministic keyword rules as fallback.
 */

const RULES: Array<{ intent: DetectedIntent; patterns: RegExp[] }> = [
  {
    intent: "purchase_intent",
    patterns: [/\b(buy|order|invoice|purchase|checkout|place .*order|wholesale|stock)\b/i],
  },
  {
    intent: "meeting_intent",
    patterns: [/\b(call|meet|meeting|demo|schedule|book|calendar|appointment|times work)\b/i],
  },
  {
    intent: "complaint",
    patterns: [/\b(refund|broken|wrong|defect|complaint|angry|terrible|disappointed|return)\b/i],
  },
  {
    intent: "objection",
    patterns: [/\b(expensive|too high|cheaper|why .*premium|justify|not sure|competitor)\b/i],
  },
  {
    intent: "support",
    patterns: [/\b(how do i|how to use|tracking|where is my|delivery|usage|help with)\b/i],
  },
  {
    intent: "interest",
    patterns: [/\b(interested|tell me more|safe for|does it|can it|ingredient|sample)\b/i],
  },
];

function ruleBased(message: string): DetectedIntent {
  for (const { intent, patterns } of RULES) {
    if (patterns.some((p) => p.test(message))) return intent;
  }
  return "none";
}

export async function detectIntent(message: string): Promise<DetectedIntent> {
  const text = await generate({
    model: MODELS.classify,
    maxTokens: 16,
    system:
      "You classify a single B2B sales message into exactly one intent label. " +
      "Reply with ONLY one of: interest, objection, meeting_intent, purchase_intent, support, complaint, none.",
    prompt: message,
  });

  if (text) {
    const label = text.toLowerCase().trim() as DetectedIntent;
    const valid: DetectedIntent[] = [
      "interest",
      "objection",
      "meeting_intent",
      "purchase_intent",
      "support",
      "complaint",
      "none",
    ];
    if (valid.includes(label)) return label;
  }
  return ruleBased(message);
}
