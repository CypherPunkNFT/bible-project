import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupVersions, VERSION_GROUPS, type VersionGroup } from "@/lib/languages";
import type { Catalog, Translation } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

/** Seven versions in view; the rest scroll. */
const ROW_REM = 3.75;
const VISIBLE = 7;
/** The sticky group heading (py-1.5 + text-xs + border) sits on top of the rows, so the box grows by its height. */
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
 * Every version in a list seven rows tall: English by name, then the original and ancient languages, then
 * translations into other languages (each language a sub-heading). The frame stays fixed while its contents
 * scroll, with the current group heading pinned inside the frame.
 */
export function VersionsList() {
  const catalog = useCatalog();
  const [filter, setFilter] = useState<VersionGroup["id"] | "all">("all");
  const grouped = groupVersions(catalog.translations);
  const shown = grouped.filter((g) => filter === "all" || g.group.id === filter);
  return (
    <section aria-labelledby="versions-title" className="py-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="versions-title" className="font-serif text-2xl font-semibold sm:text-3xl">
          The versions
        </h2>
        <p className="text-sm text-muted">
          {catalog.translations.length} free texts ·{" "}
          <Link to="/versions" className="underline underline-offset-2 hover:text-ink">
            sources and licences
          </Link>
        </p>
      </div>
      <div role="group" aria-label="Show" className="mb-3 flex flex-wrap gap-1.5">
        {(["all", ...VERSION_GROUPS.map((g) => g.id)] as const).map((id) => {
          const count = id === "all" ? catalog.translations.length : grouped.find((g) => g.group.id === id)?.count ?? 0;
          const title = id === "all" ? "All" : VERSION_GROUPS.find((g) => g.id === id)!.title;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn("rounded-full border px-3 py-1 text-sm", filter === id ? "border-ink bg-ink font-semibold text-page" : "border-line hover:bg-surface-2")}
            >
              {title}
              <span className="ms-1 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="versions-list-frame overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="versions-list-scroll slim-scroll overflow-y-auto overscroll-contain" style={{ height: `${ROW_REM * VISIBLE + HEADING_REM + 0.15}rem` }}>
          {shown.map(({ group, count, sections }) => (
            <section key={group.id} aria-label={group.title}>
              <h3 className="sticky top-0 z-10 border-b border-line bg-surface-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {group.title} <span className="font-normal normal-case tracking-normal">· {count}</span>
              </h3>
              {sections.map((section) => (
                <div key={section.lang ?? group.id}>
                  {section.label && (
                    <h4 className="border-b border-line px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{section.label}</h4>
                  )}
                  <ul className="divide-y divide-line border-b border-line last:border-b-0">
                    {section.versions.map((t) => {
                      const first = Object.keys(t.books)[0];
                      return (
                        <li key={t.slug} style={{ height: `${ROW_REM}rem` }}>
                          <Link to={`/read/${t.slug}/${first}/${t.books[first][0]}`} className="group flex h-full items-center gap-4 px-4 hover:bg-surface-2/60">
                            <span className="w-14 shrink-0 font-semibold">{t.abbr}</span>
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
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
