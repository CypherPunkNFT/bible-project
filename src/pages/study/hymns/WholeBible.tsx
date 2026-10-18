// 01 · Every chapter, sung in our hymns. The Preachers page's "every chapter, lit by our teachers" map with hymns in place
// of teachers' works: one square per chapter, lit by how many hymns take it as their text; chips choose a hymn book.
// The side panel shows what was clicked, never what the pointer passes over (owner, 2026-10-17): moving to the panel
// to click a hymn must not change it. Pointing only outlines the square
// (approved mock-up: design/hymn-directions/collection/bible.js).
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, X } from "lucide-react";
import { OutsideScroll } from "@/components/OutsideScroll";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThemeVersion } from "@/lib/theme";
import { bookIndexOf, chapterOf, hymnHref, type HymnCollection, type HymnEntry, type HymnGroup } from "@/lib/hymns";
import { SectionHead } from "@/pages/teachers/shared/Frame";
import { ChapterCanvas } from "@/pages/teachers/preachers/bible/chapter-canvas";
import { SECTION_LABEL, type Cell } from "@/pages/teachers/preachers/bible/model";
import { centreInStrip } from "@/pages/teachers/preachers/bible/words";
import { chapterLabel, formatNumber, groupsById, plural, tone } from "./model";
import "@/pages/teachers/preachers/bible.css";

const SHOWN_TITLES = 8;
const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
interface View { id: string; label: string; chapters: number; tone: string; group?: HymnGroup }

function buildModel(collection: HymnCollection) {
  const { books, groups, hymns } = collection;
  const cells: Cell[] = [];
  const index = new Map<string, Cell>();
  const onChapter = new Map<string, HymnEntry[]>();
  books.forEach((book, b) => book.chapters.forEach((verses, c) => {
    const cell: Cell = { i: cells.length, b, c: c + 1, key: `${b + 1}:${c + 1}`, verses, counts: {}, total: 0, voices: 0 };
    cells.push(cell); index.set(cell.key, cell);
  }));
  for (const h of hymns) {
    if (!h.v) continue;
    const cell = index.get(`${bookIndexOf(h.v) + 1}:${chapterOf(h.v)}`);
    if (!cell) throw new Error(`Hymns, the whole Bible: "${h.id}" is on ${h.r}, a chapter the Bible here does not have`);
    cell.counts[h.g] = (cell.counts[h.g] ?? 0) + 1; cell.total++;
    onChapter.set(cell.key, [...(onChapter.get(cell.key) ?? []), h]);
  }
  for (const cell of cells) cell.voices = Object.keys(cell.counts).length;
  const lit = (id: string) => cells.filter((c) => (id === "all" ? c.total : c.counts[id])).length;
  const views: View[] = [{ id: "all", label: "Every hymn", chapters: lit("all"), tone: "--accent" },
    ...groups.map((g) => ({ id: g.id, label: g.short, chapters: lit(g.id), tone: g.tone, group: g }))];
  return { books, cells, onChapter, views, onChapters: hymns.filter((h) => h.v).length };
}
type Model = ReturnType<typeof buildModel>;

const valueOf = (cell: Cell, view: string) => (view === "all" ? cell.total : cell.counts[view] ?? 0);
function targetsFor(cells: Cell[], view: string) {
  const max = Math.max(1, ...cells.map((c) => valueOf(c, view))), scale = Math.log(1 + max);
  return Float32Array.from(cells, (c) => { const v = valueOf(c, view); return v ? 0.42 + 0.58 * (Math.log(1 + v) / scale) : 0; });
}
const nameOf = (model: Model, cell: Cell) => chapterLabel(model.books[cell.b], cell.c);
const readHref = (model: Model, cell: Cell) => `/read/kjv/${model.books[cell.b].code}/${cell.c}`;

function Summary({ model, view, narrow, onPin }: { model: Model; view: string; narrow: boolean; onPin: (i: number) => void }) {
  const meta = model.views.find((v) => v.id === view) ?? model.views[0];
  const lit = model.cells.filter((c) => valueOf(c, view));
  const sung = lit.reduce((sum, c) => sum + valueOf(c, view), 0);
  const top = [...lit].sort((a, b) => valueOf(b, view) - valueOf(a, view) || a.i - b.i).slice(0, 6);
  const psalms = model.cells.filter((c) => model.books[c.b].code === "PSA").reduce((s, c) => s + c.total, 0);
  return <div className="bib-inner" style={tone(meta.tone)}>
    <p className="kicker">{meta.group ? "One hymn book" : "Every hymn with its words held"}</p>
    <h3>{meta.group ? meta.group.label : "Every hymn"}</h3>
    <p className="bib-big"><b>{formatNumber(lit.length)}</b> chapters · <b>{formatNumber(sung)}</b> {sung === 1 ? "hymn" : "hymns"}</p>
    <p className="bib-note">{meta.group
      ? `${meta.group.label}, ${meta.group.year}. ${meta.group.who}.`
      : `Watts set nearly every psalm, so the Psalms hold ${formatNumber(psalms)} of these ${formatNumber(model.onChapters)} hymns and are the brightest block. Choose a book to see its own map.`}</p>
    <p className="bib-mini">Most sung chapters</p>
    <ol className="bib-top">{top.map((c) => <li key={c.i}><button type="button" onClick={() => onPin(c.i)}><span>{nameOf(model, c)}</span><b>{valueOf(c, view)}</b></button></li>)}</ol>
    <p className="bib-hint">{narrow ? "Tap a square" : "Click a square"} to see the hymns on that chapter and open one.</p>
  </div>;
}

