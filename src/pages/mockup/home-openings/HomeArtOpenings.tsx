// MOCK-UP: three openings on /home_mockup4 with newly drawn art (owner, 2026-10-30: "Something new for the artworks").
// A and B are the scroll whose sheets are the hills, carrying Isaiah 40:6-8 in Hebrew, Greek and English: A centres the title
// with the sun rising over the middle, B keeps the title left and the sun right. C, Manuscript, is a sun pieced together from
// torn leaves, with the gold marquee under it. The open Word and the sixty-six rays were taken out (owner, 2026-10-30).
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GoldMarquee, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import "./home-art-openings.css";

export const ART_OPENINGS = [
  { id: "a", name: "Scroll A" },
  { id: "b", name: "Scroll B" },
  { id: "c", name: "Manuscript" },
] as const;
export type ArtOpeningId = (typeof ART_OPENINGS)[number]["id"];

/** The same numbers on every render, so the drawings never change between visits. */
const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const fixed = (value: number) => value.toFixed(1);
/** A contour of the land; the sheet's writing runs along it, so the lines of the scroll are the lines of the hills. */
const contour = (x: number, base: number, phase: number) => base + Math.sin(x / 270 + phase) * 30 + Math.sin(x / 96 + phase * 2.3) * 7;
const trace = (base: number, phase: number, length: number) => {
  const points: string[] = [];
  for (let x = 0; x < length; x += 20) points.push(`${x} ${fixed(contour(x, base, phase))}`);
  points.push(`${length} ${fixed(contour(length, base, phase))}`);
  return `M${points.join("L")}`;
};
/** The scroll's height in drawing units; the sheets fill the lower half. */
const HEIGHT = 560;
/** Isaiah 40:6-8, a verse to a line, from the site's own texts: the Hebrew (WLC, unpointed, as on the old scrolls), the Greek
 *  (LXX, in capitals, as in the old codices) and the Berean Standard Bible (its quotation marks left off). Each line repeats its
 *  verse along the sheet. Two lines were added to each sheet and the Hebrew made large (owner, 2026-10-30). */
const VERSES = {
  he: ["קול אמר קרא ואמר מה אקרא כל־הבשר חציר וכל־חסדו כציץ השדה׃", "יבש חציר נבל ציץ כי רוח יהוה נשבה בו אכן חציר העם׃", "יבש חציר נבל ציץ ודבר־אלהינו יקום לעולם׃"],
  grc: ["ΦΩΝΗ ΛΕΓΟΝΤΟΣ ΒΟΗΣΟΝ ΚΑΙ ΕΙΠΑ ΤΙ ΒΟΗΣΩ ΠΑΣΑ ΣΑΡΞ ΧΟΡΤΟΣ ΚΑΙ ΠΑΣΑ ΔΟΞΑ ΑΝΘΡΩΠΟΥ ΩΣ ΑΝΘΟΣ ΧΟΡΤΟΥ", "ΕΞΗΡΑΝΘΗ Ο ΧΟΡΤΟΣ ΚΑΙ ΤΟ ΑΝΘΟΣ ΕΞΕΠΕΣΕ", "ΤΟ ΔΕ ΡΗΜΑ ΤΟΥ ΘΕΟΥ ΗΜΩΝ ΜΕΝΕΙ ΕΙΣ ΤΟΝ ΑΙΩΝΑ"],
  en: ["A voice says, Cry out! And I asked, What should I cry out? All flesh is like grass, and all its glory like the flowers of the field.", "The grass withers and the flowers fall when the breath of the LORD blows on them; indeed, the people are grass.", "The grass withers and the flowers fall, but the word of our God stands forever.", "The grass withers and the flowers fall, but the word of our God stands forever."],
};
/** Enough repeats of a verse to run the longest scroll: [characters needed, separator] for each script. */
const RUNS = { he: [220, "   "], grc: [240, "  ·  "], en: [380, "  ·  "] } as const;
const INSCRIPTIONS = Object.fromEntries(Object.entries(VERSES).map(([script, verses]) => {
  const [needed, separator] = RUNS[script as keyof typeof RUNS];
  return [script, verses.map((verse) => Array(Math.ceil(needed / verse.length) + 1).fill(verse).join(separator))];
})) as Record<keyof typeof VERSES, string[]>;
/** Each sheet: two dotted lines under its edge, then its inscription below them, a verse to a line (owner, 2026-10-30). The
 *  sheets keep their first-drawn places; only the writing changed, so the lines sit close (owner: "I did not ask you to change
 *  anything about the scrolls. Except for the words in them"). */
