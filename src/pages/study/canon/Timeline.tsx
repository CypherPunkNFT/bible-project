// "Enter the timeline" (approved mock-up D: js/timeline.js): the eighteen records on one time line, in four lanes by what
// kind of witness each is. Each record spans only as much time as its own date says: a solid bar for a year or short span,
// a soft bar for a century, a dashed outline where the date is debated. The long quiet stretch between 650 and 1500 is cut
// to a marked break. Pointing at a record reads it below; clicking opens its sheet.
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { byId, CN, name, tone } from "./model";

// Year to a share of the plot's width: 350 BC to AD 650 takes 84%, a break, then 1500 to 1700.
const SEGMENTS = [[-350, 650, 0, 0.84], [1500, 1700, 0.88, 1]] as const;
function at(year: number): number {
  for (const [a, b, x0, x1] of SEGMENTS) if (year <= b || x1 === 1) return x0 + ((Math.min(Math.max(year, a), b) - a) / (b - a)) * (x1 - x0);
  return 1;
}
const TICKS = [-300, -200, -100, 1, 100, 200, 300, 400, 500, 600, 1500, 1600, 1700];
const tickText = (y: number) => (y < 0 ? `${-y} BC` : y === 1 ? "AD 1" : String(y));
const ROW = 30;

/** Place each record's bar and label in its lane, stacking into a new row only where labels would collide. */
function layout(tracks: HTMLElement[]) {
  const width = tracks[0]?.clientWidth ?? 0;
  for (const lane of tracks) {
    const ends: number[] = [];
    for (const item of lane.querySelectorAll<HTMLElement>(".tl-item")) {
      const span = CN.spans[item.dataset.open ?? ""];
      if (!span) { console.error(`canon timeline: no span for record "${item.dataset.open}" in canon-data.json`); continue; }
      const left = at(span.from) * width, barWidth = Math.max((at(span.to) - at(span.from)) * width, 9);
      const labelWidth = (item.querySelector("b")?.textContent?.length ?? 0) * 7 + 16;
      const flip = left + barWidth + labelWidth > width;
      const [start, end] = flip ? [left - labelWidth, left + barWidth] : [left, left + barWidth + labelWidth];
      let row = ends.findIndex((e) => e < start);
      if (row === -1) { row = ends.length; ends.push(end); } else ends[row] = end;
      Object.assign(item.style, { left: `${left}px`, top: `${row * ROW + 8}px` });
      item.style.setProperty("--bar", `${barWidth}px`);
      item.classList.toggle("tl-flip", flip);
    }
    lane.style.height = `${Math.max(ends.length, 1) * ROW + 14}px`;
  }
}

/** The line under a plot that reads whichever record is pointed at or focused. */
export function Say({ id }: { id: string | null }) {
  const r = id ? byId.get(id) : undefined;
  return <p className="ms-say" aria-live="polite">{r
    ? <><b>{name(r.id)}</b> · {r.date} · {r.place}. {r.title} <span className="ms-say-go">{r.kind} · open</span></>
    : "Point at a record to read it here; click to open it."}</p>;
}
/** Pointer and focus handlers that report the record under them ([data-open]), and forget it when the pointer leaves. */
export function sayHandlers(set: (id: string | null) => void) {
  const pick = (e: { target: EventTarget }) => set((e.target as Element).closest<HTMLElement | SVGElement>("[data-open]")?.dataset.open ?? null);
  return { onPointerOver: pick, onFocus: pick, onPointerLeave: () => set(null) };
}

export function Timeline({ num }: { num: string }) {
  const plot = useRef<HTMLDivElement>(null);
  const [said, setSaid] = useState<string | null>(null);
  useLayoutEffect(() => {
    const tracks = [...(plot.current?.querySelectorAll<HTMLElement>(".tl-track") ?? [])];
    if (!tracks.length) return;
    const run = () => layout(tracks);
    const observer = new ResizeObserver(run);
    observer.observe(tracks[0]);
    run();
    return () => observer.disconnect();
  }, []);
  return <>
    <SectionHead num={num} kicker="Enter the timeline" title={<>Put each witness back in <em>its own time</em></>}
      lead="Explore eighteen records. Dates refer to the text, object or decision described; later copies and compilations are identified where relevant." />
    <div className="tl-scroll"><div className="tl" ref={plot} {...sayHandlers(setSaid)}>
      <div className="tl-axis"><span></span><div className="tl-ticks">{TICKS.map((y) => <i key={y} style={{ left: `${(at(y) * 100).toFixed(2)}%` }}>{tickText(y)}</i>)}
        <b className="tl-break" style={{ left: "84%", width: "4%" }} title="650–1500 left out: no record falls here">≈</b></div></div>
      {CN.lanes.map((lane) => <div key={lane.key} className="tl-lane"><div className="tl-head"><b>{lane.label}</b><small>{lane.line}</small></div>
        <div className="tl-track">{lane.ids.map((id) => {
          const r = byId.get(id), span = CN.spans[id];
          if (!r || !span) { console.error(`canon timeline: lane "${lane.key}" names record "${id}", which has no record or span`); return null; }
          return <button key={id} type="button" className={`tl-item tl-${span.how}`} data-open={id} style={{ "--tone": tone(id) } as CSSProperties}
            aria-label={`${name(id)}, ${r.date}. ${r.title}`}><i></i><b>{name(id)}</b></button>;
        })}<span className="tl-gap" style={{ left: "84%", width: "4%" }}></span></div></div>)}
    </div></div>
    <p className="tl-key"><span><i className="tl-k tl-firm"></i>A year or short span</span><span><i className="tl-k tl-century"></i>A century or broad period</span>
      <span><i className="tl-k tl-debated"></i>Date debated</span>
      <span className="tl-key-note">Nothing is pinned more precisely than its record. The lanes are this page's grouping; each record's own kind is shown when it is opened.</span></p>
    <Say id={said} />
  </>;
}
