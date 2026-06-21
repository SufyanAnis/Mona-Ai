import { NextResponse } from "next/server";
import { parseCsvWithHeader } from "@/lib/data/csv";
import { audit, leads as leadStore } from "@/lib/data/store";
import type { BusinessType } from "@/lib/data/types";

/**
 * POST /api/leads/import  (Phase 2, build step 8)
 *
 * CSV lead import → Lead Store. Used until Lead Hunter goes live. Leads land
 * with source=csv_import, stage=new, consent=pending (so the Outreach consent
 * gate applies). Duplicates (by email or phone) are skipped.
 *
 * Body: { csv: string }  — CSV text with a header row.
 */

const VALID_TYPES: BusinessType[] = ["salon", "distributor", "store", "individual"];

function normalizeType(raw: string): BusinessType {
  const t = raw.toLowerCase().trim() as BusinessType;
  return VALID_TYPES.includes(t) ? t : "individual";
}

/** Lightweight initial score for imported leads (no enrichment yet). */
function initialScore(type: BusinessType): number {
  const base: Record<BusinessType, number> = {
    distributor: 68,
    salon: 60,
    store: 55,
    individual: 48,
  };
  return base[type];
}

export async function POST(request: Request) {
  let body: { csv?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.csv || typeof body.csv !== "string") {
    return NextResponse.json({ error: "`csv` text is required" }, { status: 400 });
  }

  const rows = parseCsvWithHeader(body.csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found (need a header row + rows)" }, { status: 400 });
  }

  const existing = leadStore.all();
  const seen = new Set(
    existing.flatMap((l) => [l.email.toLowerCase(), l.phone.replace(/\s/g, "")]).filter(Boolean),
  );

  const imported: string[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  rows.forEach((r, i) => {
    const business_name = r.business_name || r.business || "";
    const email = (r.email || "").toLowerCase();
    const phone = (r.phone || r.whatsapp || "").replace(/\s/g, "");

    if (!business_name && !email && !phone) {
      skipped.push({ row: i + 2, reason: "empty row" });
      return;
    }
    if ((email && seen.has(email)) || (phone && seen.has(phone))) {
      skipped.push({ row: i + 2, reason: "duplicate" });
      return;
    }

    const type = normalizeType(r.business_type || r.type || "");
    const lead = leadStore.create({
      source: "csv_import",
      business_name: business_name || "(unknown)",
      contact_name: r.contact_name || r.contact || "",
      email: r.email || "",
      phone: r.phone || "",
      whatsapp: r.whatsapp || r.phone || "",
      city: r.city || "",
      business_type: type,
      score: initialScore(type),
      stage: "new",
      consent_status: "pending",
      enrichment_data: { imported_via: "csv" },
    });
    if (email) seen.add(email);
    if (phone) seen.add(phone);
    imported.push(lead.id);
  });

  audit.log({
    actor: "csv_import",
    action: "leads.import",
    target: "lead_store",
    detail: { imported: imported.length, skipped: skipped.length },
  });

  return NextResponse.json({ imported: imported.length, skipped, lead_ids: imported });
}
