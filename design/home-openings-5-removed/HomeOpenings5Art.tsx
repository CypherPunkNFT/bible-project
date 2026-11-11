import { fixed, tone, useBooks } from "./HomeOpenings5Art.shared";
// MOCK-UP: the drawings of /home_mockup5 that need the Bible's own data (owner, 2026-10-30: "more artworks and different ideas,
// marquee included can change into other structure"). Woven threads: the cross-references as arcs over a strip of the 66 books.
// Rose window: the 66 books as panes of glass, with the marquee bent into a ring around it. River of life: the marquee's
// phrases float down a river between trees of life.
import { loadBookPairs } from "@/lib/data";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { MARQUEE } from "./HomeOpenings";
const stillMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const ARC_WIDTH = 1600, ARC_BASE = 584, STRIP = 14, ARC_COUNT = 700;

/** Each book's place on the strip: as wide as it has chapters. */
function useStrip() {
  const books = useBooks();
  return useMemo(() => {
    const total = books.reduce((sum, book) => sum + book.chapters, 0);
    let run = 0;
    return books.map((book) => { const start = (run / total) * ARC_WIDTH; run += book.chapters; return { ...book, start, width: (book.chapters / total) * ARC_WIDTH }; });
  }, [books]);
}

/** The strongest links between books, both directions added together, as arcs from one book's middle to the other's. */
function arcsFrom(pairs: [string, string, number][], strip: ReturnType<typeof useStrip>) {
  const place = Object.fromEntries(strip.map((book) => [book.code, book]));
  const joined = new Map<string, { from: string; to: string; count: number }>();
  pairs.forEach(([a, b, count]) => {
    if (a === b || !place[a] || !place[b]) return;
    const [from, to] = place[a].start < place[b].start ? [a, b] : [b, a];
    const item = joined.get(`${from}-${to}`) ?? { from, to, count: 0 };
    item.count += count;
    joined.set(`${from}-${to}`, item);
  });
  const strongest = [...joined.values()].sort((x, y) => y.count - x.count).slice(0, ARC_COUNT);
  const most = Math.log(strongest[0]?.count ?? 2);
  return strongest.reverse().map(({ from, to, count }) => {
    const x1 = place[from].start + place[from].width / 2, x2 = place[to].start + place[to].width / 2, rx = (x2 - x1) / 2, ry = Math.min(rx * 0.95, ARC_BASE - 30);
    return { from, to, strength: Math.log(count) / most, section: place[from].section, d: `M${fixed(x1)} ${ARC_BASE}A${fixed(rx)} ${fixed(ry)} 0 0 1 ${fixed(x2)} ${ARC_BASE}` };
  });
}

export function WovenArcs() {
  const strip = useStrip();
  const [pairs, setPairs] = useState<[string, string, number][] | null>(null);
  const [focus, setFocus] = useState("");
  useEffect(() => {
    let live = true;
    loadBookPairs().then((rows) => { if (live) setPairs(rows); }).catch((error: unknown) => console.error("home_mockup5: the book-to-book cross-references (xref-books.json) did not load", error));
    return () => { live = false; };
  }, []);
  const arcs = useMemo(() => (pairs ? arcsFrom(pairs, strip) : []), [pairs, strip]);
  const references = pairs?.reduce((sum, [, , count]) => sum + count, 0) ?? 0;
  const lit = strip.find((book) => book.code === focus);
  return <figure className="hm5-arcs" data-focus={focus || undefined}>
    <svg viewBox={`0 0 ${ARC_WIDTH} ${ARC_BASE + STRIP}`} preserveAspectRatio="none" aria-hidden="true">
      {arcs.map((arc, index) => <path className={`hm5-arc${focus && (arc.from === focus || arc.to === focus) ? " is-lit" : ""}`} d={arc.d} pathLength={1} style={{ ...tone(arc.section), "--strength": arc.strength.toFixed(2), animationDelay: `${index * 2}ms` } as CSSProperties} key={`${arc.from}-${arc.to}`} />)}
      {strip.map((book) => <rect className="hm5-arc-book" x={fixed(book.start + 0.6)} y={ARC_BASE + 2} width={fixed(Math.max(book.width - 1.2, 1))} height={STRIP - 2} style={tone(book.section)} onPointerEnter={() => setFocus(book.code)} onPointerLeave={() => setFocus("")} key={book.code} />)}
    </svg>
    {references > 0 && <figcaption>{lit ? <><strong>{lit.name}</strong>: its threads to the rest of Scripture.</> : <>Each thread joins two books that point to each other: the {ARC_COUNT} strongest of {references.toLocaleString("en-US")} cross-references. Point to a book on the strip.</>}</figcaption>}
  </figure>;
}

const ROSE = 400, RING = 384;
const polar = (radius: number, angle: number) => `${fixed(ROSE + Math.cos(angle) * radius)} ${fixed(ROSE + Math.sin(angle) * radius)}`;

