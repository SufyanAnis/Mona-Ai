import "server-only";
import { conversations } from "@/lib/data/store";
import type { Channel } from "@/lib/data/types";
import { products } from "@/lib/knowledge/catalog";
import { search, type KbChunk } from "@/lib/knowledge/kb";
import { generate } from "./client";

/**
 * Product Expert AI (spec §5.4) — a SHARED SERVICE, not a funnel step.
 * Any module calls query() with { lead_id, question, context }.
 *
 * Flow: retrieve KB chunks → generate grounded answer → confidence gate.
 * Gate: confident answer served. Exception: unknown/out-of-scope → escalate to
 * human + log the knowledge gap.
 */

export interface ProductExpertResult {
  answer: string;
  confidence: number;
  sources: string[];
  escalated: boolean;
  used_live_ai: boolean;
}

interface QueryInput {
  lead_id?: string;
  question: string;
  context?: string;
  channel?: Channel;
  /** When false, don't persist to the Conversation Store (e.g. previews). */
  persist?: boolean;
}

const SYSTEM = `You are the Mona J Product Expert — a knowledgeable, warm hair-care consultant for a Pakistani salon/distributor sales team.
Answer ONLY from the provided knowledge base context. Be concise (2-4 sentences), specific, and recommend concrete Mona J products with PKR prices when relevant.
If the context does not contain the answer, say you don't have that information so it can be escalated. Never invent ingredients, claims, or prices.`;

function mockAnswer(question: string, chunks: KbChunk[]): string {
  if (chunks.length === 0) return "";
  const lead = chunks[0];

  // Surface a relevant product recommendation when the query is about hair type.
  const q = question.toLowerCase();
  const rec = products.find(
    (p) => p.category !== "bundle" && p.hair_types.some((t) => q.includes(t)),
  );

  let answer = lead.content;
  if (rec) {
    answer += ` I'd recommend the ${rec.name} (PKR ${rec.price_pkr.toLocaleString()}, ${rec.size}) — ${rec.benefits.slice(0, 2).join(", ").toLowerCase()}.`;
  }
  return answer;
}

export async function query(input: QueryInput): Promise<ProductExpertResult> {
  const { question, context, lead_id, channel = "web_chat", persist = true } = input;
  const hits = search(question, 3);
  const chunks = hits.map((h) => h.chunk);
  // Confidence is driven by the strength of the best match (a tag hit = 3),
  // so genuinely out-of-scope questions land below the escalation threshold.
  const topScore = hits[0]?.score ?? 0;
  const confidence = Math.min(0.4 + topScore * 0.12, 0.97);

  const contextBlock = chunks.map((c) => `[${c.title}] ${c.content}`).join("\n");
  const live = await generate({
    system: SYSTEM,
    prompt: `Knowledge base context:\n${contextBlock || "(none)"}\n\n${
      context ? `Conversation context: ${context}\n\n` : ""
    }Customer question: ${question}`,
  });

  const used_live_ai = Boolean(live);
  let answer = live ?? mockAnswer(question, chunks);
  const escalated = chunks.length === 0 || confidence < 0.65;

  if (escalated) {
    answer =
      answer ||
      "I don't have a confident answer to that yet — let me bring in a human specialist who can help.";
    // Log the knowledge gap (spec: "log gap to knowledge base").
    console.warn("[product-expert] knowledge gap →", question);
  }

  if (persist && lead_id) {
    conversations.create({
      lead_id,
      channel,
      direction: "outbound",
      message_body: answer,
      detected_intent: "none",
      handled_by_module: "product_expert",
    });
  }

  return {
    answer,
    confidence,
    sources: chunks.map((c) => c.title),
    escalated,
    used_live_ai,
  };
}
