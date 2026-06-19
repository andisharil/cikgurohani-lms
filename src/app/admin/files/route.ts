import { NextResponse, type NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth/admin";
import { signedUrl } from "@/lib/storage";

/**
 * Admin file viewer: takes a stored bucket-qualified path (?p=bucket/path),
 * verifies an active admin session, and redirects to a short-lived signed URL.
 * Centralizes access control for admin-side viewing of materials/receipts.
 */
export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });

  const p = req.nextUrl.searchParams.get("p");
  if (!p || /^https?:\/\//i.test(p)) return new NextResponse("Bad request", { status: 400 });

  const url = await signedUrl(p, 120);
  if (!url) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(url);
}
