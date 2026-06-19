"use client";

import { useActionState, useState } from "react";
import {
  approveRenewalAction,
  rejectRenewalAction,
  applyPackageChangeAction,
  rejectPackageChangeAction,
  approveProfileChangeAction,
  rejectProfileChangeAction,
  type ActionState,
} from "@/app/admin/pengesahan/actions";
import { Button, Field, Input, Select } from "@/components/ui";
import { PAKEJ, type Pakej } from "@/lib/domain/packages";

const initial: ActionState = { error: null };

export function RenewalControls({
  renewalId,
  defaultPakej,
  reasons,
}: {
  renewalId: string;
  defaultPakej: Pakej;
  reasons: string[];
}) {
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [approveState, approveAction, approving] = useActionState(approveRenewalAction, initial);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectRenewalAction, initial);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={() => setMode(mode === "approve" ? "none" : "approve")}>
          Sahkan & Lanjutkan
        </Button>
        <Button variant="danger" onClick={() => setMode(mode === "reject" ? "none" : "reject")}>
          Tolak
        </Button>
      </div>

      {mode === "approve" && (
        <form action={approveAction} className="space-y-3 rounded-lg border border-rule p-3">
          <input type="hidden" name="renewalId" value={renewalId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pakej">
              <Select name="pakej" defaultValue={defaultPakej}>
                {PAKEJ.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Mula dari (pilihan)" hint="Kosong = auto.">
              <Input name="startFrom" type="date" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={approving}>
              {approving ? "Memproses…" : "Sahkan"}
            </Button>
            {approveState.error && <span className="text-sm text-rose-600">{approveState.error}</span>}
          </div>
        </form>
      )}

      {mode === "reject" && (
        <form action={rejectAction} className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/40 p-3">
          <input type="hidden" name="renewalId" value={renewalId} />
          <Field label="Sebab penolakan">
            <Select name="reason" defaultValue="">
              <option value="" disabled>
                Pilih sebab…
              </option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="danger" disabled={rejecting}>
              {rejecting ? "Memproses…" : "Tolak Permohonan"}
            </Button>
            {rejectState.error && <span className="text-sm text-rose-600">{rejectState.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export function PackageControls({ requestId }: { requestId: string }) {
  const [applyState, applyAction, applying] = useActionState(applyPackageChangeAction, initial);
  const [rejState, rejAction, rejecting] = useActionState(rejectPackageChangeAction, initial);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={applyAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" disabled={applying}>
          {applying ? "…" : "Laksanakan Tukar Pakej"}
        </Button>
      </form>
      <form action={rejAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" variant="secondary" disabled={rejecting}>
          Tolak
        </Button>
      </form>
      {(applyState.error || rejState.error) && (
        <span className="text-sm text-rose-600">{applyState.error || rejState.error}</span>
      )}
    </div>
  );
}

export function ProfileControls({ requestId }: { requestId: string }) {
  const [okState, okAction, approving] = useActionState(approveProfileChangeAction, initial);
  const [rejState, rejAction, rejecting] = useActionState(rejectProfileChangeAction, initial);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={okAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" disabled={approving}>
          {approving ? "…" : "Luluskan"}
        </Button>
      </form>
      <form action={rejAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" variant="secondary" disabled={rejecting}>
          Tolak
        </Button>
      </form>
      {(okState.error || rejState.error) && (
        <span className="text-sm text-rose-600">{okState.error || rejState.error}</span>
      )}
    </div>
  );
}
