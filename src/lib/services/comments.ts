import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/supabase/database.types";

export type Comment = {
  id: string;
  announcement_id: string;
  parent_comment_id: string | null;
  author_type: Enums<"comment_author">;
  author_name: string | null;
  body: string;
  created_at: string;
};

export async function getComments(announcementId: string): Promise<Comment[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("announcement_comments")
    .select("id, announcement_id, parent_comment_id, author_type, author_name, body, created_at")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addComment(input: {
  announcementId: string;
  authorType: Enums<"comment_author">;
  authorId?: string | null;
  authorName: string;
  body: string;
  parentCommentId?: string | null;
  /**
   * For parent/student commenters: the announcement audiences they're allowed
   * to see (e.g. ["Semua","T4"]). When set, the announcement must be published
   * and its audience must be in this list. Omit for admins.
   */
  allowedAudiences?: string[] | null;
}) {
  const body = input.body.trim();
  if (!body) throw new Error("Komen tidak boleh kosong.");
  const db = createAdminClient();
  // Ensure the announcement exists; portal commenters may only touch published
  // announcements whose audience targets them (PRD §8.4 comments).
  const { data: ann } = await db
    .from("announcements")
    .select("id, published, audience")
    .eq("id", input.announcementId)
    .maybeSingle();
  if (!ann) throw new Error("Pengumuman tidak dijumpai.");
  if (input.allowedAudiences) {
    if (!ann.published || !input.allowedAudiences.includes(ann.audience)) {
      throw new Error("Pengumuman ini tidak tersedia untuk anda.");
    }
  }

  // A reply must attach to a comment on the SAME announcement.
  if (input.parentCommentId) {
    const { data: parentComment } = await db
      .from("announcement_comments")
      .select("announcement_id")
      .eq("id", input.parentCommentId)
      .maybeSingle();
    if (!parentComment || parentComment.announcement_id !== input.announcementId) {
      throw new Error("Komen induk tidak sah.");
    }
  }

  const { error } = await db.from("announcement_comments").insert({
    announcement_id: input.announcementId,
    author_type: input.authorType,
    author_id: input.authorId ?? null,
    author_name: input.authorName,
    body,
    parent_comment_id: input.parentCommentId ?? null,
  });
  if (error) throw new Error(error.message);
}
