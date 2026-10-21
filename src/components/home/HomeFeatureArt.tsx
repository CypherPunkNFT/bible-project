// The opening drawings for the homepage Bible and Study sections, plus the block that pairs each with its
// explanation (the Listen and Chapters drawings live in HomeBibleScenes.tsx). Both scenes loop slowly while on screen and open up further on hover (home-features.css); they hold still
// under reduced motion. Shapes describe meaning only: the book, the languages it is read in, the sound of it read aloud;
// the sixty-six books on one line, the references that cross it, the four Gospels meeting, the names of God.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./home-features.css";

/** True while the element is on screen, so loops only run when someone can see them. */
function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, visible] as const;
}

type Cta = { to: string; label: string; note?: string; icon?: ReactNode; bookmark?: boolean };
type BlockProps = {
  kicker: ReactNode; title: ReactNode; level?: "h2" | "h3"; reverse?: boolean; tone?: string;
  facts: string[]; cta?: Cta; art: ReactNode; artTo: string; artLabel: string; children: ReactNode;
};

/** The call to action: a ribbon bookmark for the Bible blocks, a quiet text link elsewhere. */
function CallToAction({ to, label, note, icon, bookmark }: Cta) {
  if (!bookmark) return <Link className="hf-link" to={to}>{label}<ArrowUpRight size={16} aria-hidden /></Link>;
  return <Link className="hf-bookmark" to={to}>{icon}<span>{note && <small>{note}</small>}{label}</span><ArrowRight className="hf-bookmark-arrow" size={20} aria-hidden /></Link>;
}

