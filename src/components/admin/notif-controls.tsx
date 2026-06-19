"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Select } from "@/components/ui";
import { retryNotificationAction } from "@/app/admin/notifikasi/actions";

export function NotifFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={params.get("channel") ?? ""} onChange={(e) => setParam("channel", e.target.value)} className="w-40">
        <option value="">Semua saluran</option>
        <option value="Portal">Portal</option>
        <option value="Email">Email</option>
        <option value="WhatsApp">WhatsApp</option>
      </Select>
      <Select value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="w-40">
        <option value="">Semua status</option>
        <option value="Berjaya">Berjaya</option>
        <option value="Gagal">Gagal</option>
        <option value="Menunggu">Menunggu</option>
      </Select>
      {pending && <span className="self-center text-xs text-ink-soft">Memuatkan…</span>}
    </div>
  );
}

export function RetryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", id);
          start(async () => setError((await retryNotificationAction(fd)).error));
        }}
      >
        {pending ? "…" : "Hantar semula"}
      </Button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
