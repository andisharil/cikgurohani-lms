"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/admin";
import {
  createStudentWithParent,
  larasStudent,
  extendStudent,
  blockStudent,
  unblockStudent,
} from "@/lib/services/students";
import { TINGKATAN, PAKEJ } from "@/lib/domain/packages";
import { uploadFile, RECEIPT_TYPES } from "@/lib/storage";

const RECEIPT_MAX = 10 * 1024 * 1024;

const tingkatanEnum = z.enum(TINGKATAN as [string, ...string[]]);
const pakejEnum = z.enum(PAKEJ as [string, ...string[]]);
const saluranEnum = z.enum(["BCL", "BayarCash", "Manual", "Pindahan Bank"]);

export type ActionState = { error: string | null; ok?: boolean };

function actorLabel(ctx: { nama: string; role: string }) {
  return `${ctx.nama} (${ctx.role})`;
}

const addSchema = z.object({
  parentNama: z.string().min(1, "Nama ibu bapa diperlukan."),
  parentEmel: z.string().email("Emel ibu bapa tidak sah."),
  parentTelefon: z.string().min(6, "Telefon ibu bapa diperlukan."),
  parentLokasi: z.string().optional(),
  existingParentId: z.string().uuid().optional().or(z.literal("")),
  studentNama: z.string().min(1, "Nama pelajar diperlukan."),
  studentTelefon: z.string().optional(),
  tingkatan: tingkatanEnum,
  pakej: pakejEnum,
  tarikhMula: z.string().min(1, "Tarikh mula diperlukan."),
  saluran: saluranEnum,
  resitUrl: z.string().optional(),
  nota: z.string().optional(),
});

export async function addStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requirePermission("tambah_pelajar");
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }
  const v = parsed.data;
  let studentId: string;
  try {
    const resitUrl = await uploadFile("receipts", "registration", formData.get("resit") as File, {
      allowed: RECEIPT_TYPES,
      maxBytes: RECEIPT_MAX,
    });
    const res = await createStudentWithParent(
      {
        parentNama: v.parentNama,
        parentEmel: v.parentEmel,
        parentTelefon: v.parentTelefon,
        parentLokasi: v.parentLokasi,
        existingParentId: v.existingParentId || null,
        studentNama: v.studentNama,
        studentTelefon: v.studentTelefon,
        tingkatan: v.tingkatan as never,
        pakej: v.pakej as never,
        tarikhMula: v.tarikhMula,
        saluran: v.saluran as never,
        resitUrl,
        nota: v.nota,
      },
      { userId: ctx.userId, label: actorLabel(ctx) },
    );
    studentId = res.studentId;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/pelajar");
  redirect(`/admin/pelajar/${studentId}`);
}

const larasSchema = z.object({
  studentId: z.string().uuid(),
  nama: z.string().min(1),
  telefon: z.string().optional(),
  tingkatan: tingkatanEnum,
  pakej: pakejEnum,
  tarikhTamat: z.string().optional(),
  aktif: z.union([z.literal("on"), z.literal("")]).optional(),
  fromPackageRequestId: z.string().uuid().optional().or(z.literal("")),
});

export async function larasStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requirePermission("pelajar");
  const parsed = larasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  const v = parsed.data;
  try {
    await larasStudent(
      {
        studentId: v.studentId,
        nama: v.nama,
        telefon: v.telefon || null,
        tingkatan: v.tingkatan as never,
        pakej: v.pakej as never,
        tarikhTamat: v.tarikhTamat || null,
        aktif: v.aktif === "on",
        fromPackageRequestId: v.fromPackageRequestId || null,
      },
      { userId: ctx.userId, label: actorLabel(ctx) },
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/admin/pelajar/${v.studentId}`);
  return { error: null, ok: true };
}

const extendSchema = z.object({
  studentId: z.string().uuid(),
  pakej: pakejEnum,
  startFrom: z.string().optional(),
});

export async function extendStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requirePermission("pelajar");
  const parsed = extendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  const v = parsed.data;
  try {
    await extendStudent(
      { studentId: v.studentId, pakej: v.pakej as never, startFrom: v.startFrom || null },
      { userId: ctx.userId, label: actorLabel(ctx) },
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/admin/pelajar/${v.studentId}`);
  return { error: null, ok: true };
}

const blockSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().min(3, "Sila isi sebab dalaman."),
});

export async function blockStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requirePermission("pelajar");
  const parsed = blockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  const v = parsed.data;
  try {
    await blockStudent({ studentId: v.studentId, reason: v.reason }, { userId: ctx.userId, label: actorLabel(ctx) });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/admin/pelajar/${v.studentId}`);
  return { error: null, ok: true };
}

export async function unblockStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requirePermission("pelajar");
  const studentId = String(formData.get("studentId") || "");
  if (!studentId) return { error: "Pelajar tidak sah." };
  try {
    await unblockStudent({ studentId }, { userId: ctx.userId, label: actorLabel(ctx) });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/admin/pelajar/${studentId}`);
  return { error: null, ok: true };
}
