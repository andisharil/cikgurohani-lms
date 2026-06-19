"use client";

import { useActionState } from "react";
import { addParentComment } from "@/app/portal/comment-actions";
import { addStudentComment } from "@/app/student/comment-actions";
import { addAdminReplyAction } from "@/app/admin/kandungan/actions";
import { Button, Textarea } from "@/components/ui";
import { fmtDateTime } from "@/lib/domain/format";

type CommentState = { error: string | null; ok?: boolean };
type Comment = { id: string; author_type: string; author_name: string | null; body: string; created_at: string };

const initial: CommentState = { error: null };

const ACTION = {
  parent: addParentComment,
  student: addStudentComment,
  admin: addAdminReplyAction,
} as const;

const AUTHOR_STYLE: Record<string, string> = {
  admin: "bg-highlight/25 text-ink",
  parent: "bg-paper text-ink-soft",
  student: "bg-emerald-50 text-emerald-700",
};

export function CommentThread({
  announcementId,
  comments,
  role,
  path,
}: {
  announcementId: string;
  comments: Comment[];
  role: "parent" | "student" | "admin";
  path?: string;
}) {
  const [state, action, pending] = useActionState(ACTION[role], initial);

  return (
    <div className="mt-3 space-y-3 border-t border-rule pt-3">
      {comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${AUTHOR_STYLE[c.author_type] ?? ""}`}>
                  {c.author_name ?? c.author_type}
                </span>
                <span className="text-xs text-ink-soft">{fmtDateTime(c.created_at)}</span>
              </div>
              <p className="mt-0.5 text-ink">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex items-start gap-2">
        <input type="hidden" name="announcementId" value={announcementId} />
        {path && <input type="hidden" name="path" value={path} />}
        <Textarea name="body" rows={1} required placeholder={role === "admin" ? "Balas…" : "Tulis komen…"} className="flex-1" />
        <Button type="submit" disabled={pending}>
          {pending ? "…" : role === "admin" ? "Balas" : "Hantar"}
        </Button>
      </form>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
    </div>
  );
}
