// The round's Scripture panel (owner, 2026-11-12): beside the map on a wide screen, under it on a narrower one, every
// verse that names the place, in Bible order, each with its reference (opening the reader in a new tab, so the game
// is kept). It is there while the player looks, so the verses double as clues and as a way to learn them. The lists
// come from src/data/map-quest/verses.json (scripts/build-map-quest.py), loaded with the first round; a long list
// (Jerusalem has over 900) draws only the rows near the panel's own scroll position (the site's useRowWindow).
import { ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import { useAsync } from "@/lib/useAsync";
import { useRowWindow } from "@/lib/useRowWindow";
import { useReaderHref } from "./reader-href";

type VerseLists = Record<string, number[]>;
const loadVerseLists = () => import("@/data/map-quest/verses.json").then((module) => module.default as VerseLists);

export function ScripturePanel({ placeId }: { placeId: string }) {
  const lists = useAsync(loadVerseLists, "map-quest-verses");
  const verses = lists.status === "ready" ? lists.value[placeId] ?? [] : null;
  return <aside className="mq-scripture" aria-labelledby="mq-scripture-title">
    <div className="mq-scripture-box">
      <header className="mq-scripture-head">
        <h3 id="mq-scripture-title" className="mq-scripture-title">Where Scripture names it</h3>
        {verses && <p className="mq-scripture-count">{plural(verses.length, "{n} verse", "{n} verses")}</p>}
      </header>
      {lists.status === "error" && <p className="mq-scripture-note">The verses could not be loaded. The game plays on without them.</p>}
      {lists.status === "loading" && <p className="mq-scripture-note" aria-busy="true">Loading the verses…</p>}
      {verses && <VerseRows key={placeId} verses={verses} />}
    </div>
  </aside>;
}

function VerseRows({ verses }: { verses: readonly number[] }) {
  const catalog = useCatalog();
  const href = useReaderHref();
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const keys = useMemo(() => verses.map(String), [verses]);
  const rowOf = useMemo(() => new Map(keys.map((key, i) => [key, i])), [keys]);
  const rowKey = useCallback((i: number) => keys[i], [keys]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: verses.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: 92, gap: 0,
    scroller, container, dataVersion: keys.join(",") });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k).filter((i) => i < verses.length);
  return <div ref={setScroller} className="mq-scripture-scroll" tabIndex={0} aria-label="Verses that name this place">
    <ol ref={setContainer} className="mq-scripture-rows" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((i) => <li key={keys[i]} data-row={i} className="mq-scripture-row" aria-posinset={i + 1} aria-setsize={verses.length}>
        <a className="mq-scripture-ref" href={href(verses[i])} target="_blank" rel="noopener noreferrer">
          <span>{formatRange(catalog, verses[i], verses[i])}</span><ExternalLink size={12} aria-hidden="true" />
        </a>
        <Verse id={verses[i]} className="mq-scripture-text" />
      </li>)}
    </ol>
  </div>;
}
