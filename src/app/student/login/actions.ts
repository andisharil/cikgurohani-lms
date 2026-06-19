"use server";

import { redirect } from "next/navigation";
import { issueStudentOtp, verifyStudentOtp, type StudentMatch } from "@/lib/auth/student-otp";
import { setStudentSession, signData, verifyData } from "@/lib/auth/student-session";

type SelectionToken = { ids: string[]; phone: string; exp: number };

export type OtpState = {
  step: "phone" | "code" | "select";
  phone?: string;
  error?: string | null;
  devCode?: string;
  matches?: StudentMatch[];
  selectionToken?: string;
};

/** Single dispatcher so the client can drive the flow with one useActionState. */
export async function otpFlow(prev: OtpState, formData: FormData): Promise<OtpState> {
  switch (String(formData.get("_action"))) {
    case "request":
      return requestOtp(prev, formData);
    case "verify":
      return verifyOtp(prev, formData);
    case "select":
      return selectStudent(prev, formData);
    default:
      return prev;
  }
}

export async function requestOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "").trim();
  if (!phone) return { step: "phone", error: "Sila masukkan nombor telefon." };

  const res = await issueStudentOtp(phone);
  if (!res.ok) return { step: "phone", error: "Nombor tidak dijumpai." };
  return { step: "code", phone, devCode: res.devCode, error: null };
}

export async function verifyOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "");
  const code = String(formData.get("code") || "").trim();

  const res = await verifyStudentOtp(phone, code);
  if (!res.ok) {
    const msg: Record<string, string> = {
      invalid: "Kod tidak sah.",
      expired: "Kod telah luput. Sila minta kod baharu.",
      locked: "Terlalu banyak cubaan. Sila minta kod baharu.",
      not_found: "Nombor tidak dijumpai.",
    };
    return { step: "code", phone, error: msg[res.reason] ?? "Ralat." };
  }

  if (res.matches.length === 1) {
    await setStudentSession(res.matches[0].id, phone);
    redirect("/student");
  }

  // Multiple children: issue a short-lived signed token so the selection step
  // can't be called without a verified OTP.
  const selectionToken = signData<SelectionToken>({
    ids: res.matches.map((m) => m.id),
    phone,
    exp: Date.now() + 10 * 60 * 1000,
  });
  return { step: "select", phone, matches: res.matches, selectionToken, error: null };
}

export async function selectStudent(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "");
  const studentId = String(formData.get("studentId") || "");
  const token = String(formData.get("selectionToken") || "");

  const payload = verifyData<SelectionToken>(token);
  if (!payload || payload.phone !== phone || payload.exp < Date.now() || !payload.ids.includes(studentId)) {
    return { step: "phone", error: "Sesi tamat. Sila log masuk semula." };
  }

  await setStudentSession(studentId, phone);
  redirect("/student");
}
