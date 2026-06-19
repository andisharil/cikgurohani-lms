import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth/parent";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui";
import { deriveStatus } from "@/lib/domain/status";
import { PAKEJ, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { RenewForm } from "./renew-form";

export const dynamic = "force-dynamic";

export default async function RenewPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  await requireParent();
  const supabase = await createClient();

  // RLS parent_own scopes this to the parent's own child.
  const { data: student } = await supabase
    .from("students")
    .select("id, nama, tingkatan, aktif, tarikh_tamat")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) notFound();

  const status = deriveStatus(student.aktif, student.tarikh_tamat);
  // Expired accounts may only renew Bulanan / 3 Bulan (PRD §9.5).
  const allowed: Pakej[] = status === "Tamat" ? ["Bulanan", "3 Bulan"] : PAKEJ;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <Link href="/portal" className="text-sm text-ink hover:underline">
          ← Kembali
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">Perbaharui Langganan</h1>
        <p className="text-sm text-ink-soft">{student.nama} · {student.tingkatan}</p>
      </div>
      <Card>
        <CardBody>
          <RenewForm
            studentId={student.id}
            tingkatan={student.tingkatan as Tingkatan}
            allowedPackages={allowed}
          />
        </CardBody>
      </Card>
    </div>
  );
}
