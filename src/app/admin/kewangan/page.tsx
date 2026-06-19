import Link from "next/link";
import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { computeFinance } from "@/lib/services/finance";
import { Badge, ButtonLink, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { rm, fmtDate, isoDate } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const PERIODS: { key: string; label: string }[] = [
  { key: "harian", label: "Harian" },
  { key: "mingguan", label: "Mingguan" },
  { key: "bulanan", label: "Bulanan" },
  { key: "suku", label: "Suku Tahun" },
  { key: "ytd", label: "YTD" },
];

function periodRange(period: string): { from: string; to: string } {
  const today = new Date();
  const to = isoDate(today);
  const start = new Date(today);
  switch (period) {
    case "harian":
      return { from: to, to };
    case "mingguan":
      start.setDate(start.getDate() - 6);
      return { from: isoDate(start), to };
    case "suku": {
      const q = Math.floor(today.getMonth() / 3) * 3;
      return { from: isoDate(new Date(today.getFullYear(), q, 1)), to };
    }
    case "ytd":
      return { from: isoDate(new Date(today.getFullYear(), 0, 1)), to };
    case "bulanan":
    default:
      return { from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  }
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="mt-1 text-xl font-bold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export default async function KewanganPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("kewangan");
  const sp = await searchParams;
  const period = sp.period ?? "bulanan";
  const { from, to } = periodRange(period);

  const supabase = await createClient();
  const m = await computeFinance(supabase, from, to);

  const { data: recent } = await supabase
    .from("payments")
    .select("id, code, tarikh, pakej, jumlah, saluran, status")
    .order("tarikh", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Kewangan</h1>
          <p className="text-sm text-ink-soft">
            {fmtDate(from)} – {fmtDate(to)} · semua angka bersih (selepas refund)
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/admin/kewangan/report?period=${period}`} variant="secondary">
            Laporan PDF
          </ButtonLink>
          <ButtonLink href={`/admin/kewangan/export?period=${period}`} variant="secondary">
            Export CSV
          </ButtonLink>
        </div>
      </div>

      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/kewangan?period=${p.key}`}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium " +
              (period === p.key ? "bg-ink text-white" : "bg-white text-ink-soft border border-rule hover:bg-paper")
            }
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pendapatan Bersih" value={rm(m.netRevenue)} hint={`Kasar ${rm(m.grossRevenue)} − refund ${rm(m.refunded)}`} />
        <Stat label="MRR (normalized)" value={rm(m.mrr)} hint="Nilai bulanan langganan aktif" />
        <Stat label="Langganan Aktif" value={String(m.activeSubs)} />
        <Stat label="ARPU" value={rm(m.arpu)} hint="Bersih ÷ langganan aktif" />
        <Stat label="Purata Tempoh" value={`${m.avgDurationMonths.toFixed(1)} bln`} />
        <Stat label="Renewal Diluluskan" value={String(m.renewalsApproved)} hint="Dalam tempoh" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Ikut Pakej</CardTitle>
          </CardHeader>
          <CardBody>
            {m.revenueByPackage.length === 0 ? (
              <EmptyState title="Tiada pendapatan dalam tempoh ini" />
            ) : (
              <ul className="space-y-2 text-sm">
                {m.revenueByPackage.map((r) => (
                  <li key={r.pakej} className="flex justify-between">
                    <span className="text-ink-soft">{r.pakej}</span>
                    <span className="font-medium text-ink">{rm(r.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saluran Pembayaran</CardTitle>
          </CardHeader>
          <CardBody>
            {m.channelSplit.length === 0 ? (
              <EmptyState title="Tiada data saluran" />
            ) : (
              <ul className="space-y-2 text-sm">
                {m.channelSplit.map((r) => (
                  <li key={r.saluran} className="flex justify-between">
                    <span className="text-ink-soft">{r.saluran}</span>
                    <span className="font-medium text-ink">{rm(r.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terkini</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {!recent || recent.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Tiada transaksi" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Rujukan</th>
                  <th className="px-4 py-2.5 font-medium">Tarikh</th>
                  <th className="px-4 py-2.5 font-medium">Pakej</th>
                  <th className="px-4 py-2.5 font-medium">Jumlah</th>
                  <th className="px-4 py-2.5 font-medium">Saluran</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/70">
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 font-medium">
                      <a href={`/admin/resit/${p.id}`} className="text-ink hover:underline">
                        {p.code}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{fmtDate(p.tarikh)}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{p.pakej ?? "—"}</td>
                    <td className="px-4 py-2.5 text-ink">{rm(p.jumlah)}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{p.saluran ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={
                          p.status === "Berjaya"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : p.status === "Refunded"
                              ? "bg-violet-100 text-violet-700 border-violet-200"
                              : "bg-paper text-ink-soft border-rule"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-ink-soft">
        Churn &amp; LTV memerlukan penjejakan sejarah langganan — akan ditambah apabila data terkumpul (lihat
        docs/PRD.md §6a).
      </p>
    </div>
  );
}