/** Title, what this part of the site is and why it matters, and a drawing beside it that is itself a way in. */
export function FeatureBlock({ kicker, title, level = "h2", reverse, tone, facts, cta, art, artTo, artLabel, children }: BlockProps) {
  const [ref, visible] = useOnScreen<HTMLAnchorElement>();
  const Heading = level;
  return <div className="hf-intro" data-reverse={reverse || undefined} style={tone ? ({ "--home-color": `var(--${tone})` } as CSSProperties) : undefined}>
    <div className="hf-copy">
      <p className="home-eyebrow">{kicker}</p>
      <Heading>{title}</Heading>
      {children}
      <ul className="hf-facts">{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      {cta && <CallToAction {...cta} />}
    </div>
    <Link className="hf-art" to={artTo} aria-label={artLabel} ref={ref} data-live={visible || undefined}>{art}</Link>
  </div>;
}

/* ---------- The Bible: one Word, read, compared and heard ---------- */

const FIRST_WORDS = [
  { text: "In principio erat Verbum", width: 150, angle: 140 },
  { text: "Ἐν ἀρχῇ ἦν ὁ λόγος", width: 128, angle: 110 },
  { text: "太初有道", width: 74, angle: 70 },
  { text: "Im Anfang war das Wort", width: 142, angle: 40 },
  { text: "En el principio era el Verbo", width: 162, angle: 170 },
  { text: "בְּרֵאשִׁית הָיָה הַדָּבָר", width: 128, angle: 10 },
];

/** John 1:1's opening words in six languages, spaced around the orbit; each drifts on its own beat. */
function Languages() {
  return <g className="hf-words">{FIRST_WORDS.map((word, i) => {
    const x = 300 + 220 * Math.cos((word.angle * Math.PI) / 180);
    const y = 228 - 118 * Math.sin((word.angle * Math.PI) / 180);
    return <g key={word.text} className="hf-word" style={{ animationDelay: `${-i * 1.7}s` }}>
      <rect x={x - word.width / 2} y={y - 13} width={word.width} height="26" rx="13" />
      <text x={x} y={y + 4} textAnchor="middle">{word.text}</text>
    </g>;
  })}</g>;
}

/** Ruled lines across a curved page; mirrored for the right-hand page. */
function pageRows(side: 1 | -1) {
  return Array.from({ length: 7 }, (_, r) => {
    const y = 266 + r * 8.6;
    const start = 300 - side * (166 - r * 2.4);
    return <path key={r} d={`M${start} ${y + 4}Q${300 - side * 98} ${y - 8} ${300 - side * 14} ${y}`} opacity={r === 6 ? 0.45 : 0.75} />;
  });
}

export function OpenBook() {
  return <g className="hf-book">
    <path className="hf-page-edge" d="M118 332v10C178 324 250 326 300 346C350 326 422 324 482 342v-10" />
    <path className="hf-page" d="M300 252C250 236 190 236 138 252L118 332C178 316 250 318 300 338Z" />
    <path className="hf-page" d="M300 252C350 236 410 236 462 252L482 332C422 316 350 318 300 338Z" />
    <path className="hf-spine" d="M300 252V338" />
    <g className="hf-ink">{pageRows(1)}{pageRows(-1)}</g>
    <g className="hf-ribbon"><path d="M303 250V362l6-7 6 7V248" /></g>
  </g>;
}

/** Light rising from the open page, with the star at its heart. */
function Light() {
  return <g className="hf-light">
    <ellipse className="hf-glow" cx="300" cy="250" rx="150" ry="70" />
    {Array.from({ length: 11 }, (_, i) => {
      const angle = Math.PI * (0.18 + (i * 0.64) / 10);
      return <path key={i} className="hf-ray" style={{ animationDelay: `${i * 0.4}s` }}
        d={`M${300 + 30 * Math.cos(angle)} ${244 - 22 * Math.sin(angle)}L${300 + 120 * Math.cos(angle)} ${244 - 88 * Math.sin(angle)}`} />;
    })}
    <text className="hf-star" x="300" y="222" textAnchor="middle">✦</text>
  </g>;
}

/** The audio Bible as a breathing sound wave under the book. */
export function SoundWave({ bars = 41, width = 300, x = 150, y = 384, height = 30, className = "hf-wave" }: { bars?: number; width?: number; x?: number; y?: number; height?: number; className?: string }) {
  const step = width / (bars - 1);
  return <g className={className}>{Array.from({ length: bars }, (_, i) => {
    const envelope = Math.sin((Math.PI * i) / (bars - 1));
    const h = Math.max(3, height * envelope * (0.45 + ((i * 7) % 5) / 9));
    return <rect key={i} x={x + i * step - 1.2} y={y - h / 2} width="2.4" height={h} rx="1.2" style={{ animationDelay: `${-((i * 0.13) % 2.4)}s` }} />;
  })}</g>;
}

export function BibleScene({ versions, languages }: { versions: number; languages: number }) {
  return <svg className="hf-scene hf-bible-scene" viewBox="0 0 600 440" fill="none" aria-hidden="true">
    <ellipse className="hf-orbit" cx="300" cy="228" rx="232" ry="118" />
    <ellipse className="hf-orbit hf-orbit-inner" cx="300" cy="236" rx="180" ry="84" />
    <path className="hf-cross" d="M300 70V410M40 236H560" />
    <g className="hf-layer-light"><Light /></g>
    <g className="hf-layer-book"><OpenBook /></g>
    <g className="hf-layer-words"><Languages /></g>
    <g className="hf-layer-wave"><SoundWave /></g>
    <text className="hf-caption" x="300" y="428" textAnchor="middle">ONE WORD · {versions} VERSIONS · {languages} LANGUAGES · READ ALOUD</text>
  </svg>;
}

/* ---------- Study: the whole Bible on one line, and what connects it ---------- */

const BASE = 322;
const bookX = (index: number) => 48 + index * 7.8;
/** Sixty-six books in canonical order, grouped by kind; the tick height marks the group. */
const GROUPS = [
  { count: 5, tone: "accent", height: 26 }, { count: 12, tone: "history", height: 19 }, { count: 5, tone: "poetry", height: 30 },
  { count: 5, tone: "prophets", height: 28 }, { count: 12, tone: "prophets", height: 17 }, { count: 4, tone: "gospels", height: 36 },
  { count: 1, tone: "gospels", height: 24 }, { count: 21, tone: "epistles", height: 16 }, { count: 1, tone: "revelation", height: 30 },
];
/** Well-known references across the canon: Genesis–Revelation, Isaiah–Matthew, Psalms–Hebrews, Exodus–John, Deuteronomy–Romans. */
const ARCS = [[0, 65], [22, 39], [18, 57], [1, 42], [4, 44]];

function BookLine() {
  let index = 0;
  return <g className="hf-books">{GROUPS.flatMap((group) => Array.from({ length: group.count }, () => {
    const i = index++;
    return <rect key={i} x={bookX(i) - 2.6} y={BASE - group.height} width="5.2" height={group.height} rx="1.4" style={{ color: `var(--${group.tone})` }} />;
  }))}</g>;
}

function CrossReferences() {
  return <g className="hf-arcs">{ARCS.map(([from, to], i) => {
    const x1 = bookX(from), x2 = bookX(to);
    const rise = Math.min(190, (x2 - x1) * 0.62);
    return <path key={from} pathLength={1} style={{ animationDelay: `${i * 1.6}s` }} d={`M${x1} ${BASE - 40}Q${(x1 + x2) / 2} ${BASE - 40 - rise} ${x2} ${BASE - 40}`} />;
  })}</g>;
}

/** Matthew, Mark, Luke and John drawn as four threads that meet over the Gospels. */
function GospelThreads() {
  const meet = bookX(40.5);
  return <g className="hf-threads">
    {["MATTHEW", "MARK", "LUKE", "JOHN"].map((name, i) => {
      const y = 70 + i * 24;
      return <g key={name}><text x="40" y={y + 3}>{name}</text>
        <path style={{ animationDelay: `${-i * 0.8}s` }} d={`M98 ${y}C190 ${y} ${meet - 70} ${150 + i * 4} ${meet} 168`} /></g>;
    })}
    <path className="hf-thread-drop" d={`M${meet} 180V${BASE - 44}`} />
    <circle className="hf-node" cx={meet} cy="168" r="14" />
    <path className="hf-node-cross" d={`M${meet} 159v18M${meet - 6} 165h12`} />
  </g>;
}

/** The names of God: Father, Son and Spirit in one emblem, with its rays slowly turning. */
function NamesEmblem() {
  return <g className="hf-names">
    <g className="hf-rays">{Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      return <path key={i} d={`M${498 + 30 * Math.cos(a)} ${92 + 30 * Math.sin(a)}L${498 + (i % 2 ? 36 : 40) * Math.cos(a)} ${92 + (i % 2 ? 36 : 40) * Math.sin(a)}`} />;
    })}</g>
    <circle cx="498" cy="92" r="24" />
    <path d="M498 77L511 100H485Z" />
    <text x="498" y="146" textAnchor="middle">HIS NAMES</text>
  </g>;
}

