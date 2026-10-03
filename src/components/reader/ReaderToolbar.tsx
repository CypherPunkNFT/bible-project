import { ChevronLeft, ChevronRight, Columns2, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { SectionDot } from "@/components/SectionStrip";
import { useCatalog } from "@/lib/catalog";
import type { BookInfo, Translation } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ReaderSettings } from "./settings";

interface Props {
  translation: Translation;
  book: BookInfo;
  chapter: string;
  parallel: Translation[];
  settings: ReaderSettings;
  onTranslation: (slug: string) => void;
  onChapter: (label: string) => void;
  onOpenBooks: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onParallel: (slugs: string[]) => void;
  onSettings: (settings: ReaderSettings) => void;
}

const LANGUAGE_GROUPS: [string, string[]][] = [
  ["English", ["en", "enm"]],
  ["Hebrew", ["he"]],
  ["Greek", ["grc"]],
  ["Latin", ["la"]],
];

function VersionOptions({ bookCode, exclude = [] }: { bookCode: string; exclude?: string[] }) {
  const catalog = useCatalog();
  return (
    <>
      {LANGUAGE_GROUPS.map(([group, langs]) => (
        <optgroup key={group} label={group}>
          {catalog.translations
            .filter((t) => langs.includes(t.lang) && !exclude.includes(t.slug))
            .map((t) => (
              <option key={t.slug} value={t.slug} disabled={!t.books[bookCode]}>
                {t.abbr} — {t.name} ({t.year}){t.books[bookCode] ? "" : " · not in this book"}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

const selectClass = "h-9 rounded-lg border border-line bg-surface px-2 text-sm hover:bg-surface-2";

export function ReaderToolbar(props: Props) {
  const { translation, book, chapter, parallel, settings } = props;
  const [showSettings, setShowSettings] = useState(false);
  const chapters = translation.books[book.code] ?? [];

  return (
    <div className="sticky top-[3.6rem] z-30 -mx-4 border-b border-line bg-page/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={props.onOpenBooks} className={cn(selectClass, "flex items-center gap-2 font-semibold")} aria-haspopup="dialog">
          <SectionDot id={book.section} /> {book.name}
        </button>
        <label className="sr-only" htmlFor="chapter-select">
          Chapter
        </label>
        <select id="chapter-select" value={chapter} onChange={(e) => props.onChapter(e.target.value)} className={selectClass}>
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="version-select">
          Version
        </label>
        <select id="version-select" value={translation.slug} onChange={(e) => props.onTranslation(e.target.value)} className={cn(selectClass, "max-w-[11rem] sm:max-w-xs")}>
          <VersionOptions bookCode={book.code} />
        </select>
        <div className="ms-auto flex items-center gap-1">
          <button type="button" onClick={props.onPrev ?? undefined} disabled={!props.onPrev} className="rounded-full p-2 hover:bg-surface-2 disabled:opacity-30" aria-label="Previous chapter">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={props.onNext ?? undefined} disabled={!props.onNext} className="rounded-full p-2 hover:bg-surface-2 disabled:opacity-30" aria-label="Next chapter">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
            className={cn("rounded-full p-2 hover:bg-surface-2", showSettings && "bg-surface-2")}
            aria-label="Reading options"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <Columns2 className="h-4 w-4 text-muted" aria-hidden />
        <span className="text-muted">Side by side:</span>
        {parallel.map((t) => (
          <span key={t.slug} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pe-1 ps-2.5">
            {t.abbr}
            <button
              type="button"
              onClick={() => props.onParallel(parallel.filter((p) => p.slug !== t.slug).map((p) => p.slug))}
              className="rounded-full p-0.5 hover:bg-line"
              aria-label={`Remove ${t.abbr}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {parallel.length < 2 && (
          <label className="inline-flex items-center gap-1">
            <Plus className="h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">Add a version side by side</span>
            <select
              value=""
              onChange={(e) => e.target.value && props.onParallel([...parallel.map((p) => p.slug), e.target.value])}
              className="h-8 rounded-lg border border-dashed border-line bg-transparent px-2 text-sm"
            >
              <option value="">add a version…</option>
              <VersionOptions bookCode={book.code} exclude={[translation.slug, ...parallel.map((p) => p.slug)]} />
            </select>
          </label>
        )}
      </div>
      {showSettings && (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-line bg-surface p-3 text-sm">
          {(
            [
              ["redLetters", "Words of Jesus in red"],
              ["footnotes", "Footnotes"],
              ["versePerLine", "One verse per line"],
            ] as const
          ).map(([key, text]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={settings[key]} onChange={(e) => props.onSettings({ ...settings, [key]: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
              {text}
            </label>
          ))}
          <label className="flex items-center gap-2">
            Text size
            <input
              type="range"
              min={0.85}
              max={1.5}
              step={0.05}
              value={settings.scale}
              onChange={(e) => props.onSettings({ ...settings, scale: Number(e.target.value) })}
              className="accent-[var(--accent)]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
