// 01 · The whole Bible: all 1,189 chapters on one canvas, each lit by how many of our teachers' works take it as a
// main text. Chips repaint it with a wave that runs Genesis → Revelation; hover (or tap) a chapter for who, how many,
// and the titles, each linking to the work itself (approved mock-up: design/authors-directions/teachers/bible.js).
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThemeVersion } from "@/lib/theme";
import { SectionHead } from "../shared/Frame";
import { formatNumber } from "../shared/people";
import { usePreachers } from "./context";
import { ChapterCanvas } from "./bible/chapter-canvas";
import { SECTION_LABEL, buildBibleModel, readHref, targetsFor } from "./bible/model";
import { ChapterPanel, Summary } from "./bible/Panels";
import { centreInStrip } from "./bible/words";
import "./bible.css";

const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;
const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function WholeBible() {
  const { data, openProfile } = usePreachers();
  const model = useMemo(() => buildBibleModel(data), [data]);
  const narrow = useMediaQuery("(max-width: 899px)");
  const themeVersion = useThemeVersion();
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  const [hovered, setHovered] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const [sheetCell, setSheetCell] = useState(-1); // what the phone sheet shows, kept while it slides away
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
    let lastWidth = Math.floor(box.clientWidth);
    let live = true;
    map.layout(lastWidth || 800);
    map.draw();
    const resize = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      if (!width || width === lastWidth) return;
      lastWidth = width; map.layout(width); map.draw();
    });
    resize.observe(box);
    document.fonts.ready.then(() => { if (live && lastWidth) { map.layout(lastWidth); map.draw(); } }, (error: unknown) => console.warn("The whole Bible: fonts did not report ready", error));
    const firstLight = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      firstLight.disconnect();
      litRef.current = true;
      map.repaint(targetsFor(model.cells, viewRef.current));
    }, { threshold: 0.15 });
    firstLight.observe(box);
    return () => { live = false; resize.disconnect(); firstLight.disconnect(); map.stop(); mapRef.current = null; };
  }, [model]);

  useEffect(() => {
    viewRef.current = view;
    if (litRef.current) mapRef.current?.repaint(targetsFor(model.cells, view));
  }, [view, model]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setHighlight(hovered, pinned);
    map.draw();
  }, [hovered, pinned]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !themeVersion) return;
    map.resetPalette();
    map.draw();
  }, [themeVersion]);

  const pin = useCallback((i: number) => {
    setPinned(i); setExpanded(false); setHovered(-1);
    if (i >= 0) setSheetCell(i);
  }, []);

  // Phone: Escape closes the chapter sheet; the sheet is out of the tab order while it is away.
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
  function onPointerLeave() { pendingMove.current = null; setHovered(-1); }
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
    if (event.key === "Enter" && pinned >= 0) { navigate(readHref(model.books, model.cells[pinned])); return; }
    pin(Math.max(0, Math.min(model.cells.length - 1, (pinned < 0 ? -1 : pinned) + (move ?? 1))));
  }
  function choose(id: string, chip: HTMLElement) {
    litRef.current = true;
    setView(id);
    centreInStrip(chip);
  }

  const open = (id: string, origin: Element) => openProfile(id, origin);
  const shownCell = hovered >= 0 ? hovered : pinned;
  const summary = <Summary key={`summary-${view}`} model={model} view={view} narrow={narrow} onOpen={open} onPin={pin} />;
  const chapter = (i: number, closable: boolean) => <ChapterPanel key={`cell-${i}-${expanded}`} model={model} cell={model.cells[i]} view={view} closable={closable}
    expanded={expanded} onOpen={open} onClose={() => pin(-1)} onExpand={() => setExpanded(true)} />;

  return <div className="bib" style={tone("--accent")}>
    <SectionHead num="01" kicker="The whole Bible" title={<>Every chapter, lit by our <em>teachers</em></>}
      line={`All ${formatNumber(model.cells.length)} chapters of the Bible, each lit by how many of our teachers' works take it as their main text. Choose a teacher to see the chapters they gave their work to.`} />
    <div className="bib-bar">
      <p className="kicker">Light up the Bible for</p>
      <div className="bib-chips">{model.views.map((v) =>
        <button key={v.id} type="button" className="bib-chip" aria-pressed={v.id === view} style={tone(v.tone)} onClick={(e) => choose(v.id, e.currentTarget)}>
          <i className="bib-dot" />{v.label}<b>{formatNumber(v.chapters)}</b></button>)}</div>
    </div>
    <div className="bib-grid">
      <div className="bib-card">
        <div className="bib-key"><p>One square is one chapter, Genesis to Revelation, reading down each column. The brighter it is, the more works take that chapter as their main text.</p>
          <span className="bib-scale" aria-hidden="true">fewer<i /><i /><i /><i /><i />more</span></div>
        <div className="bib-canvas-box" ref={boxRef}>
          <canvas ref={canvasRef} tabIndex={0} aria-label="Chapter map of the Bible. Use the arrow keys to move between chapters, Enter to read one."
            onPointerDown={(e) => { pointerRef.current = e.pointerType; }} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} onClick={onClick} onKeyDown={onKeyDown} />
        </div>
        <div className="bib-legend">{Object.entries(SECTION_LABEL).map(([key, label]) => <span key={key}><i style={{ background: `var(--${key})` }} />{label}</span>)}
          <span className="bib-legend-quiet"><i />No work yet</span></div>
      </div>
      <aside className="bib-detail slim-scroll" aria-live="polite">
        {narrow || shownCell < 0 ? summary : chapter(shownCell, pinned >= 0 && hovered < 0)}
      </aside>
    </div>
    <div ref={sheetRef} className={`bib-sheet slim-scroll${sheetOpen ? " bib-open" : ""}`} role="dialog" aria-label="Chapter">
      {narrow && sheetCell >= 0 && chapter(sheetCell, true)}
    </div>
  </div>;
}
