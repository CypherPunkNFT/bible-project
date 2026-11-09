// My verses (design §10.5): every passage the player chose to learn, with its box, when it is next due, and on
// tapping, the passage itself, Practise now and Remove. Rows are windowed with the site's useRowWindow: about 50 rows
// drawn above and below the screen, no "load more" button. Verse text loads only for an opened row.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Catalog } from "@/lib/types";
import { useRowWindow } from "@/lib/useRowWindow";
import { formatDate, formatNumber } from "@/lib/site-format";
import { verseReference } from "@/lib/verses";
import { isDue, type Progress } from "./boxes";
import { passageText } from "./load";
import { compareIds, type Passage } from "./model";
import { boxLabel } from "./text";

type Filter = "all" | "due" | "memorised";
type Sort = "due" | "box" | "bible";
const DAY_MS = 86_400_000;

/** A passage's words, loaded when shown. */
export function PassageWords({ catalog, passage }: { catalog: Catalog; passage: Passage }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    passageText(catalog, passage).then((value) => { if (live) setText(value); }).catch((error) => {
      console.warn(`Verse completion: ${passage.id} could not load:`, error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [catalog, passage]);
  return <p className="vc-verse is-small">{failed ? "This verse couldn't load." : text ?? "Loading the verse…"}</p>;
}

/** "Due today", or the date, written with the site's date formatter (local calendar day numbers are UTC dates). */
const dueText = (progress: Progress, today: number) =>
  progress.due <= today ? "Due today" : `Due ${formatDate(progress.due * DAY_MS, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}`;

interface MyVersesProps {
  catalog: Catalog;
  pool: ReadonlyMap<string, Passage>;
  passages: Readonly<Record<string, Progress>>;
  today: number;
  onReview: () => void;
  onPractise: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
}

export function MyVerses(props: MyVersesProps) {
  const { pool, passages, today } = props;
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("due");
  const [open, setOpen] = useState<string | null>(null);
  const mine = useMemo(() => Object.entries(passages).filter(([, progress]) => progress.box > 0), [passages]);
  const due = mine.filter(([, progress]) => isDue(progress, today)).length;
  const memorised = mine.filter(([, progress]) => progress.memorised).length;
  const rows = useMemo(() => mine
    .filter(([, progress]) => filter === "all" || (filter === "due" ? isDue(progress, today) : progress.memorised))
    .sort(([a, x], [b, y]) => sort === "due" ? x.due - y.due || compareIds(a, b) : sort === "box" ? y.box - x.box || x.due - y.due
      : (pool.get(a)?.from ?? 0) - (pool.get(b)?.from ?? 0)), [mine, filter, sort, today, pool]);

  return <div className="vc-mine">
    <button type="button" className="vc-link" onClick={props.onBack}>Game home</button>
    <h1>My verses</h1>
    <p className="vc-note">{`Verses: ${mine.length} · due: ${due} · memorised: ${memorised}`}</p>
    {due > 0 && <button type="button" className="vc-primary" onClick={props.onReview}>Review due verses</button>}
    {mine.length === 0 ? <p className="vc-note">No verses yet. Tap Add to My verses after any verse to start learning it.</p> : <>
      <div className="vc-tools">
        <label>Show <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
          <option value="all">All</option><option value="due">Due</option><option value="memorised">Memorised</option>
        </select></label>
        <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
          <option value="due">Due first</option><option value="box">By box</option><option value="bible">Bible order</option>
        </select></label>
      </div>
      <Rows {...props} rows={rows} open={open} onOpen={(id) => setOpen(open === id ? null : id)} version={`${filter}|${sort}|${rows.length}|${open}`} />
    </>}
    <button type="button" className="vc-link vc-clear" onClick={() => { if (window.confirm("Clear all your Verse completion progress in this browser?")) props.onClear(); }}>Clear my progress</button>
  </div>;
}

function Rows(props: MyVersesProps & { rows: [string, Progress][]; open: string | null; onOpen: (id: string) => void; version: string }) {
  const { rows } = props;
  const [container, setContainer] = useState<HTMLUListElement | null>(null);
  const rowOf = useMemo(() => new Map(rows.map(([id], i) => [id, i])), [rows]);
  const rowKey = useCallback((i: number) => `${rows[i][0]}${rows[i][0] === props.open ? ":open" : ""}`, [rows, props.open]);
  const anchorKey = useCallback((i: number) => rows[i][0], [rows]);
  const rowOfAnchor = useCallback((id: string) => rowOf.get(id), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey, rowOfAnchor, estimate: 64, gap: 0,
    scroller: "window", container, dataVersion: props.version });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k);
  return <ul ref={setContainer} className="vc-rows" role="list" style={{ paddingTop: before, paddingBottom: after }}>
    {drawn.map((i) => {
      const [id, progress] = rows[i];
      const passage = props.pool.get(id);
      if (!passage) return null;
      const opened = props.open === id;
      return <li key={id} data-row={i} className="vc-row is-mine" aria-posinset={i + 1} aria-setsize={rows.length}>
        <button type="button" className="vc-row-head" aria-expanded={opened} onClick={() => props.onOpen(id)}>
          <span className="vc-row-ref">{verseReference(props.catalog, passage.from, passage.to)}</span>
          <span className="vc-meter" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= progress.box ? "is-on" : ""} />)}</span>
          <span className="vc-row-box">{progress.memorised ? "Memorised" : `Box ${progress.box} of 5 · ${boxLabel(progress.box)}`}</span>
          <span className="vc-row-due">{dueText(progress, props.today)}</span>
        </button>
        {opened && <div className="vc-row-body">
          {passage.retired && <p className="vc-note">No longer in the game.</p>}
          <PassageWords catalog={props.catalog} passage={passage} />
          <p className="vc-note">{`Best: ${formatNumber(progress.best / 100, { style: "percent" })}`}</p>
          <div className="vc-actions">
            {!passage.retired && <button type="button" className="vc-secondary" onClick={() => props.onPractise(id)}>Practise now</button>}
            <button type="button" className="vc-link" onClick={() => props.onRemove(id)}>Remove from My verses</button>
          </div>
        </div>}
      </li>;
    })}
  </ul>;
}
