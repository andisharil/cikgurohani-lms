import { createAdminClient } from "@/lib/supabase/admin";
import { packagePrice, calcExpiry, calcRenewalExpiry, type Pakej } from "@/lib/domain/packages";
import { isoDate } from "@/lib/domain/format";
import { logActivity } from "./activity";
import { notifyPortal } from "./notifications";

type Actor = { userId: string | null; label: string };

/**
 * Approve a renewal (PRD §10.1): extend the student, mark approved, create the
 * payment, notify + log. Reopens a blocked student's access.
 */
export async function approveRenewal(
  renewalId: string,
  opts: { pakej?: Pakej; startFrom?: string | null },
  actor: Actor,
) {
  const db = createAdminClient();
  const { data: r } = await db.from("renewal_requests").select("*").eq("id", renewalId).single();
  if (!r) throw new Error("Permohonan tidak dijumpai.");
  if (r.status !== "Menunggu") throw new Error("Permohonan ini telah diproses.");

  const { data: s } = await db.from("students").select("*").eq("id", r.student_id).single();
  if (!s) throw new Error("Pelajar tidak dijumpai.");

  const pakej = (opts.pakej ?? r.pakej) as Pakej;
  const newExpiry = opts.startFrom
    ? calcExpiry(new Date(opts.startFrom), pakej)
    : calcRenewalExpiry(s.tarikh_tamat ? new Date(s.tarikh_tamat) : null, pakej);
  const expiryIso = isoDate(newExpiry);
  const price = packagePrice(s.tingkatan, pakej);

  await db
    .from("students")
    .update({ pakej, tarikh_tamat: expiryIso, aktif: true })
    .eq("id", s.id);

  await db
    .from("renewal_requests")
    .update({ status: "Diluluskan", pakej, lulus_oleh: actor.userId, lulus_masa: new Date().toISOString() })
    .eq("id", renewalId);

  await db.from("payments").insert({
    parent_id: r.parent_id,
    student_id: s.id,
    tarikh: isoDate(opts.startFrom ? new Date(opts.startFrom) : new Date()),
    pakej,
    jumlah: price,
    saluran: r.sumber === "BayarCash" ? "BayarCash" : "Manual",
    resit_url: r.resit_url,
    ref: r.code,
    status: "Berjaya",
  });

  await notifyPortal(db, {
    parentId: r.parent_id,
    studentId: s.id,
    type: "renewal",
    message: `Pembayaran disahkan. Langganan ${s.code} dilanjutkan sehingga ${expiryIso}.`,
  });
  await logActivity(db, {
    type: "pakej",
    parentId: r.parent_id,
    studentId: s.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Lulus renewal ${r.code} → ${expiryIso} (${pakej})`,
  });

  return { expiry: expiryIso };
}

const REJECT_REASONS = [
  "Tiada rekod pembayaran dalam akaun bank.",
  "Jumlah tidak sepadan dengan pakej.",
  "Resit tidak sah / tidak jelas.",
  "Resit pernah digunakan sebelum ini.",
];

export function renewalRejectReasons() {
  return REJECT_REASONS;
}

/** Reject a renewal (PRD §10.2): store reason, notify, log. No expiry change. */
export async function rejectRenewal(renewalId: string, reason: string, actor: Actor) {
  const db = createAdminClient();
  const { data: r } = await db.from("renewal_requests").select("*").eq("id", renewalId).single();
  if (!r) throw new Error("Permohonan tidak dijumpai.");
  if (r.status !== "Menunggu") throw new Error("Permohonan ini telah diproses.");

  await db
    .from("renewal_requests")
    .update({ status: "Ditolak", sebab_tolak: reason, lulus_oleh: actor.userId, lulus_masa: new Date().toISOString() })
    .eq("id", renewalId);

  await notifyPortal(db, {
    parentId: r.parent_id,
    studentId: r.student_id,
    type: "renewal",
    message: `Permohonan pembayaran ditolak: ${reason} Anda boleh hantar resit baharu.`,
  });
  await logActivity(db, {
    type: "pakej",
    parentId: r.parent_id,
    studentId: r.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tolak renewal ${r.code}`,
    internalNote: reason,
  });
}

