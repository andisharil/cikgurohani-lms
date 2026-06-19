"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { retryNotification } from "@/lib/services/notifications";
import { logActivity } from "@/lib/services/activity";

export type Result = { error: string | null; ok?: boolean };

export async function retryNotificationAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("notifikasi");
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Notifikasi tidak sah." };
  const db = createAdminClient();
  try {
    const ok = await retryNotification(db, id);
    await logActivity(db, {
      type: "notifikasi",
      actor: ctx.userId,
      actorLabel: `${ctx.nama} (${ctx.role})`,
      message: `Cuba semula notifikasi ${id.slice(0, 8)} — ${ok ? "berjaya" : "gagal"}`,
    });
    if (!ok) return { error: "Cubaan semula gagal." };
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/notifikasi");
  return { error: null, ok: true };
}
