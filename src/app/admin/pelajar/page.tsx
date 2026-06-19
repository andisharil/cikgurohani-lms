import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { StudentFilters } from "@/components/admin/student-filters";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { fmtDate } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const SORT_COLUMNS: Record<string, { col: string; asc: boolean }> = {
  created: { col: "created_at", asc: false },
  nama: { col: "nama", asc: true },
  tamat: { col: "tarikh_tamat", asc: true },
  hari: { col: "days_left", asc: true },
};

function sanitize(q: string): string {
  return q.replace(/[,()*%]/g, " ").trim();
}

export default async function PelajarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();

  const q = sanitize(sp.q ?? "");
  const status = sp.status ?? "";
  const tingkatan = sp.tingkatan ?? "";
  const sort = SORT_COLUMNS[sp.sort ?? "created"] ?? SORT_COLUMNS.created;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("students_admin").select("*", { count: "exact" });
  if (q) query = query.or(`nama.ilike.%${q}%,code.ilike.%${q}%,parent_nama.ilike.%${q}%,parent_emel.ilike.%${q}%`);
  if (status) query = query.eq("status", status as SubscriptionStatus);
  if (tingkatan) query = query.eq("tingkatan", tingkatan as "T4" | "T5" | "T4&5");
  query = query.order(sort.col, { ascending: sort.asc, nullsFirst: false }).range(from, from + PAGE_SIZE - 1);

  const { data: rows, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (tingkatan) exportParams.set("tingkatan", tingkatan);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Pelajar</h1>
          <p className="text-sm text-ink-soft">{total} rekod</p>
        </div>
        <div className="flex gap-2">
          {ctx.can("pelajar") && (
            <ButtonLink href={`/admin/pelajar/export?${exportParams.toString()}`} variant="secondary">
              Export CSV
            </ButtonLink>
          )}
          {ctx.can("tambah_pelajar") && (
            <ButtonLink href="/admin/pelajar/baru">Tambah Pelajar</ButtonLink>
          )}
        </div>
      </div>

      <StudentFilters />

      {!rows || rows.length === 0 ? (
        <EmptyState
          title="Tiada pelajar dijumpai"
          description="Cuba tukar carian atau penapis."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Ibu Bapa</th>
                <th className="px-4 py-3 font-medium">Tingkatan</th>
                <th className="px-4 py-3 font-medium">Pakej</th>
                <th className="px-4 py-3 font-medium">Tamat</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pelajar/${s.id}`} className="font-medium text-ink hover:underline">
                      {s.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{s.nama}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.parent_nama}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.tingkatan}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.pakej}</td>
                  <td className="px-4 py-3 text-ink-soft">{fmtDate(s.tarikh_tamat)}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[s.status as SubscriptionStatus]}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} sp={sp} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  sp,
}: {
  page: number;
  totalPages: number;
  sp: Record<string, string | undefined>;
}) {
  const mk = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") next.set(k, v);
    next.set("page", String(p));
    return `/admin/pelajar?${next.toString()}`;
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-soft">
        Halaman {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={mk(page - 1)} className="rounded-lg border border-rule bg-white px-3 py-1.5 hover:bg-paper">
            Sebelum
          </Link>
        )}
        {page < totalPages && (
          <Link href={mk(page + 1)} className="rounded-lg border border-rule bg-white px-3 py-1.5 hover:bg-paper">
            Seterusnya
          </Link>
        )}
      </div>
    </div>
  );
}
