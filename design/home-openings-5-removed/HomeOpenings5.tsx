// MOCK-UP: six openings for /home_mockup5 (owner, 2026-10-30: "make a mockup5 with more artworks and different ideas, marquee
// included can change into other structure ... lets get very creative"). The marquee takes a new shape in each: a band under the
// threads, a ring round the rose window, the river itself, the edge of the bookshelf, a column beside the lamp-lit page, and a
// whole wall of moving words. Every English phrase is the Berean Standard Bible's own wording.
import { useCatalog } from "@/lib/catalog";
import { loadChapterPlain } from "@/lib/data";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { GoldMarquee, MARQUEE, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { RiverOfLife, RoseWindow, WovenArcs } from "./HomeOpenings5Art";
import { fixed, useBooks } from "./HomeOpenings5Art.shared";
import "./home-openings5.css";

export const OPENINGS_5 = [
  { id: "a", name: "Woven threads" },
  { id: "b", name: "Rose window" },
  { id: "c", name: "River of life" },
  { id: "d", name: "The shelf" },
  { id: "e", name: "Lamp to my feet" },
  { id: "f", name: "Word wall" },
] as const;
export type Opening5Id = (typeof OPENINGS_5)[number]["id"];

/** Every book standing on one shelf, as tall as it has chapters; each spine opens that book. The shelf's edge is the marquee. */
function Shelf() {
  const books = useBooks();
  const most = Math.max(1, ...books.map((book) => book.chapters));
  return <nav className="hm5-shelf" aria-label="The books of the Bible">
    {books.map((book, index) => <Link to={`/read/bsb/${book.code}/1`} className="hm5-spine" aria-label={`${book.name}, ${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}`} title={book.name}
      style={{ "--spine": `var(--${book.section}-tab)`, "--spine-ink": `var(--${book.section}-tab-ink)`, "--tall": fixed(0.4 + Math.sqrt(book.chapters / most) * 0.6), "--wide": fixed(1 + book.chapters / 50), animationDelay: `${index * 14}ms` } as CSSProperties} key={book.code}>
      <span>{book.name}</span>
    </Link>)}
  </nav>;
}

/** An oil lamp of fired clay, its flame where the light falls from. */
function ClayLamp() {
  return <svg className="hm5-clay-lamp" viewBox="0 0 260 150" aria-hidden="true">
    <ellipse className="hm5-lamp-shadow" cx="128" cy="140" rx="100" ry="7" />
    <path className="hm5-lamp-handle" d="M46 98C22 94 12 76 24 64C33 56 47 62 52 76" />
    <path className="hm5-lamp-body" d="M40 104C40 76 78 62 122 62C152 62 178 70 198 82L234 92C246 95 246 109 234 112L198 118C178 128 152 136 122 136C78 136 40 126 40 104Z" />
    <path className="hm5-lamp-band" d="M58 102C92 116 158 116 192 102" /><ellipse className="hm5-lamp-hole" cx="118" cy="80" rx="24" ry="6" />
    <g className="hm5-flame"><path className="hm5-flame-outer" d="M232 92C219 80 225 56 237 36C248 58 254 80 242 92Z" /><path className="hm5-flame-inner" d="M235 90C229 82 232 70 238 60C243 72 245 84 239 90Z" /></g>
  </svg>;
}

const FIRST_VERSE = 89, LAST_VERSE = 136;

/** Psalm 119 set as one page, dim until the lamp's light (or the pointer) falls on it. */
function LampPage() {
  const catalog = useCatalog();
  const page = useRef<HTMLDivElement>(null);
  const [verses, setVerses] = useState<[string, string][]>([]);
  useEffect(() => {
    let live = true;
    const labels = catalog.translations.find((item) => item.slug === "bsb")?.books.PSA ?? [];
    loadChapterPlain("bsb", "PSA", labels, "119")
      .then((plain) => { if (live) setVerses(Object.entries(plain).filter(([id]) => { const verse = Number(id.split(":")[1]); return verse >= FIRST_VERSE && verse <= LAST_VERSE; })); })
      .catch((error: unknown) => console.error("home_mockup5: Psalm 119 (BSB) did not load for the lamp page", error));
    return () => { live = false; };
  }, [catalog]);
  const follow = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    page.current?.style.setProperty("--lx", `${Math.round(event.clientX - box.left)}px`);
    page.current?.style.setProperty("--ly", `${Math.round(event.clientY - box.top)}px`);
  };
  const rest = () => { page.current?.style.removeProperty("--lx"); page.current?.style.removeProperty("--ly"); };
  const text = (lit: boolean) => <p className={`hm5-lamp-text${lit ? " hm5-lamp-lit" : ""}`} aria-hidden={lit || undefined}>
    {verses.map(([id, words]) => <span className={id === "119:105" ? "is-verse" : undefined} key={id}><sup>{id.split(":")[1]}</sup>{words} </span>)}
  </p>;
  return <div className="hm5-lamp-page" ref={page} onPointerMove={follow} onPointerLeave={rest}>
    {text(false)}{text(true)}
    <ClayLamp />
    <p className="hm5-lamp-note"><Link to="/read/bsb/PSA/119?hl=105">Psalm 119:{FIRST_VERSE}–{LAST_VERSE}</Link> · move the light across the page</p>
  </div>;
}

