import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { computeFinance } from "@/lib/services/finance";
import { PrintButton } from "@/components/print-button";
import { rm, fmtDate, fmtDateTime, isoDate } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  harian: "Harian",
  mingguan: "Mingguan",
  bulanan: "Bulanan",
  suku: "Suku Tahun",
  ytd: "Tahun Semasa (YTD)",
};

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
    default:
      return { from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  }
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-rule/70 py-1.5 ${strong ? "font-semibold text-ink" : "text-ink-soft"}`}>
      <span>{label}</span>
      <span className={strong ? "font-mono text-ink" : "font-mono"}>{value}</span>
    </div>
  );
}

export default async function FinanceReportPage({
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between no-print">
        <a href={`/admin/kewangan?period=${period}`} className="text-sm text-ink hover:underline">
          ← Kewangan
        </a>
        <PrintButton />
      </div>

      <div className="print-sheet rounded-[5px] border border-rule bg-white p-8">
        {/* Letterhead */}
        <div className="flex items-end justify-between border-b-2 border-ink pb-4">
          <div>
            <p className="wordmark text-3xl text-ink">cikgurohani</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Pusat Tuisyen SPM · T4 &amp; T5
            </p>
          </div>
          <div className="text-right">
            <h1 className="font-display text-lg font-bold text-ink">Laporan Kewangan</h1>
            <p className="text-xs text-ink-soft">
              {LABELS[period] ?? "Bulanan"} · {fmtDate(from)} – {fmtDate(to)}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-x-10">
          <div>
            <h2 className="mb-1 font-display text-sm font-bold text-ink">Ringkasan</h2>
            <Line label="Pendapatan kasar" value={rm(m.grossRevenue)} />
            <Line label="Refund" value={`(${rm(m.refunded)})`} />
            <Line label="Pendapatan bersih" value={rm(m.netRevenue)} strong />
            <Line label="MRR (normalized)" value={rm(m.mrr)} />
            <Line label="ARPU" value={rm(m.arpu)} />
          </div>
          <div>
            <h2 className="mb-1 font-display text-sm font-bold text-ink">Langganan</h2>
            <Line label="Langganan aktif" value={String(m.activeSubs)} />
            <Line label="Purata tempoh" value={`${m.avgDurationMonths.toFixed(1)} bulan`} />
            <Line label="Renewal diluluskan" value={String(m.renewalsApproved)} />
          </div>
        </div>

        {/* Breakdowns */}
        <div className="mt-6 grid grid-cols-2 gap-x-10">
          <div>
            <h2 className="mb-1 font-display text-sm font-bold text-ink">Pendapatan ikut pakej</h2>
            {m.revenueByPackage.length === 0 ? (
              <p className="py-1.5 text-sm text-ink-soft">—</p>
            ) : (
              m.revenueByPackage.map((r) => <Line key={r.pakej} label={r.pakej} value={rm(r.total)} />)
            )}
          </div>
          <div>
            <h2 className="mb-1 font-display text-sm font-bold text-ink">Saluran pembayaran</h2>
            {m.channelSplit.length === 0 ? (
              <p className="py-1.5 text-sm text-ink-soft">—</p>
            ) : (
              m.channelSplit.map((r) => <Line key={r.saluran} label={r.saluran} value={rm(r.total)} />)
            )}
          </div>
        </div>

        <p className="mt-8 text-[10px] text-ink-soft">
          Dijana {fmtDateTime(new Date())}. Semua angka adalah bersih (selepas refund). Lihat
          docs/PRD.md §6a untuk takrif.
        </p>
      </div>
    </div>
  );
}
