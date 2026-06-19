"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireAdmin } from "@/lib/auth/admin";
import {
  setPermission,
  setSetting,
  addAdminUser,
  updateAdminRole,
  setAdminActive,
  removeAdminUser,
} from "@/lib/services/settings";
import type { AdminRole, Permission } from "@/lib/domain/permissions";

export type Result = { error: string | null; ok?: boolean };

function actor(ctx: { userId: string; nama: string; role: string }) {
  return { userId: ctx.userId, label: `${ctx.nama} (${ctx.role})` };
}

export async function setPermissionAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("permission");
  try {
    await setPermission(
      formData.get("role") as AdminRole,
      formData.get("permission") as Permission,
      formData.get("allowed") === "true",
      actor(ctx),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

export async function setSettingAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("tetapan");
  try {
    await setSetting(String(formData.get("key")), String(formData.get("value")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

export async function addAdminUserAction(_prev: Result, formData: FormData): Promise<Result> {
  const ctx = await requirePermission("permission");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nama = String(formData.get("nama") || "").trim();
  const role = (formData.get("role") as AdminRole) || "Pembantu";
  if (!email || !password || !nama) return { error: "Sila lengkapkan semua medan." };
  if (password.length < 8) return { error: "Kata laluan minimum 8 aksara." };
  try {
    await addAdminUser({ email, password, nama, role }, actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

export async function updateAdminRoleAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("permission");
  try {
    await updateAdminRole(String(formData.get("id")), formData.get("role") as AdminRole, actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

export async function setAdminActiveAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("permission");
  try {
    await setAdminActive(String(formData.get("id")), formData.get("active") === "true", actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

export async function removeAdminUserAction(formData: FormData): Promise<Result> {
  const ctx = await requirePermission("permission");
  // Don't let an admin delete themselves.
  if (String(formData.get("id")) === ctx.userId) return { error: "Tidak boleh padam akaun sendiri." };
  try {
    await removeAdminUser(String(formData.get("id")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/tetapan");
  return { error: null, ok: true };
}

// Re-export for the no-arg guard used by the page.
export { requireAdmin };