const SHEETS = [
  { name: "far", base: 340, phase: 0.6, dots: [14, 27], words: [46, 68, 90], script: "he" as const },
  { name: "mid", base: 402, phase: 2.4, dots: [14, 27], words: [42, 58, 74], script: "grc" as const },
  { name: "near", base: 470, phase: 4.1, dots: [14, 27], words: [46, 66, 86, 106], script: "en" as const },
];
const LINE_STARTS = [24, 90, 50, 130];
const drawSheets = (length: number) => SHEETS.map((sheet) => ({
  ...sheet,
  edge: trace(sheet.base, sheet.phase, length),
  dotted: sheet.dots.map((line) => trace(sheet.base + line, sheet.phase, length)),
  writing: sheet.words.map((line) => trace(sheet.base + line, sheet.phase, length)),
}));

/** The turned handle's outline, top down: [height above the roll, half its width]. A groove is drawn at each step. */
const HANDLE: [number, number][] = [[78, 0], [77, 2.6], [75, 4.4], [72, 5.2], [69, 4.4], [67, 2.8], [65, 2.8], [63, 4], [60, 6.2], [56, 8.6], [51, 9.8], [46, 9.6], [41, 8], [37, 5.4], [34, 4], [31, 4], [30, 7], [27, 7], [26, 4], [15, 4]];
const HANDLE_GROOVES = [65, 63, 34, 30, 27];
const frontArc = (cx: number, y: number, half: number) => `M${fixed(cx - half)} ${fixed(y)}A${fixed(half)} ${fixed(half * 0.3)} 0 0 0 ${fixed(cx + half)} ${fixed(y)}`;

/** One end of the scroll, in the same flat line art as the hills: roundness comes only from lines. The wound sheet shows as a
 *  spiral on top, its writing curves round the roll, hatching darkens the side away from the sun, and the handle is turned wood. */
function Roller({ cx, inward }: { cx: number; inward: 1 | -1 }) {
  const top = 296, bottom = HEIGHT, half = 20, wrap = cx + inward * (half + 3);
  const outline = [...HANDLE.map(([up, width]) => `${fixed(cx - width)} ${top - up}`), ...[...HANDLE].reverse().map(([up, width]) => `${fixed(cx + width)} ${top - up}`)];
  const spiral = Array.from({ length: 97 }, (_, step) => { const turn = (step / 96) * Math.PI * 8, radius = 2.5 + (16.5 * step) / 96; return `${fixed(cx + Math.cos(turn) * radius)} ${fixed(top + Math.sin(turn) * radius * 0.3)}`; });
  const hatch = [0.4, 0.6, 0.74, 0.84, 0.91, 0.96].map((across) => { const x = cx - inward * half * across; return `M${fixed(x)} ${fixed(top + 6 * Math.sqrt(1 - across * across))}V${bottom}`; });
  const bulbHatch = [0.5, 0.78].map((across) => `M${fixed(cx - inward * 8.6 * across)} ${top - 57}Q${fixed(cx - inward * 9.8 * across * 1.02)} ${top - 49} ${fixed(cx - inward * 8 * across)} ${top - 41}`);
  return <g className="hm4-roller">
    <path className="hm4-roll-line" d={`M${wrap} ${fixed(contour(wrap, SHEETS[0].base, SHEETS[0].phase))}V${bottom}`} />
    <path className="hm4-roll-fill" d={`M${cx - half} ${top}V${bottom}H${cx + half}V${top}Z`} />
    {Array.from({ length: 16 }, (_, row) => <path className="hm4-roll-writing" d={frontArc(cx, top + 22 + row * 16, half - 3)} key={row} />)}
    <path className="hm4-roll-hatch" d={hatch.join("")} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top} rx={half} ry="6" />
    <path className="hm4-roll-line" d={`M${spiral.join("L")}`} />
    <rect className="hm4-roll-fill" x={cx - 4} y={top - 10} width="8" height="10" />
    <path className="hm4-roll-fill" d={`M${cx - 23} ${top - 15}V${top - 10}A23 5 0 0 0 ${cx + 23} ${top - 10}V${top - 15}Z`} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top - 15} rx="23" ry="5" />
    <ellipse className="hm4-roll-line" cx={cx} cy={top - 15} rx="12" ry="3" />
    <path className="hm4-roll-fill" d={`M${outline.join("L")}Z`} />
    <path className="hm4-roll-line" d={HANDLE_GROOVES.map((up) => frontArc(cx, top - up, HANDLE.find(([height]) => height === up)?.[1] ?? 4)).join("")} />
    <path className="hm4-roll-hatch" d={bulbHatch.join("")} />
  </g>;
}

