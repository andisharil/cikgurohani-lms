import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole, Permission } from "@/lib/domain/permissions";

export type AdminContext = {
  userId: string;
  email: string | null;
  nama: string;
  role: AdminRole;
  /** Resolved permission map (Owner => everything true). */
  can: (perm: Permission) => boolean;
  permissions: Record<string, boolean>;
};

/**
 * Resolve the signed-in admin + their effective permissions, or null if the
 * current session is not an active admin. Reads run under the user's RLS.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("nama, emel, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.active) return null;

  const role = admin.role as AdminRole;
  let permissions: Record<string, boolean> = {};

  if (role === "Pemilik") {
    // Owner is always fully allowed.
    permissions = new Proxy({}, { get: () => true }) as Record<string, boolean>;
  } else {
    const { data: rows } = await supabase
      .from("role_permissions")
      .select("permission, allowed")
      .eq("role", role);
    permissions = Object.fromEntries((rows ?? []).map((r) => [r.permission, r.allowed]));
  }

  return {
    userId: user.id,
    email: admin.emel,
    nama: admin.nama,
    role,
    permissions,
    can: (perm: Permission) => role === "Pemilik" || permissions[perm] === true,
  };
}

/** Require an active admin session; redirect to login otherwise. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login?next=/admin");
  return ctx;
}

/**
 * Require a specific permission. For use in server actions / route handlers;
 * throws so the caller surfaces a clear error instead of silently proceeding.
 */
export async function requirePermission(perm: Permission): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!ctx.can(perm)) {
    throw new Error(`Tiada kebenaran: ${perm}`);
  }
  return ctx;
}
