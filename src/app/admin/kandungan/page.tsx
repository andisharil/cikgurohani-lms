import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getComments } from "@/lib/services/comments";
import { Tabs } from "@/components/admin/tabs";
import {
  MaterialsPanel,
  RecordingsPanel,
  ZoomPanel,
  AnnouncementsPanel,
  ReportsPanel,
  BankSoalanPanel,
} from "@/components/admin/content-panels";

export const dynamic = "force-dynamic";

export default async function KandunganPage() {
  await requirePermission("kandungan");
  const supabase = await createClient();

  const [
    { data: materials },
    { data: recordings },
    { data: zoom },
    { data: announcements },
    { data: reports },
    { data: folders },
    { data: files },
  ] = await Promise.all([
    supabase.from("materials").select("id, title, target, file_url, created_at").order("created_at", { ascending: false }),
    supabase.from("recordings").select("id, title, url, target, created_at").order("created_at", { ascending: false }),
    supabase.from("zoom_links").select("tingkatan, url"),
    supabase.from("announcements").select("id, title, audience, cta_type, created_at").order("created_at", { ascending: false }),
    supabase.from("student_reports").select("id, tingkatan, bulan, guru, created_at").order("created_at", { ascending: false }),
    supabase.from("bank_soalan_folders").select("id, tingkatan, name, sort_order").order("tingkatan").order("sort_order"),
    supabase.from("bank_soalan_files").select("id, folder_id, title, created_at").order("created_at", { ascending: false }),
  ]);

  const announcementsWithComments = await Promise.all(
    (announcements ?? []).map(async (a) => ({ ...a, comments: await getComments(a.id) })),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink">Kandungan</h1>
      <Tabs
        tabs={[
          {
            key: "bahan",
            label: "Bahan Kelas",
            node: <MaterialsPanel items={(materials ?? []).map((m) => ({ ...m, url: m.file_url }))} />,
          },
          { key: "rakaman", label: "Rakaman", node: <RecordingsPanel items={recordings ?? []} /> },
          { key: "bank", label: "Bank Soalan", node: <BankSoalanPanel folders={folders ?? []} files={files ?? []} /> },
          { key: "pengumuman", label: "Pengumuman", node: <AnnouncementsPanel items={announcementsWithComments} /> },
          { key: "laporan", label: "Laporan Pelajar", node: <ReportsPanel items={reports ?? []} /> },
          { key: "zoom", label: "Zoom Link", node: <ZoomPanel links={zoom ?? []} /> },
        ]}
      />
    </div>
  );
}
