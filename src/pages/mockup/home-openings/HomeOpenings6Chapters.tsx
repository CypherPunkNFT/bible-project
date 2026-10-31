// MOCK-UP: the city of chapters, version F of /home_mockup6 (owner, 2026-10-31: "with the design of D and E do one with every
// chapter, but we don't need to name them at all. They can be tiny little pieces, just like the first one"; then "clicking
// that stone should update the continue button, and hitting that should take us there"). The wall is laid in nine courses of
// small stones, one for each of the Bible's 1,189 chapters, in reading order: clockwise from the north-west tower round the
// outer course, then on into the next. Each stone takes its book's section colour, so the parts of the Bible run round the
// wall in bands. Clicking a stone makes the centre button "Continue" to that chapter in the Berean Standard Bible. The courses
// appear from the outside in, as the foundations of the city (D) do (owner, 2026-10-31).
import { ArrowRight, BookOpen, GraduationCap, HandHeart, Library, Map as MapIcon, ShieldCheck, type LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { HOME_PATHS } from "@/components/home/collection-data";
import { OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { WALL_ROWS, WordWall } from "./HomeOpenings5";
import { useBooks } from "./HomeOpenings5Art";
import { GATES, SECTION_NAMES, stone, tone } from "./HomeOpenings6City";
import { SquareColumn, useSquareRoom } from "./HomeOpenings6Squares";

/** Nine courses, each 10 units deep with 2 between, from just inside the outer wall. */
const COURSES = Array.from({ length: 9 }, (_, course) => ({ outer: 84 + course * 12, inner: 94 + course * 12 }));
const perimeter = (inset: number) => 4 * (1000 - inset * 2);
/** A mock-up can lay the chapters inside the wall as a brick wall instead of courses round it (/home_mobile_mockups, owner,
 *  2026-10-31: "they can just be stacked like bricks ... inside of the twelve pearl gates square"). False everywhere else. */
export const BrickCity = createContext(false);
/** The bricks: rows 25 bricks across inside the wall, every other row set half a brick over with a plain half brick at each
 *  end, as a wall is laid; the chapters run left to right, top to bottom, and any bricks left over in the last row are plain. */
const BRICKS = { left: 84, size: 832, per: 25 };
function brickRows(count: number) {
  const { left, size, per } = BRICKS, width = size / per;
  let rows = 0;
  for (let slots = 0; slots < count; rows++) slots += rows % 2 ? per - 1 : per;
  const height = size / rows, bricks: { x: number; y: number; w: number; row: number; plain: boolean }[] = [];
  let taken = 0;
  for (let row = 0; row < rows; row++) {
    const y = left + row * height, shift = row % 2 ? width / 2 : 0;
    if (shift) bricks.push({ x: left, y, w: shift, row, plain: true });
    for (let i = 0; i < (shift ? per - 1 : per); i++) bricks.push({ x: left + shift + i * width, y, w: width, row, plain: taken++ >= count });
    if (shift) bricks.push({ x: left + size - shift, y, w: shift, row, plain: true });
  }
  const box = (x: number, y: number, w: number) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${height.toFixed(1)}h${(-w).toFixed(1)}Z`;
  return {
    rows,
    places: bricks.filter((brick) => !brick.plain).map((brick) => ({ row: brick.row, d: box(brick.x, brick.y, brick.w) })),
    plain: bricks.filter((brick) => brick.plain).map((brick) => box(brick.x, brick.y, brick.w)).join(""),
  };
}

interface Chapter { code: string; name: string; section: string; chapter: number }

/** Every chapter in order, shared out among the courses by their length, so the stones are near enough one size; or laid as
 *  bricks. `delay` brings the courses in from the outside, the bricks from the top. */
function useStones(bricks: boolean) {
  const books = useBooks();
  return useMemo(() => {
    const chapters: Chapter[] = books.flatMap((book) => Array.from({ length: book.chapters }, (_, index) => ({ code: book.code, name: book.name, section: book.section, chapter: index + 1 })));
    if (bricks) {
      const { rows, places, plain } = brickRows(chapters.length);
      return { plain, stones: chapters.map((chapter, index) => ({ ...chapter, d: places[index].d, delay: (places[index].row * 630) / rows })) };
    }
    const lengths = COURSES.map((course) => perimeter((course.outer + course.inner) / 2)), total = lengths.reduce((sum, length) => sum + length, 0);
    let before = 0, taken = 0;
    return { plain: "", stones: COURSES.flatMap((course, index) => {
      before += lengths[index];
      const until = Math.round((chapters.length * before) / total), here = chapters.slice(taken, until);
      taken = until;
      return here.map((chapter, place) => ({ ...chapter, delay: index * 70, d: stone(place / here.length, (place + 1) / here.length, course.outer, course.inner) }));
    }) };
  }, [books, bricks]);
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

/** I's word wall, with its last two rows in Arabic and Chinese in place of Greek and English, and the small row under it in
 *  Japanese in place of Hebrew (owner, 2026-10-31). Each is a public-domain Bible: the Chinese Union Version (1919, simplified
 *  characters), the Van Dyck Arabic (1865) and the Japanese Colloquial (1955). Arabic: John 1:1, 1:14, 1:5, 3:16, 8:32,
 *  1 Peter 1:25, Matthew 24:35, as the Greek row was. Japanese and Chinese: the English and Hebrew rows' verses, John 1:1,
 *  Psalm 119:105, Isaiah 40:8, John 3:16, Psalm 23:1, John 8:32, Matthew 24:35, Genesis 1:1, Psalm 19:1. */
const ARABIC = ["في البدء كان الكلمة", "والكلمة صار جسدا", "والنور يضيء في الظلمة", "لأنه هكذا أحب الله العالم", "والحق يحرركم", "وأما كلمة الرب فتثبت إلى الأبد", "ولكن كلامي لا يزول"];
const JAPANESE = ["初めに言があった", "あなたのみ言葉はわが足のともしび、わが道の光です", "われわれの神の言葉はとこしえに変ることはない", "神はそのひとり子を賜わったほどに、この世を愛して下さった", "主はわたしの牧者であって、わたしには乏しいことがない", "真理はあなたがたに自由を得させるであろう", "わたしの言葉は滅びることがない"];
const CHINESE = ["起初，神创造天地", "你的话是我脚前的灯，是我路上的光", "惟有我们神的话必永远立定", "诸天述说神的荣耀", "耶和华是我的牧者，我必不致缺乏", "神爱世人"];
/** Latin, the Vulgate (Clementine, public domain), one more row near the bottom (owner, 2026-10-31): John 1:1, Psalm 119:105,
 *  Isaiah 40:8, Genesis 1:1, John 3:16, Psalm 19:1, John 8:32, Psalm 23:1, Matthew 24:35 (the Vulgate numbers the psalms one lower). */
const LATIN = ["In principio erat Verbum", "Lucerna pedibus meis verbum tuum, et lumen semitis meis", "verbum autem Domini nostri manet in aeternum", "In principio creavit Deus caelum et terram", "Sic enim Deus dilexit mundum", "Caeli enarrant gloriam Dei", "et veritas liberabit vos", "Dominus regit me, et nihil mihi deerit", "verba autem mea non praeteribunt"];
const WALL_ROWS_I = [...WALL_ROWS.slice(0, -2), ["chinese", WALL_ROWS[WALL_ROWS.length - 2][1]], ["latin", 165], ["arabic", WALL_ROWS[WALL_ROWS.length - 1][1]]] as const;

/** I's small row of Japanese, sliding where the gold marquee runs on G and H (owner, 2026-10-31). */
function ScriptRow() {
  const words = [...JAPANESE, ...JAPANESE];
  return <div className="hm5-wall-row hm6-wall-japanese hm6-hebrew-row" lang="ja" style={{ "--speed": "160s" } as CSSProperties} aria-hidden="true">
    <div className="hm5-wall-track">{["first", "second"].map((copy) => <span key={copy}>{words.map((phrase, place) => <b key={`${place}-${phrase}`}>{phrase}</b>)}</span>)}</div>
  </div>;
}

/** I's own words, in the opening's places (owner, 2026-10-31): the title, two lines under it, the button, and the opening's
 *  usual lead and counts under that. */
function StandsForeverCopy({ resume, resumeLabel, versions, languages }: OpeningProps) {
  return <div className="home-hero-copy">
    <p className="home-eyebrow"><span className="home-live-dot" />The Bible, open to you</p>
    <h1 id="home-title">God’s Word<br /><em>Stands Forever.</em></h1>
    <p className="home-hero-lead">Written over fifteen centuries by ~40 authors.<br />Carried through persecution and fire.</p>
    <div className="home-hero-actions"><Link className="home-button" to={resume}><BookOpen size={17} aria-hidden />{resumeLabel}<ArrowRight size={17} aria-hidden /></Link></div>
    <p className="home-hero-foot"><span className="hm6-foot-lines">Read the Scriptures. Follow the connections.</span><span>{versions} Bible versions · {languages} languages</span></p>
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
  const { stones, plain } = useStones(useContext(BrickCity));
  const stage = useRef<HTMLElement>(null);
  useSquareRoom(stage, squares);
  const [picked, setPicked] = useState(-1);
  const chosen = stones[picked];
  const choose = (event: MouseEvent) => { const index = Number((event.target as Element).getAttribute("data-stone") ?? -1); if (index >= 0) setPicked((now) => (now === index ? -1 : index)); };
  // I opens on a chapter picked at random, a new one on each visit (owner, 2026-10-31).
  const seeded = useRef(false);
  useEffect(() => {
    if (!wall || seeded.current || !stones.length) return;
    seeded.current = true;
    setPicked(Math.floor(Math.random() * stones.length));
  }, [wall, stones.length]);
  const copy = chosen ? { ...props, resume: `/read/bsb/${chosen.code}/${chosen.chapter}`, resumeLabel: `Continue: ${chosen.name} ${chosen.chapter}` } : props;
  const note = <p className="hm6-note" aria-live="polite">{chosen
    ? <><strong style={tone(chosen.section)}>{chosen.name} {chosen.chapter}</strong> · {SECTION_NAMES[chosen.section] ?? chosen.section}</>
    : <>“the twelve gates were twelve pearls” · <Link to="/read/bsb/REV/21?hl=21">Revelation 21:21</Link> · {stones.length.toLocaleString("en")} chapters in the wall</>}</p>;
  return <section ref={stage} className={`hm6-stage hm6-f${wings ? " hm6-g" : ""}${wall ? " hm6-i" : ""}`} aria-labelledby="home-title">
    {wall && <><WordWall rows={WALL_ROWS_I} pools={{ chinese: CHINESE, latin: LATIN, arabic: ARABIC }} /><ScriptRow /></>}
    {wings && <><WingColumn side="left" /><WingColumn side="right" /></>}
    {squares && <><SquareColumn side="left" /><SquareColumn side="right" /></>}
    <svg className="hm6-art hm6-city hm6-chapters" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs><radialGradient id="hm6-chapters-lamp"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
      <rect className="hm6-city-ground" x="70" y="70" width="860" height="860" />
      <circle cx="500" cy="500" r="330" fill="url(#hm6-chapters-lamp)" />
      {plain && <path className="hm6-brick-plain" d={plain} />}
      <g className="hm6-chapter-stones" onClick={choose}>
        {stones.map((item, index) => <path className={index === picked ? "is-picked" : undefined} d={item.d} style={{ ...tone(item.section), animationDelay: `${item.delay}ms` } as CSSProperties} data-stone={index} key={`${item.code}-${item.chapter}`}><title>{`${item.name} ${item.chapter}`}</title></path>)}
      </g>
      {chosen && <path className="hm6-chapter-ring" d={chosen.d} style={tone(chosen.section) as CSSProperties} />}
      <rect className="hm6-wall" x="70" y="70" width="860" height="860" />
      {[[70, 70], [930, 70], [70, 930], [930, 930]].map(([x, y]) => <rect className="hm6-tower" x={x - 16} y={y - 16} width="32" height="32" key={`${x}-${y}`} />)}
      {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`} />)}
    </svg>
    {/* The pearls again, over the squares, which tuck in behind them (owner, 2026-10-31: "the boxes are below"). */}
    {squares && <svg className="hm6-art hm6-pearls-over" viewBox="0 0 1000 1000" aria-hidden="true">
      {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`} />)}
    </svg>}
    {wall ? <StandsForeverCopy {...copy} /> : <OpeningCopy {...copy} />}
    {wall ? <div className="hm6-note-frame">{note}</div> : note}
  </section>;
}
