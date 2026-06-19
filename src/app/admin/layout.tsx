import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/lib/auth/actions";
import { Sidebar, type NavItem } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();

  // Build nav filtered by the admin's effective permissions.
  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard" },
    ctx.can("pelajar") && { href: "/admin/pelajar", label: "Pelajar" },
    ctx.can("kandungan") && { href: "/admin/kandungan", label: "Kandungan" },
    ctx.can("sahkanBayaran") && { href: "/admin/pengesahan", label: "Pengesahan Bayaran" },
    ctx.can("kewangan") && { href: "/admin/kewangan", label: "Kewangan" },
    (ctx.can("mohonRefund") || ctx.can("prosesRefund")) && {
      href: "/admin/refund",
      label: "Refund",
    },
    ctx.can("notifikasi") && { href: "/admin/notifikasi", label: "Notifikasi" },
    ctx.can("waba") && { href: "/admin/waba", label: "WhatsApp" },
    (ctx.can("tetapan") || ctx.can("permission")) && {
      href: "/admin/tetapan",
      label: "Tetapan",
    },
  ].filter(Boolean) as NavItem[];

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-60 flex-col bg-ink text-paper">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="wordmark text-2xl text-paper">cikgurohani</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
            Panel Admin
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={items} />
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-paper">{ctx.nama}</p>
            <p className="font-mono text-xs text-paper/50">{ctx.role}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-[5px] px-3 py-2 text-left text-sm font-medium text-paper/70 hover:bg-white/5 hover:text-paper"
            >
              Log Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
