// The Listen and Chapters drawings for the homepage Bible section, companions to the open-book scene in HomeFeatureArt.
// Listen: the Word read aloud, sound rings from a small open book, a voice wave with a playhead travelling a timeline of the
// canon, and notes for the musical readings. Chapters: all 1,189 chapters as a band of cells read in order, over four
// panels of figures drawn from the same chapter counts.
// Both loop slowly while on screen, open up on hover (home-features.css) and hold still under reduced motion.
import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { OpenBook, SoundWave } from "./HomeFeatureArt";

/** Chapters per book in canonical order, grouped by kind; the tone names a site colour. */
const CANON = [
  { tone: "accent", chapters: [50, 40, 27, 36, 34] },
  { tone: "history", chapters: [24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10] },
  { tone: "poetry", chapters: [42, 150, 31, 12, 8] },
  { tone: "prophets", chapters: [66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4] },
  { tone: "gospels", chapters: [28, 16, 24, 21, 28] },
  { tone: "epistles", chapters: [16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1] },
  { tone: "revelation", chapters: [22] },
];
const TONES = CANON.flatMap((group) => group.chapters.flatMap((count) => Array<string>(count).fill(group.tone)));
export const CHAPTER_COUNT = TONES.length;
/** Where a few landmark books begin, counted in chapters from Genesis 1. */
const LANDMARKS = [["GENESIS", 0], ["PSALMS", 478], ["ISAIAH", 679], ["MATTHEW", 929], ["REVELATION", 1167]] as const;

/* ---------- Listen ---------- */

function SoundRings() {
  return <g className="hf-rings">{[0, 1, 2].map((i) => <circle key={i} cx="300" cy="165" r="74" style={{ animationDelay: `${i * 1.5}s` }} />)}</g>;
}

/** A timeline of the canon under the voice; the playhead travels it from Genesis to Revelation. */
function CanonTimeline() {
  const at = (chapter: number) => 80 + (440 * chapter) / CHAPTER_COUNT;
  return <g className="hf-timeline">
    <path d="M80 352H520" />
    {LANDMARKS.map(([name, chapter], i) => <g key={name}>
      <path d={`M${at(chapter)} 347V357`} />
      <text x={i === LANDMARKS.length - 1 ? 520 : at(chapter)} y="374" textAnchor={i === LANDMARKS.length - 1 ? "end" : i ? "middle" : "start"}>{name}</text>
    </g>)}
  </g>;
}

function Notes() {
  return <g className="hf-notes">{[["♪", 432, 124], ["♫", 470, 98], ["♪", 398, 96], ["♫", 176, 112]].map(([glyph, x, y], i) =>
    <text key={i} x={x} y={y} style={{ animationDelay: `${i * 1.6}s` }}>{glyph}</text>)}</g>;
}

export function ListenScene() {
  return <svg className="hf-scene hf-listen-scene" viewBox="0 30 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M300 60V420M40 290H560" />
    <g className="hf-layer-rings"><SoundRings /></g>
    <g className="hf-layer-mini"><g transform="translate(300 175) scale(.5) translate(-300 -295)"><OpenBook /></g></g>
    <g className="hf-layer-notes"><Notes /></g>
    <g className="hf-layer-voice"><SoundWave bars={61} width={440} x={80} y={290} height={58} /></g>
    <g className="hf-playhead-track"><path d="M0 252V328" /><circle cx="0" cy="252" r="4" /></g>
    <g className="hf-layer-timeline"><CanonTimeline /></g>
    <text className="hf-caption" x="300" y="414" textAnchor="middle">AMERICAN STANDARD VERSION · READ IN FULL · FREELY HEARD</text>
  </svg>;
}

/* ---------- Chapters ---------- */

const ROWS = 12;
const STEP = 4.6;
const GRID_WIDTH = Math.ceil(CHAPTER_COUNT / ROWS) * STEP;
const GRID_X = 300 - GRID_WIDTH / 2;
const GRID_Y = 70;
const GRID_BOTTOM = GRID_Y + ROWS * STEP;
const cellX = (i: number) => GRID_X + Math.floor(i / ROWS) * STEP;
const cellY = (i: number) => GRID_Y + (i % ROWS) * STEP;

