import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Layers, Map, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChapterSpectrum } from "@/components/ChapterSpectrum";
import { SectionDot } from "@/components/SectionStrip";
import { useCatalog } from "@/lib/catalog";
import { loadStats } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { SectionId, Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

const TILES = [
  { to: "/charts", title: "Charts", text: "Every cross-reference as an arc, book sizes, the words of Jesus, the versions through time.", icon: BarChart3 },
  { to: "/atlas", title: "Atlas", text: "1,252 places of the Bible on a map — filter by book, click a place to read its verses.", icon: Map },
  { to: "/search", title: "Search", text: "Find any word or phrase in any version, and see where in the Bible it falls.", icon: Search },
  { to: "/versions", title: "Versions", text: "24 public-domain texts — Wycliffe to the Berean Standard, Hebrew, Greek and Latin.", icon: Layers },
];

function preferredSlug(): string {
  return lastReadPath()?.split("/")[2] ?? "kjv";
}

export default function LibraryPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const [apocrypha, setApocrypha] = useState(false);
  const slug = preferredSlug();
  const totals = useMemo(() => summarize(stats.status === "ready" ? stats.value : null), [stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="pb-8 pt-10 sm:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
        >
          The whole Bible, in every free version.
        </motion.h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
          {catalog.translations.length} public-domain texts in English, Hebrew, Greek and Latin — with charts, an atlas and every open cross-reference,
          coloured by the reading chart's seven sections.
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Stat label="versions" value={catalog.translations.length} />
          <Stat label="books" value={66} suffix=" + Apocrypha" />
          <Stat label="verses (KJV)" value={totals?.verses ?? 31102} />
          <Stat label="cross-references" value={343545} />
          <Stat label="places" value={1252} />
        </dl>
      </section>

      <section aria-labelledby="spectrum" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <h2 id="spectrum" className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          The Bible, chapter by chapter
        </h2>
        {stats.status === "ready" ? <ChapterSpectrum stats={stats.value} slug={slug} /> : <div className="h-36 animate-pulse rounded bg-surface-2" />}
      </section>

      <section aria-labelledby="library" className="py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 id="library" className="font-serif text-2xl font-semibold sm:text-3xl">
            The library
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={apocrypha} onChange={(e) => setApocrypha(e.target.checked)} className="h-4 w-4 accent-[var(--apocrypha)]" />
            Show the Apocrypha
          </label>
        </div>
        <div className="space-y-6">
          {SECTIONS.filter((s) => apocrypha || s.id !== "apocrypha").map((section) => (
            <SectionShelf key={section.id} id={section.id} slug={slug} stats={stats.status === "ready" ? stats.value : null} share={totals?.share[section.id]} />
          ))}
        </div>
      </section>

      <section aria-label="Explore" className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map(({ to, title, text, icon: Icon }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <Icon className="h-6 w-6 text-accent" aria-hidden />
            <h3 className="mt-3 flex items-center gap-1 font-serif text-xl font-semibold">
              {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-serif text-2xl font-semibold">{formatNumber(value)}</span>
        <span className="text-muted">
          {suffix} {label}
        </span>
      </dd>
    </div>
  );
}

function summarize(stats: Stats | null) {
  if (!stats) return null;
  const canon = stats.books.filter((b) => b.section !== "apocrypha");
  const words = canon.reduce((sum, b) => sum + b.words, 0);
  const share = Object.fromEntries(
    SECTIONS.map((s) => [s.id, stats.books.filter((b) => b.section === s.id).reduce((sum, b) => sum + b.words, 0) / words]),
  ) as Record<SectionId, number>;
  return { verses: canon.reduce((sum, b) => sum + b.verses, 0), share };
}

function SectionShelf({ id, slug, stats, share }: { id: SectionId; slug: string; stats: Stats | null; share?: number }) {
  const catalog = useCatalog();
  const section = SECTIONS.find((s) => s.id === id)!;
  const books = catalog.books.filter((b) => b.section === id);
  const kjvBooks = catalog.translations.find((t) => t.slug === "kjv")?.books ?? {};
  const chaptersOf = (code: string) => stats?.books.find((b) => b.code === code)?.chapters.length ?? kjvBooks[code]?.length ?? 1;
  const linkSlug = (code: string) =>
    catalog.translations.find((t) => t.slug === slug)?.books[code] ? slug : catalog.translations.find((t) => t.books[code])?.slug ?? "kjv";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <SectionDot id={id} className="h-3 w-3 self-center" />
        <h3 className="font-semibold">{section.name}</h3>
        <span className="text-sm text-muted">{section.span}</span>
        {share !== undefined && share > 0 && id !== "apocrypha" && (
          <span className="text-xs text-muted">· {(share * 100).toFixed(1)}% of the words</span>
        )}
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {books
          .filter((b) => catalog.translations.some((t) => t.books[b.code]))
          .map((book) => (
            <li key={book.code} style={{ flexGrow: chaptersOf(book.code), flexBasis: `${Math.max(44, chaptersOf(book.code) * 3)}px` }} className="min-w-[44px]">
              <Link
                to={`/read/${linkSlug(book.code)}/${book.code}/${catalog.translations.find((t) => t.slug === linkSlug(book.code))?.books[book.code]?.[0] ?? 1}`}
                title={`${book.name} — ${chaptersOf(book.code)} chapters`}
                className="group relative flex h-16 flex-col justify-end overflow-hidden rounded-lg px-2 py-1.5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: sectionColor(id) }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
                <span className="relative truncate text-[13px] font-semibold leading-tight drop-shadow">{book.name}</span>
                <span className="relative text-[11px] opacity-90">{chaptersOf(book.code)}</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
