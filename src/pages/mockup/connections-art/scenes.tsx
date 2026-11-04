// Four settings for the Connections heading drawing: the open Bible in front, books in the background as soft coloured
// silhouettes with no lines. All of them play the same 16-second loop: threads joining one colour to itself, then
// threads joining two different colours.
import type { ReactNode } from "react";
import { Codex } from "@/pages/study/connections/art/Codex";
import { Wall } from "@/pages/study/connections/art/Wall";
import { seeded, wallRow } from "@/pages/study/connections/art/wall-books";
import { endOf, ink, verse, MATCHED_LINKS, MISMATCHED_LINKS, type End, type Link, type Section } from "@/pages/study/connections/art/geometry";
import { Thread } from "@/pages/study/connections/art/Thread";

const GROUND = 212;
const VIEW_BOX = "0 0 400 230";
const BOOK_AT = { x: 200, y: 120, scale: 0.9 };
const FIVE: Section[] = ["history", "poetry", "prophets", "gospels", "epistles"];
/** Flat books piled up, bottom first, in the same soft colour. */
function Pile({ centre, widths, sections }: { centre: number; widths: number[]; sections: Section[] }) {
  return (
    <g stroke="none">
      {widths.map((w, i) => <rect key={i} x={centre - w / 2 + (i % 2 ? 3 : -3)} y={GROUND - 14 * (i + 1)} width={w} height={13} rx={2} style={{ fill: ink(sections[i]) }} fillOpacity={0.26} />)}
    </g>
  );
}

/** The Bible, with any threads drawn in its own coordinates so they scale with it. */
function BookAt({ children }: { children?: ReactNode }) {
  return (
    <g transform={`translate(${BOOK_AT.x} ${BOOK_AT.y}) scale(${BOOK_AT.scale})`}>
      <path d="M0 0 C-4 -18 -30 -31 -55 -31 H-71 L-94 -14 L-124 65.4 C-68 71 -27 74 0 100 C27 74 68 71 124 65.4 L94 -14 L71 -31 H55 C30 -31 4 -18 0 0 Z" stroke="none" style={{ fill: "var(--page)" }} />
      <Codex />
      {children}
    </g>
  );
}

const toBook = (x: number, y: number): { x: number; y: number } => ({ x: (x - BOOK_AT.x) / BOOK_AT.scale, y: (y - BOOK_AT.y) / BOOK_AT.scale });

function PageThreads({ first, second, rise, weight }: { first: Link[]; second: Link[]; rise?: number; weight?: number }) {
  return (
    <>
      {first.map((link, i) => <Thread key={`m${i}`} a={endOf(link.a)} b={endOf(link.b)} half={0} index={i} count={first.length} rise={rise} weight={weight} />)}
      {second.map((link, i) => <Thread key={`x${i}`} a={endOf(link.a)} b={endOf(link.b)} half={1} index={i} count={second.length} rise={rise} weight={weight} />)}
    </>
  );
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg className="cxa-scene" viewBox={VIEW_BOX} aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {children}
      <path d={`M4 ${GROUND + 2} H396`} strokeWidth={0.8} opacity={0.4} />
    </svg>
  );
}

/** Links between random verses: `matched` joins two verses of one colour, otherwise two of different colours. Lines are not reused within a page. */
function scatterLinks(seed: number, count: number, matched: boolean): Link[] {
  const next = seeded(seed);
  const lines = (n: number) => Array.from({ length: n }, (_, i) => i).sort(() => next() - 0.5);
  const left = lines(9), right = lines(9);
  return Array.from({ length: count }, (_, i) => {
    const one = FIVE[Math.floor(next() * FIVE.length)];
    const other = matched ? one : FIVE[(FIVE.indexOf(one) + 1 + Math.floor(next() * 4)) % FIVE.length];
    return { a: verse("L", left[i], 0.1 + next() * 0.8, one), b: verse("R", right[i], 0.1 + next() * 0.8, other) };
  });
}

/** A. Library wall: one long row of books behind the Bible; threads arch from verse to verse across its pages. */
export function WallScene() {
  return (
    <Scene>
      <Wall books={wallRow(5, 6, 394, GROUND - 10, [76, 134], [12, 20])} />
      <BookAt><PageThreads first={MATCHED_LINKS} second={MISMATCHED_LINKS} /></BookAt>
    </Scene>
  );
}

/** B. Two shelves: a low row above and a taller row below, behind the Bible; a fine web of many threads over the pages. */
export function ShelvesScene() {
  return (
    <Scene>
      <Wall books={wallRow(9, 6, 394, 66, [30, 48], [10, 16])} opacity={0.14} />
      <Wall books={wallRow(13, 6, 394, GROUND - 10, [64, 106], [12, 20])} />
      <BookAt><PageThreads first={scatterLinks(11, 8, true)} second={scatterLinks(23, 8, false)} rise={0.5} weight={0.9} /></BookAt>
    </Scene>
  );
}

/** C. Threads to the books: the threads leave the pages and land on the tops of the books behind, one of each colour. */
export function LandingScene() {
  const books = wallRow(17, 6, 394, GROUND - 10, [84, 138], [14, 22]);
  const landing = (section: Section, side: "left" | "right", skip = 0): End => {
    const matches = books.filter((b) => b.section === section && (side === "left" ? b.x + b.w < 150 : b.x > 250));
    const book = matches[Math.min(skip, matches.length - 1)] ?? books[0];
    return { ...toBook(book.x + book.w / 2, book.y - 2), section };
  };
  const first: Link[] = [
    { a: verse("L", 2, 0.3, "history"), b: verse("L", 0, 0, "history") },
    { a: verse("L", 5, 0.4, "poetry"), b: verse("L", 0, 0, "poetry") },
    { a: verse("R", 1, 0.5, "epistles"), b: verse("R", 0, 0, "epistles") },
    { a: verse("R", 4, 0.4, "gospels"), b: verse("R", 0, 0, "gospels") },
  ];
  const second: Link[] = [
    { a: verse("L", 3, 0.3, "gospels"), b: verse("L", 0, 0, "history") },
    { a: verse("L", 6, 0.4, "epistles"), b: verse("L", 0, 0, "poetry") },
    { a: verse("R", 2, 0.5, "history"), b: verse("R", 0, 0, "epistles") },
    { a: verse("R", 5, 0.4, "prophets"), b: verse("R", 0, 0, "gospels") },
  ];
  const draw = (links: Link[], half: 0 | 1) => links.map((link, i) => (
    <Thread key={`${half}${i}`} a={endOf(link.a)} b={landing(link.b.section, link.a.side === "L" ? "left" : "right", i % 2)} half={half} index={i} count={links.length} rise={0.4} />
  ));
  return (
    <Scene>
      <Wall books={books} />
      <BookAt>{draw(first, 0)}{draw(second, 1)}</BookAt>
    </Scene>
  );
}

/** D. Shelf and stacks: a few upright books behind, and flat piles in front at each side. */
export function StacksScene() {
  const left = wallRow(21, 8, 120, GROUND - 40, [70, 112], [13, 21]);
  const right = wallRow(31, 280, 392, GROUND - 40, [70, 112], [13, 21]);
  return (
    <Scene>
      <Wall books={[...left, ...right]} />
      <Pile centre={58} widths={[96, 84, 90]} sections={["history", "poetry", "prophets"]} />
      <Pile centre={342} widths={[92, 100, 82]} sections={["epistles", "gospels", "prophets"]} />
      <BookAt><PageThreads first={MATCHED_LINKS} second={MISMATCHED_LINKS} /></BookAt>
    </Scene>
  );
}