/** Every chapter as a cell, column by column in reading order. */
function Cells() {
  return <>{TONES.map((tone, i) => <rect key={i} x={cellX(i)} y={cellY(i)} width="3.6" height="3.6" rx=".8" style={{ color: `var(--${tone})` }} />)}</>;
}

/* The four figure panels, every number counted from CANON except the verse totals (King James Version). */
const SECTION_NAMES = ["LAW", "HISTORY", "POETRY", "PROPHETS", "GOSPELS · ACTS", "LETTERS", "REVELATION"];
const SECTIONS = CANON.map((group, i) => ({ name: SECTION_NAMES[i], tone: group.tone, chapters: group.chapters.reduce((a, b) => a + b, 0) }));
const OLD_TESTAMENT_CHAPTERS = SECTIONS.slice(0, 4).reduce((sum, s) => sum + s.chapters, 0);
const LONGEST = [["PSALMS", 150, "poetry"], ["ISAIAH", 66, "prophets"], ["JEREMIAH", 52, "prophets"], ["GENESIS", 50, "accent"], ["EZEKIEL", 48, "prophets"]] as const;
const BOOK_SIZES = CANON.flatMap((group) => group.chapters);
const LENGTHS = ([["1", 1, 1], ["2–5", 2, 5], ["6–10", 6, 10], ["11–20", 11, 20], ["21–30", 21, 30], ["31+", 31, Infinity]] as const)
  .map(([label, low, high]) => ({ label, books: BOOK_SIZES.filter((n) => n >= low && n <= high).length }));
const PANEL_WIDTH = 222;

const grow = (i: number) => ({ animationDelay: `${i * 0.25}s` }) as CSSProperties;
const toned = (tone: string) => ({ color: `var(--${tone})` }) as CSSProperties;

/** One of the four equal panels under the scanner: a frame and its title. */
function Panel({ x, y, title, children }: { x: number; y: number; title: string; children: ReactNode }) {
  return <g className="hf-stat" transform={`translate(${x} ${y})`}>
    <rect className="hf-stat-frame" width={PANEL_WIDTH} height="112" rx="6" /><text className="hf-stat-title" x="14" y="19">{title}</text>{children}
  </g>;
}

function SectionBars() {
  const max = Math.max(...SECTIONS.map((s) => s.chapters));
  return <>{SECTIONS.map((s, i) => { const w = (96 * s.chapters) / max, y = 34 + i * 10.4; return <g key={s.name} style={toned(s.tone)}>
    <text className="hf-stat-label" x="14" y={y + 5.5}>{s.name}</text>
    <rect className="hf-stat-bar hf-grow-x" style={grow(i)} x="88" y={y} width={w} height="6" rx="1.5" />
    <text className="hf-stat-value" x={92 + w} y={y + 5.5}>{s.chapters}</text>
  </g>; })}</>;
}

function LongestBooks() {
  return <>{LONGEST.map(([name, chapters, tone], i) => { const h = (56 * chapters) / 150, x = 16 + i * 42; return <g key={name} style={toned(tone)}>
    <rect className="hf-stat-bar hf-grow-y" style={grow(i)} x={x} y={92 - h} width="24" height={h} rx="2" />
    <text className="hf-stat-value" x={x + 12} y={88 - h} textAnchor="middle">{chapters}</text>
    <text className="hf-stat-label" x={x + 12} y="103" textAnchor="middle">{name}</text>
  </g>; })}</>;
}

