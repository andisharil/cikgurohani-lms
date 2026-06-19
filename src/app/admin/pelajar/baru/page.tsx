import Link from "next/link";
import { requirePermission } from "@/lib/auth/admin";
import { AddStudentForm } from "@/components/admin/add-student-form";

export const dynamic = "force-dynamic";

export default async function AddStudentPage() {
  await requirePermission("tambah_pelajar");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/admin/pelajar" className="text-sm text-ink hover:underline">
          ← Kembali ke senarai
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">Tambah Pelajar Baharu</h1>
      </div>
      <AddStudentForm />
    </div>
  );
}
