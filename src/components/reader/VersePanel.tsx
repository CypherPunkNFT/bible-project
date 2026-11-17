import { Image as ImageIcon, Link2, Layers, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SectionDot } from "@/components/SectionStrip";
import { WindowedRows } from "@/components/WindowedRows";
import { useCatalog } from "@/lib/catalog";
import { loadCrossRefs } from "@/lib/data";
import { VERSION_GROUPS } from "@/lib/languages";
import { NUMBERING_LABEL } from "@/lib/numbering";
import { bookByNum, formatRange, sectionOfNum, splitId } from "@/lib/refs";
import type { CrossRefBook, Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useVerseText } from "@/lib/useVerseText";
import { formatNumber } from "@/lib/utils";
import { verseCardPath } from "@/lib/verse-card/links";
import { ReferencePanel } from "./ReferencePanel";
import { plural } from "@/lib/site-format";

interface Props {
  translation: Translation;
  bookCode: string;
  chapter: string;
  label: string;
  onClose: () => void;
}

type Ref = [number, number, number];
const refKey = ([start, end]: Ref) => `${start}-${end}`;

/** The selected verse: its open cross-references (strongest first) and the verse in every version. */
export function VersePanel({ translation, bookCode, chapter, label, onClose }: Props) {
  const catalog = useCatalog();
  const heading = useRef<HTMLHeadingElement>(null);
  const [compare, setCompare] = useState(false);
  const verse = Number(/^\d+/.exec(label)?.[0] ?? NaN);
  const lastVerse = Number(/-(\d+)/.exec(label)?.[1] ?? verse);
  const inCanon = (catalog.books.find((b) => b.code === bookCode)?.num ?? 99) <= 66;
  // The open cross-references are numbered the KJV way; in other numbering systems a lookup by this
  // version's chapter:verse would show some other verse's links.
  const kjvNumbering = translation.numbering === "english";
  const refs = useAsync<CrossRefBook>(
    () => (inCanon && kjvNumbering ? loadCrossRefs(bookCode, chapter).catch(() => ({})) : Promise.resolve({})),
    `xref:${bookCode}:${chapter}:${kjvNumbering}`,
  );
  const list = useMemo(() => {
    if (refs.status !== "ready") return [];
    const all: Ref[] = [];
    for (let v = verse; v <= lastVerse; v++) all.push(...(refs.value[`${chapter}:${v}`] ?? []));
    return all.sort((a, b) => b[2] - a[2]);
  }, [refs, chapter, verse, lastVerse]);
  const bookName = catalog.books.find((b) => b.code === bookCode)?.name ?? bookCode;
  // A verse card always quotes the Berean, so it is offered only where the verse numbers match it (design 7.1).
  const cardHref = inCanon && kjvNumbering ? verseCardPath(catalog.books.find((b) => b.code === bookCode)?.num ?? 0, Number(chapter), verse, lastVerse) : null;

  useEffect(() => {
    heading.current?.focus();
  }, [bookCode, chapter, label]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <ReferencePanel
      labelledBy="verse-panel-title"
      scrollLabel={`Cross-references for ${bookName} ${chapter}:${label}`}
      header={
        <>
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
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2"
          >
            <Layers className="h-4 w-4 text-accent" aria-hidden /> {compare ? "Hide this verse in every version" : "Show this verse in every version"}
          </button>
          {cardHref && (
            <Link to={cardHref} className="mb-2 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2">
              <ImageIcon className="h-4 w-4 text-accent" aria-hidden /> {translation.slug === "bsb" ? "Make a verse card" : "Make a verse card (Berean)"}
            </Link>
          )}
        </>
      }
      footer={
        <p className="text-[11px] text-muted">
          {list.length ? "Ordered by OpenBible.info readers' votes (strongest first). Cross references from OpenBible.info, CC-BY." : "Ordered by OpenBible.info readers' votes (none here). Cross references from OpenBible.info, CC-BY."}
        </p>
      }
    >
      {compare && <EveryVersion current={translation} bookCode={bookCode} chapter={Number(chapter)} verse={verse} />}

      {/* Stays at the top of the scrolling list once the versions above it have scrolled away. */}
      <h3 className="sticky top-0 z-10 -mx-4 mb-1 flex items-center gap-2 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Link2 className="h-3.5 w-3.5" aria-hidden /> {list.length > 0 ? `Cross-references · ${formatNumber(list.length)}` : "Cross-references"}
      </h3>
      {!inCanon && <p className="text-sm text-muted">The open cross-reference set covers the 66 books only, not the Apocrypha.</p>}
      {inCanon && !kjvNumbering && (
        <p className="text-sm text-muted">
          {`The ${translation.abbr} numbers verses differently (${NUMBERING_LABEL[translation.numbering]}), but the cross-references are numbered like the KJV, so they are not shown here.`}{" "}
          <Link className="underline hover:text-ink" to={`/read/kjv/${bookCode}/${chapter}`}>
            Open this chapter in the KJV
          </Link>{" "}
          to see them.
        </p>
      )}
      {inCanon && refs.status === "loading" && <p className="animate-pulse text-sm text-muted">Loading…</p>}
      {inCanon && kjvNumbering && refs.status === "ready" && list.length === 0 && <p className="text-sm text-muted">No cross-references recorded for this verse.</p>}
      {/* Every cross-reference, drawn a window of rows at a time as the panel scrolls (owner's scroll rule, 2026-11-17);
          a row fetches its verse's words only when it is drawn. */}
      <WindowedRows as="ol" className="grid gap-2" items={list} itemKey={refKey} estimate={92}
        renderItem={([start, end, votes], row) => <CrossRef key={`${start}-${end}`} row={row} start={start} end={end} votes={votes} translation={translation} />} />
      <div className="h-4" aria-hidden />
    </ReferencePanel>
  );
}

