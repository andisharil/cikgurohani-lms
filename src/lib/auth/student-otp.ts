import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { msisdnVariants } from "@/lib/domain/phone";
import { sendWhatsAppOtp } from "@/lib/messaging/whatsapp";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type StudentMatch = {
  id: string;
  code: string;
  nama: string;
  tingkatan: string;
};

function hashCode(phone: string, code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-otp-secret";
  return crypto.createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

function genCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Find students whose own phone OR whose parent's phone matches the input
 * (PRD §9.1 — login by student phone OR parent phone).
 */
async function matchStudents(phone: string): Promise<StudentMatch[]> {
  const db = createAdminClient();
  const variants = msisdnVariants(phone);
  const orFilter = variants.map((v) => `telefon.eq.${v}`).join(",");

  const { data: byStudent } = await db
    .from("students")
    .select("id, code, nama, tingkatan, telefon")
    .or(orFilter);

  const { data: parents } = await db.from("parents").select("id").or(orFilter);
  let byParent: typeof byStudent = [];
  if (parents && parents.length) {
    const { data } = await db
      .from("students")
      .select("id, code, nama, tingkatan, telefon")
      .in(
        "parent_id",
        parents.map((p) => p.id),
      );
    byParent = data ?? [];
  }

  const merged = new Map<string, StudentMatch>();
  for (const s of [...(byStudent ?? []), ...(byParent ?? [])]) {
    merged.set(s.id, { id: s.id, code: s.code, nama: s.nama, tingkatan: s.tingkatan });
  }
  return [...merged.values()];
}

export type IssueResult =
  | { ok: true; simulated: boolean; devCode?: string }
  | { ok: false; reason: "not_found" };

/** Issue an OTP for a phone if it matches at least one student. */
export async function issueStudentOtp(phone: string): Promise<IssueResult> {
  const matches = await matchStudents(phone);
  if (matches.length === 0) return { ok: false, reason: "not_found" };

  const db = createAdminClient();
  const code = genCode();
  await db.from("student_otps").insert({
    telefon: phone,
    code_hash: hashCode(phone, code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  const res = await sendWhatsAppOtp(phone, code);
  // Surface the code on-screen when WhatsApp isn't really sending it: always in
  // dev, and in any environment when SHOW_DEV_OTP=true (demo mode). Remove the
  // flag once the WhatsApp Cloud API is wired for real delivery.
  const showOtp =
    res.simulated && (process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_OTP === "true");
  return {
    ok: true,
    simulated: res.simulated,
    devCode: showOtp ? code : undefined,
  };
}

export type VerifyResult =
  | { ok: true; matches: StudentMatch[] }
  | { ok: false; reason: "invalid" | "expired" | "locked" | "not_found" };

/** Verify an OTP; on success return the matching students for selection. */
export async function verifyStudentOtp(phone: string, code: string): Promise<VerifyResult> {
  const db = createAdminClient();
  const { data: otp } = await db
    .from("student_otps")
    .select("*")
    .eq("telefon", phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) return { ok: false, reason: "not_found" };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };
  if (new Date(otp.expires_at) < new Date()) return { ok: false, reason: "expired" };

  if (otp.code_hash !== hashCode(phone, code)) {
    await db.from("student_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return { ok: false, reason: "invalid" };
  }

  await db.from("student_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
  const matches = await matchStudents(phone);
  if (matches.length === 0) return { ok: false, reason: "not_found" };
  return { ok: true, matches };
}
