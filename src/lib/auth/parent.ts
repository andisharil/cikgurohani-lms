import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ParentContext = {
  userId: string;
  parent: Tables<"parents">;
};

/** Resolve the signed-in parent (via parents.auth_user_id), or null. */
export async function getParentContext(): Promise<ParentContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS parent_own restricts this to the caller's own parent row.
  const { data: parent } = await supabase
    .from("parents")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!parent) return null;
  return { userId: user.id, parent };
}

export async function requireParent(): Promise<ParentContext> {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login?next=/portal");
  return ctx;
}
