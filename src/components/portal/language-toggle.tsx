import { setLang } from "@/lib/i18n-actions";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * BM/EN toggle. Submitting either button persists the cookie via the server
 * action and re-renders the page in the chosen language; the active tab is
 * keyed by a language-independent id, so it maps to its translated label.
 */
export function LanguageToggle({ lang }: { lang: Lang }) {
  return (
    <form className="flex overflow-hidden rounded-[5px] border border-white/20">
      {(["ms", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          formAction={setLang}
          aria-pressed={lang === l}
          className={cn(
            "px-2 py-1 text-xs font-medium uppercase",
            lang === l ? "bg-highlight text-ink" : "text-paper/70 hover:bg-white/5",
          )}
        >
          {l === "ms" ? "BM" : "EN"}
        </button>
      ))}
    </form>
  );
}
