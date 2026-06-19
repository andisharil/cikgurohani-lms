import type { Enums } from "@/lib/supabase/database.types";

export type AdminRole = Enums<"admin_role">;

/** Permission keys — must match seeded role_permissions rows (migration 8). */
export const PERMISSIONS = [
  "pelajar",
  "tambah_pelajar",
  "kandungan",
  "notifikasi",
  "waba",
  "sahkanBayaran",
  "kewangan",
  "mohonRefund",
  "prosesRefund",
  "tetapan",
  "permission",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  pelajar: "Urus Pelajar",
  tambah_pelajar: "Tambah Pelajar",
  kandungan: "Kandungan",
  notifikasi: "Notifikasi",
  waba: "WhatsApp / WABA",
  sahkanBayaran: "Pengesahan Bayaran",
  kewangan: "Kewangan",
  mohonRefund: "Mohon Refund",
  prosesRefund: "Proses Refund",
  tetapan: "Tetapan",
  permission: "Urus Kebenaran",
};

export const ROLES: AdminRole[] = ["Pemilik", "Pembantu", "Finance"];

/** Default matrix (mirrors migration 8). Owner is always allowed in code. */
export const DEFAULT_PERMISSIONS: Record<AdminRole, Record<Permission, boolean>> = {
  Pemilik: Object.fromEntries(PERMISSIONS.map((p) => [p, true])) as Record<Permission, boolean>,
  Pembantu: {
    pelajar: true,
    tambah_pelajar: true,
    kandungan: true,
    notifikasi: true,
    waba: true,
    sahkanBayaran: false,
    kewangan: false,
    mohonRefund: true,
    prosesRefund: false,
    tetapan: false,
    permission: false,
  },
  Finance: {
    pelajar: false,
    tambah_pelajar: false,
    kandungan: false,
    notifikasi: false,
    waba: false,
    sahkanBayaran: true,
    kewangan: true,
    mohonRefund: true,
    prosesRefund: true,
    tetapan: false,
    permission: false,
  },
};
