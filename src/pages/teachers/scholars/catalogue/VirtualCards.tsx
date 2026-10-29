// The catalogue's card view, drawn a window of rows at a time (owner, 2026-10-29): the rows on screen plus 50 above
// and 50 below, however many cards fit in a row at this width; rows further out are released and drawn again when
// the reader scrolls back (src/lib/useRowWindow.ts). The cards, the opened shelf and the grid look as before.
// A card that holds focus, or that the open profile grew from, stays drawn in its own place when its row is released,
// so focus is never dropped and the profile can shrink back into it.
import { useCallback, useLayoutEffect, useMemo, useState, type CSSProperties, type FocusEvent } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { gridRows, trackCount } from "@/lib/row-window";
import { useRowWindow } from "@/lib/useRowWindow";
import { FieldWorks } from "../FieldWorks";
import { Card } from "./Card";
import { LibraryCard } from "./LibraryCard";
import type { LibraryPerson } from "./library";

const ROW_ESTIMATE = 240;
const noop = () => {};

interface Props {
  people: LibraryPerson[]; data: ScholarsData; shelf: string | null; onShelf: (id: string | null) => void;
  onOpen: (id: string, origin: Element | null) => void; scroller: HTMLElement | null; profileOrigin: Element | null;
}

/** The grid item (a direct child of the grid) holding `el`, or null. */
function gridItem(grid: Element, el: EventTarget | null): Element | null {
  let node = el instanceof Element ? el : null;
  while (node && node.parentElement !== grid) node = node.parentElement;
  return node;
}

export function VirtualCards({ people, data, shelf, onShelf, onOpen, scroller, profileOrigin }: Props) {
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  const [tracks, setTracks] = useState({ columns: 1, gap: 16 });
  // Cards per row and the row gap, as the stylesheet lays them out at this width (one column and a smaller gap on phones).
  useLayoutEffect(() => {
    if (!grid) return;
    const read = () => {
      const style = getComputedStyle(grid);
      const next = { columns: trackCount(style.gridTemplateColumns), gap: parseFloat(style.rowGap) || 0 };
      setTracks(prev => prev.columns === next.columns && prev.gap === next.gap ? prev : next);
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [grid]);

  const rows = useMemo(() => gridRows(people, tracks.columns, p => p.id === shelf), [people, tracks.columns, shelf]);
  const index = useMemo(() => {
    const rowOf = new Map<string, number>(), byDomId = new Map<string, string>();
    rows.forEach((row, r) => row.forEach(p => { rowOf.set(p.id, r); byDomId.set(p.id !== shelf && p.scholar ? p.scholar.id : p.id, p.id); }));
    return { rowOf, byDomId };
  }, [rows, shelf]);
  const dataVersion = useMemo(() => [people, shelf], [people, shelf]);
  const rowKey = useCallback((r: number) => `${rows[r][0].id}|${rows[r][rows[r].length - 1].id}|${tracks.columns}`, [rows, tracks.columns]);
  const anchorKey = useCallback((r: number) => rows[r][0].id, [rows]);
  const rowOfAnchor = useCallback((key: string) => index.rowOf.get(key), [index]);
  const { start, end, before, after, offsetOf } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: tracks.gap, scroller, container: grid, dataVersion });

  const [focused, setFocused] = useState<string | null>(null);
  const idOf = (el: Element | null) => { const id = el?.getAttribute("data-id"); return id ? index.byDomId.get(id) ?? null : null; };
  const onFocus = (e: FocusEvent<HTMLDivElement>) => setFocused(idOf(gridItem(e.currentTarget, e.target)));
  const onBlur = (e: FocusEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(null); };
  const origin = grid && profileOrigin && grid.contains(profileOrigin) ? idOf(gridItem(grid, profileOrigin)) : null;
  const pinned = [...new Set([focused, origin].map(id => id ? index.rowOf.get(id) : undefined))]
    .filter((r): r is number => r !== undefined && (r < start || r > end)).sort((a, b) => a - b);

  const cardWidth = `calc((100% - ${(tracks.columns - 1) * tracks.gap}px) / ${tracks.columns})`;
  const place = (row: number, column: number, full: boolean): CSSProperties =>
    ({ position: "absolute", top: offsetOf(row), left: full ? 0 : `calc(${column} * (${cardWidth} + ${tracks.gap}px))`, width: full ? "100%" : cardWidth });
  const item = (p: LibraryPerson, row: number, column: number, pin: boolean) => {
    const full = p.id === shelf, style = pin ? place(row, column, full) : undefined;
    if (full) return <article className="cat-shelf" key={p.id} data-id={p.id} data-row={row} data-pinned={pin ? "" : undefined} style={style}>
      <div className="cat-shelf-heading"><h3>{p.name}</h3><button type="button" onClick={() => onShelf(null)}>Close works</button></div>
      <p>{p.roles.join(' · ')} · {p.records.toLocaleString()} associated records. Source records, editions and reading copies may overlap.</p>
      <p>{p.traditions.length ? `Recorded tradition: ${p.traditions.join(', ')}.` : 'Faith and tradition not recorded.'}</p>
      {p.sourceLifeDates.length > 0 && <p>Source date labels: {p.sourceLifeDates.join('; ')}.</p>}
      <FieldWorks key={p.id} entry={p} />
    </article>;
    return p.scholar ? <Card key={p.id} data={data} s={p.scholar} order={0} onOpen={onOpen} cardRef={noop} row={row} pinned={style} />
      : <LibraryCard key={p.id} person={p} data={data} onOpen={() => onShelf(p.id)} row={row} pinned={style} />;
  };
  const draw = (list: number[], pin: boolean) => list.flatMap(r => rows[r].map((p, column) => item(p, r, column, pin)));
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  // One flat list of keyed children, so a card moving between the drawn rows and a pinned place keeps its element
  // (and focus). Pinned rows go first or last, so Tab order still follows the catalogue's order.
  const children = [...draw(pinned.filter(r => r < start), true), ...draw(drawn, false), ...draw(pinned.filter(r => r > end), true)];
  return <div ref={setGrid} className="cat-grid" style={{ paddingTop: before, paddingBottom: after }} onFocus={onFocus} onBlur={onBlur}>{children}</div>;
}