function CrossRef({ row, start, end, votes, translation }: { row: number; start: number; end: number; votes: number; translation: Translation }) {
  const catalog = useCatalog();
  const { num, chapter, verse } = splitId(start);
  const book = bookByNum(catalog, num);
  const code = book?.code ?? "GEN";
  const version = translation.books[code] ? translation : catalog.translations.find((t) => t.slug === "kjv");
  const slug = version?.slug ?? "kjv";
  const { loading, text } = useVerseText(version, code, chapter, verse);
  return (
    <li data-row={row}>
      <Link
        to={`/read/${slug}/${code}/${chapter}?v=${verse}`}
        className="block rounded-lg border border-line/70 p-2.5 transition hover:border-line hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SectionDot id={sectionOfNum(catalog, num)} />
          {formatRange(catalog, start, end)}
          <span className="ms-auto text-[11px] font-normal text-muted" title="OpenBible.info votes">
            {votes} {plural(votes, "vote", "votes")}
          </span>
        </span>
        <span className="mt-1 line-clamp-3 block font-serif text-[0.92rem] leading-snug text-ink/85" lang={slug === translation.slug ? translation.lang : "en"} dir={slug === translation.slug ? translation.dir : "ltr"}>
          {loading ? "…" : text ?? "(not in this version)"}
          {slug !== translation.slug && <span className="ms-1 font-sans text-[10px] text-muted">KJV</span>}
        </span>
      </Link>
    </li>
  );
}

type VersionRow = { t: Translation; code: string };
const versionKey = ({ t }: VersionRow) => t.slug;

function EveryVersion({ current, bookCode, chapter, verse }: { current: Translation; bookCode: string; chapter: number; verse: number }) {
  const catalog = useCatalog();
  // A version without this book may carry its Greek twin (Brenton's DAG for Daniel, ESG for Esther).
  const twin = catalog.equivalent[bookCode];
  const versions = catalog.translations
    .map((t) => ({ t, code: t.books[bookCode] ? bookCode : twin && t.books[twin] ? twin : null }))
    .filter((v): v is VersionRow => v.code !== null);
  // The main groups first, then every other language. Each line fetches a file, so the list is drawn a window of rows
  // at a time as the panel scrolls and a line fetches only when drawn: no "Show more" (owner's scroll rule, 2026-11-17).
  const main = (t: Translation) => t.slug === current.slug || VERSION_GROUPS.some((group) => group.langs.includes(t.lang));
  const ordered = [...versions.filter(({ t }) => main(t)), ...versions.filter(({ t }) => !main(t))];
  return (
    <WindowedRows as="ul" className="mb-5" items={ordered} itemKey={versionKey} estimate={64} dataVersion={`${current.slug}|${bookCode}|${chapter}|${verse}`}
      renderItem={({ t, code }, row, index) => <VersionLine key={t.slug} row={row} first={index === 0} translation={t} bookCode={code} chapter={chapter} verse={verse} />} />
  );
}

function VersionLine({ row, first, translation, bookCode, chapter, verse }: { row: number; first: boolean; translation: Translation; bookCode: string; chapter: number; verse: number }) {
  const { loading, text } = useVerseText(translation, bookCode, chapter, verse);
  return (
    <li data-row={row} className={first ? "pb-3 text-sm" : "border-t border-line py-3 text-sm"}>
      <span className="me-1.5 font-semibold text-accent" title={`${translation.name} (${translation.year})`}>
        {translation.abbr}
      </span>
      <span lang={translation.lang} dir={translation.dir} className={translation.lang === "he" ? "font-hebrew text-base" : "font-serif"}>
        {loading ? "…" : text ?? "—"}
      </span>
      {translation.numbering !== "english" && (
        <span className="ms-1.5 text-[10px] text-muted" title="This version numbers verses differently, so this may be a neighbouring verse">
          {`${NUMBERING_LABEL[translation.numbering]} numbering`}
        </span>
      )}
    </li>
  );
}