function Testaments() {
  const share = OLD_TESTAMENT_CHAPTERS / CHAPTER_COUNT;
  const rows = [["OLD", OLD_TESTAMENT_CHAPTERS, "23,145", "accent", 50], ["NEW", CHAPTER_COUNT - OLD_TESTAMENT_CHAPTERS, "7,957", "gospels", 80]] as const;
  return <>
    <circle className="hf-ring-track" cx="58" cy="66" r="27" />
    <g transform="rotate(-90 58 66)">
      <circle className="hf-ring" style={toned("accent")} pathLength={1} cx="58" cy="66" r="27" strokeDasharray={`${share} 1`} />
      <circle className="hf-ring" style={toned("gospels")} pathLength={1} cx="58" cy="66" r="27" strokeDasharray={`${1 - share} 1`} strokeDashoffset={-share} />
    </g>
    <text className="hf-stat-big" x="58" y="70" textAnchor="middle">{Math.round(share * 100)}%</text>
    {rows.map(([name, chapters, verses, tone, y]) => <g key={name} style={toned(tone)}>
      <rect className="hf-stat-bar" x="106" y={y - 7} width="6" height="6" rx="1.5" />
      <text className="hf-stat-label" x="118" y={y - 1}>{name} TESTAMENT</text>
      <text className="hf-stat-note" x="118" y={y + 10}>{chapters} chapters · {verses} verses</text>
    </g>)}
  </>;
}

function LengthHistogram() {
  const max = Math.max(...LENGTHS.map((b) => b.books));
  return <>{LENGTHS.map((b, i) => { const h = (52 * b.books) / max, x = 18 + i * 32.5; return <g key={b.label}>
    <rect className="hf-stat-bar hf-stat-plain hf-grow-y" style={grow(i)} x={x} y={92 - h} width="24" height={h} rx="2" />
    <text className="hf-stat-value" x={x + 12} y={88 - h} textAnchor="middle">{b.books}</text>
    <text className="hf-stat-label" x={x + 12} y="103" textAnchor="middle">{b.label}</text>
  </g>; })}</>;
}

export function ChaptersScene() {
  const clip = `hf-read-${useId().replace(/:/g, "")}`;
  const right = GRID_X + GRID_WIDTH - PANEL_WIDTH;
  return <svg className="hf-scene hf-chapters-scene" viewBox="0 30 600 400" fill="none" aria-hidden="true">
    <defs><clipPath id={clip}><rect className="hf-read-mask" x={GRID_X - 1} y={GRID_Y - 1} width={GRID_WIDTH + 1} height={ROWS * STEP + 1} /></clipPath></defs>
    {/* Revelation is named under the grid, so the top row stops at Matthew rather than crowding the last columns. */}
    <g className="hf-layer-labels">{LANDMARKS.slice(0, -1).map(([name, chapter]) => <g key={name} className="hf-landmark">
      <path d={`M${cellX(chapter) + 1.8} ${GRID_Y - 10}V${GRID_Y - 3}`} />
      <text x={cellX(chapter)} y={GRID_Y - 15}>{name}</text>
    </g>)}</g>
    <g className="hf-layer-grid">
      <g className="hf-cells"><Cells /></g>
      <g className="hf-cells-read" clipPath={`url(#${clip})`}><Cells /></g>
    </g>
    <g className="hf-reading-marker" style={{ transform: `translateX(${GRID_X}px)`, "--scan": `${GRID_WIDTH}px` } as CSSProperties}>
      <g className="hf-marker-move"><path d={`M0 ${GRID_Y - 5}V${GRID_BOTTOM + 3}`} /><path className="hf-marker-ribbon" d={`M-4 ${GRID_BOTTOM + 3}h8v11l-4-3-4 3Z`} /></g>
    </g>
    <text className="hf-caption" x={GRID_X} y={GRID_BOTTOM + 32}>GENESIS 1</text>
    <text className="hf-caption" x="300" y={GRID_BOTTOM + 32} textAnchor="middle">{CHAPTER_COUNT.toLocaleString("en-US")} CHAPTERS</text>
    <text className="hf-caption" x={GRID_X + GRID_WIDTH} y={GRID_BOTTOM + 32} textAnchor="end">REVELATION 22</text>
    <g className="hf-layer-stats">
      <Panel x={GRID_X} y={176} title="CHAPTERS BY SECTION"><SectionBars /></Panel>
      <Panel x={right} y={176} title="THE LONGEST BOOKS"><LongestBooks /></Panel>
      <Panel x={GRID_X} y={302} title="OLD AND NEW TESTAMENT"><Testaments /></Panel>
      <Panel x={right} y={302} title="BOOKS BY NUMBER OF CHAPTERS"><LengthHistogram /></Panel>
    </g>
  </svg>;
}
