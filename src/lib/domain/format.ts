/** Format a number as Malaysian Ringgit. */
export function rm(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(n || 0);
}

/** Format an ISO date string as a readable date (e.g. 19 Jun 2026). */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format an ISO timestamp as date + time. */
export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Malaysia is UTC+8 with no DST. Anchor calendar dates to MYT so that a
// timestamp like `new Date()` produces the Malaysian civil date (not the UTC
// one, which rolls back a day before 08:00 local on a UTC server).
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** ISO date (yyyy-mm-dd) for date inputs / DB date columns, in Malaysia time. */
export function isoDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  // Shift into MYT, then read the UTC calendar parts.
  return new Date(d.getTime() + MYT_OFFSET_MS).toISOString().slice(0, 10);
}
