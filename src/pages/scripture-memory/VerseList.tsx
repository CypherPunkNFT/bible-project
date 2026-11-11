// Scripture memory: my verses (design §6, shelf 03), newest first. Rows are windowed with the site's useRowWindow: about
// 50 rows drawn above and below the screen and the rest drawn as the reader scrolls, no "load more" button. A row opens
// its passage in Practise; no verse text is loaded for the list.
import { useCallback, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { plural } from "@/lib/site-format";
import { useRowWindow } from "@/lib/useRowWindow";
import { verseReference } from "@/lib/verses";
import { stepLabel } from "./steps";
import { doneToday, isKnown, verseKey, type MemoryVerse } from "./progress";

interface VerseListProps {
  verses: readonly MemoryVerse[];
  openKey: string | null;
  day: number;
  onOpen: (key: string) => void;
}

const rowState = (verse: MemoryVerse, day: number): string =>
  doneToday(verse, day) ? "Done today" : isKnown(verse) ? "Say it now and then" : "Ready for today's step";

export function VerseList({ verses, openKey, day, onOpen }: VerseListProps) {
  const catalog = useCatalog();
  const known = verses.filter(isKnown).length;
  const ready = verses.filter((verse) => !isKnown(verse) && !doneToday(verse, day)).length;
  if (verses.length === 0) return <p className="sm-quiet">No verses yet. Choose one above to start.</p>;
  return <>
    <ul className="sm-counts" role="list">
      <li>{plural(verses.length, "{n} verse in your list.", "{n} verses in your list.")}</li>
      <li>{plural(known, "{n} known by heart.", "{n} known by heart.")}</li>
      <li>{plural(ready, "{n} ready for today's step.", "{n} ready for today's step.")}</li>
    </ul>
    <Rows verses={verses} openKey={openKey} day={day} onOpen={onOpen} reference={(verse) => verseReference(catalog, verse.from, verse.to)} />
  </>;
}

function Rows({ verses, openKey, day, onOpen, reference }: VerseListProps & { reference: (verse: MemoryVerse) => string }) {
  const [container, setContainer] = useState<HTMLUListElement | null>(null);
  const keys = useMemo(() => verses.map(verseKey), [verses]);
  const rowOf = useMemo(() => new Map(keys.map((key, i) => [key, i])), [keys]);
  const rowKey = useCallback((i: number) => keys[i], [keys]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: verses.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: 56, gap: 0,
    scroller: "window", container, dataVersion: `${keys.join(",")}|${openKey}|${day}` });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k).filter((i) => i < verses.length);
  return <ul ref={setContainer} className="sm-rows" role="list" style={{ paddingTop: before, paddingBottom: after }}>
    {drawn.map((i) => {
      const verse = verses[i];
      const key = keys[i];
      return <li key={key} data-row={i} className="sm-row" aria-posinset={i + 1} aria-setsize={verses.length}>
        <button type="button" className="sm-row-head" aria-current={key === openKey ? "true" : undefined} onClick={() => onOpen(key)}>
          <span className="sm-row-ref">{reference(verse)}</span>
          <span className="sm-meter" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((n) => <span key={n} className={n < verse.stage ? "is-on" : ""} />)}</span>
          <span className="sm-row-step">{stepLabel(verse.stage)}</span>
          <span className="sm-row-state">{rowState(verse, day)}</span>
        </button>
      </li>;
    })}
  </ul>;
}
