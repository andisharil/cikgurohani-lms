import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { NotifFilters, RetryButton } from "@/components/admin/notif-controls";
import { fmtDateTime } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function NotifikasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("notifikasi");
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const fromRow = (page - 1) * PAGE_SIZE;

  let query = supabase.from("notifications").select("*", { count: "exact" });
  if (sp.channel) query = query.eq("channel", sp.channel as "Portal" | "Email" | "WhatsApp");
  if (sp.status) query = query.eq("status", sp.status as "Berjaya" | "Gagal" | "Menunggu");
  query = query.order("created_at", { ascending: false }).range(fromRow, fromRow + PAGE_SIZE - 1);

  const { data: rows, count } = await query;
  const total = count ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Log Notifikasi</h1>
        <p className="text-sm text-ink-soft">{total} rekod</p>
      </div>

      <NotifFilters />

      {!rows || rows.length === 0 ? (
        <EmptyState title="Tiada notifikasi" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Masa</th>
                <th className="px-4 py-3 font-medium">Saluran</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Mesej</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {rows.map((n) => (
                <tr key={n.id} className={n.status === "Gagal" ? "bg-rose-50/40" : undefined}>
                  <td className="px-4 py-3 text-ink-soft">{fmtDateTime(n.created_at)}</td>
                  <td className="px-4 py-3 text-ink-soft">{n.channel}</td>
                  <td className="px-4 py-3 text-ink-soft">{n.type}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-ink">{n.message}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        n.status === "Gagal"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : n.status === "Menunggu"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                      }
                    >
                      {n.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {n.status === "Gagal" && <RetryButton id={n.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
