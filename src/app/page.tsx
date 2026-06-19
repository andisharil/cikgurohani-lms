import Link from "next/link";
import { getAdminContext } from "@/lib/auth/admin";
import { getParentContext } from "@/lib/auth/parent";
import { getStudentSession } from "@/lib/auth/student-session";
import { packagePrice, type Pakej } from "@/lib/domain/packages";

export const dynamic = "force-dynamic";

const PRIMARY =
  "inline-flex items-center justify-center rounded-[5px] bg-ink px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const SECONDARY =
  "inline-flex items-center justify-center rounded-[5px] border border-ink/20 bg-card px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const FEATURES = [
  ["Bahan Kelas", "Nota & latihan ikut tingkatan, sedia dimuat turun."],
  ["Rakaman Kelas", "Terlepas kelas? Tonton semula bila-bila masa."],
  ["Kelas Zoom Langsung", "Sertai sesi T4 & T5 terus dari portal."],
  ["Bank Soalan SPM", "Topikal, ujian percubaan & soalan sebenar SPM."],
  ["Laporan Bulanan", "Ringkasan prestasi daripada cikgu setiap bulan."],
  ["Peringatan WhatsApp", "Notifikasi yuran, renewal & kandungan baharu."],
];

const STEPS = [
  ["Daftar", "Hubungi kami untuk daftar anak anda dan pilih pakej."],
  ["Belajar", "Pelajar akses bahan, rakaman & kelas Zoom di portal."],
  ["Pantau", "Ibu bapa pantau yuran, kemajuan dan laporan bulanan."],
];

function PriceCard({
  title,
  tingkatan,
  note,
}: {
  title: string;
  tingkatan: "T4" | "T4&5";
  note: string;
}) {
  const rows: { label: Pakej; best?: boolean }[] = [
    { label: "Bulanan" },
    { label: "3 Bulan" },
    { label: "6 Bulan", best: true },
  ];
  return (
    <div className="rounded-[5px] border border-rule bg-card p-6 shadow-[0_1px_2px_rgba(22,34,58,0.06)]">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-0.5 text-sm text-ink-soft">{note}</p>
      <ul className="mt-4 divide-y divide-rule/70">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm text-ink">
              {r.label}
              {r.best && (
                <span className="rounded-full bg-highlight px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                  Nilai terbaik
                </span>
              )}
            </span>
            <span className="font-mono text-base font-semibold text-ink">
              RM{packagePrice(tingkatan, r.label)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Home() {
  const [admin, parent, student] = await Promise.all([
    getAdminContext(),
    getParentContext(),
    getStudentSession(),
  ]);
  const portal = admin
    ? { href: "/admin", label: "Panel Admin" }
    : parent
      ? { href: "/portal", label: "Portal Ibu Bapa" }
      : student
        ? { href: "/student", label: "Portal Pelajar" }
        : null;

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <span className="wordmark text-2xl text-ink">cikgurohani</span>
          <nav className="flex items-center gap-5 text-sm">
            <a href="#ciri" className="hidden text-ink-soft hover:text-ink sm:inline">Ciri</a>
            <a href="#pakej" className="hidden text-ink-soft hover:text-ink sm:inline">Pakej</a>
            {portal ? (
              <Link href={portal.href} className={PRIMARY + " px-3.5 py-2"}>
                Buka {portal.label}
              </Link>
            ) : (
              <Link href="/login" className={PRIMARY + " px-3.5 py-2"}>
                Log Masuk
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero — a page from an exercise book */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pt-20">
        <div className="ruled book-margin">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-marker">
            Tuisyen SPM · Tingkatan 4 &amp; 5
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Persediaan SPM anak anda,{" "}
            <span className="relative inline-block">
              tersusun
              <svg
                aria-hidden
                viewBox="0 0 240 70"
                preserveAspectRatio="none"
                fill="none"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5em] w-[118%] -translate-x-1/2 -translate-y-1/2"
              >
                <path
                  className="pen-circle"
                  d="M28,40 C24,18 70,11 124,12 C196,13 224,24 220,41 C216,58 150,63 96,61 C40,59 18,49 30,28"
                  stroke="var(--color-marker)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            dalam satu portal.
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-soft sm:text-lg">
            Kelas, bahan, rakaman, Bank Soalan dan laporan bulanan — di satu tempat. Pelajar belajar,
            ibu bapa pantau.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login" className={PRIMARY}>
              Portal Ibu Bapa
            </Link>
            <Link href="/student/login" className={SECONDARY}>
              Portal Pelajar
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-ink-soft">
            Bahan ikut tingkatan · Kelas Zoom langsung · Bank Soalan SPM
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="ciri" className="border-t border-rule bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">Ciri</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Semua untuk SPM, di satu tempat.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, desc]) => (
              <div key={title} className="rounded-[5px] border border-rule bg-card p-5">
                <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pakej" className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">Pakej</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Pilih tempoh yang sesuai.
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <PriceCard title="Satu Tingkatan" tingkatan="T4" note="T4 atau T5" />
            <PriceCard title="T4 & T5" tingkatan="T4&5" note="Kedua-dua tingkatan" />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Bank Soalan SPM disertakan untuk pakej <strong className="text-ink">3 Bulan</strong> dan{" "}
            <strong className="text-ink">6 Bulan</strong>.
          </p>
        </div>
      </section>

      {/* How it works — a real sequence, so it's numbered */}
      <section className="border-t border-rule bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">Cara ia berfungsi</p>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map(([title, desc], i) => (
              <div key={title} className="book-margin">
                <p className="font-mono text-sm font-semibold text-marker">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band — the navy book cover */}
      <section className="bg-ink">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-5 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="wordmark text-2xl text-paper">cikgurohani</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-paper">Sedia untuk mula?</h2>
            <p className="mt-1 text-sm text-paper/70">Log masuk ke portal anda untuk teruskan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={portal ? portal.href : "/login"}
              className="inline-flex items-center justify-center rounded-[5px] bg-highlight px-5 py-3 text-sm font-semibold text-ink hover:bg-highlight/90"
            >
              {portal ? `Buka ${portal.label}` : "Portal Ibu Bapa"}
            </Link>
            {!portal && (
              <Link
                href="/student/login"
                className="inline-flex items-center justify-center rounded-[5px] border border-white/25 px-5 py-3 text-sm font-semibold text-paper hover:bg-white/5"
              >
                Portal Pelajar
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-ink-soft sm:flex-row">
          <span className="wordmark text-xl text-ink">cikgurohani</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-ink">Ibu Bapa / Admin</Link>
            <Link href="/student/login" className="hover:text-ink">Pelajar</Link>
          </div>
          <span className="font-mono text-xs">© {new Date().getFullYear()} cikgurohani.com</span>
        </div>
      </footer>
    </div>
  );
}
