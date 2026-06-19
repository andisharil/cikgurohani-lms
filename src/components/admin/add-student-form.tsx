"use client";

import { useActionState, useState } from "react";
import { addStudentAction, type ActionState } from "@/app/admin/pelajar/actions";
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Select, Textarea } from "@/components/ui";
import { PAKEJ, TINGKATAN, packagePrice, calcExpiry, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { rm, fmtDate, isoDate } from "@/lib/domain/format";

const initial: ActionState = { error: null };
const SALURAN = ["BayarCash", "BCL", "Manual", "Pindahan Bank"] as const;

export function AddStudentForm() {
  const [state, formAction, pending] = useActionState(addStudentAction, initial);
  const [tingkatan, setTingkatan] = useState<Tingkatan>("T4");
  const [pakej, setPakej] = useState<Pakej>("Bulanan");
  const [tarikhMula, setTarikhMula] = useState<string>(isoDate(new Date()));

  const price = packagePrice(tingkatan, pakej);
  const expiry = tarikhMula ? calcExpiry(new Date(tarikhMula), pakej) : null;

  return (
    <form action={formAction} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Maklumat Ibu Bapa</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <Field label="Nama" htmlFor="parentNama" required>
            <Input id="parentNama" name="parentNama" required />
          </Field>
          <Field label="Telefon" htmlFor="parentTelefon" required>
            <Input id="parentTelefon" name="parentTelefon" required placeholder="0123456789" />
          </Field>
          <Field label="Emel" htmlFor="parentEmel" required>
            <Input id="parentEmel" name="parentEmel" type="email" required />
          </Field>
          <Field label="Lokasi" htmlFor="parentLokasi">
            <Input id="parentLokasi" name="parentLokasi" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maklumat Pelajar</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <Field label="Nama" htmlFor="studentNama" required>
            <Input id="studentNama" name="studentNama" required />
          </Field>
          <Field label="Telefon Pelajar" htmlFor="studentTelefon" hint="Nombor ini ialah kunci log masuk pelajar.">
            <Input id="studentTelefon" name="studentTelefon" placeholder="0123456789" />
          </Field>
          <Field label="Tingkatan" htmlFor="tingkatan" required>
            <Select
              id="tingkatan"
              name="tingkatan"
              value={tingkatan}
              onChange={(e) => setTingkatan(e.target.value as Tingkatan)}
            >
              {TINGKATAN.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pakej" htmlFor="pakej" required>
            <Select id="pakej" name="pakej" value={pakej} onChange={(e) => setPakej(e.target.value as Pakej)}>
              {PAKEJ.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarikh Mula" htmlFor="tarikhMula" required>
              <Input
                id="tarikhMula"
                name="tarikhMula"
                type="date"
                value={tarikhMula}
                onChange={(e) => setTarikhMula(e.target.value)}
                required
              />
            </Field>
            <Field label="Saluran / Kaedah" htmlFor="saluran" required>
              <Select id="saluran" name="saluran" defaultValue="BayarCash">
                {SALURAN.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Resit Bayaran" htmlFor="resit" hint="Muat naik PDF atau gambar (maks 10MB).">
            <Input id="resit" name="resit" type="file" accept="application/pdf,image/*" />
          </Field>
          <Field label="Nota (dalaman)" htmlFor="nota">
            <Textarea id="nota" name="nota" rows={2} />
          </Field>

          <div className="rounded-lg bg-paper px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Harga</span>
              <span className="font-semibold text-ink">{rm(price)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-soft">Tarikh tamat (dikira)</span>
              <span className="font-medium text-ink">{expiry ? fmtDate(expiry) : "—"}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Daftar Pelajar"}
        </Button>
      </div>
    </form>
  );
}
