import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { rm, fmtDate, fmtDateTime } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink-soft">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const ctx = await requireAdmin();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students_with_status")
    .select("id, code, nama, tingkatan, pakej, status, tarikh_tamat, days_left, parent_id")
    .order("days_left", { ascending: true })
    .limit(2000);

  const rows = students ?? [];
  const by = (s: SubscriptionStatus) => rows.filter((r) => r.status === s).length;
  const activeCount = by("Aktif") + by("Akan Tamat");
  const tingByActive = (t: string) =>
    rows.filter((r) => r.tingkatan === t && (r.status === "Aktif" || r.status === "Akan Tamat")).length;

  const attention = rows.filter((r) => r.status === "Akan Tamat" || r.status === "Tamat").slice(0, 12);

  // Pending requests awaiting review (PRD §7.1 alert).
  const [{ count: pendingRenewals }, { count: pendingPkg }, { count: pendingProfile }] =
    await Promise.all([
      supabase.from("renewal_requests").select("*", { count: "exact", head: true }).eq("status", "Menunggu"),
      supabase.from("package_change_requests").select("*", { count: "exact", head: true }).eq("status", "Baharu"),
      supabase.from("profile_change_requests").select("*", { count: "exact", head: true }).eq("status", "Baharu"),
    ]);
  const pendingTotal = (pendingRenewals ?? 0) + (pendingPkg ?? 0) + (pendingProfile ?? 0);

  // Monthly net revenue (permission-gated, PRD §7.1 / §6a).
  let revenue: number | null = null;
  if (ctx.can("kewangan")) {
    const monthStart = new Date();
    monthStart.setDate(1);
    const iso = monthStart.toISOString().slice(0, 10);
    const [{ data: pays }, { data: refs }] = await Promise.all([
      supabase.from("payments").select("jumlah").eq("status", "Berjaya").gte("tarikh", iso),
      supabase.from("refunds").select("jumlah").eq("status", "Selesai").gte("completed_at", iso),
    ]);
    const gross = (pays ?? []).reduce((s, p) => s + Number(p.jumlah), 0);
    const refunded = (refs ?? []).reduce((s, r) => s + Number(r.jumlah), 0);
    revenue = gross - refunded;
  }

  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("id, channel, type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <div className="book-margin">
        <p className="wordmark text-2xl text-ink-soft">Selamat kembali, {ctx.nama}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
      </div>

      {pendingTotal > 0 && (
        <Link
          href="/admin/pengesahan"
          className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <span className="font-semibold">{pendingTotal}</span> permohonan menunggu semakan
          {" — "}
          {pendingRenewals ?? 0} renewal, {pendingPkg ?? 0} tukar pakej, {pendingProfile ?? 0} tukar profil.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pelajar Aktif" value={activeCount} />
        <StatCard label="Akan Tamat (≤7 hari)" value={by("Akan Tamat")} />
        <StatCard label="Tamat" value={by("Tamat")} />
        {revenue !== null ? (
          <StatCard label="Pendapatan Bulan Ini" value={rm(revenue)} hint="Bersih selepas refund" />
        ) : (
          <StatCard label="Pendapatan" value="—" hint="Tiada kebenaran kewangan" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Aktif T4" value={tingByActive("T4")} />
        <StatCard label="Aktif T5" value={tingByActive("T5")} />
        <StatCard label="Aktif T4&5" value={tingByActive("T4&5")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {attention.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Tiada pelajar hampir tamat" description="Semua langganan masih aktif." />
              </div>
            ) : (
              <ul className="divide-y divide-rule/70">
                {attention.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/admin/pelajar/${s.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-paper"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{s.nama}</p>
                        <p className="text-xs text-ink-soft">
                          {s.code} · {s.tingkatan} · tamat {fmtDate(s.tarikh_tamat)}
                        </p>
                      </div>
                      <Badge className={STATUS_BADGE[s.status as SubscriptionStatus]}>
                        {s.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Notifikasi Terkini</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!recentNotifs || recentNotifs.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Tiada notifikasi lagi" />
              </div>
            ) : (
              <ul className="divide-y divide-rule/70">
                {recentNotifs.map((n) => (
                  <li
                    key={n.id}
                    className={cn_row(n.status)}
                  >
                    <div>
                      <p className="text-sm text-ink">{n.type}</p>
                      <p className="text-xs text-ink-soft">
                        {n.channel} · {fmtDateTime(n.created_at)}
                      </p>
                    </div>
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
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function cn_row(status: string): string {
  return `flex items-center justify-between px-5 py-3 ${
    status === "Gagal" ? "bg-rose-50/50" : ""
  }`;
}
