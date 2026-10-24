import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { formatNumber } from "@/lib/utils";
import type { Bar, Library, Metric } from "./model";
import { useRiver, type RiverApi } from "./useRiver";

const METRICS: [Metric, string][] = [
  ["verses", "Verses"],
  ["words", "Words"],
  ["red", "Words of Jesus"],
];

interface Props {
  library: Library | null;
  selection: { index: number; reveal: boolean };
  onSelect: (index: number) => void;
  /** filled with the river's controls, for the parts below to fly it */
  handle: MutableRefObject<RiverApi | null>;
  /** the summary title for a hovered chapter, when its book's summaries are loaded */
  titleOf: (bar: Bar) => string | undefined;
}

/** 01 · the whole Bible as one zoomable line of chapters. */
export function River({ library, selection, onSelect, handle, titleOf }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const overviewBox = useRef<HTMLDivElement>(null);
  const overview = useRef<SVGSVGElement>(null);
  const [elements] = useState(() => ({ box, svg, overviewBox, overview }));
  const [metric, setMetric] = useState<Metric>("verses");
  const [hover, setHover] = useState<Bar | null>(null);
  const api = useRiver(library, elements, { onSelect, onHover: setHover });

  useEffect(() => {
    handle.current = {
      select: (...args) => api.current?.select(...args),
      flyToBook: (book) => api.current?.flyToBook(book),
      flyToSection: (id) => api.current?.flyToSection(id),
      reset: () => api.current?.reset(),
      setMetric: (value) => api.current?.setMetric(value),
    };
  }, [api, handle]);
  useEffect(() => {
    if (library && selection.index >= 0) api.current?.select(selection.index, { reveal: selection.reveal });
  }, [api, library, selection]);

  const choose = (value: Metric) => {
    setMetric(value);
    api.current?.setMetric(value);
  };
  const title = hover ? titleOf(hover) : undefined;

  return (
    <section className="lib-river-section" id="river" aria-labelledby="river-title">
      <div className="lib-section-head">
        <p className="lib-num">01</p>
        <div>
          <h2 id="river-title">
            Move through <em>the whole Bible.</em>
          </h2>
          <p>Each bar is one chapter, as tall as it is long. Zoom in to see the books, then the chapters.</p>
        </div>
        <div className="lib-toggle" role="radiogroup" aria-label="Bar height">
          {METRICS.map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={metric === value} onClick={() => choose(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="lib-readout" aria-live="polite">
        {hover ? (
          <>
            <b style={{ color: `var(--${hover.section})` }}>
              {hover.name} {hover.chapter}
            </b>{" "}
            · {hover.verses} verses · {formatNumber(hover.words)} words{hover.red ? ` · ${formatNumber(hover.red)} words of Jesus` : ""}
            {title && (
              <>
                {" "}
                · <i>{title}</i>
              </>
            )}
          </>
        ) : (
          " "
        )}
      </p>
      <div ref={box} className="lib-river" tabIndex={0} aria-label="The Bible, chapter by chapter. Scroll or pinch to zoom, drag to move, arrow keys to step through chapters.">
        <svg ref={svg} className="lib-river-svg" aria-hidden="true" />
        {!library && <div className="lib-river-loading" />}
      </div>
      <div ref={overviewBox} className="lib-overview">
        <svg ref={overview} className="lib-overview-svg" aria-hidden="true" />
      </div>
      <div className="lib-controls-line">
        <span className="lib-legend">
          <b>Scroll</b> or <b>pinch</b> to zoom <i /> <b>Drag</b> to move <i /> <b>← →</b> one chapter at a time <i /> Click a part or a book to fly to it
        </span>
        <button type="button" className="lib-link-button" onClick={() => api.current?.reset()}>
          Whole Bible
        </button>
      </div>
    </section>
  );
}
