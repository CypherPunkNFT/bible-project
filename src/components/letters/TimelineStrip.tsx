import { useEffect, type ReactNode } from "react";
import type { Timeline, TimelineEvent } from "@/data/letters/types";
import { useKeep } from "./letter-hooks";
import { ClaimText, CiteMarks, KeepX, Refs } from "./LetterParts";
import { StableTip } from "@/components/StableTip";

const W = 1000;
const ROW = 22;
const PAD = 40;

/** Labels on the chart stay short; the full text is in the line under the chart. */
const short = (label: string) => (label.length > 48 ? `${label.slice(0, 46).trimEnd()}…` : label);

/** Whether a bar's label sits to its left (bars ending near the right edge) — shared by packing and drawing. */
const labelLeft = (barEnd: number) => barEnd > W - 200;

/**
 * Greedy rows so nothing overlaps: each event, with its label on the side it is drawn, takes the first row whose
 * last occupied point is before it starts.
 */
function packRows(events: TimelineEvent[], x: (v: number) => number, minWidth: number): number[] {
  const ends: number[] = [];
  return events.map((e) => {
    const x0 = x(e.from), x1 = Math.max(x(e.to ?? e.from), x0 + minWidth);
    const text = short(e.label).length * 6.5 + 12; // about 6.5px per character
    const [start, end] = labelLeft(x1) ? [x0 - text, x1] : [x0, x1 + text];
    let row = ends.findIndex((last) => last + 6 < start);
    if (row === -1) { row = ends.length; ends.push(end); } else ends[row] = end;
    return row;
  });
}

/**
 * Dated events as glowing ranges on a year axis (letters stand out in the group colour), or — for "story"
 * timelines that follow the biblical narrative rather than dates — as a row of numbered steps.
 */
export function TimelineStrip({ timeline, formatYear = (v) => (v < 0 ? `${-v} BC` : `AD ${v}`), onActive, lit }: {
  timeline: Timeline;
  /** How a point on the axis is named (default: years BC/AD; the ruler pages use years of a reign). */
  formatYear?: (value: number) => string;
  /** Told whenever the pointed-at or kept event changes, so a map beside the strip can light its place. */
  onActive?: (event: TimelineEvent | null) => void;
  /** Events lit from outside the strip while nothing in it is pointed at (a place pointed at on a map beside it). */
  lit?: (event: TimelineEvent) => boolean;
}) {
  const keep = useKeep<TimelineEvent>();
  useEffect(() => { onActive?.(keep.active); }, [keep.active, onActive]);
  const events = [...timeline.events].sort((a, b) => a.from - b.from);
  const lighted = !keep.active && lit ? events.filter(lit) : [];
  const active = keep.active ?? lighted[0] ?? null;
  const isLit = (e: TimelineEvent) => (keep.active ? keep.active === e : lighted.includes(e));
  const tip = active;
  const x = keep.kept && <KeepX onRelease={keep.release} />;
  // The tip's hidden sizing copies carry the "let go" mark too, so keeping an event never makes the box grow.
  const keptMark = <KeepX onRelease={() => undefined} />;
  const stepResting = <span className="lg-muted">Point at a step to see its verses; click to keep it.</span>;
  const stepTip = (e: TimelineEvent, mark: ReactNode) => <><strong>{e.label}</strong>{mark}{e.kind && <span className="lg-muted"> · {e.kind}</span>}<Refs refs={e.refs} /><CiteMarks cites={e.cites} /></>;
  const barResting = <span className="lg-muted">Ranges show where the sources disagree. Letters glow in the page colour. Point at a bar for its verses; click to keep it.</span>;
  const barTip = (e: TimelineEvent, mark: ReactNode) => <><strong>{e.label}</strong>{mark} <span className="lg-muted">· {formatYear(e.from)}{e.to && e.to !== e.from ? `–${formatYear(e.to).replace(/^AD /, "")}` : ""}</span><Refs refs={e.refs} /><CiteMarks cites={e.cites} /></>;

  if (timeline.axis === "story") return <figure>
    <ol className="lg-story" aria-label={timeline.title}>
      {events.map((e, i) => <li key={i}>
        <button type="button" aria-pressed={keep.kept === e} className={keep.peek(e) ? "lg-peek" : undefined} {...keep.bind(e)}>
          <span className="lg-story-dot">{i + 1}</span><span className="lg-story-label">{e.label}</span>
        </button>
      </li>)}
    </ol>
    <StableTip show={tip ? stepTip(tip, x) : stepResting} options={[stepResting, ...events.map((e) => stepTip(e, keptMark))]} />
    <figcaption className="lg-caption"><ClaimText claim={timeline.claim} as="span" /></figcaption>
  </figure>;

  const lo = Math.min(...events.map((e) => e.from)), hi = Math.max(...events.map((e) => e.to ?? e.from));
  const span = Math.max(1, hi - lo);
  const xOf = (v: number) => PAD + ((v - lo) / span) * (W - PAD * 2);
  const rows = packRows(events, xOf, 10);
  const height = 40 + (Math.max(0, ...rows) + 1) * ROW + 30;
  // About eight labelled ticks, on round numbers, whatever the span (decades for Paul, centuries for the canon).
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => span / s <= 9) ?? 1000;
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);

  return <figure>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${timeline.title}, ${formatYear(lo)} to ${formatYear(hi)}`}>
        {ticks.map((t) => <g key={t}><line x1={xOf(t)} x2={xOf(t)} y1={24} y2={height - 20} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={xOf(t)} y={16} textAnchor="middle" className="lg-svg-text">{formatYear(t)}</text></g>)}
        {events.map((e, i) => {
          const x0 = xOf(e.from), x1 = Math.max(xOf(e.to ?? e.from), x0 + 10), y = 34 + rows[i] * ROW;
          const isLetter = Boolean(e.letter);
          return <g key={i} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`${e.label}, ${e.from}${e.to && e.to !== e.from ? `–${e.to}` : ""}`}
            className={keep.peek(e) ? "lg-peek" : undefined} {...keep.bind(e)}>
            <rect x={x0} y={y} width={x1 - x0} height={14} rx={7} fill={isLetter ? "var(--lg)" : "color-mix(in srgb, var(--ink) 30%, transparent)"}
              opacity={active && !isLit(e) ? 0.35 : isLetter ? 0.85 : 0.6} className={isLetter ? "lg-glow" : undefined} />
            {/* Labels near the right edge sit to the left of their bar. */}
            <text x={labelLeft(x1) ? x0 - 6 : x1 + 6} y={y + 11} textAnchor={labelLeft(x1) ? "end" : "start"} className={isLetter ? "lg-svg-strong" : "lg-svg-text"}>{short(e.label)}</text>
          </g>;
        })}
      </svg>
    </div>
    <StableTip show={tip ? barTip(tip, x) : barResting} options={[barResting, ...events.map((e) => barTip(e, keptMark))]} />
    <figcaption className="lg-caption"><ClaimText claim={timeline.claim} as="span" /></figcaption>
  </figure>;
}
