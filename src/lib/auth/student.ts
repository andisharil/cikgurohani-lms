import { redirect } from "next/navigation";
import { getStudentSession } from "./student-session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type StudentContext = {
  studentId: string;
  student: Tables<"students_with_status">;
};

/**
 * Resolve the signed-in student from the custom session. Students don't have a
 * Supabase auth session, so we read their data with the service-role client
 * (scoping is enforced by the verified session, not RLS).
 */
export async function getStudentContext(): Promise<StudentContext | null> {
  const session = await getStudentSession();
  if (!session) return null;
  const db = createAdminClient();
  const { data: student } = await db
    .from("students_with_status")
    .select("*")
    .eq("id", session.studentId)
    .maybeSingle();
  if (!student) return null;
  return { studentId: session.studentId, student };
}

export async function requireStudent(): Promise<StudentContext> {
  const ctx = await getStudentContext();
  if (!ctx) redirect("/student/login");
  return ctx;
}
