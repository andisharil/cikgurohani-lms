"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

/**
 * Email + password login for admins and parents (PRD §9.1 / §16.1).
 * Routes to /admin or /portal based on the account type; rejects others.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) return { error: "Sila isi emel dan kata laluan." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Emel atau kata laluan tidak sah." };

  const userId = data.user.id;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", userId)
    .eq("active", true)
    .maybeSingle();
  if (admin) redirect(next && next.startsWith("/admin") ? next : "/admin");

  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (parent) redirect(next && next.startsWith("/portal") ? next : "/portal");

  // Authenticated but neither admin nor parent — deny.
  await supabase.auth.signOut();
  return { error: "Akaun ini tiada akses ke sistem." };
}
