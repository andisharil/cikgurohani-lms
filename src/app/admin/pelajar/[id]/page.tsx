import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/admin/tabs";
import { StudentManage } from "@/components/admin/student-manage";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { rm, fmtDate, fmtDateTime } from "@/lib/domain/format";
import type { Pakej, Tingkatan } from "@/lib/domain/packages";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireAdmin();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students_with_status")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!student || !student.parent_id) notFound();

  const [{ data: parent }, { data: siblings }, { data: payments }, { data: logs }, { data: notifs }] =
    await Promise.all([
      supabase.from("parents").select("*").eq("id", student.parent_id).single(),
      supabase
        .from("students_with_status")
        .select("id, code, nama, tingkatan, pakej, status")
        .eq("parent_id", student.parent_id),
      supabase
        .from("payments")
        .select("*")
        .eq("parent_id", student.parent_id)
        .order("tarikh", { ascending: false })
        .limit(50),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("parent_id", student.parent_id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notifications")
        .select("*")
        .eq("parent_id", student.parent_id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const status = student.status as SubscriptionStatus;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/pelajar" className="text-sm text-ink hover:underline">
          ← Senarai pelajar
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">{student.nama}</h1>
          <Badge className={STATUS_BADGE[status]}>{status}</Badge>
        </div>
        <p className="text-sm text-ink-soft">
          {student.code} · {student.tingkatan} · {student.pakej} · tamat {fmtDate(student.tarikh_tamat)}
          {student.days_left != null && status !== "Disekat" && ` (${student.days_left} hari)`}
        </p>
      </div>

      <StudentManage
        student={{
          id: student.id!,
          nama: student.nama!,
          telefon: student.telefon,
          tingkatan: student.tingkatan as Tingkatan,
          pakej: student.pakej as Pakej,
          tarikh_tamat: student.tarikh_tamat,
          aktif: student.aktif!,
        }}
        canManage={ctx.can("pelajar")}
      />

      <Tabs
        tabs={[
          {
            key: "maklumat",
            label: "Maklumat",
            node: (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Card>
                  <CardBody className="space-y-2 text-sm">
                    <h3 className="font-semibold text-ink">Ibu Bapa</h3>
                    <Row label="Nama" value={parent?.nama} />
                    <Row label="ID" value={parent?.code} />
                    <Row label="Emel" value={parent?.emel} />
                    <Row label="Telefon" value={parent?.telefon} />
                    <Row label="Lokasi" value={parent?.lokasi} />
                    <Row label="Daftar" value={fmtDate(parent?.tarikh_daftar)} />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="space-y-2 text-sm">
                    <h3 className="font-semibold text-ink">Anak-anak ({siblings?.length ?? 0})</h3>
                    {(siblings ?? []).map((s) => (
                      <Link
                        key={s.id}
                        href={`/admin/pelajar/${s.id}`}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-paper"
                      >
                        <span className={s.id === student.id ? "font-semibold text-ink" : "text-ink"}>
                          {s.nama} · {s.tingkatan}
                        </span>
                        <Badge className={STATUS_BADGE[s.status as SubscriptionStatus]}>{s.status}</Badge>
                      </Link>
                    ))}
                  </CardBody>
                </Card>
              </div>
            ),
          },
          {
            key: "bayaran",
            label: "Sejarah Pembayaran",
            node: <PaymentsTable payments={payments ?? []} />,
          },
          {
            key: "log",
            label: "Log Aktiviti",
            node: <LogList logs={(logs ?? []).map((l) => ({ ...l, internal_note: null }))} />,
          },
          {
            key: "notifikasi",
            label: "Notifikasi",
            node: <NotifList notifs={notifs ?? []} />,
          },
          {
            key: "nota",
            label: "Nota",
            node: <LogList logs={(logs ?? []).filter((l) => l.internal_note)} showNote />,
          },
        ]}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right text-ink">{value || "—"}</span>
    </div>
  );
}

type Payment = {
  id: string;
  code: string;
  tarikh: string;
  pakej: string | null;
  jumlah: number;
  saluran: string | null;
  status: string;
};
function PaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return <EmptyState title="Tiada rekod pembayaran" />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Rujukan</th>
            <th className="px-4 py-3 font-medium">Tarikh</th>
            <th className="px-4 py-3 font-medium">Pakej</th>
            <th className="px-4 py-3 font-medium">Jumlah</th>
            <th className="px-4 py-3 font-medium">Saluran</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/70">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">
                <a href={`/admin/resit/${p.id}`} className="text-ink hover:underline">
                  {p.code}
                </a>
              </td>
              <td className="px-4 py-3 text-ink-soft">{fmtDate(p.tarikh)}</td>
              <td className="px-4 py-3 text-ink-soft">{p.pakej ?? "—"}</td>
              <td className="px-4 py-3 text-ink">{rm(p.jumlah)}</td>
              <td className="px-4 py-3 text-ink-soft">{p.saluran ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge
                  className={
                    p.status === "Refunded"
                      ? "bg-violet-100 text-violet-700 border-violet-200"
                      : p.status === "Menunggu"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : p.status === "Ditolak"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }
                >
                  {p.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

type Log = { id: string; type: string; message: string; actor_label: string | null; internal_note: string | null; created_at: string };
function LogList({ logs, showNote }: { logs: Log[]; showNote?: boolean }) {
  if (logs.length === 0)
    return <EmptyState title={showNote ? "Tiada nota dalaman" : "Tiada aktiviti"} />;
  return (
    <ul className="space-y-2">
      {logs.map((l) => (
        <li key={l.id} className="rounded-lg border border-rule bg-white px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-ink">{l.message}</span>
            <span className="text-xs text-ink-soft">{fmtDateTime(l.created_at)}</span>
          </div>
          {showNote && l.internal_note && <p className="mt-1 text-ink-soft">{l.internal_note}</p>}
          {l.actor_label && <p className="mt-0.5 text-xs text-ink-soft">oleh {l.actor_label}</p>}
        </li>
      ))}
    </ul>
  );
}

type Notif = { id: string; channel: string; type: string; message: string | null; status: string; created_at: string };
function NotifList({ notifs }: { notifs: Notif[] }) {
  if (notifs.length === 0) return <EmptyState title="Tiada notifikasi" />;
  return (
    <ul className="space-y-2">
      {notifs.map((n) => (
        <li key={n.id} className="flex items-start justify-between rounded-lg border border-rule bg-white px-4 py-3 text-sm">
          <div>
            <p className="text-ink">{n.message ?? n.type}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {n.channel} · {n.type} · {fmtDateTime(n.created_at)}
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
  );
}
