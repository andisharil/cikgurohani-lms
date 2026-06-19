"use client";

import { useActionState } from "react";
import { otpFlow, type OtpState } from "./actions";
import { Button, Field, Input } from "@/components/ui";

const initial: OtpState = { step: "phone", error: null };

export function StudentLoginForm() {
  const [state, action, pending] = useActionState(otpFlow, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      {state.step === "phone" && (
        <>
          <input type="hidden" name="_action" value="request" />
          <Field label="Nombor Telefon" htmlFor="phone" hint="Nombor pelajar atau ibu bapa yang berdaftar.">
            <Input id="phone" name="phone" inputMode="tel" placeholder="0123456789" required autoFocus />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Menghantar kod…" : "Hantar Kod"}
          </Button>
        </>
      )}

      {state.step === "code" && (
        <>
          <input type="hidden" name="_action" value="verify" />
          <input type="hidden" name="phone" value={state.phone} />
          <Field label="Kod Pengesahan" htmlFor="code" hint={`Kod dihantar ke WhatsApp ${state.phone}.`}>
            <Input id="code" name="code" inputMode="numeric" maxLength={6} placeholder="123456" required autoFocus />
          </Field>
          {state.devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Mod dev — kod anda: <b>{state.devCode}</b>
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Mengesahkan…" : "Sahkan"}
          </Button>
        </>
      )}

      {state.step === "select" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">Pilih akaun pelajar:</p>
          <input type="hidden" name="_action" value="select" />
          <input type="hidden" name="phone" value={state.phone} />
          <input type="hidden" name="selectionToken" value={state.selectionToken} />
          <div className="space-y-2">
            {state.matches?.map((m) => (
              <button
                key={m.id}
                type="submit"
                name="studentId"
                value={m.id}
                className="flex w-full items-center justify-between rounded-lg border border-rule bg-white px-4 py-3 text-left text-sm hover:border-ink/40 hover:bg-highlight/25"
              >
                <span className="font-medium text-ink">{m.nama}</span>
                <span className="text-ink-soft">
                  {m.code} · {m.tingkatan}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
