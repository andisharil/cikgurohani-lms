import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Tabs } from "@/components/admin/tabs";
import { PermissionMatrix, AdminUsers, GeneralSettings } from "@/components/admin/settings-panels";
import type { AdminRole } from "@/lib/domain/permissions";

export const dynamic = "force-dynamic";

export default async function TetapanPage() {
  const ctx = await requireAdmin();
  if (!ctx.can("tetapan") && !ctx.can("permission")) redirect("/admin");
  const supabase = await createClient();

  const [{ data: perms }, { data: users }, { data: settings }] = await Promise.all([
    supabase.from("role_permissions").select("role, permission, allowed"),
    supabase.from("admin_users").select("id, nama, emel, role, active").order("created_at"),
    supabase.from("app_settings").select("key, value"),
  ]);

  const matrix: Record<string, Record<string, boolean>> = {};
  for (const row of perms ?? []) {
    (matrix[row.role] ??= {})[row.permission] = row.allowed;
  }
  const settingMap = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const language = String(settingMap.get("default_language") ?? "ms");
  const communityLink = String(settingMap.get("whatsapp_community_link") ?? "");

  const tabs = [];
  if (ctx.can("permission")) {
    tabs.push({ key: "kebenaran", label: "Kebenaran", node: <PermissionMatrix matrix={matrix} /> });
    tabs.push({
      key: "pengguna",
      label: "Pengguna",
      node: (
        <AdminUsers
          users={(users ?? []).map((u) => ({ ...u, role: u.role as AdminRole }))}
          currentUserId={ctx.userId}
        />
      ),
    });
  }
  if (ctx.can("tetapan")) {
    tabs.push({
      key: "umum",
      label: "Umum",
      node: <GeneralSettings language={language} communityLink={communityLink} />,
    });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink">Tetapan</h1>
      <Tabs tabs={tabs} />
    </div>
  );
}
