/**
 * Mona J Product Catalog (spec §4 — feeds Product Expert + Sales Closer).
 *
 * In production this is edited in the Control Center and stored as versioned
 * config. Here it's the source of truth for pricing, bundles and the Product
 * Expert knowledge base.
 */

export interface Product {
  sku: string;
  name: string;
  category: "serum" | "shampoo" | "conditioner" | "mask" | "oil" | "bundle";
  price_pkr: number;
  distributor_price_pkr?: number;
  hair_types: string[];
  key_ingredients: string[];
  benefits: string[];
  size: string;
  description: string;
}

export const products: Product[] = [
  {
    sku: "MJ-ARG-SER-50",
    name: "Argan Repair Serum",
    category: "serum",
    price_pkr: 2800,
    distributor_price_pkr: 1820,
    hair_types: ["dry", "damaged", "color-treated", "frizzy"],
    key_ingredients: ["Moroccan Argan Oil", "Hydrolyzed Keratin", "Vitamin E"],
    benefits: ["Seals split ends", "Adds shine", "Tames frizz", "Color-safe"],
    size: "50ml",
    description:
      "A lightweight, sulfate-free repair serum. The argan + keratin complex seals the cuticle, making it safe for chemically treated and color-treated hair.",
  },
  {
    sku: "MJ-KER-SHMP-300",
    name: "Keratin Smooth Shampoo",
    category: "shampoo",
    price_pkr: 1900,
    distributor_price_pkr: 1235,
    hair_types: ["frizzy", "unmanageable", "thick", "wavy"],
    key_ingredients: ["Hydrolyzed Keratin", "Argan Oil", "Provitamin B5"],
    benefits: ["Smooths frizz", "Sulfate-free", "Strengthens strands"],
    size: "300ml",
    description:
      "Daily smoothing shampoo with keratin to reduce frizz and strengthen the hair shaft. Free of sulfates and parabens.",
  },
  {
    sku: "MJ-HYDR-COND-300",
    name: "Hydra Silk Conditioner",
    category: "conditioner",
    price_pkr: 2100,
    distributor_price_pkr: 1365,
    hair_types: ["dry", "curly", "color-treated"],
    key_ingredients: ["Shea Butter", "Argan Oil", "Glycerin"],
    benefits: ["Deep hydration", "Detangles", "Softens"],
    size: "300ml",
    description:
      "Rich hydrating conditioner that detangles and locks in moisture without weighing hair down.",
  },
  {
    sku: "MJ-HAIR-MASK-200",
    name: "Intensive Hair Mask",
    category: "mask",
    price_pkr: 3200,
    distributor_price_pkr: 2080,
    hair_types: ["damaged", "dry", "over-processed"],
    key_ingredients: ["Keratin", "Argan Oil", "Biotin", "Collagen"],
    benefits: ["Deep repair", "Rebuilds bonds", "Weekly treatment"],
    size: "200ml",
    description:
      "A weekly deep-repair treatment that rebuilds damaged bonds — ideal for over-processed or heat-damaged hair.",
  },
  {
    sku: "MJ-ARG-OIL-100",
    name: "Pure Argan Hair Oil",
    category: "oil",
    price_pkr: 2500,
    distributor_price_pkr: 1625,
    hair_types: ["all", "dry", "frizzy"],
    key_ingredients: ["100% Cold-Pressed Argan Oil"],
    benefits: ["Nourishes scalp", "Adds shine", "Multi-use"],
    size: "100ml",
    description:
      "Cold-pressed Moroccan argan oil for scalp nourishment, shine and frizz control. Suitable for all hair types.",
  },
  {
    sku: "MJ-DIST-STARTER",
    name: "Distributor Starter Bundle",
    category: "bundle",
    price_pkr: 150000,
    hair_types: ["all"],
    key_ingredients: [],
    benefits: ["35% margin", "Mixed full range", "Marketing kit included"],
    size: "Wholesale (MOQ)",
    description:
      "Minimum-order wholesale bundle for distributors: a mixed case of the full Mona J range plus point-of-sale marketing material. 35% distributor margin.",
  },
  {
    sku: "MJ-RETAIL-PACK",
    name: "Retail Starter Pack",
    category: "bundle",
    price_pkr: 45000,
    hair_types: ["all"],
    key_ingredients: [],
    benefits: ["Best-seller mix", "Shelf-ready", "30% margin"],
    size: "Retail",
    description:
      "Shelf-ready pack of best-sellers for salons and stores starting to carry Mona J.",
  },
];

export const bundles = products.filter((p) => p.category === "bundle");

export function findProduct(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}
