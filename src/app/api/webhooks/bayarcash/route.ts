import { NextResponse, type NextRequest } from "next/server";
import { verifyCallback } from "@/lib/payments/bayarcash";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveRenewal } from "@/lib/services/approvals";

/**
 * BayarCash payment callback (PRD §9.6 online flow / §16.4).
 * On a verified success, approves the matching renewal (extends subscription,
 * records payment, notifies). Idempotent: an already-approved renewal is a no-op.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? req.headers.get("checksum");
  if (!verifyCallback(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const ref = String(payload.ref ?? payload.order_number ?? "");
  const status = String(payload.status ?? "").toLowerCase();
  if (!ref) return NextResponse.json({ error: "missing ref" }, { status: 400 });

  const db = createAdminClient();
  const { data: renewal } = await db
    .from("renewal_requests")
    .select("id, status")
    .eq("code", ref)
    .maybeSingle();
  // Always 200 for unknown/processed refs so the gateway doesn't retry forever.
  if (!renewal) return NextResponse.json({ ok: true, note: "unknown ref" });
  if (renewal.status === "Diluluskan") return NextResponse.json({ ok: true, note: "already processed" });

  if (status === "success" || status === "1" || status === "paid") {
    try {
      await approveRenewal(renewal.id, {}, { userId: null, label: "BayarCash" });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
