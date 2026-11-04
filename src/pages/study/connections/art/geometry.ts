// Shared by the Connections page's heading drawing and the scene mock-ups: the open book's page geometry, so a verse
// (a ruled line on a page and how far along it) maps to a point and a short bar on that line, and the section
// colours the drawings use.

export type Section = "history" | "poetry" | "prophets" | "gospels" | "epistles" | "revelation";
export interface Point { x: number; y: number }
/** A marked verse: the page, its line, how far along the line (0 to 1), and the section it belongs to. */
export interface Verse { side: "L" | "R"; line: number; at: number; section: Section }
/** A thread joining two verses of the open book. */
export interface Link { a: Verse; b: Verse }
/** One end of a drawn thread: where it lands, whose colour it takes, and the mark drawn on the page there, if any. */
export interface End extends Point { section: Section; bar?: string }

/** A section's colour in the drawings (connections.css `--art-*`): the chart's own, except History, which the whole-Bible
 *  picture shows as a deep brick red where the legend dot is pale salmon. */
export const ink = (section: Section) => `var(--art-${section})`;

interface Curve { p0: Point; p1: Point; p2: Point }

/** The page's left edge slants outward going down; a ruled line starts just inside it. */
const EDGE_SLOPE = -30 / 80.4;
const EDGE_TOP = { x: -71, y: -31 };
/** Where each ruled line ends along its length (1 is the gutter): ragged, like text. */
const LINE_END = [1, 0.93, 1, 0.86, 1, 0.95, 0.82, 1, 0.62];
export const LINE_COUNT = LINE_END.length;
/** How much of a line a mark covers, as a share of its curve. */
const MARK_SPAN = 0.15;

/** A ruled line across the left page: it fans out, so lines are closer together at the outer edge than at the gutter,
 *  and arches a little. The right page mirrors it. */
function ruledLine(side: "L" | "R", line: number): Curve {
  const left = -16 + line * 6.6;
  const gutter = 6 + line * 8;
  const startX = EDGE_TOP.x + EDGE_SLOPE * (left - EDGE_TOP.y) + 11;
  const sign = side === "L" ? 1 : -1;
  return {
    p0: { x: sign * startX, y: left },
    p1: { x: sign * (startX - 9) / 2, y: (left + gutter) / 2 - 5 },
    p2: { x: sign * -9, y: gutter },
  };
}

const along = ({ p0, p1, p2 }: Curve, t: number): Point => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
});

const polyline = (curve: Curve, from: number, to: number, steps = 14) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const point = along(curve, from + ((to - from) * i) / steps);
    return `${i ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }).join("");

/** The path of one ruled line of text. */
export const textLine = (side: "L" | "R", line: number) => polyline(ruledLine(side, line), 0, LINE_END[line]);

/** Where a verse's mark is centred along its line. */
const markCentre = ({ line, at }: Verse) => MARK_SPAN / 2 + 0.04 + at * (LINE_END[line] - MARK_SPAN - 0.08);

/** A verse's mark centre, in the book's own coordinates (origin at the top of the gutter). */
export function versePoint(verse: Verse): Point {
  return along(ruledLine(verse.side, verse.line), markCentre(verse));
}

/** The short bar drawn over the text where a verse is marked, following the curve of its line. */
export function verseBar(verse: Verse): string {
  const centre = markCentre(verse);
  return polyline(ruledLine(verse.side, verse.line), centre - MARK_SPAN / 2, centre + MARK_SPAN / 2, 6);
}

export const endOf = (verse: Verse): End => {
  const point = versePoint(verse);
  return { x: point.x, y: point.y - 1, section: verse.section, bar: verseBar(verse) };
};

export const verse = (side: "L" | "R", line: number, at: number, section: Section): Verse => ({ side, line, at, section });

/** First half of the loop: both ends in one colour. */
export const MATCHED_LINKS: Link[] = [
  { a: verse("L", 1, 0.15, "prophets"), b: verse("R", 7, 0.8, "prophets") },
  { a: verse("L", 3, 0.2, "poetry"), b: verse("R", 2, 0.7, "poetry") },
  { a: verse("L", 5, 0.5, "history"), b: verse("R", 4, 0.3, "history") },
  { a: verse("L", 7, 0.1, "gospels"), b: verse("R", 6, 0.8, "gospels") },
  { a: verse("L", 8, 0.4, "epistles"), b: verse("R", 0, 0.6, "epistles") },
];
/** Second half: the two ends differ, and the thread shades from one colour to the other. */
export const MISMATCHED_LINKS: Link[] = [
  { a: verse("L", 0, 0.2, "history"), b: verse("R", 3, 0.8, "gospels") },
  { a: verse("L", 4, 0.1, "poetry"), b: verse("R", 0, 0.9, "epistles") },
  { a: verse("L", 6, 0.6, "prophets"), b: verse("R", 5, 0.5, "gospels") },
  { a: verse("L", 2, 0.5, "history"), b: verse("R", 8, 0.3, "prophets") },
  { a: verse("L", 8, 0.2, "gospels"), b: verse("R", 6, 0.9, "poetry") },
];
