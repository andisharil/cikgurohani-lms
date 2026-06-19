"use client";

import { useActionState, useState } from "react";
import {
  larasStudentAction,
  extendStudentAction,
  blockStudentAction,
  unblockStudentAction,
  type ActionState,
} from "@/app/admin/pelajar/actions";
import { Button, Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui";
import { PAKEJ, TINGKATAN, type Pakej, type Tingkatan } from "@/lib/domain/packages";
import { isoDate } from "@/lib/domain/format";

const initial: ActionState = { error: null };

type StudentData = {
  id: string;
  nama: string;
  telefon: string | null;
  tingkatan: Tingkatan;
  pakej: Pakej;
  tarikh_tamat: string | null;
  aktif: boolean;
};

type Panel = "laras" | "extend" | "block" | null;

export function StudentManage({
  student,
  canManage,
}: {
  student: StudentData;
  canManage: boolean;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  if (!canManage) return null;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPanel(panel === "laras" ? null : "laras")}>
            Laras / Edit
          </Button>
          <Button variant="secondary" onClick={() => setPanel(panel === "extend" ? null : "extend")}>
            Lanjut Langganan
          </Button>
          {student.aktif ? (
            <Button variant="danger" onClick={() => setPanel(panel === "block" ? null : "block")}>
              Sekat
            </Button>
          ) : (
            <UnblockButton studentId={student.id} />
          )}
        </div>

        {panel === "laras" && <LarasPanel student={student} />}
        {panel === "extend" && <ExtendPanel studentId={student.id} />}
        {panel === "block" && <BlockPanel studentId={student.id} />}
      </CardBody>
    </Card>
  );
}

function LarasPanel({ student }: { student: StudentData }) {
  const [state, action, pending] = useActionState(larasStudentAction, initial);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-rule p-4">
      <input type="hidden" name="studentId" value={student.id} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama">
          <Input name="nama" defaultValue={student.nama} required />
        </Field>
        <Field label="Telefon" hint="Tukar di sini berkuat kuasa serta-merta (admin).">
          <Input name="telefon" defaultValue={student.telefon ?? ""} />
        </Field>
        <Field label="Tingkatan">
          <Select name="tingkatan" defaultValue={student.tingkatan}>
            {TINGKATAN.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Pakej">
          <Select name="pakej" defaultValue={student.pakej}>
            {PAKEJ.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tarikh Tamat" hint="Jika sebelum hari ini, status jadi Tamat.">
          <Input name="tarikhTamat" type="date" defaultValue={isoDate(student.tarikh_tamat)} />
        </Field>
        <Field label="Status Aktif">
          <label className="mt-2 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="aktif" defaultChecked={student.aktif} /> Aktif
          </label>
        </Field>
      </div>
      <FormFooter state={state} pending={pending} label="Simpan" />
    </form>
  );
}

function ExtendPanel({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(extendStudentAction, initial);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-rule p-4">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pakej">
          <Select name="pakej" defaultValue="Bulanan">
            {PAKEJ.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Mula dari (pilihan)" hint="Kosongkan untuk auto: dari tarikh tamat / hari ini.">
          <Input name="startFrom" type="date" />
        </Field>
      </div>
      <FormFooter state={state} pending={pending} label="Lanjutkan" />
    </form>
  );
}

function BlockPanel({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(blockStudentAction, initial);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/40 p-4">
      <input type="hidden" name="studentId" value={studentId} />
      <Field label="Sebab dalaman" hint="Hanya untuk rekod admin — tidak dipaparkan kepada ibu bapa.">
        <Textarea name="reason" rows={2} required />
      </Field>
      <FormFooter state={state} pending={pending} label="Sekat Pelajar" danger />
    </form>
  );
}

function UnblockButton({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(unblockStudentAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="studentId" value={studentId} />
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Buka Sekatan"}
      </Button>
      {state.error && <span className="ml-2 text-sm text-rose-600">{state.error}</span>}
    </form>
  );
}

function FormFooter({ state, pending, label, danger }: { state: ActionState; pending: boolean; label: string; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending}>
        {pending ? "Menyimpan…" : label}
      </Button>
      {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      {state.ok && <span className="text-sm text-emerald-600">Berjaya disimpan.</span>}
    </div>
  );
}
