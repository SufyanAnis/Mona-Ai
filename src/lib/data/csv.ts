/**
 * Minimal RFC-4180-ish CSV parser (no dependency) for Phase 2 lead import.
 * Handles quoted fields, embedded commas, escaped quotes ("") and CRLF.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // skip fully-empty lines
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

/** Parse CSV with a header row into objects keyed by normalized header names. */
export function parseCsvWithHeader(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

export const SAMPLE_CSV = `business_name,contact_name,email,phone,whatsapp,city,business_type
Velvet Hair Studio,Sara Ahmed,sara@velvethair.pk,+92 300 5551234,+92 300 5551234,Karachi,salon
North Beauty Distribution,Imran Qureshi,imran@northbeauty.pk,+92 321 4448899,+92 321 4448899,Peshawar,distributor
Bloom Cosmetics,Hira Saleem,hira@bloomcos.pk,+92 333 2227766,+92 333 2227766,Sialkot,store
Elegance Salon,Kiran Shah,kiran@elegance.pk,+92 345 9991122,+92 345 9991122,Lahore,salon`;
