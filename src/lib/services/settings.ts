import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";
import type { AdminRole, Permission } from "@/lib/domain/permissions";

type Actor = { userId: string; label: string };

async function activeOwnerCount(): Promise<number> {
  const db = createAdminClient();
  const { count } = await db
    .from("admin_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "Pemilik")
    .eq("active", true);
  return count ?? 0;
}

/** Toggle a permission in the matrix (PRD §15). Owner row is not editable. */
export async function setPermission(role: AdminRole, permission: Permission, allowed: boolean, actor: Actor) {
  if (role === "Pemilik") throw new Error("Kebenaran Pemilik tidak boleh diubah.");
  const db = createAdminClient();
  const { error } = await db.from("role_permissions").upsert({ role, permission, allowed });
  if (error) throw new Error(error.message);
  await logActivity(db, {
    type: "permission",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Kebenaran ${role}.${permission} = ${allowed ? "ya" : "tidak"}`,
  });
}

export async function setSetting(key: string, value: unknown, actor: Actor) {
  const db = createAdminClient();
  const { error } = await db.from("app_settings").upsert({ key, value: value as never });
  if (error) throw new Error(error.message);
  await logActivity(db, {
    type: "edit",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tetapan ${key} dikemas kini`,
  });
}

export async function addAdminUser(
  input: { email: string; password: string; nama: string; role: AdminRole },
  actor: Actor,
) {
  const db = createAdminClient();
  const { data: created, error } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(error?.message ?? "Gagal cipta pengguna.");

  const { error: insErr } = await db.from("admin_users").insert({
    id: created.user.id,
    nama: input.nama,
    emel: input.email,
    role: input.role,
    active: true,
  });
  if (insErr) {
    await db.auth.admin.deleteUser(created.user.id); // compensate
    throw new Error(insErr.message);
  }
  await logActivity(db, {
    type: "permission",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tambah admin ${input.email} (${input.role})`,
  });
}

export async function updateAdminRole(id: string, role: AdminRole, actor: Actor) {
  const db = createAdminClient();
  const { data: target } = await db.from("admin_users").select("role, active, emel").eq("id", id).single();
  if (!target) throw new Error("Pengguna tidak dijumpai.");
  if (target.role === "Pemilik" && role !== "Pemilik" && target.active && (await activeOwnerCount()) <= 1) {
    throw new Error("Tidak boleh — sistem mesti ada sekurang-kurangnya satu Pemilik.");
  }
  const { error } = await db.from("admin_users").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(db, {
    type: "permission",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tukar peranan ${target.emel} → ${role}`,
  });
}

export async function setAdminActive(id: string, active: boolean, actor: Actor) {
  const db = createAdminClient();
  const { data: target } = await db.from("admin_users").select("role, active, emel").eq("id", id).single();
  if (!target) throw new Error("Pengguna tidak dijumpai.");
  if (!active && target.role === "Pemilik" && target.active && (await activeOwnerCount()) <= 1) {
    throw new Error("Tidak boleh nyahaktif Pemilik terakhir.");
  }
  const { error } = await db.from("admin_users").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(db, {
    type: "permission",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `${active ? "Aktif" : "Nyahaktif"} admin ${target.emel}`,
  });
}

export async function removeAdminUser(id: string, actor: Actor) {
  const db = createAdminClient();
  const { data: target } = await db.from("admin_users").select("role, active, emel").eq("id", id).single();
  if (!target) throw new Error("Pengguna tidak dijumpai.");
  if (target.role === "Pemilik" && target.active && (await activeOwnerCount()) <= 1) {
    throw new Error("Tidak boleh padam Pemilik terakhir.");
  }
  await db.from("admin_users").delete().eq("id", id);
  await db.auth.admin.deleteUser(id).catch(() => {});
  await logActivity(db, {
    type: "permission",
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Padam admin ${target.emel}`,
  });
}
