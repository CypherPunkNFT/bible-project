// MOCK-UP: the city of chapters, version F of /home_mockup6 (owner, 2026-10-31: "with the design of D and E do one with every
// chapter, but we don't need to name them at all. They can be tiny little pieces, just like the first one"; then "clicking
// that stone should update the continue button, and hitting that should take us there"). The wall is laid in nine courses of
// small stones, one for each of the Bible's 1,189 chapters, in reading order: clockwise from the north-west tower round the
// outer course, then on into the next. Each stone takes its book's section colour, so the parts of the Bible run round the
// wall in bands. Clicking a stone makes the centre button "Continue" to that chapter in the Berean Standard Bible.
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { useBooks } from "./HomeOpenings5Art";
import { GATES, SECTION_NAMES, stone, tone } from "./HomeOpenings6City";

/** Nine courses, each 10 units deep with 2 between, from just inside the outer wall. */
const COURSES = Array.from({ length: 9 }, (_, course) => ({ outer: 84 + course * 12, inner: 94 + course * 12 }));
const perimeter = (inset: number) => 4 * (1000 - inset * 2);

interface Chapter { code: string; name: string; section: string; chapter: number }

/** Every chapter in order, shared out among the courses by their length, so the stones are near enough one size. */
function useStones() {
  const books = useBooks();
  return useMemo(() => {
    const chapters: Chapter[] = books.flatMap((book) => Array.from({ length: book.chapters }, (_, index) => ({ code: book.code, name: book.name, section: book.section, chapter: index + 1 })));
    const lengths = COURSES.map((course) => perimeter((course.outer + course.inner) / 2)), total = lengths.reduce((sum, length) => sum + length, 0);
    let before = 0, taken = 0;
    return COURSES.flatMap((course, index) => {
      before += lengths[index];
      const until = Math.round((chapters.length * before) / total), here = chapters.slice(taken, until);
      taken = until;
      return here.map((chapter, place) => ({ ...chapter, d: stone(place / here.length, (place + 1) / here.length, course.outer, course.inner) }));
    });
  }, [books]);
}

export function CityOfChapters(props: OpeningProps) {
  const stones = useStones();
  const [picked, setPicked] = useState(-1);
  const chosen = stones[picked];
  const choose = (event: MouseEvent) => { const index = Number((event.target as Element).getAttribute("data-stone") ?? -1); if (index >= 0) setPicked((now) => (now === index ? -1 : index)); };
  const copy = chosen ? { ...props, resume: `/read/bsb/${chosen.code}/${chosen.chapter}`, resumeLabel: `Continue: ${chosen.name} ${chosen.chapter}` } : props;
  return <section className="hm6-stage hm6-d hm6-e hm6-f" aria-labelledby="home-title">
    <svg className="hm6-art hm6-city hm6-chapters" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs><radialGradient id="hm6-chapters-lamp"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
      <rect className="hm6-city-ground" x="70" y="70" width="860" height="860" />
      <circle cx="500" cy="500" r="330" fill="url(#hm6-chapters-lamp)" />
      <g className="hm6-chapter-stones" onClick={choose}>
        {stones.map((item, index) => <path className={index === picked ? "is-picked" : undefined} d={item.d} style={tone(item.section) as CSSProperties} data-stone={index} key={`${item.code}-${item.chapter}`}><title>{`${item.name} ${item.chapter}`}</title></path>)}
      </g>
      {chosen && <path className="hm6-chapter-ring" d={chosen.d} style={tone(chosen.section) as CSSProperties} />}
      <rect className="hm6-wall" x="70" y="70" width="860" height="860" />
      {[[70, 70], [930, 70], [70, 930], [930, 930]].map(([x, y]) => <rect className="hm6-tower" x={x - 16} y={y - 16} width="32" height="32" key={`${x}-${y}`} />)}
      {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`} />)}
    </svg>
    <OpeningCopy {...copy} />
    <p className="hm6-note" aria-live="polite">{chosen
      ? <><strong style={tone(chosen.section)}>{chosen.name} {chosen.chapter}</strong> · {SECTION_NAMES[chosen.section] ?? chosen.section}</>
      : <>“the twelve gates were twelve pearls” · <Link to="/read/bsb/REV/21?hl=21">Revelation 21:21</Link> · {stones.length.toLocaleString("en")} chapters in the wall</>}</p>
  </section>;
}