/** "edge" runs the scroll from one side of the screen to the other, cropped from the left on narrow screens (Scroll A).
 *  "framed" sets it inside margins and lets its length follow the shape of its space, so it fills a phone and a wide screen
 *  alike instead of shrinking to a strip (Scroll B). */
function ScrollArt({ fit }: { fit: "edge" | "framed" }) {
  const frame = useRef<SVGSVGElement>(null);
  const [length, setLength] = useState(1600);
  useLayoutEffect(() => {
    const svg = frame.current;
    if (!svg || fit === "edge") return;
    const measure = () => { const box = svg.getBoundingClientRect(); if (box.height) setLength(Math.round(Math.min(2200, Math.max(640, (HEIGHT * box.width) / box.height)))); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [fit]);
  const sheets = useMemo(() => drawSheets(length), [length]);
  const sun = length - 300, sunY = 262;
  return <svg ref={frame} className={`hm4-scroll-art hm4-scroll-${fit}`} viewBox={`0 0 ${length} ${HEIGHT}`} preserveAspectRatio={fit === "edge" ? "xMaxYMax slice" : "xMidYMax meet"} aria-hidden="true">
    <defs>
      {sheets.flatMap((sheet) => sheet.writing.map((d, line) => <path id={`hm4-line-${sheet.name}-${line}`} d={d} key={`${sheet.name}-${line}`} />))}
      <clipPath id="hm4-between-rollers"><rect x="22" y="0" width={length - 44} height={HEIGHT} /></clipPath>
    </defs>
    {[104, 132, 162, 196, 234].map((radius, ring) => <circle className={`hm4-scroll-ring hm4-scroll-ring-${ring % 2}`} cx={sun} cy={sunY} r={radius} style={{ opacity: 0.62 - ring * 0.1, transformOrigin: `${sun}px ${sunY}px` }} key={radius} />)}
    <circle className="hm4-sun-disc hm4-sun-solid" cx={sun} cy={sunY} r="82" />
    {sheets.map((sheet) => <g className={`hm4-sheet hm4-sheet-${sheet.name}`} key={sheet.name}>
      <path className="hm4-sheet-fill" d={`${sheet.edge}L${length} ${HEIGHT}L0 ${HEIGHT}Z`} /><path className="hm4-sheet-edge" d={sheet.edge} />
      {sheet.dotted.map((d) => <path className="hm4-sheet-writing" d={d} key={d} />)}
      {sheet.writing.map((d, line) => <text className={`hm4-sheet-script hm4-script-${sheet.script}`} clipPath="url(#hm4-between-rollers)" key={d}><textPath href={`#hm4-line-${sheet.name}-${line}`} startOffset={LINE_STARTS[line]}>{INSCRIPTIONS[sheet.script][line]}</textPath></text>)}
    </g>)}
    <Roller cx={22} inward={1} /><Roller cx={length - 22} inward={-1} />
  </svg>;
}

/** Rings of torn leaves around one bright centre; a few have not yet reached their place. */
function leafPieces() {
  const pieces: { d: string; ghost: boolean; ring: number; pattern: number; dx: number; dy: number; turn: number }[] = [];
  const rings = [[62, 148, 7], [152, 240, 12], [244, 330, 17]];
  let seed = 11;
  rings.forEach(([inner, outer, count], ring) => count && Array.from({ length: count }).forEach((_, piece) => {
    const step = (Math.PI * 2) / count, start = piece * step + ring * 0.31 + 0.022, end = start + step - 0.044;
    const edge: [number, number][] = [];
    const push = (angle: number, radius: number) => { seed += 1; const torn = radius + (seeded(seed) - 0.5) * 11, sway = angle + (seeded(seed + 500) - 0.5) * 0.018; edge.push([450 + Math.cos(sway) * torn, 400 + Math.sin(sway) * torn]); };
    for (let side = 0; side <= 5; side += 1) push(start + ((end - start) * side) / 5, outer);
    for (let across = 1; across < 3; across += 1) push(end, outer - ((outer - inner) * across) / 3);
    for (let side = 5; side >= 0; side -= 1) push(start + ((end - start) * side) / 5, inner);
    for (let across = 2; across > 0; across -= 1) push(start, outer - ((outer - inner) * across) / 3);
    const middle = (start + end) / 2, drift = 60 + seeded(seed + 900) * 130;
    const ghost = ring === 2 && piece % 5 === 2;
    pieces.push({ d: `M${edge.map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`, ghost, ring, pattern: piece % 3, dx: Math.cos(middle) * drift, dy: Math.sin(middle) * drift, turn: (seeded(seed + 1300) - 0.5) * 34 });
  }));
  return pieces;
}
const LEAF_PIECES = leafPieces();
const leafStyle = (dx: number, dy: number, turn: number, delay: number) => ({ "--dx": `${fixed(dx)}px`, "--dy": `${fixed(dy)}px`, "--turn": `${fixed(turn)}deg`, animationDelay: `${delay}ms` } as CSSProperties);

function ManyPiecesArt() {
  return <figure className="hm4-pieces">
    <svg viewBox="-20 0 940 800" aria-hidden="true">
      <defs>{[-14, 6, 24].map((tilt, index) => <pattern id={`hm4-leaf-writing-${index}`} width="46" height="11" patternUnits="userSpaceOnUse" patternTransform={`rotate(${tilt})`} key={tilt}><path className="hm4-leaf-line" d="M1 5h15M20 5h7M31 5h13" /></pattern>)}</defs>
      <circle className="hm4-sun-disc hm4-sun-solid" cx="450" cy="400" r="54" />
      {LEAF_PIECES.map((piece, index) => {
        const leaf = <><path className={`hm4-leaf hm4-leaf-ring-${piece.ring}`} d={piece.d} /><path fill={`url(#hm4-leaf-writing-${piece.pattern})`} d={piece.d} /></>;
        if (!piece.ghost) return <g className="hm4-leaf-settle" style={leafStyle(piece.dx, piece.dy, piece.turn, index * 40)} key={piece.d}>{leaf}</g>;
        return <g key={piece.d}><path className="hm4-leaf-place" d={piece.d} /><g style={{ transform: `translate(${fixed(piece.dx * 0.22)}px, ${fixed(piece.dy * 0.22)}px) rotate(${fixed(piece.turn * 0.4)}deg)`, transformOrigin: "450px 400px" }}>{leaf}</g></g>;
      })}
    </svg>
    <figcaption>Many pieces. One Word.</figcaption>
  </figure>;
}

function ScrollEdgeOpening(props: OpeningProps) {
  return <section className="hm4-b" aria-labelledby="home-title"><ScrollArt fit="edge" /><div className="home-wrap"><OpeningCopy {...props} /></div></section>;
}

function ScrollFramedOpening(props: OpeningProps) {
  return <section className="hm4-b" aria-labelledby="home-title"><ScrollArt fit="framed" /><div className="home-wrap"><OpeningCopy {...props} /></div></section>;
}

function ManuscriptOpening(props: OpeningProps) {
  return <section className="home-hero home-wrap hm4-row hm4-row-flip" aria-labelledby="home-title"><ManyPiecesArt /><OpeningCopy {...props} /></section>;
}

const VIEWS: Record<ArtOpeningId, (props: OpeningProps) => JSX.Element> = { a: ScrollEdgeOpening, b: ScrollFramedOpening, c: ManuscriptOpening };

export function ArtOpening({ version, ...props }: OpeningProps & { version: ArtOpeningId }) {
  const View = VIEWS[version];
  // Scroll B stands alone; Scroll A keeps the marquee it was first made with, and so does the manuscript (owner, 2026-10-30).
  return <><View {...props} />{version !== "b" && <GoldMarquee />}</>;
}
