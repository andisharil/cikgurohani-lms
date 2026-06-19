import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, CardBody } from "@/components/ui";
import { ContentView, type AnnouncementWithComments } from "@/components/portal/content-view";
import { getStudentContent } from "@/lib/services/portal-content";
import { getComments } from "@/lib/services/comments";
import { getLang, getDict } from "@/lib/i18n";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { fmtDate } from "@/lib/domain/format";
import type { Pakej, Tingkatan } from "@/lib/domain/packages";

export const dynamic = "force-dynamic";

export default async function ChildView({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  await requireParent();
  const lang = await getLang();
  const t = getDict(lang);
  const supabase = await createClient();

  // RLS parent_own scopes this to the parent's own child.
  const { data: child } = await supabase
    .from("students_with_status")
    .select("id, nama, tingkatan, pakej, aktif, tarikh_tamat, status")
    .eq("id", studentId)
    .maybeSingle();
  if (!child) notFound();

  const status = child.status as SubscriptionStatus;
  const commentPath = `/portal/anak/${studentId}`;

  if (status === "Disekat") {
    return (
      <div className="space-y-4">
        <Link href="/portal" className="text-sm text-ink hover:underline">
          ← {t.back}
        </Link>
        <Card>
          <CardBody className="space-y-2 text-center">
            <h1 className="text-lg font-bold text-ink">Akaun Disekat</h1>
            <p className="text-sm text-ink-soft">{t.blockedMsg}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const content = await getStudentContent({
    tingkatan: child.tingkatan as Tingkatan,
    pakej: child.pakej as Pakej,
    aktif: child.aktif!,
    tarikh_tamat: child.tarikh_tamat,
  });
  const announcements: AnnouncementWithComments[] = await Promise.all(
    content.announcements.map(async (a) => ({ ...a, comments: await getComments(a.id) })),
  );

  return (
    <div className="space-y-5">
      <Link href="/portal" className="text-sm text-ink hover:underline">
        ← Kembali
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">{child.nama}</h1>
          <p className="text-sm text-ink-soft">
            {child.tingkatan} · {child.pakej} · tamat {fmtDate(child.tarikh_tamat)}
          </p>
        </div>
        <Badge className={STATUS_BADGE[status]}>{status}</Badge>
      </div>

      {status === "Tamat" && (
        <div className="flex items-center justify-between rounded-[5px] border border-[#ecd98a] bg-highlight/25 px-4 py-3 text-sm text-ink">
          <span>{t.expiredMsg}</span>
          <ButtonLink href={`/portal/renew/${child.id}`}>{t.renewNow}</ButtonLink>
        </div>
      )}

      <ContentView content={content} announcements={announcements} role="parent" commentPath={commentPath} t={t} />
    </div>
  );
}
