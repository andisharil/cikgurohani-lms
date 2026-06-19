/**
 * Client-safe (no server imports) link builder for admin-side file viewing.
 * External URLs pass through; internal storage paths go via /admin/files which
 * signs them after an admin check.
 */
export function fileHref(stored?: string | null): string | null {
  if (!stored) return null;
  return /^https?:\/\//i.test(stored) ? stored : `/admin/files?p=${encodeURIComponent(stored)}`;
}
