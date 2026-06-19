import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type DB = SupabaseClient<Database>;

export type LogActivityInput = {
  type: string; // 'log_masuk' | 'pakej' | 'notifikasi' | 'edit' | 'refund' | 'block' | ...
  message: string;
  parentId?: string | null;
  studentId?: string | null;
  actor?: string | null; // auth.users.id
  actorLabel?: string | null;
  internalNote?: string | null; // never exposed to parent/student
};

/**
 * Append an entry to the audit trail (PRD §19). Best-effort: logging must never
 * break the primary action, so failures are swallowed after being reported.
 */
export async function logActivity(db: DB, input: LogActivityInput): Promise<void> {
  const { error } = await db.from("activity_logs").insert({
    type: input.type,
    message: input.message,
    parent_id: input.parentId ?? null,
    student_id: input.studentId ?? null,
    actor: input.actor ?? null,
    actor_label: input.actorLabel ?? null,
    internal_note: input.internalNote ?? null,
  });
  if (error) console.error("logActivity failed:", error.message);
}
