import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { RequestRefundForm, ProcessRefundForm } from "@/components/admin/refund-controls";
import { rm, fmtDateTime } from "@/lib/domain/format";
import { fileHref } from "@/lib/files";

export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const ctx = await requireAdmin();
  if (!ctx.can("mohonRefund") && !ctx.can("prosesRefund")) redirect("/admin");
  const supabase = await createClient();

  const { data: refunds } = await supabase
    .from("refunds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const pending = (refunds ?? []).filter((r) => r.status === "Dimohon");
  const done = (refunds ?? []).filter((r) => r.status === "Selesai");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink">Refund</h1>

      {ctx.can("mohonRefund") && <RequestRefundForm />}

      <Card>
        <CardHeader>
          <CardTitle>Dimohon ({pending.length})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {pending.length === 0 ? (
            <EmptyState title="Tiada permohonan refund" />
          ) : (
            pending.map((r) => (
              <div key={r.id} className="rounded-lg border border-rule p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-semibold text-ink">
                      {r.code} · {rm(r.jumlah)} · {r.kaedah}
                    </p>
                    <p className="text-ink-soft">{r.sebab || "—"}</p>
                    <p className="text-xs text-ink-soft">{fmtDateTime(r.created_at)}</p>
                    {r.akaun && <p className="text-xs text-ink-soft">Akaun: {r.akaun}</p>}
                    {r.qr_url && (
                      <a href={fileHref(r.qr_url)!} target="_blank" rel="noopener noreferrer" className="text-xs text-ink hover:underline">
                        Lihat QR
                      </a>
                    )}
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">Dimohon</Badge>
                </div>
                {ctx.can("prosesRefund") && <ProcessRefundForm refundId={r.id} />}
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selesai ({done.length})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {done.length === 0 ? (
            <EmptyState title="Tiada refund selesai" />
          ) : (
            done.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-rule px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {r.code} · {rm(r.jumlah)}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Selesai {fmtDateTime(r.completed_at)}
                    {r.resit_refund_url && (
                      <>
                        {" · "}
                        <a href={fileHref(r.resit_refund_url)!} target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">
                          resit
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Selesai</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
