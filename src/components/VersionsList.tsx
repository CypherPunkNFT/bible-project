import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { languageName, languagesOf } from "@/lib/languages";
import type { Catalog, Translation } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

/** Seven versions in view; the rest scroll. */
const ROW_REM = 3.75;
const VISIBLE = 7;
/** The sticky language heading (py-1.5 + text-xs + border) sits on top of the rows, so the box grows by its height. */
const HEADING_REM = 1.95;

function testaments(catalog: Catalog, t: Translation): string {
  const section = (code: string) => catalog.books.find((b) => b.code === code)?.section;
  const codes = Object.keys(t.books);
  const nt = codes.filter((c) => ["gospels", "epistles", "revelation"].includes(section(c) ?? "")).length;
  const apocrypha = codes.filter((c) => section(c) === "apocrypha").length;
  const ot = codes.length - nt - apocrypha;
  return [ot && `${ot} OT`, nt && `${nt} NT`, apocrypha && `${apocrypha} Apocrypha`].filter(Boolean).join(" · ");
}

/**
 * Every version in a list seven rows tall, grouped by language (filter buttons above), the language shown between
 * the abbreviation and the name; the scrollbar sits just outside the list's right edge.
 */
export function VersionsList() {
  const catalog = useCatalog();
  const [language, setLanguage] = useState("all");
  const languages = languagesOf(catalog.translations);
  const shown = language === "all" ? languages : [language];
  return (
    <section aria-labelledby="versions-title" className="py-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="versions-title" className="font-serif text-2xl font-semibold sm:text-3xl">
          The versions
        </h2>
        <p className="text-sm text-muted">
          {catalog.translations.length} public-domain texts ·{" "}
          <Link to="/versions" className="underline underline-offset-2 hover:text-ink">
            sources and licences
          </Link>
        </p>
      </div>
      <div role="group" aria-label="Show versions in" className="mb-3 flex flex-wrap gap-1.5">
        {["all", ...languages].map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={language === code}
            onClick={() => setLanguage(code)}
            className={cn("rounded-full border px-3 py-1 text-sm", language === code ? "border-ink bg-ink font-semibold text-page" : "border-line hover:bg-surface-2")}
          >
            {code === "all" ? "All languages" : languageName(code)}
            <span className="ms-1 text-xs opacity-70">{code === "all" ? catalog.translations.length : catalog.translations.filter((t) => t.lang === code).length}</span>
          </button>
        ))}
      </div>
      <div className="slim-scroll -me-3 overflow-y-auto overscroll-contain pe-3" style={{ maxHeight: `${ROW_REM * VISIBLE + HEADING_REM + 0.15}rem` }}>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {shown.map((code) => (
        <section key={code} aria-label={`${languageName(code)} versions`}>
        <h3 className="sticky top-0 z-10 border-b border-line bg-surface-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {languageName(code)} <span className="font-normal normal-case tracking-normal">· {catalog.translations.filter((t) => t.lang === code).length}</span>
        </h3>
        <ul className="divide-y divide-line">
          {catalog.translations.filter((t) => t.lang === code).map((t) => {
            const first = Object.keys(t.books)[0];
            return (
              <li key={t.slug} style={{ height: `${ROW_REM}rem` }}>
                <Link to={`/read/${t.slug}/${first}/${t.books[first][0]}`} className="group flex h-full items-center gap-4 px-4 hover:bg-surface-2/60">
                  <span className="w-14 shrink-0 font-semibold">{t.abbr}</span>
                  <span className="hidden w-28 shrink-0 text-sm text-muted xs:block">{languageName(t.lang)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.year} · {testaments(catalog, t)} · {formatNumber(t.verses)} verses
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-sm text-muted group-hover:text-ink sm:flex">
                    <BookOpen className="h-4 w-4" aria-hidden /> Read
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        </section>
        ))}
        </div>
      </div>
    </section>
  );
}
