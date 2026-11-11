import type { End, Section } from "./geometry";
import { Thread } from "./Thread";

/** Where each page begins and ends, and how far the page's top dips toward the gutter. */
const LEFT_EDGE = 24;
const RIGHT_EDGE = 216;
const GUTTER = 120;
const DIP = 6;
const LINE_TOP = 97;
const LINE_STEP = 8.5;
const MARK = 22;

/** The text lines on each page: where each starts and how long it is, ragged like text. */
const LEFT_LINES: [number, number][] = [[34, 70], [34, 62], [34, 70], [34, 54], [34, 66], [34, 48]];
const RIGHT_LINES: [number, number][] = [[136, 66], [136, 70], [136, 58], [136, 70], [136, 50], [136, 62]];

/** How far the page's top edge has dipped at `x`: none at the outer edge, the full dip at the gutter. */
const dipAt = (x: number) => {
  const share = x < GUTTER ? (x - LEFT_EDGE) / (GUTTER - LEFT_EDGE) : (RIGHT_EDGE - x) / (RIGHT_EDGE - GUTTER);
  return DIP * share * share;
};
const lineY = (line: number, x: number) => LINE_TOP + line * LINE_STEP + dipAt(x);

/** One line of text, bowed down toward the gutter the way the page is. */
function textLine(x: number, length: number, line: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const at = x + (length * i) / 6;
    return `${i ? "L" : "M"}${at.toFixed(1)} ${lineY(line, at).toFixed(1)}`;
  }).join("");
}

/** A verse marked on a page: a thread end centred on `x` with a short bar on the line. */
function verseEnd(_side: "L" | "R", line: number, x: number, section: Section): End {
  const y = lineY(line, x);
  return { x, y: y - 3, section, bar: `M${x - MARK / 2} ${y.toFixed(1)} h${MARK}` };
}

type Mark = [side: "L" | "R", line: number, x: number, section: Section];

/** First half of the loop: each thread joins two verses of one colour. */
const MATCHED: [Mark, Mark][] = [
  [["L", 0, 48, "prophets"], ["R", 5, 180, "prophets"]],
  [["L", 2, 62, "gospels"], ["R", 4, 160, "gospels"]],
  [["L", 4, 84, "history"], ["R", 0, 150, "history"]],
  [["L", 1, 50, "epistles"], ["R", 2, 172, "epistles"]],
];
/** Second half: each joins two different colours. */
const MISMATCHED: [Mark, Mark][] = [
  [["L", 0, 62, "history"], ["R", 3, 182, "gospels"]],
  [["L", 3, 84, "poetry"], ["R", 1, 150, "epistles"]],
  [["L", 5, 48, "prophets"], ["R", 5, 186, "history"]],
  [["L", 1, 70, "epistles"], ["R", 4, 172, "poetry"]],
];

/** The page's outline, its edge stack along the bottom, and a cover rim around both. */
function Pages() {
  return (
    <>
      <path d={`M16 150 C58 143 100 145 ${GUTTER} 159 C140 145 182 143 224 150`} strokeWidth={0.9} opacity={0.5} />
      <path d="M16 150 V88 M224 150 V88" strokeWidth={0.9} opacity={0.5} />
      <path d="M24 156 C60 149 100 151 120 163 C140 151 180 149 216 156" strokeWidth={0.6} opacity={0.3} />
      <path d={`M${GUTTER} 150 C100 142 60 140 ${LEFT_EDGE} 146 V84 C60 78 100 80 ${GUTTER} 90 C140 80 180 78 ${RIGHT_EDGE} 84 V146 C180 140 140 142 ${GUTTER} 150 Z`} strokeWidth={1.3} />
      <path d="M24 149 C60 143 100 145 120 153 C140 145 180 143 216 149 M24 152 C60 146 100 148 120 156 C140 148 180 146 216 152" strokeWidth={0.7} opacity={0.5} />
      <path d={`M${GUTTER} 90 V152`} strokeWidth={0.9} opacity={0.6} />
      <path d="M114 94 V146 M126 94 V146" strokeWidth={0.5} opacity={0.3} />
    </>
  );
}

/** The Connections heading drawing: an open Bible seen straight on, its text lines bowed toward the gutter, and threads
 *  arching over the gutter between marked verses, each in the colour of its section. Two halves on a 16-second loop. */
export function FlatBook() {
  return (
    <>
      <Pages />
      {/* the running head of each page, then the text */}
      <path d="M60 88 h24 M156 88 h24" strokeWidth={1.4} opacity={0.7} />
      {LEFT_LINES.map(([x, length], i) => <path key={`l${i}`} d={textLine(x, length, i)} strokeWidth={0.8} opacity={0.5} />)}
      {RIGHT_LINES.map(([x, length], i) => <path key={`r${i}`} d={textLine(x, length, i)} strokeWidth={0.8} opacity={0.5} />)}
      {[MATCHED, MISMATCHED].map((links, half) => links.map(([[sideA, lineA, xA, sectionA], [sideB, lineB, xB, sectionB]], i) => (
        <Thread
          key={`${half}${i}`} half={half as 0 | 1} index={i} count={links.length}
          a={verseEnd(sideA, lineA, xA, sectionA)} b={verseEnd(sideB, lineB, xB, sectionB)}
        />
      )))}
    </>
  );
}
