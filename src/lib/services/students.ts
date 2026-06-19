import { createAdminClient } from "@/lib/supabase/admin";
import { packagePrice, calcExpiry, calcRenewalExpiry, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { isoDate } from "@/lib/domain/format";
import { logActivity } from "./activity";
import { notifyPortal, notifyEmail } from "./notifications";
import type { Enums } from "@/lib/supabase/database.types";

type Saluran = Enums<"saluran_bayaran">;
type Actor = { userId: string; label: string };

export type CreateStudentInput = {
  // parent
  parentNama: string;
  parentEmel: string;
  parentTelefon: string;
  parentLokasi?: string;
  existingParentId?: string | null; // attach to existing parent (PRD §7.4)
  // student
  studentNama: string;
  studentTelefon?: string;
  tingkatan: Tingkatan;
  pakej: Pakej;
  // payment
  tarikhMula: string; // yyyy-mm-dd
  saluran: Saluran;
  resitUrl?: string | null;
  nota?: string;
};

/**
 * Add-new-student flow (PRD §7.4): create/attach parent, create student with
 * computed expiry + price, create the payment record, send registration
 * notifications, and log activity. Parent+student are created with a
 * compensating delete if the student insert fails.
 */
export async function createStudentWithParent(input: CreateStudentInput, actor: Actor) {
  const db = createAdminClient();
  const price = packagePrice(input.tingkatan, input.pakej);
  const tarikhTamat = isoDate(calcExpiry(new Date(input.tarikhMula), input.pakej));

  // 1) Parent — reuse existing or create.
  let parentId = input.existingParentId ?? null;
  let createdParent = false;
  if (!parentId) {
    const { data: parent, error } = await db
      .from("parents")
      .insert({
        nama: input.parentNama,
        emel: input.parentEmel || null,
        telefon: input.parentTelefon || null,
        lokasi: input.parentLokasi || null,
      })
      .select("id")
      .single();
    if (error || !parent) throw new Error(`Gagal cipta ibu bapa: ${error?.message}`);
    parentId = parent.id;
    createdParent = true;
  }

  // 2) Student.
  const { data: student, error: se } = await db
    .from("students")
    .insert({
      parent_id: parentId,
      nama: input.studentNama,
      telefon: input.studentTelefon || null,
      tingkatan: input.tingkatan,
      pakej: input.pakej,
      tarikh_mula: input.tarikhMula,
      tarikh_tamat: tarikhTamat,
      saluran_bayaran: input.saluran,
      aktif: true,
    })
    .select("id, code")
    .single();
  if (se || !student) {
    if (createdParent && parentId) await db.from("parents").delete().eq("id", parentId);
    throw new Error(`Gagal cipta pelajar: ${se?.message}`);
  }

  // 3) Payment — manual/transfer without a receipt stays Menunggu (PRD §7.4).
  const needsReview =
    (input.saluran === "Manual" || input.saluran === "Pindahan Bank") && !input.resitUrl;
  const { error: payErr } = await db.from("payments").insert({
    parent_id: parentId,
    student_id: student.id,
    tarikh: input.tarikhMula,
    pakej: input.pakej,
    jumlah: price,
    saluran: input.saluran,
    resit_url: input.resitUrl || null,
    status: needsReview ? "Menunggu" : "Berjaya",
  });
  if (payErr) {
    // Roll back so we never leave a student without its registration payment.
    await db.from("students").delete().eq("id", student.id);
    if (createdParent && parentId) await db.from("parents").delete().eq("id", parentId);
    throw new Error(`Gagal cipta rekod bayaran: ${payErr.message}`);
  }

  // 4) Notifications + audit.
  await notifyPortal(db, {
    parentId: parentId!,
    studentId: student.id,
    type: "pendaftaran",
    message: `Pendaftaran pelajar ${student.code} berjaya. Pakej ${input.pakej} (${input.tingkatan}).`,
  });
  if (input.parentEmel) {
    await notifyEmail(db, {
      parentId: parentId!,
      studentId: student.id,
      type: "pendaftaran",
      to: input.parentEmel,
      subject: "Pendaftaran cikgurohani berjaya",
      message: `Pendaftaran pelajar ${student.code} berjaya.`,
      html: `<p>Terima kasih. Pelajar <b>${input.studentNama}</b> (${student.code}) telah didaftarkan untuk pakej ${input.pakej}.</p>`,
    });
  }
  await logActivity(db, {
    type: "edit",
    parentId,
    studentId: student.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tambah pelajar ${student.code} (${input.tingkatan}, ${input.pakej})`,
    internalNote: input.nota || null,
  });

  return { parentId: parentId!, studentId: student.id, studentCode: student.code };
}

export type LarasStudentInput = {
  studentId: string;
  nama: string;
  telefon?: string | null;
  tingkatan: Tingkatan;
  pakej: Pakej;
  tarikhTamat: string | null;
  aktif: boolean;
  fromPackageRequestId?: string | null;
};

/** Laras / edit student (PRD §7.5). Recomputes status implicitly via expiry. */
export async function larasStudent(input: LarasStudentInput, actor: Actor) {
  const db = createAdminClient();
  const { data: before } = await db
    .from("students")
    .select("*")
    .eq("id", input.studentId)
    .single();
  if (!before) throw new Error("Pelajar tidak dijumpai.");

  const { error } = await db
    .from("students")
    .update({
      nama: input.nama,
      telefon: input.telefon ?? null,
      tingkatan: input.tingkatan,
      pakej: input.pakej,
      tarikh_tamat: input.tarikhTamat,
      aktif: input.aktif,
    })
    .eq("id", input.studentId);
  if (error) throw new Error(`Gagal kemas kini: ${error.message}`);

  // If executing a package change request, mark it done + notify (PRD §7.5/§10.3).
  // Only when the request is still pending AND belongs to this student — guards
  // against re-processing a terminal request or closing someone else's.
  if (input.fromPackageRequestId) {
    const { data: req } = await db
      .from("package_change_requests")
      .select("status, student_id")
      .eq("id", input.fromPackageRequestId)
      .maybeSingle();
    if (req && req.status === "Baharu" && req.student_id === before.id) {
      await db
        .from("package_change_requests")
        .update({ status: "Selesai" })
        .eq("id", input.fromPackageRequestId);
      await notifyPortal(db, {
        parentId: before.parent_id,
        studentId: before.id,
        type: "tukar_pakej",
        message: `Permohonan tukar pakej diluluskan. Pakej baharu: ${input.pakej}.`,
      });
    }
  }

  await logActivity(db, {
    type: "pakej",
    parentId: before.parent_id,
    studentId: before.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Laras pelajar ${before.code}: ${before.tingkatan}/${before.pakej} → ${input.tingkatan}/${input.pakej}`,
  });
}

/** Manual extend subscription (PRD §7.6) / renewal application path. */
export async function extendStudent(
  args: { studentId: string; pakej: Pakej; startFrom?: string | null },
  actor: Actor,
) {
  const db = createAdminClient();
  const { data: s } = await db.from("students").select("*").eq("id", args.studentId).single();
  if (!s) throw new Error("Pelajar tidak dijumpai.");

  const baseStart = args.startFrom ? new Date(args.startFrom) : null;
  const newExpiry = baseStart
    ? calcExpiry(baseStart, args.pakej)
    : calcRenewalExpiry(s.tarikh_tamat ? new Date(s.tarikh_tamat) : null, args.pakej);
  const price = packagePrice(s.tingkatan, args.pakej);
  const expiryIso = isoDate(newExpiry);

  await db
    .from("students")
    .update({ pakej: args.pakej, tarikh_tamat: expiryIso, aktif: true })
    .eq("id", args.studentId);

  await db.from("payments").insert({
    parent_id: s.parent_id,
    student_id: s.id,
    tarikh: isoDate(baseStart ?? new Date()),
    pakej: args.pakej,
    jumlah: price,
    saluran: "Manual",
    status: "Berjaya",
  });

  await notifyPortal(db, {
    parentId: s.parent_id,
    studentId: s.id,
    type: "renewal",
    message: `Langganan dilanjutkan sehingga ${expiryIso}. Pakej ${args.pakej}.`,
  });
  await logActivity(db, {
    type: "pakej",
    parentId: s.parent_id,
    studentId: s.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Lanjut langganan ${s.code} → ${expiryIso} (${args.pakej})`,
  });

  return { newExpiry: expiryIso };
}

/** Block a student (PRD §7.7): set inactive, auto-reject pending renewals, notify. */
export async function blockStudent(
  args: { studentId: string; reason: string },
  actor: Actor,
) {
  const db = createAdminClient();
  const { data: s } = await db.from("students").select("*").eq("id", args.studentId).single();
  if (!s) throw new Error("Pelajar tidak dijumpai.");

  await db
    .from("students")
    .update({ aktif: false, block_reason: args.reason })
    .eq("id", args.studentId);

  // Auto-reject pending renewals for this student.
  await db
    .from("renewal_requests")
    .update({ status: "Ditolak", sebab_tolak: "Akaun pelajar disekat." })
    .eq("student_id", args.studentId)
    .eq("status", "Menunggu");

  // Generic notification to parent (internal reason NOT exposed).
  await notifyPortal(db, {
    parentId: s.parent_id,
    studentId: s.id,
    type: "akaun_disekat",
    message: "Akses akaun disekat sementara. Sila hubungi admin untuk maklumat lanjut.",
  });
  await logActivity(db, {
    type: "block",
    parentId: s.parent_id,
    studentId: s.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Sekat pelajar ${s.code}`,
    internalNote: args.reason,
  });
}

/** Unblock a student (PRD §7.7). */
export async function unblockStudent(args: { studentId: string }, actor: Actor) {
  const db = createAdminClient();
  const { data: s } = await db.from("students").select("*").eq("id", args.studentId).single();
  if (!s) throw new Error("Pelajar tidak dijumpai.");

  await db.from("students").update({ aktif: true, block_reason: null }).eq("id", args.studentId);

  await notifyPortal(db, {
    parentId: s.parent_id,
    studentId: s.id,
    type: "akaun_dibuka",
    message: "Akses akaun anda telah dibuka semula. Terima kasih.",
  });
  await logActivity(db, {
    type: "block",
    parentId: s.parent_id,
    studentId: s.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Buka sekatan pelajar ${s.code}`,
  });
}
