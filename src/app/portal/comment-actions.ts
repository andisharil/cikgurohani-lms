"use server";

import { revalidatePath } from "next/cache";
import { requireParent } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { addComment } from "@/lib/services/comments";

export type CommentState = { error: string | null; ok?: boolean };

/** Announcement audiences visible to a set of children's tingkatan. */
function audiencesFor(tingkatans: (string | null)[]): string[] {
  const set = new Set<string>(["Semua"]);
  for (const t of tingkatans) {
    if (t === "T4") set.add("T4");
    else if (t === "T5") set.add("T5");
    else if (t === "T4&5") {
      set.add("T4");
      set.add("T5");
    }
  }
  return [...set];
}

export async function addParentComment(_p: CommentState, fd: FormData): Promise<CommentState> {
  const { parent } = await requireParent();
  const supabase = await createClient();
  // RLS parent_own → only this parent's children.
  const { data: children } = await supabase.from("students").select("tingkatan").eq("parent_id", parent.id);
  const allowedAudiences = audiencesFor((children ?? []).map((c) => c.tingkatan));

  try {
    await addComment({
      announcementId: String(fd.get("announcementId")),
      authorType: "parent",
      authorId: parent.id,
      authorName: parent.nama,
      body: String(fd.get("body") || ""),
      parentCommentId: String(fd.get("parentCommentId") || "") || null,
      allowedAudiences,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(String(fd.get("path") || "/portal"));
  return { error: null, ok: true };
}
