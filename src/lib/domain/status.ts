import type { Enums } from "@/lib/supabase/database.types";

export type SubscriptionStatus = Enums<"subscription_status">;

/**
 * Derive subscription status from aktif + tarikh_tamat (PRD §4.1).
 * Mirrors student_status() in SQL — keep both in sync.
 */
export function deriveStatus(
  aktif: boolean,
  tarikhTamat: string | Date | null,
  today: Date = new Date(),
): SubscriptionStatus {
  if (!aktif) return "Disekat";
  if (!tarikhTamat) return "Tamat";
  const end = typeof tarikhTamat === "string" ? new Date(tarikhTamat) : tarikhTamat;
  const t = startOfDay(today);
  const e = startOfDay(end);
  if (e < t) return "Tamat";
  const daysLeft = Math.round((e.getTime() - t.getTime()) / 86_400_000);
  if (daysLeft <= 7) return "Akan Tamat";
  return "Aktif";
}

export function daysLeft(tarikhTamat: string | Date | null, today: Date = new Date()): number | null {
  if (!tarikhTamat) return null;
  const end = typeof tarikhTamat === "string" ? new Date(tarikhTamat) : tarikhTamat;
  return Math.round((startOfDay(end).getTime() - startOfDay(today).getTime()) / 86_400_000);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Tailwind badge classes per status (for consistent UI). */
export const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  Aktif: "bg-[#e6efe9] text-[#2e6e55] border-[#c2dccd]",
  "Akan Tamat": "bg-[#fbf1c4] text-[#7a5c00] border-[#ecd98a]",
  Tamat: "bg-[#f7ddd9] text-[#b1281b] border-[#eeb7af]",
  Disekat: "bg-[#e4e6ec] text-[#46506a] border-[#cfd4de]",
};

/** Whether a status may access live/gated content actions (Zoom join, downloads). */
export function canAccessLiveContent(status: SubscriptionStatus): boolean {
  return status === "Aktif" || status === "Akan Tamat";
}

/** Whether the portal should be fully locked (blocked account). */
export function isPortalLocked(status: SubscriptionStatus): boolean {
  return status === "Disekat";
}
