"use client";

import { useActionState, useTransition, useState } from "react";
import {
  createMaterialAction,
  createRecordingAction,
  setZoomLinkAction,
  createAnnouncementAction,
  createReportAction,
  createBankFileAction,
  deleteContentAction,
  type Result,
} from "@/app/admin/kandungan/actions";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { CommentThread } from "@/components/portal/comment-thread";
import type { Comment } from "@/lib/services/comments";
import { fmtDate } from "@/lib/domain/format";

const initial: Result = { error: null };
const TARGETS = ["Kedua-dua", "T4", "T5"];

type DeleteTable = "materials" | "recordings" | "announcements" | "student_reports" | "bank_soalan_files";
function DeleteButton({ table, id }: { table: DeleteTable; id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("table", table);
        fd.set("id", id);
        start(async () => {
          await deleteContentAction(fd);
        });
      }}
      className="text-rose-600"
    >
      {pending ? "…" : "Padam"}
    </Button>
  );
}

function FormMsg({ state }: { state: Result }) {
  return (
    <>
      {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      {state.ok && <span className="text-sm text-emerald-600">Berjaya.</span>}
    </>
  );
}

type Item = { id: string; title: string; target?: string; url?: string | null; created_at: string };

export function MaterialsPanel({ items }: { items: Item[] }) {
  const [state, action, pending] = useActionState(createMaterialAction, initial);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Bahan Kelas</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={action} className="grid grid-cols-2 gap-3">
            <Field label="Tajuk">
              <Input name="title" required />
            </Field>
            <Field label="Sasaran">
              <Select name="target" defaultValue="Kedua-dua">
                {TARGETS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Fail PDF" hint="Maksimum 20MB. Format PDF sahaja.">
                <Input name="file" type="file" accept="application/pdf" />
              </Field>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                Tambah
              </Button>
              <FormMsg state={state} />
            </div>
          </form>
        </CardBody>
      </Card>
      <ContentList items={items} table="materials" labelTarget />
    </div>
  );
}

export function RecordingsPanel({ items }: { items: Item[] }) {
  const [state, action, pending] = useActionState(createRecordingAction, initial);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Rakaman</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={action} className="grid grid-cols-2 gap-3">
            <Field label="Tajuk">
              <Input name="title" required />
            </Field>
            <Field label="Sasaran">
              <Select name="target" defaultValue="Kedua-dua">
                {TARGETS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="URL (YouTube / pautan)">
                <Input name="url" placeholder="https://youtube.com/…" required />
              </Field>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                Tambah
              </Button>
              <FormMsg state={state} />
            </div>
          </form>
        </CardBody>
      </Card>
      <ContentList items={items} table="recordings" labelTarget />
    </div>
  );
}

export function ZoomPanel({ links }: { links: { tingkatan: string; url: string | null }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {["T4", "T5"].map((t) => {
        const cur = links.find((l) => l.tingkatan === t)?.url ?? "";
        return <ZoomForm key={t} tingkatan={t} url={cur} />;
      })}
    </div>
  );
}
function ZoomForm({ tingkatan, url }: { tingkatan: string; url: string }) {
  const [state, action, pending] = useActionState(setZoomLinkAction, initial);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zoom {tingkatan}</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={action} className="space-y-3">
          <input type="hidden" name="tingkatan" value={tingkatan} />
          <Field label="Pautan Zoom">
            <Input name="url" defaultValue={url} placeholder="https://zoom.us/j/…" />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              Simpan
            </Button>
            <FormMsg state={state} />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function AnnouncementsPanel({
  items,
}: {
  items: { id: string; title: string; audience: string; cta_type: string | null; created_at: string; comments: Comment[] }[];
}) {
  const [state, action, pending] = useActionState(createAnnouncementAction, initial);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buat Pengumuman</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={action} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tajuk">
                <Input name="title" required />
              </Field>
              <Field label="Audiens">
                <Select name="audience" defaultValue="Semua">
                  <option>Semua</option>
                  <option>T4</option>
                  <option>T5</option>
                </Select>
              </Field>
            </div>
            <Field label="Kandungan">
              <Textarea name="body" rows={3} />
            </Field>
            <Field label="Butang CTA (pilihan)">
              <Select name="ctaType" defaultValue="">
                <option value="">Tiada</option>
                <option value="zoom">Zoom</option>
                <option value="bahan">Bahan</option>
                <option value="rakaman">Rakaman</option>
                <option value="bank">Bank Soalan</option>
              </Select>
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                Terbit
              </Button>
              <FormMsg state={state} />
            </div>
          </form>
        </CardBody>
      </Card>
      {items.length === 0 ? (
        <EmptyState title="Tiada pengumuman" />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border border-rule bg-white px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-xs text-ink-soft">
                    {a.audience}
                    {a.cta_type ? ` · CTA: ${a.cta_type}` : ""} · {fmtDate(a.created_at)} · {a.comments.length} komen
                  </p>
                </div>
                <DeleteButton table="announcements" id={a.id} />
              </div>
              <CommentThread announcementId={a.id} comments={a.comments} role="admin" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsPanel({ items }: { items: { id: string; tingkatan: string; bulan: string; guru: string | null; created_at: string }[] }) {
  const [state, action, pending] = useActionState(createReportAction, initial);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Terbit Laporan Pelajar</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={action} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Tingkatan">
                <Select name="tingkatan" defaultValue="T4">
                  <option>T4</option>
                  <option>T5</option>
                </Select>
              </Field>
              <Field label="Bulan">
                <Input name="bulan" placeholder="Jun 2026" required />
              </Field>
              <Field label="Guru">
                <Input name="guru" />
              </Field>
            </div>
            <Field label="Ringkasan">
              <Textarea name="ringkasan" rows={3} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                Terbit
              </Button>
              <FormMsg state={state} />
            </div>
          </form>
        </CardBody>
      </Card>
      {items.length === 0 ? (
        <EmptyState title="Tiada laporan" />
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-rule bg-white px-4 py-3 text-sm">
              <p className="text-ink">
                {r.tingkatan} · {r.bulan} {r.guru ? `· ${r.guru}` : ""}
              </p>
              <DeleteButton table="student_reports" id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BankSoalanPanel({
  folders,
  files,
}: {
  folders: { id: string; tingkatan: string; name: string }[];
  files: { id: string; folder_id: string; title: string; created_at: string }[];
}) {
  const [state, action, pending] = useActionState(createBankFileAction, initial);
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Muat Naik Soalan</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={action} className="grid grid-cols-2 gap-3">
            <Field label="Folder">
              <Select name="folderId" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.tingkatan} · {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tajuk">
              <Input name="title" required />
            </Field>
            <div className="col-span-2">
              <Field label="Fail PDF" hint="Maksimum 20MB. Format PDF sahaja.">
                <Input name="file" type="file" accept="application/pdf" />
              </Field>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                Muat Naik
              </Button>
              <FormMsg state={state} />
            </div>
          </form>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {folders.map((f) => {
          const inFolder = files.filter((x) => x.folder_id === f.id);
          return (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle>
                  {f.tingkatan} · {f.name}
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {inFolder.length === 0 ? (
                  <p className="text-sm text-ink-soft">Folder kosong.</p>
                ) : (
                  inFolder.map((file) => (
                    <div key={file.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{file.title}</span>
                      <DeleteButton table="bank_soalan_files" id={file.id} />
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ContentList({ items, table, labelTarget }: { items: Item[]; table: DeleteTable; labelTarget?: boolean }) {
  if (items.length === 0) return <EmptyState title="Tiada item" />;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between rounded-lg border border-rule bg-white px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-ink">{it.title}</p>
            <p className="text-xs text-ink-soft">
              {labelTarget && it.target ? `${it.target} · ` : ""}
              {it.url ? (
                <a
                  href={/^https?:\/\//i.test(it.url) ? it.url : `/admin/files?p=${encodeURIComponent(it.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink hover:underline"
                >
                  {/^https?:\/\//i.test(it.url) ? "pautan" : "lihat fail"}
                </a>
              ) : (
                fmtDate(it.created_at)
              )}
            </p>
          </div>
          <DeleteButton table={table} id={it.id} />
        </div>
      ))}
    </div>
  );
}
