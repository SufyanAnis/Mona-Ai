/**
 * Product Expert knowledge base (spec §5.4).
 *
 * Sources: Ingredient Database, FAQ & Objection Library, Competitive Intel.
 * In production these are chunked + embedded into `kb_chunks` (pgvector) and
 * retrieved by the RAG endpoint. Here they back the keyword-retrieval mock so
 * the Product Expert answers sensibly with no external dependency.
 */

export interface KbChunk {
  id: string;
  source: "ingredients" | "faq" | "objection" | "competitive";
  title: string;
  content: string;
  /** Keywords used by the mock retriever to match a query. */
  tags: string[];
}

export const knowledgeBase: KbChunk[] = [
  // ── Ingredients ──
  {
    id: "kb-arg",
    source: "ingredients",
    title: "Argan Oil",
    content:
      "Moroccan argan oil is rich in vitamin E and fatty acids. It seals the hair cuticle, adds shine and tames frizz without buildup. Safe for color-treated hair — it helps lock in color.",
    tags: ["argan", "oil", "frizz", "shine", "color", "ingredient"],
  },
  {
    id: "kb-ker",
    source: "ingredients",
    title: "Hydrolyzed Keratin",
    content:
      "Keratin is the protein hair is made of. Hydrolyzed keratin penetrates the shaft to rebuild damaged bonds, strengthen strands and smooth frizz. Ideal for over-processed or heat-damaged hair.",
    tags: ["keratin", "protein", "damage", "repair", "frizz", "ingredient"],
  },
  {
    id: "kb-sulfate",
    source: "ingredients",
    title: "Sulfate-Free Formulation",
    content:
      "All Mona J shampoos are sulfate- and paraben-free. Sulfates strip natural oils and fade hair color; our gentle surfactants cleanse without stripping, making the range safe for color-treated and keratin-treated hair.",
    tags: ["sulfate", "paraben", "safe", "color", "gentle", "ingredient"],
  },
  // ── FAQ ──
  {
    id: "kb-faq-color",
    source: "faq",
    title: "Is it safe for color-treated hair?",
    content:
      "Yes. The entire Mona J range is sulfate-free and color-safe. The Argan Repair Serum and Hydra Silk Conditioner are especially recommended for color-treated hair as they help seal and preserve color.",
    tags: ["color", "colored", "treated", "safe", "dye", "faq"],
  },
  {
    id: "kb-faq-hairtype",
    source: "faq",
    title: "Which products for which hair type?",
    content:
      "Dry/damaged: Argan Repair Serum + Intensive Hair Mask. Frizzy/unmanageable: Keratin Smooth Shampoo + Argan Serum. Curly/dry: Hydra Silk Conditioner + Argan Oil. Oily scalp: use Argan Oil sparingly on mid-lengths only.",
    tags: ["hair type", "recommend", "dry", "frizzy", "curly", "oily", "faq"],
  },
  {
    id: "kb-faq-salon",
    source: "faq",
    title: "Do you offer salon / professional sizes?",
    content:
      "Yes — salons get professional pricing and can order the Retail Starter Pack or request bulk professional sizes. Distributors get a 35% margin via the Distributor Starter Bundle (MOQ PKR 150,000).",
    tags: ["salon", "professional", "bulk", "wholesale", "distributor", "faq"],
  },
  // ── Objection handling ──
  {
    id: "kb-obj-price",
    source: "objection",
    title: "Objection: too expensive / competitor is cheaper",
    content:
      "Mona J is salon-grade: higher active concentrations (real hydrolyzed keratin, cold-pressed argan) mean a little goes further, so cost-per-use is competitive. It's sulfate-free and color-safe, reducing client complaints. For distributors, the 35% margin beats most mass brands.",
    tags: ["price", "expensive", "cost", "competitor", "cheaper", "margin", "objection"],
  },
  {
    id: "kb-obj-trust",
    source: "objection",
    title: "Objection: never heard of the brand / will it sell?",
    content:
      "Mona J has strong salon traction in Karachi and Lahore with repeat reorder rates above 60%. We provide point-of-sale marketing material and salon sampling kits to drive sell-through, and we start partners on a low-risk Retail Starter Pack.",
    tags: ["trust", "unknown", "brand", "new", "sell", "risk", "objection"],
  },
  // ── Competitive intel ──
  {
    id: "kb-comp",
    source: "competitive",
    title: "Competitive positioning",
    content:
      "Versus mass-market brands, Mona J competes on salon-grade actives and sulfate-free/color-safe formulation rather than price. Versus imported premium brands, Mona J wins on local availability, PKR pricing and faster distributor support.",
    tags: ["competitor", "compare", "positioning", "premium", "competitive"],
  },
];

const STOPWORDS = new Set([
  "the", "and", "for", "are", "you", "your", "what", "with", "this", "that",
  "does", "can", "is", "it", "to", "of", "a", "in", "on", "my", "our", "do",
  "i", "we", "they", "be", "or", "from", "have", "has", "will", "would",
]);

/**
 * Mock retriever — keyword/tag overlap scoring with stopword filtering and
 * word-boundary matching. Stands in for vector similarity search until
 * ANTHROPIC_API_KEY + pgvector are wired (see ai/). Returns scored results so
 * the Product Expert can derive a real confidence and escalate weak matches.
 */
export function search(query: string, k = 3): Array<{ chunk: KbChunk; score: number }> {
  const q = query.toLowerCase();
  const words = q
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  return knowledgeBase
    .map((chunk) => {
      let score = 0;
      const hay = `${chunk.title} ${chunk.content}`.toLowerCase();
      for (const tag of chunk.tags) {
        if (new RegExp(`\\b${tag.replace(/\s+/g, "\\s+")}\\b`).test(q)) score += 3;
      }
      for (const w of words) {
        if (new RegExp(`\\b${w}`).test(hay)) score += 1;
      }
      return { chunk, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function retrieve(query: string, k = 3): KbChunk[] {
  return search(query, k).map((r) => r.chunk);
}
