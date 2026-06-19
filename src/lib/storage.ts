import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const PDF_TYPES = ["application/pdf"];
export const RECEIPT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Upload a user-submitted File to a private bucket under `prefix/`, validating
 * type + size server-side. Returns a bucket-qualified path ("bucket/path") to
 * store in the DB, or null if no file was provided. Throws on invalid input.
 */
export async function uploadFile(
  bucket: "content" | "receipts",
  prefix: string,
  file: File | null | undefined,
  opts: { allowed: string[]; maxBytes: number },
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > opts.maxBytes) {
    throw new Error(`Fail terlalu besar (maksimum ${Math.round(opts.maxBytes / 1048576)}MB).`);
  }
  if (!opts.allowed.includes(file.type)) {
    throw new Error("Jenis fail tidak dibenarkan.");
  }
  const ext = EXT[file.type] ?? "bin";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const db = createAdminClient();
  const { error } = await db.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Muat naik gagal: ${error.message}`);
  return `${bucket}/${path}`;
}

/**
 * Resolve a stored value to a viewable URL. Accepts either a bucket-qualified
 * storage path ("bucket/path") → short-lived signed URL, or a legacy external
 * URL (http…/YouTube) → returned as-is.
 */
export async function signedUrl(
  stored: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;
  const slash = stored.indexOf("/");
  if (slash < 0) return null;
  const bucket = stored.slice(0, slash);
  const path = stored.slice(slash + 1);
  const db = createAdminClient();
  const { data } = await db.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** True when a stored value is an internal storage path (not an external URL). */
export function isStoragePath(stored: string | null | undefined): boolean {
  return !!stored && !/^https?:\/\//i.test(stored);
}
