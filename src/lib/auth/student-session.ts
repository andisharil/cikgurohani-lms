import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "cikgu_student";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type StudentSession = { studentId: string; phone: string; iat: number };

function secret(): string {
  return (
    process.env.STUDENT_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-insecure-student-secret-change-me"
  );
}

function sign(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSession(payload: StudentSession): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string): StudentSession | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as StudentSession;
  } catch {
    return null;
  }
}

/** Generic signed payload (used for the short-lived child-selection token). */
export function signData<T extends object>(obj: T): string {
  const body = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyData<T>(token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function setStudentSession(studentId: string, phone: string): Promise<void> {
  const token = encodeSession({ studentId, phone, iat: Date.now() });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const store = await cookies();
  const c = store.get(COOKIE);
  return c ? decodeSession(c.value) : null;
}

export async function clearStudentSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
