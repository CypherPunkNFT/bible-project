import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditLine } from "@/components/CreditLine";
import { SourceDirectory } from "@/components/SourceDirectory";
import { useCatalog } from "@/lib/catalog";
import { groupVersions, VERSION_GROUPS, type VersionGroup } from "@/lib/languages";
import { NUMBERING_LABEL } from "@/lib/numbering";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { Catalog, Translation } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";


function counts(catalog: Catalog, t: Translation) {
  const section = (code: string) => catalog.books.find((b) => b.code === code)?.section;
  const codes = Object.keys(t.books);
  const nt = codes.filter((c) => ["gospels", "epistles", "revelation"].includes(section(c) ?? "")).length;
  const apocrypha = codes.filter((c) => section(c) === "apocrypha").length;
  return { ot: codes.length - nt - apocrypha, nt, apocrypha };
}

export default function VersionsPage() {
  const catalog = useCatalog();
  const [filter, setFilter] = useState<VersionGroup["id"] | "all">("all");
  const grouped = groupVersions(catalog.translations);
  const shown = grouped.filter((g) => filter === "all" || g.group.id === filter);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <SourceDirectory scriptureCount={catalog.translations.length} />
      <header id="scriptures" className="scroll-mt-24 pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Versions & sources</p>
        <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{catalog.translations.length} scriptures, all free to read.</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Every text below is in the public domain except one: the Hindi Indian Revised Version, which its publisher shares under an open licence (CC BY-SA 4.0).
          Each was downloaded from eBible.org and is shown as published there, without the book introductions some of them carry.
        </p>
      </header>

      <div role="group" aria-label="Show" className="mb-4 flex flex-wrap gap-1.5">
        {(["all", ...VERSION_GROUPS.map((g) => g.id)] as const).map((id) => {
          const count = id === "all" ? catalog.translations.length : grouped.find((g) => g.group.id === id)?.count ?? 0;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn("rounded-full border px-3 py-1 text-sm", filter === id ? "border-ink bg-ink font-semibold text-page" : "border-line hover:bg-surface-2")}
            >
              {id === "all" ? "All" : VERSION_GROUPS.find((g) => g.id === id)!.title}
              <span className="ms-1 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Every version on this site</caption>
          <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Abbreviation</th>
              <th scope="col" className="px-3 py-3">Name</th>
              <th scope="col" className="px-3 py-3">Year</th>
              <th scope="col" className="px-3 py-3">Books (OT · NT · Apocrypha)</th>
              <th scope="col" className="px-3 py-3 text-right">Verses</th>
              <th scope="col" className="px-3 py-3">Numbering</th>
              <th scope="col" className="px-3 py-3"><span className="sr-only">Read</span></th>
            </tr>
          </thead>
          {shown.map(({ group, count, sections }) => (
            <tbody key={group.id} className="divide-y divide-line border-t border-line first-of-type:border-t-0">
              <tr className="bg-surface-2/70">
                <th scope="rowgroup" colSpan={7} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {group.title} <span className="font-normal normal-case tracking-normal">· {count}</span>
                </th>
              </tr>
              {sections.flatMap((section) => [
                ...(section.label
                  ? [
                      <tr key={`${section.lang}-label`}>
                        <th scope="rowgroup" colSpan={7} className="px-4 pb-1 pt-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                          {section.label}
                        </th>
                      </tr>,
                    ]
                  : []),
                ...section.versions.map((t) => {
                  const c = counts(catalog, t);
                  const first = Object.keys(t.books)[0];
                  return (
                    <tr key={t.slug} className="hover:bg-surface-2/60">
                      <th scope="row" className="px-4 py-3 font-semibold">{t.abbr}</th>
                      <td className="px-3 py-3 text-muted">{t.name}</td>
                      <td className="px-3 py-3 tabular-nums">{t.year}</td>
                      <td className="px-3 py-3 tabular-nums">
                        {c.ot} · {c.nt} · {c.apocrypha}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(t.verses)}</td>
                      <td className="px-3 py-3 text-muted">{NUMBERING_LABEL[t.numbering]}</td>
                      <td className="px-3 py-3">
                        <Link to={`/read/${t.slug}/${first}/${t.books[first][0]}`} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 hover:bg-surface-2">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden /> Read
                        </Link>
                      </td>
                    </tr>
                  );
                }),
              ])}
            </tbody>
          ))}
        </table>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-serif text-2xl font-semibold">The seven colours</h2>
          <p className="mt-1 text-sm text-muted">Everything on this site is coloured by the sections of a Bible reading chart.</p>
          <ul className="mt-4 space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="h-4 w-8 rounded" style={{ background: sectionColor(s.id) }} aria-hidden />
                <strong>{s.name}</strong> <span className="text-muted">{s.span}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
          <h2 className="font-serif text-2xl font-semibold">Sources and credits</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <strong>Bible texts</strong> — <a className="underline" href="https://ebible.org/" rel="noreferrer">eBible.org</a>, each marked public domain on its own copyright page, except
              the Hindi text below.
            </li>
            {catalog.translations
              .filter((t) => t.credit)
              .map((t) => (
                <li key={t.slug}>
                  <strong>{t.name}</strong> — <CreditLine credit={t.credit!} />
                </li>
              ))}
            <li>
              <strong>Cross references</strong> — <a className="underline" href="https://www.openbible.info/labs/cross-references/" rel="noreferrer">OpenBible.info</a>, licensed CC-BY. About 344,000 reader-voted links, seeded from the public-domain Treasury of Scripture Knowledge.
            </li>
            <li>
              <strong>Places</strong> — <a className="underline" href="https://www.openbible.info/geo/" rel="noreferrer">OpenBible.info Bible geocoding</a>, licensed CC-BY 4.0. Atlas map: © <a className="underline" href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap contributors</a> (ODbL), via Protomaps, served from this site. Preview imagery: NASA Blue Marble Next Generation and Natural Earth outlines (public domain).
            </li>
            <li>
              <strong>Hebrew text</strong> — the words of the Westminster Leningrad Codex are public domain. Its word-by-word grammar tags are licensed separately (CC BY-SA) and are not used here.
            </li>
            <li>
              <strong>Verse numbering</strong> differs between traditions — for example the Greek and Latin Psalms run one number behind the English for most of the book. Side-by-side reading warns when versions number differently.
            </li>
            <li>
              <strong>King James Version</strong> — public domain everywhere except the United Kingdom, where the Crown holds a perpetual patent.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
