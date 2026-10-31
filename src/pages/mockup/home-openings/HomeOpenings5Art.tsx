// MOCK-UP: the rose window of /home_mockup5 (owner, 2026-10-30): the 66 books as panes of glass, laid out as a mirror, with the
// marquee bent into a ring around it. Choosing a pane names its book. (The other drawings were removed on the owner's word;
// a copy is in design/home-openings-5-removed/.)
import { useId, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { MARQUEE } from "./HomeOpenings";

const fixed = (value: number) => value.toFixed(1);
const tone = (section: string) => ({ "--tone": `var(--${section})` } as CSSProperties);

/** The 66 books in order, with their chapter counts in the Berean Standard Bible. */
function useBooks() {
  const catalog = useCatalog();
  return useMemo(() => {
    const bible = catalog.translations.find((item) => item.slug === "bsb");
    return catalog.books.flatMap((book) => { const chapters = bible?.books[book.code]?.length; return chapters ? [{ ...book, chapters }] : []; });
  }, [catalog]);
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
