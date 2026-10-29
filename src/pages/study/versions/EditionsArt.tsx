// The Versions page's heading drawing: a shelf of Bibles in line art, each spine banded in its version group's colour
// and marked with a letter of its own script, rising from the shelf in turn on a slow loop. The shelf edge doubles as
// a timeline. Still under reduced motion (editions.css).
import { GROUP_COLOR } from "@/lib/languages";

/** Spines left to right: width, height, the letter on it, its group, and for the last a lean back onto its neighbour. */
const SPINES: { w: number; h: number; letter: string; group: "english" | "original" | "translations"; lean?: number }[] = [
  { w: 15, h: 92, letter: "א", group: "original" },
  { w: 13, h: 84, letter: "Α", group: "original" },
  { w: 17, h: 98, letter: "A", group: "english" },
  { w: 12, h: 76, letter: "L", group: "original" },
  { w: 16, h: 102, letter: "文", group: "translations" },
  { w: 14, h: 88, letter: "E", group: "english" },
  { w: 15, h: 94, letter: "ع", group: "translations" },
  { w: 12, h: 80, letter: "Я", group: "translations" },
  { w: 16, h: 96, letter: "अ", group: "translations" },
  { w: 13, h: 86, letter: "É", group: "translations" },
  { w: 15, h: 90, letter: "あ", group: "translations", lean: -9 },
];
const SHELF = 132;

export function EditionsArt() {
  let left = 26;
  const spines = SPINES.map((spine) => {
    // A leaning book stands far enough out that its edge just meets its neighbour's top corner.
    const x = left + (spine.lean ? 11 : 0);
    left = x + spine.w + 2.5;
    return { ...spine, x };
  });
  return (
    <svg className="ed-art" viewBox="0 0 240 172" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* the shelf, and beneath it a timeline of the editions' centuries */}
      <path d="M16 132 H224" strokeWidth={1.2} />
      <path d="M16 136 H224" strokeWidth={0.7} opacity={0.45} />
      <path d="M24 152 H216" strokeWidth={0.8} opacity={0.55} />
      {[24, 72, 120, 168, 216].map((x, i) => <path key={x} d={`M${x} ${149 - (i % 2) * 2} V${155 + (i % 2) * 2}`} strokeWidth={0.8} opacity={0.6} />)}
      {spines.map((spine, i) => (
        <g key={i} className="ed-art-spine" style={{ animationDelay: `${(i * 0.42).toFixed(2)}s` }}>
          <g transform={spine.lean ? `rotate(${spine.lean} ${spine.x} ${SHELF})` : undefined}>
            <rect x={spine.x} y={SHELF - spine.h} width={spine.w} height={spine.h} rx={1.6} strokeWidth={1.1} />
            <rect x={spine.x + 2} y={SHELF - spine.h + 7} width={spine.w - 4} height={3.2} rx={0.6} stroke="none" style={{ fill: GROUP_COLOR[spine.group] }} />
            <path d={`M${spine.x + 2} ${SHELF - 12} h${spine.w - 4}`} strokeWidth={0.7} opacity={0.5} />
            <text x={spine.x + spine.w / 2} y={SHELF - spine.h / 2 + 3} textAnchor="middle" stroke="none" fill="currentColor" fontSize={8.5} fontFamily="var(--font-serif)" opacity={0.9}>{spine.letter}</text>
          </g>
        </g>
      ))}
    </svg>
  );
}
