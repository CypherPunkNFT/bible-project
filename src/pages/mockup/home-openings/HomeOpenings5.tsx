import { HEBREW, WALL_ROWS } from "./HomeOpenings5.shared";
// MOCK-UP: two openings for /home_mockup5 (owner, 2026-10-30: "lets get very creative"; then "we keep only B and F"). B: the
// rose window, the marquee bent into a ring round it. F: the marquee multiplied into a wall of moving words. The letters stay
// as first shown; a copy of the four removed openings is in design/home-openings-5-removed/. Every English phrase is the
// Berean Standard Bible's own wording.
import type { CSSProperties } from "react";
import { OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { MARQUEE } from "./HomeOpenings.shared";
import { RoseWindow } from "./HomeOpenings5Art";
import "./home-openings5.css";

export const OPENINGS_5 = [
  { id: "b", name: "Rose window" },
  { id: "f", name: "Word wall" },
] as const;
export type Opening5Id = (typeof OPENINGS_5)[number]["id"];

const WALL = ["The heavens declare the glory of God", "Your word is a lamp to my feet and a light to my path", "The unfolding of Your words gives light", "Open my eyes that I may see wondrous things from Your law", "How sweet are Your words to my taste", "more precious than gold, than much pure gold", "The Light shines in the darkness, and the darkness has not overcome it", "I am the vine and you are the branches", "Heaven and earth will pass away, but My words will never pass away", "Now look to the heavens and count the stars", "a river of the water of life, as clear as crystal", "the leaves of the tree are for the healing of the nations", ...MARQUEE];
const GREEK = ["Ἐν ἀρχῇ ἦν ὁ λόγος", "Καὶ ὁ λόγος σὰρξ ἐγένετο", "καὶ τὸ φῶς ἐν τῇ σκοτίᾳ φαίνει", "Οὕτω γὰρ ἠγάπησεν ὁ Θεὸς τὸν κόσμον", "καὶ ἡ ἀλήθεια ἐλευθερώσει ὑμᾶς", "τὸ δὲ ῥῆμα Κυρίου μένει εἰς τὸν αἰῶνα", "οἱ δὲ λόγοι μου οὐ μὴ παρέλθωσι"];
const POOLS: Record<string, string[]> = { hebrew: HEBREW, greek: GREEK };
const RIGHT_TO_LEFT = new Set(["hebrew", "arabic"]);
const wordsFor = (pool: string[], row: number) => Array.from({ length: 8 }, (_, step) => pool[(row * 5 + step) % pool.length]);

/** The marquee multiplied into a wall: rows of Scripture in English, Hebrew and Greek sliding both ways behind the title.
 *  `rows` and `pools` let a version swap a row's language: a row's kind names its style and, if listed, its words. */
export function WordWall({ rows = WALL_ROWS, pools = {} }: { rows?: readonly (readonly [string, number])[]; pools?: Record<string, string[]> }) {
  return <div className="hm5-wall" lang="en" translate="no" aria-hidden="true">
    {rows.map(([kind, seconds], row) => {
      const words = wordsFor(pools[kind] ?? POOLS[kind] ?? WALL, row);
      return <div className={`hm5-wall-row hm5-wall-${kind}`} style={{ "--speed": `${seconds}s` } as CSSProperties} data-reverse={row % 2 ? true : undefined} key={row}>
        <div className="hm5-wall-track">{["first", "second"].map((copy) => <span key={copy}>{words.map((phrase, place) => <b dir={RIGHT_TO_LEFT.has(kind) ? "rtl" : undefined} key={`${place}-${phrase}`}>{phrase}</b>)}</span>)}</div>
      </div>;
    })}
  </div>;
}

const VIEWS: Record<Opening5Id, (props: OpeningProps) => JSX.Element> = {
  b: (props) => <section className="home-hero home-wrap hm5-row" aria-labelledby="home-title"><OpeningCopy {...props} /><RoseWindow /></section>,
  // No marquee under the word wall: the five doorways end its first screen instead (owner, 2026-10-30).
  f: (props) => <section className="hm5-f" aria-labelledby="home-title"><WordWall /><OpeningCopy {...props} /></section>,
};

export function Opening5({ version, ...props }: OpeningProps & { version: Opening5Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
