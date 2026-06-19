import { requireParent } from "@/lib/auth/parent";
import { signOut } from "@/lib/auth/actions";
import { getLang, getDict } from "@/lib/i18n";
import { LanguageToggle } from "@/components/portal/language-toggle";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { parent } = await requireParent();
  const lang = await getLang();
  const t = getDict(lang);
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div>
            <p className="wordmark text-2xl text-paper">cikgurohani</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
              {t.parentPortal}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} />
            <span className="hidden text-sm text-paper/80 sm:inline">{parent.nama}</span>
            <form action={signOut}>
              <button className="rounded-[5px] border border-white/20 px-3 py-1.5 text-sm text-paper/80 hover:bg-white/5">
                {t.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
    </div>
  );
}
