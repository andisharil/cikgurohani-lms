import type { Enums } from "@/lib/supabase/database.types";

export type Tingkatan = Enums<"tingkatan">; // 'T4' | 'T5' | 'T4&5'
export type Pakej = Enums<"pakej">; // 'Bulanan' | '3 Bulan' | '6 Bulan'

export const TINGKATAN: Tingkatan[] = ["T4", "T5", "T4&5"];
export const PAKEJ: Pakej[] = ["Bulanan", "3 Bulan", "6 Bulan"];

/** Months covered by each package. */
export const PACKAGE_MONTHS: Record<Pakej, number> = {
  Bulanan: 1,
  "3 Bulan": 3,
  "6 Bulan": 6,
};

/** Price in RM by tingkatan + package (PRD §4.2). Mirrors package_price() in SQL. */
const PRICE_SINGLE: Record<Pakej, number> = { Bulanan: 80, "3 Bulan": 230, "6 Bulan": 450 };
const PRICE_COMBO: Record<Pakej, number> = { Bulanan: 160, "3 Bulan": 460, "6 Bulan": 900 };

export function packagePrice(tingkatan: Tingkatan, pakej: Pakej): number {
  return tingkatan === "T4&5" ? PRICE_COMBO[pakej] : PRICE_SINGLE[pakej];
}

export function packageMonths(pakej: Pakej): number {
  return PACKAGE_MONTHS[pakej];
}

/**
 * Add a number of months to a date, clamping to the last day of the target
 * month so short months don't overflow (Jan 31 + 1 month → Feb 28, not Mar 3).
 * Operates in UTC so date-only values stay timezone-stable. Mirrors
 * calc_expiry() in SQL (Postgres interval math clamps the same way).
 */
export function addMonths(start: Date, months: number): Date {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const day = start.getUTCDate();
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay)));
}

export function calcExpiry(start: Date, pakej: Pakej): Date {
  return addMonths(start, packageMonths(pakej));
}

/**
 * New expiry on renewal (PRD §4.2 / §9.6):
 *   base = today if currently expired, else current expiry;
 *   new expiry = base + package duration.
 */
export function calcRenewalExpiry(
  currentExpiry: Date | null,
  pakej: Pakej,
  today: Date = new Date(),
): Date {
  const expired = !currentExpiry || currentExpiry < today;
  const base = expired ? today : currentExpiry;
  return calcExpiry(base, pakej);
}

/** Bank Soalan is only accessible on 3-month and 6-month packages (PRD §6.4). */
export function hasBankSoalanAccess(pakej: Pakej): boolean {
  return pakej === "3 Bulan" || pakej === "6 Bulan";
}

/** Which recording/material targets a tingkatan can see (PRD §6.2). */
export function visibleTargets(tingkatan: Tingkatan): Array<Enums<"target_tingkatan">> {
  if (tingkatan === "T4") return ["T4", "Kedua-dua"];
  if (tingkatan === "T5") return ["T5", "Kedua-dua"];
  return ["T4", "T5", "Kedua-dua"]; // T4&5
}
