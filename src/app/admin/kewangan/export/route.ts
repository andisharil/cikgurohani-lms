import { NextResponse, type NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

/** CSV export of transactions (permission: kewangan). */
export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (!ctx.can("kewangan")) return new NextResponse("Forbidden", { status: 403 });

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("payments")
    .select("code, tarikh, pakej, jumlah, saluran, status, ref")
    .order("tarikh", { ascending: false })
    .limit(10000);
  if (error) return new NextResponse(error.message, { status: 500 });

  const headers = ["Rujukan", "Tarikh", "Pakej", "Jumlah", "Saluran", "Status", "Ref"];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows ?? []) {
    lines.push([r.code, r.tarikh, r.pakej, r.jumlah, r.saluran, r.status, r.ref].map(esc).join(","));
  }

  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transaksi-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
