// MOCK-UP: the city of chapters, version F of /home_mockup6 (owner, 2026-10-31: "with the design of D and E do one with every
// chapter, but we don't need to name them at all. They can be tiny little pieces, just like the first one"; then "clicking
// that stone should update the continue button, and hitting that should take us there"). The wall is laid in nine courses of
// small stones, one for each of the Bible's 1,189 chapters, in reading order: clockwise from the north-west tower round the
// outer course, then on into the next. Each stone takes its book's section colour, so the parts of the Bible run round the
// wall in bands. Clicking a stone makes the centre button "Continue" to that chapter in the Berean Standard Bible. The courses
// appear from the outside in, as the foundations of the city (D) do (owner, 2026-10-31).
import { ArrowRight, BookOpen, GraduationCap, HandHeart, Library, Map as MapIcon, ShieldCheck, type LucideIcon } from "lucide-react";
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { HOME_PATHS } from "@/components/home/collection-data";
import { OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { HEBREW, WordWall } from "./HomeOpenings5";
import { useBooks } from "./HomeOpenings5Art";
import { GATES, SECTION_NAMES, stone, tone } from "./HomeOpenings6City";
import { SquareColumn } from "./HomeOpenings6Squares";

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
      return here.map((chapter, place) => ({ ...chapter, course: index, d: stone(place / here.length, (place + 1) / here.length, course.outer, course.inner) }));
    });
  }, [books]);
}

/** Version G's two columns beside the city (owner, 2026-10-31: "Bible study apologetics on one side, and Atlas resources and
 *  ... sources on the right side, vertical"). Icons are the header's; the short lines are the home page's own. */
const path = (title: string) => HOME_PATHS.find((item) => item.title === title);
interface Wing { title: string; to: string; line: string; icon: LucideIcon }
const WINGS: Record<"left" | "right", Wing[]> = {
  left: [
    { title: "Bible", to: "/bible", line: path("Bible")?.subtitle ?? "", icon: BookOpen },
    { title: "Study", to: "/study", line: path("Study")?.subtitle ?? "", icon: GraduationCap },
    { title: "Apologetics", to: "/apologetics", line: path("Apologetics")?.subtitle ?? "", icon: ShieldCheck },
  ],
  right: [
    { title: "Atlas", to: path("Atlas")?.to ?? "/study/atlas", line: path("Atlas")?.subtitle ?? "", icon: MapIcon },
    { title: "Resources", to: "/resources", line: "Help for the road", icon: HandHeart },
    { title: "Sources", to: "/sources", line: "Explore every source", icon: Library },
  ],
};

/** I's small row of Hebrew, sliding where the gold marquee runs on G and H (owner, 2026-10-31). */
function HebrewRow() {
  const words = [...HEBREW, ...HEBREW];
  return <div className="hm5-wall-row hm5-wall-hebrew hm6-hebrew-row" style={{ "--speed": "160s" } as CSSProperties} aria-hidden="true">
    <div className="hm5-wall-track">{["first", "second"].map((copy) => <span key={copy}>{words.map((phrase, place) => <b dir="rtl" key={`${place}-${phrase}`}>{phrase}</b>)}</span>)}</div>
  </div>;
}

/** I's own words, in the opening's places (owner, 2026-10-31): the title, two lines under it, the button, and the opening's
 *  usual lead and counts under that. */
function StandsForeverCopy({ resume, resumeLabel, versions, languages }: OpeningProps) {
  return <div className="home-hero-copy">
    <p className="home-eyebrow"><span className="home-live-dot" />The Bible, open to you</p>
    <h1 id="home-title">God’s Word<br /><em>Stands Forever.</em></h1>
    <p className="home-hero-lead">Written over fifteen centuries.<br />Carried through persecution and fire.</p>
    <div className="home-hero-actions"><Link className="home-button" to={resume}><BookOpen size={17} aria-hidden />{resumeLabel}<ArrowRight size={17} aria-hidden /></Link></div>
    <p className="home-hero-foot">Read the Scriptures. Follow the connections.<br />Bring your questions. See the bigger story.<span>{versions} Bible versions · {languages} languages</span></p>
  </div>;
}

function WingColumn({ side }: { side: "left" | "right" }) {
  return <nav className={`hm6-wing hm6-wing-${side}`} aria-label={side === "left" ? "Read and study" : "Explore"}>
    {WINGS[side].map(({ title, to, line, icon: Icon }) => <Link to={to} key={title}><Icon size={20} strokeWidth={1.5} aria-hidden /><strong>{title}</strong><span>{line}</span></Link>)}
  </nav>;
}

/** `wings` adds G's two columns of links beside the city; `squares` adds H's doorway squares instead; `wall` sets I's moving
 *  word wall behind it all. */
export function CityOfChapters({ wings = false, squares = false, wall = false, ...props }: OpeningProps & { wings?: boolean; squares?: boolean; wall?: boolean }) {
  const stones = useStones();
  const [picked, setPicked] = useState(-1);
  const chosen = stones[picked];
  const choose = (event: MouseEvent) => { const index = Number((event.target as Element).getAttribute("data-stone") ?? -1); if (index >= 0) setPicked((now) => (now === index ? -1 : index)); };
  const copy = chosen ? { ...props, resume: `/read/bsb/${chosen.code}/${chosen.chapter}`, resumeLabel: `Continue: ${chosen.name} ${chosen.chapter}` } : props;
  return <section className={`hm6-stage hm6-f${wings ? " hm6-g" : ""}${wall ? " hm6-i" : ""}`} aria-labelledby="home-title">
    {wall && <><WordWall /><HebrewRow /></>}
    {wings && <><WingColumn side="left" /><WingColumn side="right" /></>}
    {squares && <><SquareColumn side="left" /><SquareColumn side="right" /></>}
    <svg className="hm6-art hm6-city hm6-chapters" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs><radialGradient id="hm6-chapters-lamp"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
      <rect className="hm6-city-ground" x="70" y="70" width="860" height="860" />
      <circle cx="500" cy="500" r="330" fill="url(#hm6-chapters-lamp)" />
      <g className="hm6-chapter-stones" onClick={choose}>
        {stones.map((item, index) => <path className={index === picked ? "is-picked" : undefined} d={item.d} style={{ ...tone(item.section), animationDelay: `${item.course * 70}ms` } as CSSProperties} data-stone={index} key={`${item.code}-${item.chapter}`}><title>{`${item.name} ${item.chapter}`}</title></path>)}
      </g>
      {chosen && <path className="hm6-chapter-ring" d={chosen.d} style={tone(chosen.section) as CSSProperties} />}
      <rect className="hm6-wall" x="70" y="70" width="860" height="860" />
      {[[70, 70], [930, 70], [70, 930], [930, 930]].map(([x, y]) => <rect className="hm6-tower" x={x - 16} y={y - 16} width="32" height="32" key={`${x}-${y}`} />)}
      {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`} />)}
    </svg>
    {wall ? <StandsForeverCopy {...copy} /> : <OpeningCopy {...copy} />}
    <p className="hm6-note" aria-live="polite">{chosen
      ? <><strong style={tone(chosen.section)}>{chosen.name} {chosen.chapter}</strong> · {SECTION_NAMES[chosen.section] ?? chosen.section}</>
      : <>“the twelve gates were twelve pearls” · <Link to="/read/bsb/REV/21?hl=21">Revelation 21:21</Link> · {stones.length.toLocaleString("en")} chapters in the wall</>}</p>
  </section>;
}
