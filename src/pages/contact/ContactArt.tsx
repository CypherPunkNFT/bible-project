// Line art beside the contact form: a letter rising out of an open envelope sealed with a cross, a quill leaning on it,
// a dashed orbit and small stars and crosses around it, in the style of the Resources drawings. 360 × 300.
// Styles in contact.css (.ct-art); the letter floats and the stars twinkle, both stopping for reduced motion.
import type { CSSProperties } from "react";

const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}L${x + r / 4} ${y - r / 4}L${x + r} ${y}L${x + r / 4} ${y + r / 4}L${x} ${y + r}L${x - r / 4} ${y + r / 4}L${x - r} ${y}L${x - r / 4} ${y - r / 4}Z`;
const cross = (x: number, y: number, r: number) => `M${x} ${y - r}V${y + r}M${x - r * 0.7} ${y - r * 0.3}H${x + r * 0.7}`;

const SPARKLES: [number, number, number][] = [[64, 78, 7], [304, 40, 6], [46, 206, 5], [326, 228, 7], [286, 132, 4]];
const CROSSES: [number, number, number][] = [[98, 34, 6], [40, 136, 5], [262, 20, 4], [316, 176, 5]];
const TEXT_LINES = [216, 204, 222, 196, 214, 180];

export function ContactArt() {
  return (
    <figure className="ct-art" aria-label="Line drawing: a letter with a small cross at its head rising out of an open envelope sealed with a cross, a quill beside it, stars around.">
      <svg viewBox="0 0 360 300" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <defs>
          <radialGradient id="ct-glow">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={180} cy={128} r={120} fill="url(#ct-glow)" stroke="none" />
        <ellipse className="ct-orbit" cx={180} cy={162} rx={166} ry={112} strokeDasharray="2 6" />
        <path className="ct-faint" d="M58 268H302M92 278H268" strokeDasharray="1 7" />

        {SPARKLES.map(([x, y, r], i) => (
          <path key={`s${i}`} className="ct-star" style={{ "--i": i } as CSSProperties} d={sparkle(x, y, r)} />
        ))}
        {CROSSES.map(([x, y, r], i) => (
          <path key={`c${i}`} className="ct-star" style={{ "--i": i + SPARKLES.length } as CSSProperties} d={cross(x, y, r)} />
        ))}

        {/* The envelope's open flap, behind the letter. */}
        <path className="ct-paper" d="M96 156L180 102L264 156" />

        <g className="ct-letter">
          <rect className="ct-paper" x={118} y={48} width={124} height={182} rx={3} />
          <path className="ct-accent" d="M180 60V78M173.5 66H186.5" />
          {TEXT_LINES.map((end, i) => (
            <path key={i} className="ct-faint" d={`M134 ${94 + i * 11}H${end}`} />
          ))}
          <path className="ct-accent" d="M136 174c4-9 9-9 11-1s7 8 10 0 7-7 10 0 6 5 9-1" />
        </g>

        {/* The envelope's front pocket, drawn over the letter's lower half. */}
        <path className="ct-paper" d="M96 156L180 214L264 156V252H96Z" />
        <path className="ct-faint" d="M96 252L160 205M264 252L200 205" />
        <circle className="ct-seal" cx={180} cy={214} r={10} />
        <path className="ct-seal-cross" d="M180 207.5V220.5M175.5 211.5H184.5" />

        {/* The quill. */}
        <g className="ct-quill">
          <path d="M268 246C282 194 298 132 322 62" />
          <path className="ct-paper" d="M322 62C306 82 290 122 279 190C296 160 312 118 322 62Z" />
          <path className="ct-faint" d="M318 80L304 98M314 100L296 122M308 124L289 150" />
          <path d="M268 246L264 258" />
        </g>
      </svg>
    </figure>
  );
}
