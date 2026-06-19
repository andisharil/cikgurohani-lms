"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input, Select } from "@/components/ui";
import { useTransition } from "react";

const STATUSES = ["Aktif", "Akan Tamat", "Tamat", "Disekat"];
const TINGKATAN = ["T4", "T5", "T4&5"];

export function StudentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Cari nama / ID / ibu bapa…"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => setParam("q", e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={params.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="w-40"
      >
        <option value="">Semua status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select
        value={params.get("tingkatan") ?? ""}
        onChange={(e) => setParam("tingkatan", e.target.value)}
        className="w-36"
      >
        <option value="">Semua tingkatan</option>
        {TINGKATAN.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Select
        value={params.get("sort") ?? "created"}
        onChange={(e) => setParam("sort", e.target.value)}
        className="w-44"
      >
        <option value="created">Terkini didaftar</option>
        <option value="nama">Nama (A-Z)</option>
        <option value="tamat">Tarikh tamat</option>
        <option value="hari">Hari tinggal</option>
      </Select>
      {pending && <span className="text-xs text-ink-soft">Memuatkan…</span>}
    </div>
  );
}
