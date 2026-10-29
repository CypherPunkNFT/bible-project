// The Versions & languages card's drawing (owner's pick from /study/theology_cards_mockup, 2026-10-29): six of the
// library's editions stacked as they came, the oldest at the bottom, the newest lifting off the top on a slow loop.
// Names and years are the editions' own (data/catalog.json). Still under reduced motion (versions-card-art.css).
import { useCatalog } from "@/lib/catalog";
import "./versions-card-art.css";

const STACK = [
  { name: "Leningrad Codex", year: 1008, w: 330, h: 24, x: 0 },
  { name: "Wycliffe", year: 1395, w: 300, h: 20, x: 12 },
  { name: "Clementine Vulgate", year: 1598, w: 316, h: 22, x: -10 },
  { name: "King James", year: 1611, w: 306, h: 23, x: 8 },
  { name: "American Standard", year: 1901, w: 290, h: 19, x: -5 },
  { name: "Berean Standard", year: 2023, w: 278, h: 21, x: 10 },
];

export function VersionsStackArt() {
  const editions = useCatalog().translations.length;
  let bottom = 162;
  return <div className="study-art versions-stack-art" aria-hidden="true">
    <svg viewBox="0 0 480 170" fill="none" stroke="currentColor" strokeLinejoin="round">
      <path d="M60 162.5 H420" strokeWidth={1} opacity={0.5} />
      {STACK.map((book, i) => {
        const y = bottom - book.h;
        bottom = y - 1.5;
        const left = 240 - book.w / 2 + book.x;
        return <g key={book.name} className={i === STACK.length - 1 ? "versions-stack-top" : undefined}>
          <rect x={left} y={y} width={book.w} height={book.h} rx={2.5} strokeWidth={1.1} style={{ fill: `color-mix(in srgb, currentColor ${10 + i * 3}%, transparent)` }} />
          <path d={`M${left + 14} ${y}v${book.h}M${left + 19} ${y}v${book.h}M${left + book.w - 14} ${y}v${book.h}M${left + book.w - 19} ${y}v${book.h}`} strokeWidth={0.7} opacity={0.55} />
          <text x={240 + book.x} y={y + book.h / 2 + 3.5} stroke="none">{book.name.toUpperCase()} · {book.year}</text>
        </g>;
      })}
    </svg>
    <span className="study-art-note">Six of the {editions} editions, oldest at the bottom</span>
  </div>;
}
