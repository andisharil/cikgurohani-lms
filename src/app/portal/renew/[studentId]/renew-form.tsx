"use client";

import { useActionState, useState } from "react";
import { submitManualRenewal, type RenewState } from "../actions";
import { Button, Field, Input, Select } from "@/components/ui";
import { packagePrice, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { rm } from "@/lib/domain/format";

const initial: RenewState = { error: null };

export function RenewForm({
  studentId,
  tingkatan,
  allowedPackages,
}: {
  studentId: string;
  tingkatan: Tingkatan;
  allowedPackages: Pakej[];
}) {
  const [state, action, pending] = useActionState(submitManualRenewal, initial);
  const [pakej, setPakej] = useState<Pakej>(allowedPackages[0]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <Field label="Pakej">
        <Select name="pakej" value={pakej} onChange={(e) => setPakej(e.target.value as Pakej)}>
          {allowedPackages.map((p) => (
            <option key={p} value={p}>
              {p} — {rm(packagePrice(tingkatan, p))}
            </option>
          ))}
        </Select>
      </Field>

      <div className="rounded-lg bg-paper px-4 py-3 text-sm">
        <p className="text-ink-soft">Bank: Maybank 5xxxxxxxxxx (cikgurohani)</p>
        <p className="text-ink-soft">Jumlah: <b>{rm(packagePrice(tingkatan, pakej))}</b></p>
        <p className="mt-1 text-xs text-ink-soft">
          Buat pembayaran, kemudian muat naik / tampal pautan resit di bawah.
        </p>
      </div>

      <Field label="Resit Pembayaran" hint="Muat naik gambar atau PDF resit (maks 10MB)." required>
        <Input name="resit" type="file" accept="application/pdf,image/*" required />
      </Field>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menghantar…" : "Hantar untuk Semakan"}
      </Button>
      <p className="text-center text-xs text-ink-soft">
        Pembayaran dalam talian (BayarCash/FPX) akan disediakan tidak lama lagi.
      </p>
    </form>
  );
}
