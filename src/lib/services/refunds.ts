import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";
import { notifyPortal } from "./notifications";
import type { Enums } from "@/lib/supabase/database.types";

type Actor = { userId: string; label: string };
type Kaedah = Enums<"refund_kaedah">;

export type RequestRefundInput = {
  paymentId: string;
  jumlah: number;
  sebab?: string;
  kaedah: Kaedah;
  akaun?: string | null;
  qrUrl?: string | null;
};

/** Request a refund against a payment (PRD §11.1). */
export async function requestRefund(input: RequestRefundInput, actor: Actor) {
  const db = createAdminClient();
  const { data: payment } = await db.from("payments").select("*").eq("id", input.paymentId).single();
  if (!payment) throw new Error("Pembayaran tidak dijumpai.");
  if (payment.status === "Refunded") throw new Error("Pembayaran ini telah direfund.");

  // Cap against the amount not already covered by existing refunds (pending or
  // completed) so cumulative partial refunds can't exceed the payment.
  const { data: existing } = await db
    .from("refunds")
    .select("jumlah")
    .eq("payment_id", input.paymentId)
    .in("status", ["Dimohon", "Selesai"]);
  const alreadyRefunded = (existing ?? []).reduce((s, r) => s + Number(r.jumlah), 0);
  const remaining = Number(payment.jumlah) - alreadyRefunded;
  if (input.jumlah <= 0 || input.jumlah > remaining) {
    throw new Error(
      `Jumlah refund tidak sah. Baki yang boleh direfund: RM${remaining.toFixed(2)}.`,
    );
  }
  if (input.kaedah === "Akaun bank" && !input.akaun) throw new Error("Sila isi maklumat akaun bank.");
  if (input.kaedah === "QR DuitNow" && !input.qrUrl) throw new Error("Sila muat naik QR DuitNow.");

  const { data: refund, error } = await db
    .from("refunds")
    .insert({
      parent_id: payment.parent_id,
      student_id: payment.student_id,
      payment_id: payment.id,
      jumlah: input.jumlah,
      sebab: input.sebab || null,
      kaedah: input.kaedah,
      akaun: input.akaun || null,
      qr_url: input.qrUrl || null,
      status: "Dimohon",
      requested_by: actor.userId,
    })
    .select("code")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(db, {
    type: "refund",
    parentId: payment.parent_id,
    studentId: payment.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Mohon refund ${refund.code} (${input.jumlah}) untuk ${payment.code}`,
    internalNote: input.sebab || null,
  });
  return { code: refund.code };
}

/** Process a refund to completion (PRD §11.2). Requires a transfer receipt. */
export async function processRefund(input: { refundId: string; resitUrl: string }, actor: Actor) {
  if (!input.resitUrl) throw new Error("Sila muat naik resit pemindahan refund.");
  const db = createAdminClient();
  const { data: refund } = await db.from("refunds").select("*").eq("id", input.refundId).single();
  if (!refund) throw new Error("Refund tidak dijumpai.");
  if (refund.status === "Selesai") throw new Error("Refund ini telah selesai.");

  await db
    .from("refunds")
    .update({
      status: "Selesai",
      completed_at: new Date().toISOString(),
      resit_refund_url: input.resitUrl,
      processed_by: actor.userId,
      notified: true,
    })
    .eq("id", input.refundId);

  // Tag the original payment as refunded (does NOT auto-cancel subscription).
  if (refund.payment_id) {
    await db
      .from("payments")
      .update({ status: "Refunded", refunded_by_refund_id: refund.id })
      .eq("id", refund.payment_id);
  }

  await notifyPortal(db, {
    parentId: refund.parent_id,
    studentId: refund.student_id,
    type: "refund",
    message: `Refund ${refund.code} sebanyak RM${Number(refund.jumlah).toFixed(2)} telah selesai diproses.`,
  });
  await logActivity(db, {
    type: "refund",
    parentId: refund.parent_id,
    studentId: refund.student_id,
    actor: actor.userId,
    actorLabel: actor.label,
    message: `Selesai refund ${refund.code}`,
  });
}
