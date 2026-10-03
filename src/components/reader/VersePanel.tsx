import { Link2, Layers, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SectionDot } from "@/components/SectionStrip";
import { useCatalog } from "@/lib/catalog";
import { loadCrossRefs, loadPlain } from "@/lib/data";
import { bookByNum, formatRange, plainLookup, sectionOfNum, splitId } from "@/lib/refs";
import type { CrossRefBook, Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

interface Props {
  translation: Translation;
  bookCode: string;
  chapter: string;
  label: string;
  onClose: () => void;
}

const FIRST_PAGE = 12;

/** The selected verse: its open cross-references (strongest first) and the verse in every version. */
export function VersePanel({ translation, bookCode, chapter, label, onClose }: Props) {
  const catalog = useCatalog();
  const heading = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(FIRST_PAGE);
  const [compare, setCompare] = useState(false);
  const verse = Number(/^\d+/.exec(label)?.[0] ?? NaN);
  const inCanon = (catalog.books.find((b) => b.code === bookCode)?.num ?? 99) <= 66;
  const refs = useAsync<CrossRefBook>(() => (inCanon ? loadCrossRefs(bookCode) : Promise.resolve({})), `xref:${bookCode}`);
  const list = refs.status === "ready" ? refs.value[`${chapter}:${verse}`] ?? [] : [];
  const bookName = catalog.books.find((b) => b.code === bookCode)?.name ?? bookCode;

  useEffect(() => {
    setShown(FIRST_PAGE);
    setCompare(false);
    heading.current?.focus();
  }, [bookCode, chapter, label]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      aria-labelledby="verse-panel-title"
      className="fixed inset-x-0 bottom-0 z-40 max-h-[72dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] lg:sticky lg:top-[8.5rem] lg:z-0 lg:max-h-[calc(100dvh-10rem)] lg:rounded-2xl lg:border lg:shadow-none"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 id="verse-panel-title" ref={heading} tabIndex={-1} className="font-serif text-xl font-semibold outline-none">
          {bookName} {chapter}:{label}
        </h2>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close the verse panel">
          <X className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCompare((value) => !value)}
        aria-expanded={compare}
        className="mb-4 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2"
      >
        <Layers className="h-4 w-4 text-accent" aria-hidden /> {compare ? "Hide" : "Show"} this verse in every version
      </button>
      {compare && <EveryVersion bookCode={bookCode} chapter={Number(chapter)} verse={verse} />}

      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Link2 className="h-3.5 w-3.5" aria-hidden /> Cross-references {list.length > 0 && `· ${formatNumber(list.length)}`}
      </h3>
      {!inCanon && <p className="text-sm text-muted">The open cross-reference set covers the 66 books only, not the Apocrypha.</p>}
      {inCanon && refs.status === "loading" && <p className="animate-pulse text-sm text-muted">Loading…</p>}
      {inCanon && refs.status === "ready" && list.length === 0 && <p className="text-sm text-muted">No cross-references recorded for this verse.</p>}
      <ol className="space-y-2">
        {list.slice(0, shown).map(([start, end, votes]) => (
          <CrossRef key={`${start}-${end}`} start={start} end={end} votes={votes} translation={translation} />
        ))}
      </ol>
      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + 20)} className="mt-3 w-full rounded-lg bg-surface-2 py-2 text-sm hover:brightness-95">
          Show more ({formatNumber(list.length - shown)} left)
        </button>
      )}
      <p className="mt-4 text-[11px] text-muted">
        Ordered by OpenBible.info readers' votes ({list.length ? "strongest first" : "none here"}). Cross references from OpenBible.info, CC-BY.
      </p>
    </aside>
  );
}

function CrossRef({ start, end, votes, translation }: { start: number; end: number; votes: number; translation: Translation }) {
  const catalog = useCatalog();
  const { num, chapter, verse } = splitId(start);
  const book = bookByNum(catalog, num);
  const code = book?.code ?? "GEN";
  const slug = translation.books[code] ? translation.slug : "kjv";
  const plain = useAsync(() => loadPlain(slug, code), `plain:${slug}:${code}`);
  const text = plain.status === "ready" ? plainLookup(plain.value, chapter, verse) : undefined;
  return (
    <li>
      <Link
        to={`/read/${slug}/${code}/${chapter}?v=${verse}`}
        className="block rounded-lg border border-line/70 p-2.5 transition hover:border-line hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SectionDot id={sectionOfNum(catalog, num)} />
          {formatRange(catalog, start, end)}
          <span className="ms-auto text-[11px] font-normal text-muted" title="OpenBible.info votes">
            {votes} {votes === 1 ? "vote" : "votes"}
          </span>
        </span>
        <span className="mt-1 line-clamp-3 block font-serif text-[0.92rem] leading-snug text-ink/85" lang={slug === translation.slug ? translation.lang : "en"}>
          {plain.status === "loading" ? "…" : text ?? "(not in this version)"}
          {slug !== translation.slug && <span className="ms-1 font-sans text-[10px] text-muted">KJV</span>}
        </span>
      </Link>
    </li>
  );
}

function EveryVersion({ bookCode, chapter, verse }: { bookCode: string; chapter: number; verse: number }) {
  const catalog = useCatalog();
  const versions = catalog.translations.filter((t) => t.books[bookCode]);
  return (
    <ul className="mb-5 space-y-2 border-s-2 border-accent/40 ps-3">
      {versions.map((t) => (
        <VersionLine key={t.slug} translation={t} bookCode={bookCode} chapter={chapter} verse={verse} />
      ))}
    </ul>
  );
}

function VersionLine({ translation, bookCode, chapter, verse }: { translation: Translation; bookCode: string; chapter: number; verse: number }) {
  const plain = useAsync(() => loadPlain(translation.slug, bookCode), `plain:${translation.slug}:${bookCode}`);
  const text = plain.status === "ready" ? plainLookup(plain.value, chapter, verse) : undefined;
  return (
    <li className="text-sm">
      <span className="me-1.5 font-semibold" title={`${translation.name} (${translation.year})`}>
        {translation.abbr}
      </span>
      <span lang={translation.lang} dir={translation.dir} className={translation.lang === "he" ? "font-hebrew text-base" : "font-serif"}>
        {plain.status === "loading" ? "…" : text ?? "—"}
      </span>
    </li>
  );
}
