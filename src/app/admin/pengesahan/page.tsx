import Link from "next/link";
import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { renewalRejectReasons } from "@/lib/services/approvals";
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { RenewalControls, PackageControls, ProfileControls } from "@/components/admin/approval-controls";
import { rm, fmtDate, fmtDateTime } from "@/lib/domain/format";
import { fileHref } from "@/lib/files";
import type { Pakej } from "@/lib/domain/packages";

export const dynamic = "force-dynamic";

export default async function PengesahanPage() {
  await requirePermission("sahkanBayaran");
  const supabase = await createClient();

  const [{ data: renewals }, { data: pkgReqs }, { data: profReqs }] = await Promise.all([
    supabase.from("renewal_requests").select("*").eq("status", "Menunggu").order("created_at"),
    supabase.from("package_change_requests").select("*").eq("status", "Baharu").order("created_at"),
    supabase.from("profile_change_requests").select("*").eq("status", "Baharu").order("created_at"),
  ]);

  // Enrich with student + parent display info (no embedded joins on trimmed types).
  const studentIds = new Set<string>();
  const parentIds = new Set<string>();
  for (const r of renewals ?? []) {
    studentIds.add(r.student_id);
    parentIds.add(r.parent_id);
  }
  for (const r of pkgReqs ?? []) {
    studentIds.add(r.student_id);
    parentIds.add(r.parent_id);
  }
  for (const r of profReqs ?? []) {
    if (r.student_id) studentIds.add(r.student_id);
    parentIds.add(r.parent_id);
  }

  const [{ data: students }, { data: parents }] = await Promise.all([
    studentIds.size
      ? supabase.from("students").select("id, code, nama, tingkatan, pakej").in("id", [...studentIds])
      : Promise.resolve({ data: [] as { id: string; code: string; nama: string; tingkatan: string; pakej: string }[] }),
    parentIds.size
      ? supabase.from("parents").select("id, code, nama").in("id", [...parentIds])
      : Promise.resolve({ data: [] as { id: string; code: string; nama: string }[] }),
  ]);
  const sMap = new Map((students ?? []).map((s) => [s.id, s]));
  const pMap = new Map((parents ?? []).map((p) => [p.id, p]));

  const reasons = renewalRejectReasons();
  const totalPending = (renewals?.length ?? 0) + (pkgReqs?.length ?? 0) + (profReqs?.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Pengesahan Bayaran</h1>
        <p className="text-sm text-ink-soft">{totalPending} permohonan menunggu</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permohonan Renewal ({renewals?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {!renewals || renewals.length === 0 ? (
            <EmptyState title="Tiada renewal menunggu" />
          ) : (
            renewals.map((r) => {
              const s = sMap.get(r.student_id);
              const p = pMap.get(r.parent_id);
              return (
                <div key={r.id} className="rounded-lg border border-rule p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-semibold text-ink">
                        {r.code} · {rm(r.jumlah)} · {r.pakej}
                      </p>
                      <p className="text-ink-soft">
                        {s ? (
                          <Link href={`/admin/pelajar/${s.id}`} className="text-ink hover:underline">
                            {s.nama} ({s.code})
                          </Link>
                        ) : (
                          "—"
                        )}{" "}
                        · {p?.nama} · sumber {r.sumber}
                      </p>
                      <p className="text-xs text-ink-soft">{fmtDateTime(r.created_at)}</p>
                      {r.resit_url && (
                        <a
                          href={fileHref(r.resit_url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-ink hover:underline"
                        >
                          Lihat resit
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <RenewalControls renewalId={r.id} defaultPakej={r.pakej as Pakej} reasons={reasons} />
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permohonan Tukar Pakej ({pkgReqs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {!pkgReqs || pkgReqs.length === 0 ? (
            <EmptyState title="Tiada permohonan tukar pakej" />
          ) : (
            pkgReqs.map((r) => {
              const s = sMap.get(r.student_id);
              return (
                <div key={r.id} className="rounded-lg border border-rule p-4">
                  <p className="text-sm font-semibold text-ink">
                    {r.code} · {r.dari_pakej} → {r.ke_pakej}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {s ? `${s.nama} (${s.code})` : "—"} · {fmtDate(r.created_at)}
                  </p>
                  <div className="mt-3">
                    <PackageControls requestId={r.id} />
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permohonan Tukar Profil ({profReqs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {!profReqs || profReqs.length === 0 ? (
            <EmptyState title="Tiada permohonan tukar profil" />
          ) : (
            profReqs.map((r) => {
              const s = r.student_id ? sMap.get(r.student_id) : null;
              const p = pMap.get(r.parent_id);
              return (
                <div key={r.id} className="rounded-lg border border-rule p-4">
                  <p className="text-sm font-semibold text-ink">
                    {r.code} · {r.field}: {r.old_value ?? "—"} → {r.new_value}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {s ? `${s.nama} (${s.code})` : p?.nama} · {fmtDate(r.created_at)}
                  </p>
                  <div className="mt-3">
                    <ProfileControls requestId={r.id} />
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}
