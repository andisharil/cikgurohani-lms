import { createAdminClient } from "@/lib/supabase/admin";
import { signedUrl } from "@/lib/storage";
import { visibleTargets, hasBankSoalanAccess, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { deriveStatus, type SubscriptionStatus } from "@/lib/domain/status";

/** Sign a stored path → short-lived URL; null passes through, external URLs pass through. */
const sign = (u: string | null) => (u ? signedUrl(u) : Promise.resolve(null));

export type PortalContent = {
  status: SubscriptionStatus;
  /** Expired (Tamat) → view-limited: titles shown, file/live access withheld. */
  contentLocked: boolean;
  liveLocked: boolean; // Zoom join / Bank Soalan gated unless Aktif/Akan Tamat
  materials: { id: string; title: string; url: string | null }[];
  recordings: { id: string; title: string; url: string | null }[];
  zoom: { tingkatan: string; url: string | null }[];
  bankSoalan:
    | { access: false; reason: "package" | "expired" }
    | { access: true; folders: { id: string; tingkatan: string; name: string }[]; files: { id: string; folder_id: string; title: string; url: string | null }[] };
  announcements: { id: string; title: string; body: string | null; cta_type: string | null; created_at: string }[];
  reports: { id: string; tingkatan: string; bulan: string; ringkasan: string | null; guru: string | null; tarikh_publish: string }[];
};

/**
 * Fetch all portal content for a student, gated by tingkatan / package / status
 * (PRD §6). Enforced server-side: when expired (view-limited policy) file URLs
 * are withheld; Bank Soalan follows the package rule. Disekat is handled by the
 * caller (blocked overlay) — this returns minimal data for that case.
 */
export async function getStudentContent(student: {
  tingkatan: Tingkatan;
  pakej: Pakej;
  aktif: boolean;
  tarikh_tamat: string | null;
}): Promise<PortalContent> {
  const status = deriveStatus(student.aktif, student.tarikh_tamat);
  const contentLocked = status === "Tamat"; // view-limited
  const liveLocked = !(status === "Aktif" || status === "Akan Tamat");
  const targets = visibleTargets(student.tingkatan);
  // tingkatan folders/reports this student can see (T4&5 → both)
  const tings: Tingkatan[] = student.tingkatan === "T4&5" ? ["T4", "T5"] : [student.tingkatan];
  const audiences = ["Semua", ...tings] as ("Semua" | "T4" | "T5")[];

  const db = createAdminClient();
  const [{ data: materials }, { data: recordings }, { data: zoom }, { data: announcements }, { data: reports }] =
    await Promise.all([
      db.from("materials").select("id, title, file_url").in("target", targets).order("created_at", { ascending: false }),
      db.from("recordings").select("id, title, url, target").in("target", targets).order("created_at", { ascending: false }),
      db.from("zoom_links").select("tingkatan, url").in("tingkatan", tings),
      db.from("announcements").select("id, title, body, cta_type, created_at, audience").eq("published", true).in("audience", audiences).order("created_at", { ascending: false }),
      db.from("student_reports").select("id, tingkatan, bulan, ringkasan, guru, tarikh_publish").in("tingkatan", tings).order("tarikh_publish", { ascending: false }),
    ]);

  // Bank Soalan gating.
  let bankSoalan: PortalContent["bankSoalan"];
  if (!hasBankSoalanAccess(student.pakej)) {
    bankSoalan = { access: false, reason: "package" };
  } else if (contentLocked) {
    bankSoalan = { access: false, reason: "expired" };
  } else {
    const { data: folders } = await db
      .from("bank_soalan_folders")
      .select("id, tingkatan, name, sort_order")
      .in("tingkatan", tings)
      .order("tingkatan")
      .order("sort_order");
    const folderIds = (folders ?? []).map((f) => f.id);
    const { data: files } = folderIds.length
      ? await db.from("bank_soalan_files").select("id, folder_id, title, file_url").in("folder_id", folderIds)
      : { data: [] as { id: string; folder_id: string; title: string; file_url: string | null }[] };
    bankSoalan = {
      access: true,
      folders: (folders ?? []).map((f) => ({ id: f.id, tingkatan: f.tingkatan, name: f.name })),
      files: await Promise.all(
        (files ?? []).map(async (f) => ({
          id: f.id,
          folder_id: f.folder_id,
          title: f.title,
          url: await sign(f.file_url),
        })),
      ),
    };
  }

  // View-limited: withhold file/recording URLs when expired; otherwise sign
  // storage paths into short-lived URLs (external links pass through).
  const [signedMaterials, signedRecordings] = await Promise.all([
    Promise.all(
      (materials ?? []).map(async (m) => ({
        id: m.id,
        title: m.title,
        url: contentLocked ? null : await sign(m.file_url),
      })),
    ),
    Promise.all(
      (recordings ?? []).map(async (r) => ({
        id: r.id,
        title: r.title,
        url: contentLocked ? null : await sign(r.url),
      })),
    ),
  ]);

  return {
    status,
    contentLocked,
    liveLocked,
    materials: signedMaterials,
    recordings: signedRecordings,
    zoom: (zoom ?? []).map((z) => ({ tingkatan: z.tingkatan, url: liveLocked ? null : z.url })),
    bankSoalan,
    announcements: announcements ?? [],
    reports: reports ?? [],
  };
}
