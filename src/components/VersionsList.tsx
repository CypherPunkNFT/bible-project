import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import type { Catalog, Translation } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const LANGUAGE: Record<string, string> = { en: "English", enm: "Middle English", he: "Hebrew", grc: "Greek", la: "Latin" };
/** Seven versions in view; the rest scroll. */
const ROW_REM = 3.75;
const VISIBLE = 7;

function testaments(catalog: Catalog, t: Translation): string {
  const section = (code: string) => catalog.books.find((b) => b.code === code)?.section;
  const codes = Object.keys(t.books);
  const nt = codes.filter((c) => ["gospels", "epistles", "revelation"].includes(section(c) ?? "")).length;
  const apocrypha = codes.filter((c) => section(c) === "apocrypha").length;
  const ot = codes.length - nt - apocrypha;
  return [ot && `${ot} OT`, nt && `${nt} NT`, apocrypha && `${apocrypha} Apocrypha`].filter(Boolean).join(" · ");
}

/** Every version in a list seven rows tall; the scrollbar sits just outside the list's right edge. */
export function VersionsList() {
  const catalog = useCatalog();
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
      <div className="slim-scroll -me-3 overflow-y-auto overscroll-contain pe-3" style={{ maxHeight: `${ROW_REM * VISIBLE + 0.15}rem` }}>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {catalog.translations.map((t) => {
            const first = Object.keys(t.books)[0];
            return (
              <li key={t.slug} style={{ height: `${ROW_REM}rem` }}>
                <Link to={`/read/${t.slug}/${first}/${t.books[first][0]}`} className="group flex h-full items-center gap-4 px-4 hover:bg-surface-2/60">
                  <span className="w-14 shrink-0 font-semibold">{t.abbr}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.year} · {LANGUAGE[t.lang] ?? t.lang} · {testaments(catalog, t)} · {formatNumber(t.verses)} verses
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
      </div>
    </section>
  );
}
