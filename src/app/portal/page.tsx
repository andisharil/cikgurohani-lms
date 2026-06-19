import { requireParent } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, CardBody, EmptyState } from "@/components/ui";
import { getLang, getDict } from "@/lib/i18n";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { fmtDate } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function ParentDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { parent } = await requireParent();
  const renewed = (await searchParams).renewed === "1";
  const lang = await getLang();
  const t = getDict(lang);
  const supabase = await createClient();

  const { data: children } = await supabase
    .from("students_with_status")
    .select("id, code, nama, tingkatan, pakej, status, tarikh_tamat, days_left")
    .eq("parent_id", parent.id);

  return (
    <div className="space-y-5">
      <div className="book-margin">
        <p className="wordmark text-2xl text-ink-soft">
          {t.welcome}, {parent.nama}
        </p>
        <p className="text-sm text-ink-soft">{t.yourChildren}</p>
      </div>

      {renewed && (
        <div className="rounded-[5px] border border-[#c2dccd] bg-[#e6efe9] px-4 py-3 text-sm text-chalk">
          {t.reviewing}
        </div>
      )}

      {!children || children.length === 0 ? (
        <EmptyState title={t.noStudents} description={t.contactAdmin} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((c) => {
            const status = c.status as SubscriptionStatus;
            return (
              <Card key={c.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-ink">{c.nama}</h3>
                    <Badge className={STATUS_BADGE[status]}>{status}</Badge>
                  </div>
                  <dl className="space-y-1 text-sm text-ink-soft">
                    <Row label={t.tingkatan} value={c.tingkatan} />
                    <Row label={t.pakej} value={c.pakej} />
                    <Row label={t.expiry} value={fmtDate(c.tarikh_tamat)} />
                    {status !== "Disekat" && c.days_left != null && (
                      <Row label={t.daysLeft} value={`${c.days_left} ${t.days}`} />
                    )}
                  </dl>

                  {status === "Tamat" && (
                    <div className="space-y-2 rounded-[5px] border border-[#ecd98a] bg-highlight/25 px-3 py-2 text-sm text-ink">
                      <p>{t.expiredMsg}</p>
                      <ButtonLink href={`/portal/renew/${c.id}`} className="w-full">
                        {t.renewNow}
                      </ButtonLink>
                    </div>
                  )}
                  {status === "Akan Tamat" && (
                    <ButtonLink href={`/portal/renew/${c.id}`} variant="secondary" className="w-full">
                      {t.renew}
                    </ButtonLink>
                  )}
                  {status === "Disekat" ? (
                    <div className="rounded-[5px] bg-paper px-3 py-2 text-sm text-ink-soft">{t.blockedMsg}</div>
                  ) : (
                    <ButtonLink href={`/portal/anak/${c.id}`} variant="secondary" className="w-full">
                      {t.viewContent}
                    </ButtonLink>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value ?? "—"}</dd>
    </div>
  );
}
