// The games' art: one drawing per game, in one style made for this site (docs/features/games-hub/design.md). Every
// scene is a 240 × 160 SVG drawn in front of the same arched window, in its game's book colour (currentColor): main
// strokes in the colour, key details in ink, parallel hatching for shadow, a few tinted planes for weight, and one living
// detail that loops slowly (game-art.css). These are the drawn parts every scene shares; the sums are in draw.ts.
// Hatching is plain lines, never an SVG pattern or clip id: ids repeat across the page's sixteen drawings and break
// silently when the first copy is hidden.
import type { CSSProperties } from "react";
import { hatch, type GameArt } from "./draw";
import "./game-art.css";

type PathProps = { d: string; c?: string; style?: CSSProperties };

/** A stroke. c: ga-l (main line, the game's colour), ga-i (ink), ga-f (fine), ga-h (hatching); fills: ga-t (tint),
 *  ga-s (solid colour), ga-p (paper, to hide what is behind). Combine as "ga-p ga-l". */
export const P = ({ d, c = "ga-l", style }: PathProps) => <path className={c} d={d} style={style} />;

/** Letters and numbers inside a drawing. */
export const T = ({ x, y, size = 12, c = "ga-txt", children, style }: { x: number; y: number; size?: number; c?: string; children: string; style?: CSSProperties }) =>
  <text className={c} x={x} y={y} fontSize={size} textAnchor="middle" dominantBaseline="central" style={style}>{children}</text>;

/** The arched window every scene stands in front of: the one shape that ties the fifteen drawings together. */
export function Backdrop() {
  return <g className="ga-back">
    <path className="ga-arch" d="M50 150V74A70 70 0 0 1 190 74V150Z" />
    <path className="ga-arch-line" d="M58 150V76A62 62 0 0 1 182 76V150" />
    <circle className="ga-sun" cx={120} cy={66} r={30} />
    <P d="M14 150H226" c="ga-f" />
    <P d={hatch(150, 151, 70, 6, 4)} c="ga-h ga-sm-hide" />
    <P d={hatch(20, 151, 60, 6, 4)} c="ga-h ga-sm-hide" />
  </g>;
}

/** No drawing yet: the bare window with a small cross, so a new game's card is never empty (index.ts, BLANK_ART). */
export const BlankScene = () => <P d="M120 92V128M108 104H132" c="ga-f" />;

/** The drawing as the hub shows it. */
export function GameArtImage({ art, className = "" }: { art: GameArt; className?: string }) {
  const { Scene, alt } = art;
  return <svg className={`ga-art ${className}`} viewBox="0 0 240 160" role="img" aria-label={alt} focusable="false">
    <Backdrop /><Scene />
  </svg>;
}
