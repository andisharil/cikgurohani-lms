"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { requestRefund, processRefund } from "@/lib/services/refunds";
import { uploadFile, RECEIPT_TYPES } from "@/lib/storage";
import type { Enums } from "@/lib/supabase/database.types";

const RECEIPT_MAX = 10 * 1024 * 1024;

export type Result = { error: string | null; ok?: boolean };

function actor(ctx: { userId: string; nama: string; role: string }) {
  return { userId: ctx.userId, label: `${ctx.nama} (${ctx.role})` };
}

export async function requestRefundAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("mohonRefund");
  const paymentCode = String(fd.get("paymentCode") || "").trim();
  const jumlah = Number(fd.get("jumlah") || 0);
  const kaedah = fd.get("kaedah") as Enums<"refund_kaedah">;
  if (!paymentCode) return { error: "Sila masukkan rujukan pembayaran." };

  // Resolve payment code -> id (RLS admin can read all payments).
  const supabase = await createClient();
  const { data: payment } = await supabase.from("payments").select("id").eq("code", paymentCode).maybeSingle();
  if (!payment) return { error: "Rujukan pembayaran tidak dijumpai." };

  try {
    const qrUrl =
      kaedah === "QR DuitNow"
        ? await uploadFile("receipts", "refund-qr", fd.get("qr") as File, {
            allowed: RECEIPT_TYPES,
            maxBytes: RECEIPT_MAX,
          })
        : null;
    await requestRefund(
      {
        paymentId: payment.id,
        jumlah,
        sebab: String(fd.get("sebab") || ""),
        kaedah,
        akaun: String(fd.get("akaun") || "") || null,
        qrUrl,
      },
      actor(ctx),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/refund");
  return { error: null, ok: true };
}

export async function processRefundAction(_p: Result, fd: FormData): Promise<Result> {
  const ctx = await requirePermission("prosesRefund");
  try {
    const resitUrl = await uploadFile("receipts", "refund", fd.get("resit") as File, {
      allowed: RECEIPT_TYPES,
      maxBytes: RECEIPT_MAX,
    });
    if (!resitUrl) return { error: "Sila muat naik resit pemindahan refund." };
    await processRefund({ refundId: String(fd.get("refundId")), resitUrl }, actor(ctx));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/refund");
  return { error: null, ok: true };
}
