import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";
import type { Enums } from "@/lib/supabase/database.types";

type Actor = { userId: string; label: string };
type Target = Enums<"target_tingkatan">;
type Tingkatan = Enums<"tingkatan">;
type Audience = Enums<"announcement_audience">;
type Cta = Enums<"announcement_cta">;

async function log(actor: Actor, message: string) {
  const db = createAdminClient();
  await logActivity(db, { type: "edit", actor: actor.userId, actorLabel: actor.label, message });
}

/* ------------------------------- Materials ------------------------------- */
export async function createMaterial(input: { title: string; target: Target; fileUrl?: string }, actor: Actor) {
  const db = createAdminClient();
  const { error } = await db.from("materials").insert({
    title: input.title,
    target: input.target,
    file_url: input.fileUrl || null,
    created_by: actor.userId,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Tambah bahan kelas: ${input.title}`);
}

export async function deleteContent(table: "materials" | "recordings" | "announcements" | "student_reports" | "bank_soalan_files", id: string, actor: Actor) {
  const db = createAdminClient();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  await log(actor, `Padam ${table} ${id.slice(0, 8)}`);
}

/* ------------------------------- Recordings ------------------------------ */
export async function createRecording(input: { title: string; url: string; target: Target }, actor: Actor) {
  if (!/^https?:\/\//i.test(input.url)) throw new Error("URL rakaman tidak sah.");
  const db = createAdminClient();
  const { error } = await db.from("recordings").insert({
    title: input.title,
    url: input.url,
    target: input.target,
    created_by: actor.userId,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Tambah rakaman: ${input.title}`);
}

/* --------------------------------- Zoom ---------------------------------- */
export async function setZoomLink(tingkatan: Tingkatan, url: string, actor: Actor) {
  const db = createAdminClient();
  const { error } = await db.from("zoom_links").upsert({ tingkatan, url: url || null });
  if (error) throw new Error(error.message);
  await log(actor, `Kemas kini Zoom ${tingkatan}`);
}

/* ----------------------------- Announcements ----------------------------- */
export async function createAnnouncement(
  input: { title: string; body?: string; audience: Audience; ctaType?: Cta | null },
  actor: Actor,
) {
  const db = createAdminClient();
  const { error } = await db.from("announcements").insert({
    title: input.title,
    body: input.body || null,
    audience: input.audience,
    cta_type: input.ctaType || null,
    created_by: actor.userId,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Tambah pengumuman: ${input.title}`);
}

/* ------------------------------- Reports --------------------------------- */
export async function createReport(
  input: { tingkatan: Tingkatan; bulan: string; ringkasan?: string; guru?: string },
  actor: Actor,
) {
  const db = createAdminClient();
  const { error } = await db.from("student_reports").insert({
    tingkatan: input.tingkatan,
    bulan: input.bulan,
    ringkasan: input.ringkasan || null,
    guru: input.guru || null,
    created_by: actor.userId,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Terbit laporan ${input.tingkatan} ${input.bulan}`);
}

/* ------------------------------ Bank Soalan ------------------------------ */
export async function createBankFolder(
  input: { tingkatan: Tingkatan; name: string; parentFolderId?: string | null },
  actor: Actor,
) {
  const db = createAdminClient();
  const { error } = await db.from("bank_soalan_folders").insert({
    tingkatan: input.tingkatan,
    name: input.name,
    parent_folder_id: input.parentFolderId || null,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Cipta folder Bank Soalan: ${input.name}`);
}

export async function createBankFile(
  input: { folderId: string; title: string; fileUrl?: string },
  actor: Actor,
) {
  if (!input.folderId) throw new Error("Sila pilih folder.");
  const db = createAdminClient();
  const { error } = await db.from("bank_soalan_files").insert({
    folder_id: input.folderId,
    title: input.title,
    file_url: input.fileUrl || null,
    created_by: actor.userId,
  });
  if (error) throw new Error(error.message);
  await log(actor, `Muat naik soalan: ${input.title}`);
}
