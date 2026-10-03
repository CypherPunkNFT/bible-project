import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Layers, Map, Search } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChapterSpectrum } from "@/components/ChapterSpectrum";
import { LibraryChart } from "@/components/LibraryChart";
import { useCatalog } from "@/lib/catalog";
import { loadStats } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { SECTIONS } from "@/lib/sections";
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
  const slug = preferredSlug();
  // The spectrum's bars are KJV chapters; a version that numbers chapters differently would open the wrong one.
  const spectrumSlug = catalog.translations.find((t) => t.slug === slug)?.numbering === "english" ? slug : "kjv";
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

      <LibraryChart slug={slug} />

      <section aria-labelledby="spectrum" className="my-10 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <h2 id="spectrum" className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          The Bible, chapter by chapter
        </h2>
        {stats.status === "ready" ? <ChapterSpectrum stats={stats.value} slug={spectrumSlug} /> : <div className="h-36 animate-pulse rounded bg-surface-2" />}
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

