import { useMemo } from "react";
import { ChapterSpectrum } from "@/components/ChapterSpectrum";
import { LibraryChart } from "@/components/LibraryChart";
import { VersionsList } from "@/components/VersionsList";
import { useCatalog } from "@/lib/catalog";
import { loadStats } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import type { Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

function preferredSlug(): string {
  return lastReadPath()?.split("/")[2] ?? "kjv";
}

/** The library itself: the reading chart, every version, and the Bible chapter by chapter. */
export default function LibraryPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const slug = preferredSlug();
  // The spectrum's bars are KJV chapters; a version that numbers chapters differently would open the wrong one.
  const spectrumSlug = catalog.translations.find((t) => t.slug === slug)?.numbering === "english" ? slug : "kjv";
  const verses = useMemo(() => canonVerses(stats.status === "ready" ? stats.value : null), [stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Library</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">The library.</h1>
        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <Stat label="versions" value={catalog.translations.length} />
          <Stat label="books" value={66} suffix=" + Apocrypha" />
          <Stat label="verses (KJV)" value={verses ?? 31102} />
          <Stat label="cross-references" value={343545} />
          <Stat label="places" value={1252} />
        </dl>
      </header>

      <LibraryChart slug={slug} />

      <VersionsList />

      <section aria-labelledby="spectrum" className="mb-16 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <h2 id="spectrum" className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          The Bible, chapter by chapter
        </h2>
        {stats.status === "ready" ? <ChapterSpectrum stats={stats.value} slug={spectrumSlug} /> : <div className="h-36 animate-pulse rounded bg-surface-2" />}
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

function canonVerses(stats: Stats | null): number | null {
  if (!stats) return null;
  return stats.books.filter((b) => b.section !== "apocrypha").reduce((sum, b) => sum + b.verses, 0);
}
