import { NextResponse, type NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/domain/status";

/** CSV export of the (filtered) student list. Permission-gated (PRD §7.2). */
export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (!ctx.can("pelajar")) return new NextResponse("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").replace(/[,()*%]/g, " ").trim();
  const status = sp.get("status") ?? "";
  const tingkatan = sp.get("tingkatan") ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("students_admin")
    .select("code, nama, parent_code, parent_nama, parent_emel, parent_telefon, telefon, tingkatan, pakej, tarikh_mula, tarikh_tamat, status, days_left");
  if (q) query = query.or(`nama.ilike.%${q}%,code.ilike.%${q}%,parent_nama.ilike.%${q}%,parent_emel.ilike.%${q}%`);
  if (status) query = query.eq("status", status as SubscriptionStatus);
  if (tingkatan) query = query.eq("tingkatan", tingkatan as "T4" | "T5" | "T4&5");
  query = query.order("created_at", { ascending: false }).limit(5000);

  const { data: rows, error } = await query;
  if (error) return new NextResponse(error.message, { status: 500 });

  const headers = [
    "ID Pelajar",
    "Nama Pelajar",
    "ID Ibu Bapa",
    "Nama Ibu Bapa",
    "Emel Ibu Bapa",
    "Telefon Ibu Bapa",
    "Telefon Pelajar",
    "Tingkatan",
    "Pakej",
    "Tarikh Mula",
    "Tarikh Tamat",
    "Status",
    "Hari Tinggal",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows ?? []) {
    lines.push(
      [
        r.code,
        r.nama,
        r.parent_code,
        r.parent_nama,
        r.parent_emel,
        r.parent_telefon,
        r.telefon,
        r.tingkatan,
        r.pakej,
        r.tarikh_mula,
        r.tarikh_tamat,
        r.status,
        r.days_left,
      ]
        .map(esc)
        .join(","),
    );
  }

  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelajar-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