/** A pointed pane between two radii: straight sides, the outer edge rising to a point like a lancet. */
function lancet(inner: number, outer: number, start: number, end: number) {
  const a = start + 0.014, b = end - 0.014, middle = (a + b) / 2;
  return `M${polar(inner, a)}L${polar(outer - 20, a)}Q${polar(outer, a)} ${polar(outer + 6, middle)}Q${polar(outer, b)} ${polar(outer - 20, b)}L${polar(inner, b)}A${inner} ${inner} 0 0 0 ${polar(inner, a)}Z`;
}
const RING_WORDS = [MARQUEE[0], MARQUEE[1], MARQUEE[3], MARQUEE[5], MARQUEE[6], MARQUEE[7], MARQUEE[11]].join("  ✦  ") + "  ✦  ";

/** Mirror order: books go down both sides in pairs from the top (first on the right), and an odd last book takes the bottom. */
function mirrored(index: number, count: number) {
  const step = (Math.PI * 2) / count;
  if (count % 2 === 1 && index === count - 1) return Math.PI / 2;
  return -Math.PI / 2 + (index % 2 === 0 ? 1 : -1) * (Math.floor(index / 2) + 0.5) * step;
}

/** The Old Testament's 39 books as the outer ring of glass, the New Testament's 27 as the inner, the cross at the centre.
 *  Each ring is laid out as a mirror, so the colours of the parts of the Bible match on both sides; choosing a pane names its book. */
export function RoseWindow() {
  const books = useBooks();
  const id = useId().replace(/:/g, "");
  const [picked, setPicked] = useState("");
  const chosen = books.find((book) => book.code === picked);
  const rings = [{ books: books.filter((book) => book.num > 39), inner: 94, outer: 202 }, { books: books.filter((book) => book.num <= 39), inner: 216, outer: 324 }];
  const choose = (code: string) => setPicked((now) => (now === code ? "" : code));
  return <figure className="hm5-rose">
    <svg viewBox="-12 -12 824 824">
      <defs><radialGradient id={`${id}-light`}><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".7" stopColor="#fff" stopOpacity="0" /></radialGradient><path id={`${id}-ring`} d={`M${ROSE} ${ROSE - RING}A${RING} ${RING} 0 1 1 ${ROSE} ${ROSE + RING}A${RING} ${RING} 0 1 1 ${ROSE} ${ROSE - RING}`} /></defs>
      <circle className="hm5-rose-back" cx={ROSE} cy={ROSE} r="362" />
      {rings.map((ring, depth) => ring.books.map((book, index) => {
        const step = (Math.PI * 2) / ring.books.length, start = mirrored(index, ring.books.length) - step / 2;
        return <path className={`hm5-pane${book.code === picked ? " is-picked" : ""}`} d={lancet(ring.inner, ring.outer, start, start + step)} style={{ ...tone(book.section), animationDelay: `${(depth * 27 + index) * 22}ms` }}
          role="button" tabIndex={0} aria-label={book.name} aria-pressed={book.code === picked} onClick={() => choose(book.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(book.code); } }} key={book.code}><title>{book.name}</title></path>;
      }))}
      {rings[1].books.map((book, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2) / rings[1].books.length; return <circle className="hm5-rondel" cx={fixed(ROSE + Math.cos(angle) * 342)} cy={fixed(ROSE + Math.sin(angle) * 342)} r="9" key={book.code} />; })}
      <circle className="hm5-rose-frame" cx={ROSE} cy={ROSE} r="356" /><circle className="hm5-rose-frame" cx={ROSE} cy={ROSE} r="364" />
      <circle className="hm5-rose-heart" cx={ROSE} cy={ROSE} r="80" /><path className="hm5-rose-cross" d="M392 340h16v42h30v16h-30v62h-16v-62h-30v-16h30z" />
      <circle cx={ROSE} cy={ROSE} r="330" fill={`url(#${id}-light)`} pointerEvents="none" />
      <g className="hm5-ring-turn" aria-hidden="true"><text className="hm5-ring-text"><textPath href={`#${id}-ring`} textLength={fixed(Math.PI * 2 * RING - 8)} lengthAdjust="spacing">{RING_WORDS}</textPath></text></g>
    </svg>
    <figcaption className={chosen ? "is-picked" : undefined} aria-live="polite">{chosen
      ? <><strong style={tone(chosen.section)}>{chosen.name}</strong><span>{chosen.chapters} {chosen.chapters === 1 ? "chapter" : "chapters"}</span><Link to={`/read/bsb/${chosen.code}/1`}>Read {chosen.name} 1</Link></>
      : "Thirty-nine books in the outer ring, twenty-seven within, the cross at the heart. Choose a pane to see its book."}</figcaption>
  </figure>;
}