/** A reading lens gliding along the books: study is looking closer. */
function Lens() {
  return <g className="hf-lens-track"><g className="hf-lens">
    <circle cx="0" cy={BASE - 18} r="27" />
    <path d={`M19 ${BASE + 1}L34 ${BASE + 16}`} />
  </g></g>;
}

export function StudyScene() {
  return <svg className="hf-scene hf-study-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d={`M30 ${BASE + 0.5}H570`} />
    <g className="hf-layer-arcs"><CrossReferences /></g>
    <g className="hf-layer-threads"><GospelThreads /></g>
    <g className="hf-layer-names"><NamesEmblem /></g>
    <g className="hf-layer-books"><BookLine /></g>
    <g className="hf-layer-lens"><Lens /></g>
    <path className="hf-testament" d={`M${bookX(38.5)} ${BASE + 8}V${BASE + 22}`} />
    <text className="hf-caption" x={bookX(0)} y={BASE + 40}>GENESIS</text>
    <text className="hf-caption" x={bookX(19)} y={BASE + 40} textAnchor="middle">OLD TESTAMENT</text>
    <text className="hf-caption" x={bookX(48)} y={BASE + 40} textAnchor="middle">NEW TESTAMENT</text>
    <text className="hf-caption" x={bookX(65)} y={BASE + 40} textAnchor="end">REVELATION</text>
    <text className="hf-caption" x="300" y={BASE + 78} textAnchor="middle">SIXTY-SIX BOOKS · ONE STORY · EVERY PASSAGE CONNECTED</text>
  </svg>;
}
