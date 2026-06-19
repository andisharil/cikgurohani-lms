"use client";

import { useActionState, useState } from "react";
import { requestRefundAction, processRefundAction, type Result } from "@/app/admin/refund/actions";
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Select, Textarea } from "@/components/ui";

const initial: Result = { error: null };

export function RequestRefundForm() {
  const [state, action, pending] = useActionState(requestRefundAction, initial);
  const [kaedah, setKaedah] = useState("Akaun bank");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mohon Refund</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid grid-cols-2 gap-3">
          <Field label="Rujukan Pembayaran" hint="Cth: PAY-00001">
            <Input name="paymentCode" required />
          </Field>
          <Field label="Jumlah (RM)">
            <Input name="jumlah" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Kaedah">
            <Select name="kaedah" value={kaedah} onChange={(e) => setKaedah(e.target.value)}>
              <option>Akaun bank</option>
              <option>QR DuitNow</option>
            </Select>
          </Field>
          {kaedah === "Akaun bank" ? (
            <Field label="No. Akaun Bank">
              <Input name="akaun" placeholder="Bank · No akaun · Nama" />
            </Field>
          ) : (
            <Field label="QR DuitNow" hint="Muat naik gambar/PDF QR.">
              <Input name="qr" type="file" accept="application/pdf,image/*" />
            </Field>
          )}
          <div className="col-span-2">
            <Field label="Sebab">
              <Textarea name="sebab" rows={2} />
            </Field>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Menghantar…" : "Mohon Refund"}
            </Button>
            {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
            {state.ok && <span className="text-sm text-emerald-600">Permohonan refund dicipta.</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function ProcessRefundForm({ refundId }: { refundId: string }) {
  const [state, action, pending] = useActionState(processRefundAction, initial);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="refundId" value={refundId} />
      <div className="flex-1">
        <Field label="Resit Pemindahan" hint="Muat naik resit (wajib sebelum selesai).">
          <Input name="resit" type="file" accept="application/pdf,image/*" required />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Tanda Selesai"}
      </Button>
      {state.error && <span className="w-full text-sm text-rose-600">{state.error}</span>}
    </form>
  );
}
