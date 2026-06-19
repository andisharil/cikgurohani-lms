/**
 * Malaysian phone helpers. Numbers may be stored in varied formats
 * (0123456789, 60123456789, +60123456789), so for login matching we compare
 * across plausible variants.
 */

/** Strip everything but digits. */
export function digits(input: string): string {
  return (input || "").replace(/\D/g, "");
}

/** Canonical MSISDN: 60XXXXXXXXX (no plus, no leading zero). */
export function normalizeMsisdn(input: string): string {
  let d = digits(input);
  if (d.startsWith("0")) d = "60" + d.slice(1);
  else if (!d.startsWith("60")) d = "60" + d;
  return d;
}

/** Plausible stored variants for matching an entered number against the DB. */
export function msisdnVariants(input: string): string[] {
  const canonical = normalizeMsisdn(input); // 60XXXXXXXXX
  const local = "0" + canonical.slice(2); // 0XXXXXXXXX
  const plus = "+" + canonical; // +60XXXXXXXXX
  return Array.from(new Set([input.trim(), canonical, local, plus, digits(input)])).filter(Boolean);
}
