import type { DB } from "./activity";
import { packagePrice, packageMonths, type Pakej, type Tingkatan } from "@/lib/domain/packages";

export type FinanceMetrics = {
  netRevenue: number;
  grossRevenue: number;
  refunded: number;
  mrr: number;
  activeSubs: number;
  arpu: number;
  avgDurationMonths: number;
  renewalsApproved: number;
  revenueByPackage: { pakej: string; total: number }[];
  channelSplit: { saluran: string; total: number }[];
};

/**
 * Finance metrics for a period (PRD §6a). All figures are NET (refunds in the
 * period are deducted). MRR normalizes prepaid multi-month packages to a
 * monthly value. Revenue counts only paid (Berjaya) transactions.
 */
export async function computeFinance(db: DB, fromIso: string, toIso: string): Promise<FinanceMetrics> {
  const [{ data: pays }, { data: refs }, { data: active }, { count: renewalsApproved }] = await Promise.all([
    // Count payments that were actually collected on their date, including ones
    // later refunded (status flips to 'Refunded'); the refund is subtracted
    // separately below so net is correct whether the refund lands in this
    // period or a later one (PRD §6a).
    db
      .from("payments")
      .select("jumlah, pakej, saluran")
      .in("status", ["Berjaya", "Refunded"])
      .gte("tarikh", fromIso)
      .lte("tarikh", toIso),
    db.from("refunds").select("jumlah").eq("status", "Selesai").gte("completed_at", fromIso).lte("completed_at", toIso + "T23:59:59"),
    db.from("students_with_status").select("tingkatan, pakej, status, tarikh_mula, tarikh_tamat").in("status", ["Aktif", "Akan Tamat"]),
    db.from("renewal_requests").select("*", { count: "exact", head: true }).eq("status", "Diluluskan").gte("lulus_masa", fromIso).lte("lulus_masa", toIso + "T23:59:59"),
  ]);

  const grossRevenue = (pays ?? []).reduce((s, p) => s + Number(p.jumlah), 0);
  const refunded = (refs ?? []).reduce((s, r) => s + Number(r.jumlah), 0);
  const netRevenue = grossRevenue - refunded;

  // Revenue by package + channel.
  const pkgMap = new Map<string, number>();
  const chMap = new Map<string, number>();
  for (const p of pays ?? []) {
    if (p.pakej) pkgMap.set(p.pakej, (pkgMap.get(p.pakej) ?? 0) + Number(p.jumlah));
    if (p.saluran) chMap.set(p.saluran, (chMap.get(p.saluran) ?? 0) + Number(p.jumlah));
  }

  // Normalized MRR + avg duration from active subscriptions.
  let mrr = 0;
  let durationSum = 0;
  let durationCount = 0;
  for (const s of active ?? []) {
    if (s.pakej && s.tingkatan) {
      mrr += packagePrice(s.tingkatan as Tingkatan, s.pakej as Pakej) / packageMonths(s.pakej as Pakej);
    }
    if (s.tarikh_mula && s.tarikh_tamat) {
      const months = (new Date(s.tarikh_tamat).getTime() - new Date(s.tarikh_mula).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (months > 0) {
        durationSum += months;
        durationCount++;
      }
    }
  }
  const activeSubs = active?.length ?? 0;
  const arpu = activeSubs > 0 ? netRevenue / activeSubs : 0;
  const avgDurationMonths = durationCount > 0 ? durationSum / durationCount : 0;

  return {
    netRevenue,
    grossRevenue,
    refunded,
    mrr,
    activeSubs,
    arpu,
    avgDurationMonths,
    renewalsApproved: renewalsApproved ?? 0,
    revenueByPackage: [...pkgMap.entries()].map(([pakej, total]) => ({ pakej, total })),
    channelSplit: [...chMap.entries()].map(([saluran, total]) => ({ saluran, total })),
  };
}
