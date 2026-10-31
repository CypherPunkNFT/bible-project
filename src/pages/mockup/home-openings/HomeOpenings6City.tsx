// MOCK-UP: the city as a Bible explorer, version E of /home_mockup6 (owner, 2026-10-30: "a second version of the city where the
// colors are actually the colors of the Bible segments that we have. And they're segmented to actually be the books of the
// Bible. So you can click the section and then inside it'll say continue and then that book"). The wall of Revelation 21 is
// laid in two courses: the Old Testament's 39 books outside, the New Testament's 27 within, each in its section's colour and in
// reading order clockwise from the north-west tower. The twelve pearl gates stand in the outer wall. Choosing a book turns the
// button at the centre into "Continue" for that book: where the reader left off in it, or else its first chapter.
import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { lastReadPath } from "@/lib/last-read";
import { OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { useBooks } from "./HomeOpenings5Art";

const fixed = (value: number) => value.toFixed(1);
export const tone = (section: string) => ({ "--tone": `var(--${section})` } as CSSProperties);
export const SECTION_NAMES: Record<string, string> = { history: "Law & history", poetry: "Poetry & wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Letters", revelation: "Revelation" };
export const GATES = [250, 500, 750].flatMap((along) => [[along, 70], [along, 930], [70, along], [930, along]]);
/** The two courses of the wall, as distances in from the city's edge. */
const COURSES = [{ first: 1, last: 39, outer: 84, inner: 134 }, { first: 40, last: 66, outer: 142, inner: 184 }];

/** A point on the square `inset` in from the city's edge, `share` of the way round clockwise from the north-west corner. */
export function onWall(share: number, inset: number): [number, number] {
  const length = 1000 - inset * 2, side = Math.min(3, Math.floor(share * 4)), along = (share * 4 - side) * length;
  return ([[inset + along, inset], [1000 - inset, inset + along], [1000 - inset - along, 1000 - inset], [inset, 1000 - inset - along]] as [number, number][])[side];
}

/** One book's stretch of wall between two shares of the way round, turning any corner it meets. */
export function stone(start: number, end: number, outer: number, inner: number) {
  const shares = [start, ...[0.25, 0.5, 0.75].filter((corner) => corner > start && corner < end), end];
  const edge = (inset: number) => shares.map((share) => onWall(share, inset));
  return `M${[...edge(outer), ...edge(inner).reverse()].map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`;
}

/** Where "Continue" goes for a book: the reader's last place in it, or its first chapter. */
function continueIn(book: { code: string; name: string }) {
  const last = lastReadPath();
  const [, , , code, chapter] = last?.split("/") ?? [];
  return last && code === book.code ? { resume: last, resumeLabel: `Continue: ${book.name} ${chapter}` } : { resume: `/read/bsb/${book.code}/1`, resumeLabel: `Continue: ${book.name} 1` };
}

export function CityOfBooks(props: OpeningProps) {
  const books = useBooks();
  const [picked, setPicked] = useState("");
  const chosen = books.find((book) => book.code === picked);
  const choose = (code: string) => setPicked((now) => (now === code ? "" : code));
  const press = (code: string) => (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(code); } };
  return <section className="hm6-stage hm6-e" aria-labelledby="home-title">
    <svg className="hm6-art hm6-city hm6-books" viewBox="0 0 1000 1000">
      <defs><radialGradient id="hm6-books-lamp"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
      <rect className="hm6-city-ground" x="70" y="70" width="860" height="860" />
      <circle cx="500" cy="500" r="330" fill="url(#hm6-books-lamp)" />
      {COURSES.map((course) => {
        const stones = books.filter((book) => book.num >= course.first && book.num <= course.last);
        return stones.map((book, index) => {
          const start = index / stones.length, end = (index + 1) / stones.length, middle = (start + end) / 2, side = Math.min(3, Math.floor(middle * 4));
          const [x, y] = onWall(middle, (course.outer + course.inner) / 2);
          return <g className={`hm6-book${book.code === picked ? " is-picked" : ""}`} style={{ ...tone(book.section), animationDelay: `${book.num * 18}ms` }} role="button" tabIndex={0}
            aria-label={book.name} aria-pressed={book.code === picked} onClick={() => choose(book.code)} onKeyDown={press(book.code)} key={book.code}>
            <path d={stone(start, end, course.outer, course.inner)} /><text transform={`translate(${fixed(x)} ${fixed(y)}) rotate(${[0, 90, 0, -90][side]})`}>{book.code}</text><title>{book.name}</title>
          </g>;
        });
      })}
      <rect className="hm6-wall" x="70" y="70" width="860" height="860" />
      {[[70, 70], [930, 70], [70, 930], [930, 930]].map(([x, y]) => <rect className="hm6-tower" x={x - 16} y={y - 16} width="32" height="32" key={`${x}-${y}`} />)}
      {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`}><title>A gate of pearl</title></circle>)}
    </svg>
    <OpeningCopy {...props} {...(chosen ? continueIn(chosen) : {})} />
    <p className="hm6-note" aria-live="polite">{chosen
      ? <><strong style={tone(chosen.section)}>{chosen.name}</strong> · {SECTION_NAMES[chosen.section] ?? chosen.section} · {chosen.chapters} {chosen.chapters === 1 ? "chapter" : "chapters"}</>
      : <>“the twelve gates were twelve pearls” · <Link to="/read/bsb/REV/21?hl=21">Revelation 21:21</Link> · Choose a book in the wall</>}</p>
  </section>;
}
