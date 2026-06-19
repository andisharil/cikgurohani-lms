import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/print-button";
import { rm, fmtDate, fmtDateTime } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-rule/70 py-2 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}

export default async function ReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: p } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (!p) notFound();

  const [{ data: parent }, { data: student }] = await Promise.all([
    supabase.from("parents").select("nama, code, emel, telefon").eq("id", p.parent_id).maybeSingle(),
    p.student_id
      ? supabase.from("students").select("nama, code, tingkatan").eq("id", p.student_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between no-print">
        <span className="text-sm text-ink-soft">Resit {p.code}</span>
        <PrintButton />
      </div>

      <div className="print-sheet rounded-[5px] border border-rule bg-white p-8">
        <div className="flex items-end justify-between border-b-2 border-ink pb-4">
          <div>
            <p className="wordmark text-3xl text-ink">cikgurohani</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Pusat Tuisyen SPM
            </p>
          </div>
          <div className="text-right">
            <h1 className="font-display text-lg font-bold text-ink">Resit Bayaran</h1>
            <p className="font-mono text-xs text-ink-soft">{p.code}</p>
          </div>
        </div>

        <div className="mt-6">
          <Row label="Tarikh" value={fmtDate(p.tarikh)} />
          {parent && <Row label="Ibu Bapa" value={`${parent.nama} (${parent.code})`} />}
          {student && <Row label="Pelajar" value={`${student.nama} (${student.code} · ${student.tingkatan})`} />}
          {p.pakej && <Row label="Pakej" value={p.pakej} />}
          {p.saluran && <Row label="Saluran" value={p.saluran} />}
          {p.ref && <Row label="Rujukan" value={p.ref} />}
          <Row label="Status" value={p.status} />
        </div>

        <div className="mt-6 flex items-center justify-between border-t-2 border-ink pt-3">
          <span className="font-display text-sm font-bold text-ink">JUMLAH</span>
          <span className="font-display text-2xl font-bold text-ink">{rm(p.jumlah)}</span>
        </div>

        <p className="mt-8 text-[10px] text-ink-soft">
          Resit dijana {fmtDateTime(new Date())}. cikgurohani.com — terima kasih atas pembayaran anda.
        </p>
      </div>
    </div>
  );
}
