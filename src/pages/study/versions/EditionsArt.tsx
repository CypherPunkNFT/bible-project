// The Versions page's heading drawing: a shelf of Bibles in line art, each spine banded in its version group's colour
// and marked with a letter of its own script, lifting from the shelf in turn on a slow loop. The shelf edge doubles as
// a timeline. Still under reduced motion (editions.css).
import { GROUP_COLOR } from "@/lib/languages";

/** Spines left to right, one letter per script: width, height, the letter on it and its group. */
const SPINES: { w: number; h: number; letter: string; group: "english" | "original" | "translations" }[] = [
  { w: 23, h: 92, letter: "א", group: "original" },
  { w: 22, h: 84, letter: "Ω", group: "original" },
  { w: 25, h: 100, letter: "A", group: "english" },
  { w: 23, h: 104, letter: "文", group: "translations" },
  { w: 22, h: 90, letter: "ع", group: "translations" },
  { w: 21, h: 82, letter: "Я", group: "translations" },
  { w: 24, h: 96, letter: "अ", group: "translations" },
  { w: 22, h: 88, letter: "あ", group: "translations" },
];
const SHELF = 132;

export function EditionsArt() {
  let left = 21;
  const spines = SPINES.map((spine) => {
    const x = left;
    left = x + spine.w + 3;
    return { ...spine, x };
  });
  return (
    <svg className="ed-art" viewBox="0 0 240 172" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* the shelf, and beneath it a timeline of the editions' centuries */}
      <path d="M12 132 H228" strokeWidth={1.2} />
      <path d="M12 136 H228" strokeWidth={0.7} opacity={0.45} />
      <path d="M24 152 H216" strokeWidth={0.8} opacity={0.55} />
      {[24, 72, 120, 168, 216].map((x, i) => <path key={x} d={`M${x} ${149 - (i % 2) * 2} V${155 + (i % 2) * 2}`} strokeWidth={0.8} opacity={0.6} />)}
      {spines.map((spine, i) => (
        <g key={i} className="ed-art-spine" style={{ animationDelay: `${(i * 0.42).toFixed(2)}s` }}>
          <rect x={spine.x} y={SHELF - spine.h} width={spine.w} height={spine.h} rx={1.6} strokeWidth={1.1} />
          <rect x={spine.x + 3} y={SHELF - spine.h + 8} width={spine.w - 6} height={4} rx={0.8} stroke="none" style={{ fill: GROUP_COLOR[spine.group] }} />
          <path d={`M${spine.x + 3} ${SHELF - 13} h${spine.w - 6}`} strokeWidth={0.7} opacity={0.5} />
          <text x={spine.x + spine.w / 2} y={SHELF - spine.h / 2 + 5} textAnchor="middle" stroke="none" fill="currentColor" fontSize={14} fontFamily="var(--font-serif)">{spine.letter}</text>
        </g>
      ))}
    </svg>
  );
}
