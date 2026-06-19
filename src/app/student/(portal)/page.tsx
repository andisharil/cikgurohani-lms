import { cookies } from "next/headers";
import { requireStudent } from "@/lib/auth/student";
import { Badge, Card, CardBody } from "@/components/ui";
import { ContentView, type AnnouncementWithComments } from "@/components/portal/content-view";
import { StudentOnboarding } from "@/components/portal/student-onboarding";
import { getStudentContent } from "@/lib/services/portal-content";
import { getComments } from "@/lib/services/comments";
import { getLang, getDict } from "@/lib/i18n";
import { STATUS_BADGE, type SubscriptionStatus } from "@/lib/domain/status";
import { fmtDate } from "@/lib/domain/format";
import type { Pakej, Tingkatan } from "@/lib/domain/packages";

export const dynamic = "force-dynamic";

export default async function StudentHome() {
  const { student } = await requireStudent();
  const lang = await getLang();
  const t = getDict(lang);
  const status = student.status as SubscriptionStatus;

  if (status === "Disekat") {
    return (
      <Card>
        <CardBody className="space-y-2 text-center">
          <h1 className="text-lg font-bold text-ink">Akaun Disekat</h1>
          <p className="text-sm text-ink-soft">{t.blockedMsg}</p>
        </CardBody>
      </Card>
    );
  }

  const content = await getStudentContent({
    tingkatan: student.tingkatan as Tingkatan,
    pakej: student.pakej as Pakej,
    aktif: student.aktif!,
    tarikh_tamat: student.tarikh_tamat,
  });

  const announcements: AnnouncementWithComments[] = await Promise.all(
    content.announcements.map(async (a) => ({ ...a, comments: await getComments(a.id) })),
  );

  // Onboarding: active (non-expired) students who haven't completed it (PRD §9.3).
  const onboarded = (await cookies()).get("cikgu_onboarded")?.value === "1";
  const showOnboarding = (status === "Aktif" || status === "Akan Tamat") && !onboarded;

  return (
    <div className="space-y-5">
      <StudentOnboarding t={t} initialShow={showOnboarding} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {t.hi}, {student.nama}
          </h1>
          <p className="text-sm text-ink-soft">
            {student.tingkatan} · {student.pakej} · {t.expiry.toLowerCase()} {fmtDate(student.tarikh_tamat)}
          </p>
        </div>
        <Badge className={STATUS_BADGE[status]}>{status}</Badge>
      </div>

      {status === "Tamat" && (
        <div className="rounded-[5px] border border-[#eeb7af] bg-[#f7ddd9] px-4 py-3 text-sm text-[#b1281b]">
          {t.studentExpiredMsg}
        </div>
      )}

      <ContentView content={content} announcements={announcements} role="student" commentPath="/student" t={t} />
    </div>
  );
}
