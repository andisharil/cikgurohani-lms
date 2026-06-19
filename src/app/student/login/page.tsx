import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui";
import { getStudentSession } from "@/lib/auth/student-session";
import { StudentLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function StudentLoginPage() {
  if (await getStudentSession()) redirect("/student");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="wordmark text-5xl text-ink">cikgurohani</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
            Portal Pelajar
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-rule bg-ink px-5 py-3">
            <h1 className="font-display text-sm font-bold text-paper">Log Masuk Pelajar</h1>
            <p className="text-xs text-paper/60">Guna nombor telefon berdaftar</p>
          </div>
          <CardBody className="ruled book-margin py-5">
            <StudentLoginForm />
          </CardBody>
        </Card>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Ibu bapa?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-marker decoration-2 underline-offset-2">
            Log masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