/** The marquee stood on end: a gold column down the right-hand edge, its phrases rising. */
function SideMarquee() {
  const run = (key: string) => <div className="hm5-side-run" key={key}>{MARQUEE.map((words) => <span key={words}>{words}</span>)}</div>;
  return <div className="hm5-side" aria-hidden="true"><div className="hm5-side-track">{run("first")}{run("second")}</div></div>;
}

const WALL = ["The heavens declare the glory of God", "Your word is a lamp to my feet and a light to my path", "The unfolding of Your words gives light", "Open my eyes that I may see wondrous things from Your law", "How sweet are Your words to my taste", "more precious than gold, than much pure gold", "The Light shines in the darkness, and the darkness has not overcome it", "I am the vine and you are the branches", "Heaven and earth will pass away, but My words will never pass away", "Now look to the heavens and count the stars", "a river of the water of life, as clear as crystal", "the leaves of the tree are for the healing of the nations", ...MARQUEE];
// The Hebrew is the Westminster Leningrad Codex and the Greek the Textus Receptus, as in the site's reader (cantillation marks
// left off the Hebrew): Genesis 1:1, Psalm 119:105, Isaiah 40:8, Psalm 19:1, Deuteronomy 6:4, Psalm 23:1; John 1:1, 1:14, 1:5,
// 3:16, 8:32, 1 Peter 1:25, Matthew 24:35.
const HEBREW = ["בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", "נֵר־לְרַגְלִי דְבָרֶךָ וְאוֹר לִנְתִיבָתִי", "וּדְבַר־אֱלֹהֵינוּ יָקוּם לְעוֹלָם", "הַשָּׁמַיִם מְסַפְּרִים כְּבוֹד־אֵל", "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", "יְהוָה רֹעִי לֹא אֶחְסָר"];
const GREEK = ["Ἐν ἀρχῇ ἦν ὁ λόγος", "Καὶ ὁ λόγος σὰρξ ἐγένετο", "καὶ τὸ φῶς ἐν τῇ σκοτίᾳ φαίνει", "Οὕτω γὰρ ἠγάπησεν ὁ Θεὸς τὸν κόσμον", "καὶ ἡ ἀλήθεια ἐλευθερώσει ὑμᾶς", "τὸ δὲ ῥῆμα Κυρίου μένει εἰς τὸν αἰῶνα", "οἱ δὲ λόγοι μου οὐ μὴ παρέλθωσι"];
const WALL_ROWS = [["serif", 150], ["caps", 90], ["hebrew", 170], ["sans", 120], ["greek", 160], ["gold", 150], ["caps", 100], ["hebrew", 180], ["upright", 140], ["greek", 175]] as const;
const wordsFor = (kind: string, row: number) => {
  const pool = kind === "hebrew" ? HEBREW : kind === "greek" ? GREEK : WALL;
  return Array.from({ length: 8 }, (_, step) => pool[(row * 5 + step) % pool.length]);
};

/** The marquee multiplied into a wall: rows of Scripture in English, Hebrew and Greek sliding both ways behind the title. */
function WordWall() {
  return <div className="hm5-wall" aria-hidden="true">
    {WALL_ROWS.map(([kind, seconds], row) => {
      const words = wordsFor(kind, row);
      return <div className={`hm5-wall-row hm5-wall-${kind}`} style={{ "--speed": `${seconds}s` } as CSSProperties} data-reverse={row % 2 ? true : undefined} key={row}>
        <div className="hm5-wall-track">{["first", "second"].map((copy) => <span key={copy}>{words.map((phrase, place) => <b dir={kind === "hebrew" ? "rtl" : undefined} key={`${place}-${phrase}`}>{phrase}</b>)}</span>)}</div>
      </div>;
    })}
  </div>;
}

const VIEWS: Record<Opening5Id, (props: OpeningProps) => JSX.Element> = {
  a: (props) => <><section className="hm5-centre hm5-a" aria-labelledby="home-title"><WovenArcs /><OpeningCopy {...props} /></section><GoldMarquee /></>,
  b: (props) => <section className="home-hero home-wrap hm5-row" aria-labelledby="home-title"><OpeningCopy {...props} /><RoseWindow /></section>,
  c: (props) => <section className="hm5-centre hm5-c" aria-labelledby="home-title"><OpeningCopy {...props} /><RiverOfLife /></section>,
  d: (props) => <><section className="hm5-centre hm5-d" aria-labelledby="home-title"><OpeningCopy {...props} /><p className="hm5-shelf-label">Sixty-six books on one shelf · choose one to begin</p><Shelf /></section><GoldMarquee /></>,
  e: (props) => <><section className="hm5-e" aria-labelledby="home-title"><div className="hm5-e-copy"><OpeningCopy {...props} /></div><LampPage /><SideMarquee /></section><div className="hm5-phone-band"><GoldMarquee /></div></>,
  f: (props) => <><section className="hm5-f" aria-labelledby="home-title"><WordWall /><OpeningCopy {...props} /></section><GoldMarquee /></>,
};

export function Opening5({ version, ...props }: OpeningProps & { version: Opening5Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
