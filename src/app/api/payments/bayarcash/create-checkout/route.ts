import { NextResponse, type NextRequest } from "next/server";
import { getParentContext } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/payments/bayarcash";
import { packagePrice, type Pakej, type Tingkatan } from "@/lib/domain/packages";

/**
 * Create a BayarCash checkout for a renewal (PRD §9.6 online flow).
 * Creates a Menunggu renewal (sumber BayarCash) and returns the checkout URL;
 * the /api/webhooks/bayarcash callback approves it on success.
 */
export async function POST(req: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { studentId?: string; pakej?: Pakej };
  if (!body.studentId || !body.pakej) {
    return NextResponse.json({ error: "studentId & pakej required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, tingkatan")
    .eq("id", body.studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Pelajar tidak dijumpai" }, { status: 404 });

  const amount = packagePrice(student.tingkatan as Tingkatan, body.pakej);
  const { data: renewal, error } = await supabase
    .from("renewal_requests")
    .insert({
      parent_id: ctx.parent.id,
      student_id: student.id,
      pakej: body.pakej,
      jumlah: amount,
      status: "Menunggu",
      sumber: "BayarCash",
    })
    .select("code")
    .single();
  if (error || !renewal) return NextResponse.json({ error: error?.message }, { status: 500 });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const checkout = await createCheckout({
    reference: renewal.code,
    amount,
    payerName: ctx.parent.nama,
    payerEmail: ctx.parent.emel ?? "",
    returnUrl: `${origin}/portal`,
  });

  return NextResponse.json({ url: checkout.url, reference: renewal.code, simulated: checkout.simulated });
}
