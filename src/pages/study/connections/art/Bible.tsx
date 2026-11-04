// An open Bible in line art, in the proportions of the app icon's book: tall pages that are narrow at the top and flare out
// toward the reader, dipping steeply into the gutter, with a thick cover band running down each outer side and sweeping
// along the bottom to the foot of the spine. Fine lines of text fill the pages and a ribbon with a cross lies in the
// gutter. Threads arch from marked verses on one page to marked verses on the other. The origin is the gutter, level
// with the top of the pages' outer corners.
import type { End, Section } from "@/pages/study/connections/art/geometry";
import { Thread } from "@/pages/study/connections/art/Thread";

interface Point { x: number; y: number }
type Side = "L" | "R";
type Curve = [Point, Point, Point, Point];
/** A marked verse: page, line, how far along the line (0 to 1) and the section it belongs to. */
export type Mark = [side: Side, line: number, at: number, section: Section];
export type MarkedLink = [Mark, Mark];

export const LINES = 11;
/** How much of its page's width each line fills, ragged like text; the last line of a paragraph is short. */
const FILL = [1, 0.95, 1, 0.88, 1, 0.97, 0.72, 1, 0.92, 1, 0.45];
const MARGIN = { outer: 0.09, gutter: 0.08 };
const MARK_SPAN = 0.17;

/** The left page's top and bottom edges, from the outer edge (u = 0) to the gutter (u = 1); the right page is the mirror.
 *  The top starts nearly level and then drops steeply into the gutter; the bottom sweeps down to the spine. */
const TOP: Curve = [{ x: -59, y: 0 }, { x: -30, y: -1 }, { x: -10, y: 9 }, { x: -4, y: 22 }];
const BOTTOM: Curve = [{ x: -84, y: 63 }, { x: -48, y: 60 }, { x: -16, y: 68 }, { x: -4, y: 87 }];

const cubic = ([p0, p1, p2, p3]: Curve, u: number): Point => {
  const v = 1 - u;
  return {
    x: v ** 3 * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u ** 3 * p3.x,
    y: v ** 3 * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u ** 3 * p3.y,
  };
};

/** A point on a page: `u` across (0 outer edge, 1 gutter) and `f` down (0 top edge, 1 bottom edge). */
function pagePoint(side: Side, u: number, f: number): Point {
  const top = cubic(TOP, u), bottom = cubic(BOTTOM, u);
  const x = top.x + (bottom.x - top.x) * f, y = top.y + (bottom.y - top.y) * f;
  return { x: side === "L" ? x : -x, y };
}

const lineFraction = (line: number) => 0.09 + (line * 0.82) / (LINES - 1);

/** The stretch of a page's width a line covers: from the outer margin on the left page, from the gutter on the right. */
function lineSpan(side: Side, line: number): [number, number] {
  const length = (1 - MARGIN.outer - MARGIN.gutter) * FILL[line];
  return side === "L" ? [MARGIN.outer, MARGIN.outer + length] : [1 - MARGIN.gutter - length, 1 - MARGIN.gutter];
}

const trace = (side: Side, line: number, from: number, to: number) =>
  Array.from({ length: 13 }, (_, i) => {
    const p = pagePoint(side, from + ((to - from) * i) / 12, lineFraction(line));
    return `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join("");

/** Where a marked verse ends a thread, and the bar drawn on the line there. */
function verseEnd([side, line, at, section]: Mark): End {
  const [from, to] = lineSpan(side, line);
  const half = (MARK_SPAN * (to - from)) / 2;
  const centre = from + half + at * (to - from - 2 * half);
  const p = pagePoint(side, centre, lineFraction(line));
  return { ...p, y: p.y - 2.5, section, bar: trace(side, line, centre - half, centre + half) };
}

/** One page, drawn for the left; the right is its mirror. */
function Page() {
  const [t0, t1, t2, t3] = TOP, [b0, b1, b2, b3] = BOTTOM;
  return <path d={`M${t0.x} ${t0.y} C${t1.x} ${t1.y} ${t2.x} ${t2.y} ${t3.x} ${t3.y} V${b3.y} C${b2.x} ${b2.y} ${b1.x} ${b1.y} ${b0.x} ${b0.y} Z`} strokeWidth={1.4} />;
}

/** The cover's band on one side, drawn for the left: its outer edge slanting out from beside the page's top, then
 *  sweeping along the bottom to the foot of the spine; its inner edge parallel to that, with a cap at the top. */
function Cover() {
  return (
    <>
      <path d="M-73 13 L-96 75 C-64 73 -28 79 -2 101" strokeWidth={1.3} />
      <path d="M-67 13 L-89 69 C-60 66 -26 72 -4 93" strokeWidth={1.1} opacity={0.85} />
      <path d="M-73 13 H-67" strokeWidth={1.3} />
    </>
  );
}

/** The ribbon laid down the gutter, ending in a small cross at the spine's foot. */
function Ribbon() {
  return (
    <>
      <path d="M-1.4 24 V90 M1.4 24 V90" strokeWidth={0.8} opacity={0.8} />
      <path d="M0 91 V101 M-3 95 H3" strokeWidth={1.1} />
    </>
  );
}

interface BibleProps {
  first: MarkedLink[];
  second: MarkedLink[];
  rise?: number;
  weight?: number;
  /** How strongly the text lines are drawn; lower it for a denser web of threads. */
  textOpacity?: number;
}

/** The open Bible and its threads; the caller places and scales it. Threads play in two loop halves: one colour to itself, then two. */
export function Bible({ first, second, rise, weight, textOpacity = 0.6 }: BibleProps) {
  const rows = Array.from({ length: LINES }, (_, i) => i);
  return (
    <g>
      <path d="M-73 13 L-96 75 C-64 73 -28 79 -2 101 C28 79 64 73 96 75 L73 13 L59 0 C30 -1 10 9 4 22 H-4 C-10 9 -30 -1 -59 0 Z" stroke="none" style={{ fill: "var(--page)" }} />
      <Cover />
      <g transform="scale(-1 1)"><Cover /></g>
      <Page />
      <g transform="scale(-1 1)"><Page /></g>
      {(["L", "R"] as const).map((side) => rows.map((line) => {
        const [from, to] = lineSpan(side, line);
        return <path key={`${side}${line}`} d={trace(side, line, from, to)} strokeWidth={0.7} opacity={textOpacity} />;
      }))}
      <Ribbon />
      {[first, second].map((links, half) => links.map(([a, b], i) => (
        <Thread key={`${half}${i}`} half={half as 0 | 1} index={i} count={links.length} a={verseEnd(a)} b={verseEnd(b)} rise={rise} weight={weight} />
      )))}
    </g>
  );
}
