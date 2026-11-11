// The slides' previews in a grid, each with its own Save picture button. A long passage makes hundreds of slides, so
// only the rows near the screen are drawn: 50 rows above and 50 below what is visible (src/lib/row-window.ts), the rest
// held as space and drawn as they scroll into reach.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { rowOffsets, rowWindow, ROW_BUFFER, EMPTY_WINDOW, type RowWindow } from "@/lib/row-window";
import { drawSlide } from "./draw";
import type { SlideLayout } from "./layout";
import type { FontChoice, Theme } from "./templates";

const MIN_TILE = 260;
const GAP = 16;
/** The caption under each preview: the slide's number and reference, and its button. */
const CAPTION = 48;

export interface GridSlide { key: string; layout: SlideLayout; reference: string }

interface GridProps {
  slides: readonly GridSlide[];
  theme: Theme;
  font: FontChoice;
  width: number;
  height: number;
  /** Bumped when the fonts arrive, so every preview is drawn again in them. */
  drawKey: string;
  busy: boolean;
  onSave: (index: number) => void;
}

function Preview({ layout, theme, font, width, height, tile, drawKey, label }: { layout: SlideLayout; theme: Theme; font: FontChoice; width: number; height: number; tile: number; drawKey: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    element.width = Math.round(tile * scale);
    element.height = Math.round((tile * height / width) * scale);
    drawSlide(context, layout, theme, font, width, height, (tile * scale) / width);
  }, [layout, theme, font, width, height, tile, scale, drawKey]);
  return <canvas ref={canvas} className={`ws-preview${theme.fill.kind === "clear" ? " ws-preview-clear" : ""}`} style={{ width: tile, height: (tile * height) / width }} role="img" aria-label={label} />;
}

export function SlideGrid({ slides, theme, font, width, height, drawKey, busy, onSave }: GridProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [space, setSpace] = useState(0);
  const [view, setView] = useState({ top: 0, bottom: 0 });

  useLayoutEffect(() => {
    const element = holder.current;
    if (!element) return;
    const measure = () => {
      setSpace(element.clientWidth);
      const top = -element.getBoundingClientRect().top;
      setView({ top, bottom: top + window.innerHeight });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const columns = Math.max(1, Math.floor((space + GAP) / (MIN_TILE + GAP)));
  const tile = space ? (space - GAP * (columns - 1)) / columns : MIN_TILE;
  const rowCount = Math.ceil(slides.length / columns);
  const heights = useMemo(() => Array.from({ length: rowCount }, () => (tile * height) / width + CAPTION), [rowCount, tile, height, width]);
  const offsets = useMemo(() => rowOffsets(heights, GAP), [heights]);
  // Before the holder is measured (and in tests, where nothing has a size) the first rows are drawn.
  const shown: RowWindow = space ? rowWindow(heights, offsets, GAP, view.top, view.bottom, ROW_BUFFER)
    : rowCount ? { ...EMPTY_WINDOW, start: 0, end: Math.min(rowCount - 1, ROW_BUFFER), after: 0 } : EMPTY_WINDOW;

  const rows: number[] = [];
  for (let row = shown.start; row <= shown.end; row++) rows.push(row);

  return (
    <div ref={holder} className="ws-grid-holder" style={{ paddingTop: shown.before, paddingBottom: shown.after }}>
      {rows.map((row) => (
        <ol key={row} className="ws-grid-row" start={row * columns + 1} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, marginBottom: GAP }}>
          {slides.slice(row * columns, row * columns + columns).map((slide, i) => {
            const index = row * columns + i;
            return (
              <li key={slide.key} className="ws-tile">
                <Preview layout={slide.layout} theme={theme} font={font} width={width} height={height} tile={tile} drawKey={drawKey} label={slide.reference} />
                <div className="ws-tile-foot">
                  <span className="ws-tile-name"><span className="ws-tile-number">{index + 1}</span> {slide.reference}</span>
                  <button type="button" className="ws-save" disabled={busy} onClick={() => onSave(index)}>Save picture</button>
                </div>
              </li>
            );
          })}
        </ol>
      ))}
    </div>
  );
}
