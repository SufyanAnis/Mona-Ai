/** Shared formatting helpers (safe for both server and client components). */

export function pkr(amount: number, compact = false): string {
  if (compact && amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)}k`;
  }
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