/** Execute a package-change request (PRD §10.3): apply package, mark Selesai. */
export async function applyPackageChange(requestId: string, actor: Actor) {
  const db = createAdminClient();
  const { data: req } = await db
    .from("package_change_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (!req) throw new Error("Permohonan tidak dijumpai.");
  if (req.status !== "Baharu") throw new Error("Permohonan ini telah diproses.");

  const { data: s } = await db.from("students").select("*").eq("id", req.student_id).single();
  if (!s) throw new Error("Pelajar tidak dijumpai.");

  await db.from("students").update({ pakej: req.ke_pakej }).eq("id", s.id);
  await db.from("package_change_requests").update({ status: "Selesai" }).eq("id", requestId);

  await notifyPortal(db, {
    parentId: req.parent_id,
    studentId: s.id,
    type: "tukar_pakej",
    message: `Pakej ${s.code} telah ditukar kepada ${req.ke_pakej}.`,
  });
  await logActivity(db, {
    type: "pakej",
    parentId: req.parent_id,
    studentId: s.id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Laksana tukar pakej ${req.code}: ${req.dari_pakej} → ${req.ke_pakej}`,
  });
}

export async function rejectPackageChange(requestId: string, actor: Actor) {
  const db = createAdminClient();
  const { data: req } = await db.from("package_change_requests").select("*").eq("id", requestId).single();
  if (!req) throw new Error("Permohonan tidak dijumpai.");
  if (req.status !== "Baharu") throw new Error("Permohonan ini telah diproses.");
  await db.from("package_change_requests").update({ status: "Ditolak" }).eq("id", requestId);
  await notifyPortal(db, {
    parentId: req.parent_id,
    studentId: req.student_id,
    type: "tukar_pakej",
    message: "Permohonan tukar pakej tidak diluluskan. Sila hubungi admin.",
  });
  await logActivity(db, {
    type: "pakej",
    parentId: req.parent_id,
    studentId: req.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tolak tukar pakej ${req.code}`,
  });
}

/**
 * Approve a profile-change request (PRD §10.4): apply the change to the student
 * (e.g. phone — the login key) or parent, mark Selesai, notify.
 */
export async function approveProfileChange(requestId: string, actor: Actor) {
  const db = createAdminClient();
  const { data: req } = await db.from("profile_change_requests").select("*").eq("id", requestId).single();
  if (!req) throw new Error("Permohonan tidak dijumpai.");
  if (req.status !== "Baharu") throw new Error("Permohonan ini telah diproses.");

  // Apply to student if student_id present, else to the parent record.
  const allowedStudentFields = new Set(["telefon", "nama"]);
  const allowedParentFields = new Set(["telefon", "nama", "emel", "lokasi"]);
  if (req.student_id && allowedStudentFields.has(req.field)) {
    // field is allowlist-validated above; dynamic key needs a cast past strict typing.
    await db.from("students").update({ [req.field]: req.new_value } as never).eq("id", req.student_id);
  } else if (allowedParentFields.has(req.field)) {
    await db.from("parents").update({ [req.field]: req.new_value } as never).eq("id", req.parent_id);
  } else {
    throw new Error(`Medan tidak dibenarkan: ${req.field}`);
  }

  await db
    .from("profile_change_requests")
    .update({ status: "Selesai", reviewed_by: actor.userId })
    .eq("id", requestId);

  await notifyPortal(db, {
    parentId: req.parent_id,
    studentId: req.student_id,
    type: "tukar_profil",
    message: `Perubahan ${req.field} telah diluluskan.`,
  });
  await logActivity(db, {
    type: "edit",
    parentId: req.parent_id,
    studentId: req.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Lulus tukar profil ${req.code}: ${req.field} → ${req.new_value}`,
  });
}

export async function rejectProfileChange(requestId: string, actor: Actor) {
  const db = createAdminClient();
  const { data: req } = await db.from("profile_change_requests").select("*").eq("id", requestId).single();
  if (!req) throw new Error("Permohonan tidak dijumpai.");
  if (req.status !== "Baharu") throw new Error("Permohonan ini telah diproses.");
  await db
    .from("profile_change_requests")
    .update({ status: "Ditolak", reviewed_by: actor.userId })
    .eq("id", requestId);
  await notifyPortal(db, {
    parentId: req.parent_id,
    studentId: req.student_id,
    type: "tukar_profil",
    message: `Permohonan tukar ${req.field} tidak diluluskan.`,
  });
  await logActivity(db, {
    type: "edit",
    parentId: req.parent_id,
    studentId: req.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Tolak tukar profil ${req.code}`,
  });
}
