"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireParent } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { packagePrice, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { uploadFile, RECEIPT_TYPES } from "@/lib/storage";

export type RenewState = { error: string | null };

/**
 * Manual renewal submission from the parent portal (PRD §9.6 manual flow):
 * creates a Menunggu renewal_request with the uploaded receipt. RLS ensures the
 * parent can only act on their own student.
 */
export async function submitManualRenewal(_prev: RenewState, fd: FormData): Promise<RenewState> {
  const { parent } = await requireParent();
  const studentId = String(fd.get("studentId") || "");
  const pakej = fd.get("pakej") as Pakej;
  const supabase = await createClient();

  // parent_own RLS => only returns the row if this student belongs to the parent.
  const { data: student } = await supabase
    .from("students")
    .select("id, tingkatan")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { error: "Pelajar tidak dijumpai." };

  const { count } = await supabase
    .from("renewal_requests")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "Menunggu");
  if (count && count > 0) return { error: "Sudah ada permohonan yang menunggu semakan." };

  let resitUrl: string | null;
  try {
    resitUrl = await uploadFile("receipts", "renewal", fd.get("resit") as File, {
      allowed: RECEIPT_TYPES,
      maxBytes: 10 * 1024 * 1024,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!resitUrl) return { error: "Sila muat naik resit pembayaran." };

  const jumlah = packagePrice(student.tingkatan as Tingkatan, pakej);
  const { error } = await supabase.from("renewal_requests").insert({
    parent_id: parent.id,
    student_id: studentId,
    pakej,
    jumlah,
    resit_url: resitUrl,
    status: "Menunggu",
    sumber: "Portal",
  });
  if (error) return { error: error.message };

  revalidatePath("/portal");
  redirect("/portal?renewed=1");
}
