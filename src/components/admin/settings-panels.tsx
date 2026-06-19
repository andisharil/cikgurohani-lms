"use client";

import { useActionState, useState, useTransition } from "react";
import {
  setPermissionAction,
  setSettingAction,
  addAdminUserAction,
  updateAdminRoleAction,
  setAdminActiveAction,
  removeAdminUserAction,
  type Result,
} from "@/app/admin/tetapan/actions";
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Select } from "@/components/ui";
import { PERMISSIONS, PERMISSION_LABELS, ROLES, type AdminRole, type Permission } from "@/lib/domain/permissions";

/* ----------------------------- Permission matrix ------------------------- */
export function PermissionMatrix({ matrix }: { matrix: Record<string, Record<string, boolean>> }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(role: AdminRole, perm: Permission, allowed: boolean) {
    const fd = new FormData();
    fd.set("role", role);
    fd.set("permission", perm);
    fd.set("allowed", String(allowed));
    start(async () => {
      const res = await setPermissionAction(fd);
      setError(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriks Kebenaran</CardTitle>
      </CardHeader>
      <CardBody>
        {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-ink-soft">
              <th className="py-2">Kebenaran</th>
              {ROLES.map((r) => (
                <th key={r} className="py-2 text-center">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/70">
            {PERMISSIONS.map((perm) => (
              <tr key={perm}>
                <td className="py-2 text-ink">{PERMISSION_LABELS[perm]}</td>
                {ROLES.map((role) => (
                  <td key={role} className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={role === "Pemilik" ? true : !!matrix[role]?.[perm]}
                      disabled={role === "Pemilik" || pending}
                      onChange={(e) => toggle(role, perm, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-ink-soft">Pemilik sentiasa mempunyai akses penuh.</p>
      </CardBody>
    </Card>
  );
}

/* ------------------------------- Admin users ----------------------------- */
type AdminUser = { id: string; nama: string; emel: string | null; role: AdminRole; active: boolean };

export function AdminUsers({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  return (
    <div className="space-y-5">
      <AddAdminForm />
      <Card>
        <CardHeader>
          <CardTitle>Pengguna Admin</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {users.map((u) => (
            <AdminUserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function AddAdminForm() {
  const [state, action, pending] = useActionState(addAdminUserAction, { error: null } as Result);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Pengguna Admin</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid grid-cols-2 gap-3">
          <Field label="Nama">
            <Input name="nama" required />
          </Field>
          <Field label="Emel">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Kata Laluan" hint="Minimum 8 aksara.">
            <Input name="password" type="text" required />
          </Field>
          <Field label="Peranan">
            <Select name="role" defaultValue="Pembantu">
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <div className="col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Menambah…" : "Tambah"}
            </Button>
            {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
            {state.ok && <span className="text-sm text-emerald-600">Berjaya ditambah.</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function AdminUserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function call(fn: (fd: FormData) => Promise<Result>, fd: FormData) {
    start(async () => setError((await fn(fd)).error));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule px-4 py-3">
      <div className="text-sm">
        <p className="font-medium text-ink">
          {user.nama} {isSelf && <span className="text-xs text-ink-soft">(anda)</span>}
        </p>
        <p className="text-ink-soft">{user.emel}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          defaultValue={user.role}
          disabled={pending}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("id", user.id);
            fd.set("role", e.target.value);
            call(updateAdminRoleAction, fd);
          }}
          className="w-32"
        >
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id", user.id);
            fd.set("active", String(!user.active));
            call(setAdminActiveAction, fd);
          }}
        >
          {user.active ? "Nyahaktif" : "Aktif"}
        </Button>
        {!isSelf && (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", user.id);
              call(removeAdminUserAction, fd);
            }}
          >
            Padam
          </Button>
        )}
      </div>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

/* ------------------------------ General settings -------------------------- */
export function GeneralSettings({
  language,
  communityLink,
}: {
  language: string;
  communityLink: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(key: string, value: string) {
    const fd = new FormData();
    fd.set("key", key);
    fd.set("value", value);
    start(async () => {
      const res = await setSettingAction(fd);
      setMsg(res.error ?? "Disimpan.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tetapan Umum</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <Field label="Bahasa Lalai Portal">
          <Select defaultValue={language} disabled={pending} onChange={(e) => save("default_language", e.target.value)}>
            <option value="ms">Bahasa Melayu</option>
            <option value="en">English</option>
          </Select>
        </Field>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("link") as HTMLInputElement;
            save("whatsapp_community_link", input.value);
          }}
        >
          <Field label="Pautan Komuniti WhatsApp">
            <div className="flex gap-2">
              <Input name="link" defaultValue={communityLink} placeholder="https://chat.whatsapp.com/…" />
              <Button type="submit" disabled={pending}>
                Simpan
              </Button>
            </div>
          </Field>
        </form>
        {msg && <p className="text-sm text-ink-soft">{msg}</p>}
      </CardBody>
    </Card>
  );
}