function ChapterPanel({ model, cell, view, groups, expanded, onClose, onExpand }:
  { model: Model; cell: Cell; view: string; groups: Map<string, HymnGroup>; expanded: boolean; onClose: () => void; onExpand: () => void }) {
  const section = model.books[cell.b].section;
  const entries = Object.entries(cell.counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  const list = (model.onChapter.get(cell.key) ?? []).filter((h) => view === "all" || h.g === view);
  const shown = expanded ? list : list.slice(0, SHOWN_TITLES);
  const name = nameOf(model, cell);
  return <div className="bib-inner" style={tone(`--${section}`)}>
    <div className="bib-top-row"><p className="kicker">{SECTION_LABEL[section]}</p>
      <button type="button" className="bib-icon-btn" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={1.5} aria-hidden /></button></div>
    <h3>{name}<small>{cell.verses} verses</small></h3>
    <p className="bib-note">{cell.total
      ? `${plural(cell.total, "hymn")} ${cell.total === 1 ? "takes" : "take"} this chapter as ${cell.total === 1 ? "its" : "their"} text.`
      : "No hymn whose words we hold takes this chapter as its text."}</p>
    {entries.length > 0 && <ul className="bib-bars">{entries.map(([id, count]) => {
      const g = groups.get(id);
      if (!g) throw new Error(`Hymns, the whole Bible: ${name} counts hymn book "${id}", which the collection does not list`);
      return <li key={id} className={view === "all" || view === id ? "" : "bib-faded"} style={tone(g.tone)}>
        <span className="bib-name">{g.short}</span><span className="bib-vbar"><i style={{ width: `${Math.max(4, (count / max) * 100).toFixed(1)}%` }} /></span><b>{count}</b></li>;
    })}</ul>}
    {shown.length > 0 && <><p className="bib-mini">Open a hymn</p>
      <ul className="bib-titles">{shown.map((h) => <li key={h.id}><Link className="bib-work" to={hymnHref(h.id)}><span>{h.t}</span><ArrowRight size={13} strokeWidth={1.5} aria-hidden /></Link>
        <small>{h.r} · {groups.get(h.g)?.short} · {h.y}</small></li>)}</ul></>}
    {list.length > shown.length && <button type="button" className="bib-more" onClick={onExpand}>Show all {formatNumber(list.length)} hymns</button>}
    <Link className="bib-read" to={readHref(model, cell)}><BookOpen size={15} strokeWidth={1.5} aria-hidden />Read {name}<ArrowRight size={15} strokeWidth={1.5} aria-hidden /></Link>
  </div>;
}

export function WholeBible({ collection }: { collection: HymnCollection }) {
  const model = useMemo(() => buildModel(collection), [collection]);
  const groups = useMemo(() => groupsById(collection), [collection]);
  const narrow = useMediaQuery("(max-width: 899px)");
  const themeVersion = useThemeVersion();
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  const [hovered, setHovered] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const [sheetCell, setSheetCell] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ChapterCanvas | null>(null);
  const viewRef = useRef(view);
  const litRef = useRef(false);
  const pointerRef = useRef("mouse");
  const pendingMove = useRef<{ x: number; y: number } | null>(null);

  // The canvas: lay out to the box's width, relayout when it changes or the fonts arrive, and light up the first time
  // it scrolls into view (so the wave is seen rather than spent off-screen).
  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current;
    if (!canvas || !box) return;
    const map = new ChapterCanvas(canvas, model.books, model.cells);
    mapRef.current = map;
    let lastWidth = Math.floor(box.clientWidth), live = true;
    map.layout(lastWidth || 800); map.draw();
    const resize = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      if (!width || width === lastWidth) return;
      lastWidth = width; map.layout(width); map.draw();
    });
    resize.observe(box);
    document.fonts.ready.then(() => { if (live && lastWidth) { map.layout(lastWidth); map.draw(); } }, (error: unknown) => console.warn("Hymns, the whole Bible: fonts did not report ready", error));
    const firstLight = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      firstLight.disconnect(); litRef.current = true;
      map.repaint(targetsFor(model.cells, viewRef.current));
    }, { threshold: 0.15 });
    firstLight.observe(box);
    return () => { live = false; resize.disconnect(); firstLight.disconnect(); map.stop(); mapRef.current = null; };
  }, [model]);

  useEffect(() => { viewRef.current = view; if (litRef.current) mapRef.current?.repaint(targetsFor(model.cells, view)); }, [view, model]);
  useEffect(() => { const map = mapRef.current; if (map) { map.setHighlight(hovered, pinned); map.draw(); } }, [hovered, pinned]);
  useEffect(() => { const map = mapRef.current; if (map && themeVersion) { map.resetPalette(); map.draw(); } }, [themeVersion]);

  const pin = useCallback((i: number) => { setPinned(i); setExpanded(false); setHovered(-1); if (i >= 0) setSheetCell(i); }, []);
  useEffect(() => {
    if (!narrow || pinned < 0) return;
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") pin(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [narrow, pinned, pin]);
  const sheetOpen = narrow && pinned >= 0;
  useEffect(() => { if (sheetRef.current) sheetRef.current.inert = !sheetOpen; }, [sheetOpen]);

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType !== "mouse") return;
    const scheduled = pendingMove.current !== null;
    pendingMove.current = { x: event.clientX, y: event.clientY };
    if (scheduled) return;
    requestAnimationFrame(() => {
      const at = pendingMove.current, map = mapRef.current, canvas = canvasRef.current;
      pendingMove.current = null;
      if (!at || !map || !canvas) return;
      const i = map.cellAt(at.x, at.y, false);
      canvas.style.cursor = i >= 0 ? "pointer" : "default";
      setHovered(i);
    });
  }
  function onClick(event: { clientX: number; clientY: number }) {
    const map = mapRef.current;
    if (!map) return;
    const touch = pointerRef.current !== "mouse";
    const i = map.cellAt(event.clientX, event.clientY, touch);
    setPinned(i === pinned ? -1 : i);
    if (i >= 0 && i !== pinned) setSheetCell(i);
    setExpanded(false);
    if (narrow || touch) setHovered(-1);
  }
  function onKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const move = MOVES[event.key];
    if (!move && event.key !== "Enter") return;
    event.preventDefault();
    if (event.key === "Enter" && pinned >= 0) { navigate(readHref(model, model.cells[pinned])); return; }
    pin(Math.max(0, Math.min(model.cells.length - 1, (pinned < 0 ? -1 : pinned) + (move ?? 1))));
  }

  const summary = <Summary key={`summary-${view}`} model={model} view={view} narrow={narrow} onPin={pin} />;
  const chapter = (i: number) => <ChapterPanel key={`cell-${i}-${expanded}`} model={model} cell={model.cells[i]} view={view} groups={groups}
    expanded={expanded} onClose={() => pin(-1)} onExpand={() => setExpanded(true)} />;

  return <div className="bib" style={tone("--accent")}>
    <SectionHead num="01" kicker="The whole Bible" title={<>Every chapter, sung in our <em>hymns</em></>}
      line={`All ${formatNumber(model.cells.length)} chapters of the Bible, each lit by how many of our hymns take it as their text. Choose a hymn book to see the chapters it sang.`} />
    <div className="bib-bar">
      <p className="kicker">Light up the Bible for</p>
      <div className="bib-chips">{model.views.map((v) =>
        <button key={v.id} type="button" className="bib-chip" aria-pressed={v.id === view} style={tone(v.tone)} onClick={(e) => { litRef.current = true; setView(v.id); centreInStrip(e.currentTarget); }}>
          <i className="bib-dot" />{v.label}<b>{formatNumber(v.chapters)}</b></button>)}</div>
    </div>
    <div className="bib-grid">
      <div className="bib-card">
        <div className="bib-key"><p>One square is one chapter, Genesis to Revelation, reading down each column. The brighter it is, the more hymns take that chapter as their text.</p>
          <span className="bib-scale" aria-hidden="true">fewer<i /><i /><i /><i /><i />more</span></div>
        <div className="bib-canvas-box" ref={boxRef}>
          <canvas ref={canvasRef} tabIndex={0} aria-label="Chapter map of the Bible. Use the arrow keys to move between chapters, Enter to read one."
            onPointerDown={(e) => { pointerRef.current = e.pointerType; }} onPointerMove={onPointerMove} onPointerLeave={() => { pendingMove.current = null; setHovered(-1); }} onClick={onClick} onKeyDown={onKeyDown} />
        </div>
        <div className="bib-legend">{Object.entries(SECTION_LABEL).map(([key, label]) => <span key={key}><i style={{ background: `var(--${key})` }} />{label}</span>)}
          <span className="bib-legend-quiet"><i />No hymn yet</span></div>
      </div>
      <aside className={`bib-detail${narrow ? " slim-scroll" : ""}`} aria-live="polite" style={{ borderTop: `2px solid var(${pinned >= 0 && !narrow ? `--${model.books[model.cells[pinned].b].section}` : (model.views.find((v) => v.id === view)?.tone ?? "--accent")})` }}>
        {narrow ? summary : <OutsideScroll label="Chapter details" className="bib-detail-scroll" frameClassName="bib-detail-frame" viewportClassName="bib-detail-viewport" resetKey={`${view}-${pinned}`}>
          {pinned < 0 ? summary : chapter(pinned)}
        </OutsideScroll>}
      </aside>
    </div>
    <div ref={sheetRef} className={`bib-sheet slim-scroll${sheetOpen ? " bib-open" : ""}`} role="dialog" aria-label="Chapter">
      {narrow && sheetCell >= 0 && chapter(sheetCell)}
    </div>
  </div>;
}
