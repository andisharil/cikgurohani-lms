import { Suspense } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="wordmark text-5xl text-ink">cikgurohani</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
            Pusat Tuisyen SPM · T4 &amp; T5
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-rule bg-ink px-5 py-3">
            <h1 className="font-display text-sm font-bold text-paper">Log Masuk</h1>
            <p className="text-xs text-paper/60">Admin &amp; Ibu Bapa</p>
          </div>
          <CardBody className="ruled book-margin py-5">
            <Suspense fallback={<div className="h-48" />}>
              <LoginForm />
            </Suspense>
          </CardBody>
        </Card>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Pelajar?{" "}
          <Link href="/student/login" className="font-semibold text-ink underline decoration-marker decoration-2 underline-offset-2">
            Log masuk dengan nombor telefon
          </Link>
        </p>
      </div>
    </main>
  );
}
