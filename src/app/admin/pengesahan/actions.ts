"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin";
import {
  approveRenewal,
  rejectRenewal,
  applyPackageChange,
  rejectPackageChange,
  approveProfileChange,
  rejectProfileChange,
} from "@/lib/services/approvals";
import type { Pakej } from "@/lib/domain/packages";

export type ActionState = { error: string | null; ok?: boolean };

function actor(ctx: { userId: string; nama: string; role: string }) {
  return { userId: ctx.userId, label: `${ctx.nama} (${ctx.role})` };
}

export async function approveRenewalAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  try {
    await approveRenewal(
      String(fd.get("renewalId")),
      { pakej: (fd.get("pakej") as Pakej) || undefined, startFrom: String(fd.get("startFrom") || "") || null },
      actor(ctx),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}

export async function rejectRenewalAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  const reason = String(fd.get("reason") || "");
  if (!reason) return { error: "Sila pilih sebab penolakan." };
  try {
    await rejectRenewal(String(fd.get("renewalId")), reason, actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}

export async function applyPackageChangeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  try {
    await applyPackageChange(String(fd.get("requestId")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}

export async function rejectPackageChangeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  try {
    await rejectPackageChange(String(fd.get("requestId")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}

export async function approveProfileChangeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  try {
    await approveProfileChange(String(fd.get("requestId")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}

export async function rejectProfileChangeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requirePermission("sahkanBayaran");
  try {
    await rejectProfileChange(String(fd.get("requestId")), actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pengesahan");
  return { error: null, ok: true };
}