/** The river's middle line and banks, flowing left to right and widening as it comes nearer. */
const RIVER = (() => {
  const centre: [number, number][] = [];
  let length = 0;
  for (let i = 0; i <= 96; i += 1) {
    const t = i / 96, x = -60 + t * 1720, y = 214 + Math.sin(t * Math.PI * 1.6 + 0.5) * 46 + t * 70;
    if (i) length += Math.hypot(x - centre[i - 1][0], y - centre[i - 1][1]);
    centre.push([x, y]);
  }
  const bank = (side: number) => centre.map(([x, y], i) => {
    const [px, py] = centre[Math.max(0, i - 1)], [nx, ny] = centre[Math.min(centre.length - 1, i + 1)], size = Math.hypot(nx - px, ny - py), half = (26 + (i / 96) * 24) * side;
    return [x - ((ny - py) / size) * half, y + ((nx - px) / size) * half] as [number, number];
  });
  const far = bank(-1), near = bank(1);
  const line = (points: [number, number][]) => points.map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L");
  return { centre: `M${line(centre)}`, water: `M${line(far)}L${line([...near].reverse())}Z`, farEdge: `M${line(far)}`, nearEdge: `M${line(near)}`, far, near, length };
})();
const at = (points: [number, number][], t: number) => points[Math.round(t * 96)];
const FRUIT = ["history", "poetry", "prophets", "gospels", "epistles", "revelation"];
const RIVER_RUN = MARQUEE.join("  ✦  ") + "  ✦  ";

/** A tree of life: twelve kinds of fruit around its crown. */
function TreeOfLife({ x, y, size }: { x: number; y: number; size: number }) {
  return <g className="hm5-tree">
    <path className="hm5-tree-trunk" d={`M${fixed(x - size * 0.07)} ${fixed(y)}Q${fixed(x)} ${fixed(y - size * 0.6)} ${fixed(x - size * 0.03)} ${fixed(y - size * 1.2)}L${fixed(x + size * 0.05)} ${fixed(y - size * 1.2)}Q${fixed(x + size * 0.04)} ${fixed(y - size * 0.6)} ${fixed(x + size * 0.09)} ${fixed(y)}Z`} />
    <circle className="hm5-tree-crown" cx={fixed(x)} cy={fixed(y - size * 1.5)} r={fixed(size * 0.6)} />
    {Array.from({ length: 12 }, (_, kind) => { const turn = (kind / 12) * Math.PI * 2; return <circle className="hm5-fruit" cx={fixed(x + Math.cos(turn) * size * 0.4)} cy={fixed(y - size * 1.5 + Math.sin(turn) * size * 0.4)} r={fixed(size * 0.075)} style={tone(FRUIT[kind % 6])} key={kind} />; })}
  </g>;
}

export function RiverOfLife() {
  const id = useId().replace(/:/g, "");
  const measure = useRef<SVGTextElement>(null);
  const [run, setRun] = useState(0);
  useLayoutEffect(() => {
    const read = () => setRun(measure.current?.getComputedTextLength() ?? 0);
    read();
    document.fonts?.ready.then(read).catch((error: unknown) => console.error("home_mockup5: fonts did not finish loading for the river text", error));
  }, []);
  const behind = [0.14, 0.32, 0.5, 0.68, 0.86].map((t) => { const [x, y] = at(RIVER.far, t); return { x, y: y - 4, size: 30 + t * 34 }; });
  const front = [0.24, 0.42, 0.6, 0.78, 0.95].flatMap((t) => { const [x, y] = at(RIVER.near, t), size = 26 + t * 12; return 398 - size * 2.1 > y ? [{ x, y: 398, size }] : []; });
  return <figure className="hm5-river">
    <svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path className="hm5-land-far" d="M0 400V128C160 112 300 132 470 118S780 96 960 116 1300 136 1600 112V400Z" />
      <g className="hm5-source"><circle cx="40" cy="196" r="96" className="hm5-source-ring" /><circle cx="40" cy="196" r="64" className="hm5-source-ring" /><circle cx="40" cy="196" r="40" className="hm5-source-sun" /></g>
      {behind.map((tree) => <TreeOfLife {...tree} key={tree.x} />)}
      <path className="hm5-water" d={RIVER.water} /><path className="hm5-bank" d={RIVER.farEdge} /><path className="hm5-bank" d={RIVER.nearEdge} />
      <path id={`${id}-flow`} d={RIVER.centre} fill="none" />
      <text className="hm5-river-text" ref={measure} visibility="hidden">{RIVER_RUN}</text>
      {run > 0 && <text className="hm5-river-text" dy="6"><textPath href={`#${id}-flow`} startOffset={stillMotion() ? 0 : -run}>{RIVER_RUN + RIVER_RUN}{!stillMotion() && <animate attributeName="startOffset" from={-run} to={0} dur={`${Math.round(run / 38)}s`} repeatCount="indefinite" />}</textPath></text>}
      {front.map((tree) => <TreeOfLife {...tree} key={tree.x} />)}
    </svg>
    <figcaption>“a river of the water of life, as clear as crystal” · <Link to="/read/bsb/REV/22?hl=1">Revelation 22:1</Link></figcaption>
  </figure>;
}
