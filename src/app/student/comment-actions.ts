"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/student";
import { addComment } from "@/lib/services/comments";

export type CommentState = { error: string | null; ok?: boolean };

function audiencesFor(tingkatan: string | null): string[] {
  if (tingkatan === "T4&5") return ["Semua", "T4", "T5"];
  if (tingkatan === "T4" || tingkatan === "T5") return ["Semua", tingkatan];
  return ["Semua"];
}

export async function addStudentComment(_p: CommentState, fd: FormData): Promise<CommentState> {
  const { student } = await requireStudent();
  // Blocked students cannot post (the page block is presentational only).
  if (!student.aktif) return { error: "Akaun anda disekat." };

  try {
    await addComment({
      announcementId: String(fd.get("announcementId")),
      authorType: "student",
      authorId: student.id ?? null,
      authorName: student.nama ?? "Pelajar",
      body: String(fd.get("body") || ""),
      parentCommentId: String(fd.get("parentCommentId") || "") || null,
      allowedAudiences: audiencesFor(student.tingkatan),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/student");
  return { error: null, ok: true };
}
