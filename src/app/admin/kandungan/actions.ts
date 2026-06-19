"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin";
import * as content from "@/lib/services/content";
import { addComment } from "@/lib/services/comments";
import { uploadFile, PDF_TYPES } from "@/lib/storage";
import type { Enums } from "@/lib/supabase/database.types";

const PDF_MAX = 20 * 1024 * 1024;

export type Result = { error: string | null; ok?: boolean };

function actor(ctx: { userId: string; nama: string; role: string }) {
  return { userId: ctx.userId, label: `${ctx.nama} (${ctx.role})` };
}
function done(): Result {
  revalidatePath("/admin/kandungan");
  return { error: null, ok: true };
}
async function run(fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
  } catch (e) {
    return { error: (e as Error).message };
  }
  return done();
}

export async function createMaterialAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  return run(async () => {
    const path = await uploadFile("content", "materials", fd.get("file") as File, {
      allowed: PDF_TYPES,
      maxBytes: PDF_MAX,
    });
    await content.createMaterial(
      { title: String(fd.get("title")), target: fd.get("target") as Enums<"target_tingkatan">, fileUrl: path ?? undefined },
      actor(ctx),
    );
  });
}

export async function createRecordingAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  return run(() =>
    content.createRecording(
      { title: String(fd.get("title")), url: String(fd.get("url")), target: fd.get("target") as Enums<"target_tingkatan"> },
      actor(ctx),
    ),
  );
}

export async function setZoomLinkAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  return run(() => content.setZoomLink(fd.get("tingkatan") as Enums<"tingkatan">, String(fd.get("url") || ""), actor(ctx)));
}

export async function createAnnouncementAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  const cta = String(fd.get("ctaType") || "");
  return run(() =>
    content.createAnnouncement(
      {
        title: String(fd.get("title")),
        body: String(fd.get("body") || ""),
        audience: fd.get("audience") as Enums<"announcement_audience">,
        ctaType: (cta || null) as Enums<"announcement_cta"> | null,
      },
      actor(ctx),
    ),
  );
}

export async function createReportAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  return run(() =>
    content.createReport(
      {
        tingkatan: fd.get("tingkatan") as Enums<"tingkatan">,
        bulan: String(fd.get("bulan")),
        ringkasan: String(fd.get("ringkasan") || ""),
        guru: String(fd.get("guru") || ""),
      },
      actor(ctx),
    ),
  );
}

export async function createBankFileAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  return run(async () => {
    const path = await uploadFile("content", "bank-soalan", fd.get("file") as File, {
      allowed: PDF_TYPES,
      maxBytes: PDF_MAX,
    });
    await content.createBankFile(
      { folderId: String(fd.get("folderId")), title: String(fd.get("title")), fileUrl: path ?? undefined },
      actor(ctx),
    );
  });
}

export async function addAdminReplyAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  try {
    await addComment({
      announcementId: String(fd.get("announcementId")),
      authorType: "admin",
      authorId: ctx.userId,
      authorName: ctx.nama,
      body: String(fd.get("body") || ""),
      parentCommentId: String(fd.get("parentCommentId") || "") || null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/kandungan");
  return { error: null, ok: true };
}

export async function deleteContentAction(fd: FormData): Promise<Result> {
  const ctx = await requirePermission("kandungan");
  const table = fd.get("table") as "materials" | "recordings" | "announcements" | "student_reports" | "bank_soalan_files";
  return run(() => content.deleteContent(table, String(fd.get("id")), actor(ctx)));
}
