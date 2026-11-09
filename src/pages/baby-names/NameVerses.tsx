// Verses on a name page, quoted from the Berean Standard Bible (design 4.1 items 7-8). The files hold verse ids only;
// the words come from the Bible files the site already serves. Lists of up to WHOLE_LIST verses render whole through
// useVerses; longer ones (David has about 1,100) are drawn a window at a time (src/lib/useRowWindow.ts), each row's
// words fetched with its chapter through loadChapterPlain as it comes near the screen, never whole books at once.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadChapterPlain } from "@/lib/data";
import { bookByNum, formatRange, plainLookup, splitId } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { useRowWindow } from "@/lib/useRowWindow";
import { findBible, useVerses } from "@/lib/verses";

export const BIBLE = "bsb";
export const WHOLE_LIST = 100;
const ROW_ESTIMATE = 88;

/** The reader at this verse, shaded: /read/bsb/1SA/1?hl=2. */
function readerHref(catalog: Catalog, id: number): string {
  const { num, chapter, verse } = splitId(id);
  return `/read/${BIBLE}/${bookByNum(catalog, num)?.code ?? num}/${chapter}?hl=${verse}`;
}

function VerseLine({ id, text, failed }: { id: number; text: string | null | undefined; failed?: boolean }) {
  const catalog = useCatalog();
  return (
    <>
      <Link to={readerHref(catalog, id)} className="bn-ref">{formatRange(catalog, id, id)}</Link>
      {text ? <span className="scripture bn-verse-text" lang="en" translate="no">{text}</span>
        : <span className="bn-verse-missing">{failed ? "The words of this verse could not be loaded." : text === null ? "Not numbered in this Bible." : "Loading…"}</span>}
    </>
  );
}

/** A few verses in full (a bearer's key verses, a naming verse): always a short list, so read whole. */
export function QuotedVerses({ ids, className = "bn-quoted" }: { ids: readonly number[]; className?: string }) {
  const state = useVerses({ ids }, { bible: BIBLE });
  if (!ids.length) return null;
  const texts = state.status === "ready" ? new Map(state.value.verses.map((verse) => [verse.id, verse.text])) : null;
  return (
    <ul className={className} role="list">
      {ids.map((id) => <li key={id}><VerseLine id={id} text={texts ? texts.get(id) ?? null : undefined} failed={state.status === "error"} /></li>)}
    </ul>
  );
}

/** "Every verse that names Hannah": every reference, in Bible order. */
export function EveryVerse({ ids }: { ids: readonly number[] }) {
  return ids.length <= WHOLE_LIST ? <QuotedVerses ids={ids} className="bn-verses" /> : <WindowedVerses ids={ids} />;
}

/** The chapters ("BOOK:chapter") a run of verse ids falls in, in order, without repeats. */
function chaptersOf(catalog: Catalog, ids: readonly number[]): { key: string; code: string; chapter: number }[] {
  const seen = new Map<string, { key: string; code: string; chapter: number }>();
  for (const id of ids) {
    const { num, chapter } = splitId(id);
    const code = bookByNum(catalog, num)?.code;
    if (code && !seen.has(`${code}:${chapter}`)) seen.set(`${code}:${chapter}`, { key: `${code}:${chapter}`, code, chapter });
  }
  return [...seen.values()];
}

function WindowedVerses({ ids }: { ids: readonly number[] }) {
  const catalog = useCatalog();
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const [texts, setTexts] = useState<Map<number, string | null>>(() => new Map());
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const rowOf = useMemo(() => new Map(ids.map((id, i) => [String(id), i])), [ids]);
  const rowKey = useCallback((i: number) => String(ids[i]), [ids]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: ids.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: ids });
  const drawn = useMemo(() => ids.slice(start, end + 1), [ids, start, end]);

  useEffect(() => {
    const bible = findBible(catalog, BIBLE);
    let live = true;
    const wanted = chaptersOf(catalog, drawn.filter((id) => !texts.has(id))).filter((item) => !failed.has(item.key));
    for (const { key, code, chapter } of wanted) {
      loadChapterPlain(BIBLE, code, bible.books[code] ?? [], String(chapter)).then((plain) => {
        if (!live) return;
        setTexts((previous) => {
          const next = new Map(previous);
          for (const id of ids) {
            const parts = splitId(id);
            if (parts.chapter === chapter && bookByNum(catalog, parts.num)?.code === code) next.set(id, plainLookup(plain, chapter, parts.verse) ?? null);
          }
          return next;
        });
      }, (error: unknown) => {
        console.error(`baby-names: the words of ${key} could not be loaded`, error);
        if (live) setFailed((previous) => new Set(previous).add(key));
      });
    }
    return () => { live = false; };
  }, [catalog, drawn, ids, texts, failed]);

  const failedId = (id: number) => { const { num, chapter } = splitId(id); return failed.has(`${bookByNum(catalog, num)?.code}:${chapter}`); };
  return (
    <ol ref={setContainer} className="bn-verses" role="list" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((id, k) => <li key={id} data-row={start + k}><VerseLine id={id} text={texts.get(id)} failed={failedId(id)} /></li>)}
    </ol>
  );
}
