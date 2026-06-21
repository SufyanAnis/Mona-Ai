import "server-only";

/**
 * Claude adapter (spec §8: "Sonnet for modules, Haiku for high-volume
 * classification"). Live when ANTHROPIC_API_KEY is set; otherwise callers fall
 * back to deterministic mock logic so the whole platform runs with no key.
 *
 * Uses fetch against the Messages API — no SDK dependency required for the MVP.
 */

export const MODELS = {
  /** Reasoning / generation for modules. */
  module: "claude-sonnet-4-6",
  /** Cheap, high-volume intent classification. */
  classify: "claude-haiku-4-5-20251001",
} as const;

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

interface GenerateOpts {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Returns generated text, or `null` when no API key is configured (caller
 * should then use its mock path).
 */
export async function generate({
  system,
  prompt,
  model = MODELS.module,
  maxTokens = 1024,
}: GenerateOpts): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[ai] Anthropic API error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.map((b) => b.text ?? "").join("").trim() || null;
  } catch (err) {
    console.error("[ai] request failed", err);
    return null;
  }
}
