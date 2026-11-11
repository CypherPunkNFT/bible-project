// The puzzle maker's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a 240 × 160
// scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather than in
// tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

const COLUMNS = [80, 92, 104, 116, 128];
const ROWS = [62, 74, 86, 98, 110];

/** A printed sheet with a letter grid, one word ringed, a few crossword squares beside it, and a pencil. */
export function PuzzleMakerScene() {
  return <>
    <P d="M64 44H160V140H64Z" c="ga-p ga-l" />
    <P d={hatch(150, 48, 8, 88, 4)} c="ga-h ga-sm-hide" />
    <P d={[...COLUMNS.map((x) => `M${x} 56V116`), "M140 56V116", ...ROWS.map((y) => `M74 ${y}H146`), "M74 56H146M74 116H146M74 56V116"].join("")} c="ga-f" />
    <rect className="ga-t ga-l ga-pulse" x={79} y={73} width={50} height={14} rx={7} style={at(0)} />
    {[[86, 92], [110, 104], [122, 68]].map(([x, y], i) => <circle key={`${x}-${y}`} className="ga-i" cx={x} cy={y} r={1.8} style={at(i + 1)} />)}
    <P d="M74 124H120M74 130H108" c="ga-f" />
    <P d="M170 70H186V86H170ZM186 70H202V86H186ZM202 70H218V86H202ZM186 86H202V102H186ZM186 102H202V118H186Z" c="ga-p ga-l" />
    <P d="M172 73h4M188 89h4" c="ga-i" />
    <g className="ga-bob">
      <P d="M150 132L196 120L199 128L153 140Z" c="ga-t ga-l" />
      <P d="M150 132L140 138L153 140" c="ga-l" />
      <P d="M190 121.5L193 129.5" c="ga-i" />
    </g>
    {[[52, 52, 3.2], [176, 50, 3], [222, 112, 2.8]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(116, 148, 70)} c="ga-h" />
  </>;
}

export const PUZZLE_MAKER_ART = {
  Scene: PuzzleMakerScene,
  tone: "history",
  alt: "A printed sheet with a grid of letters and one word ringed, a few crossword squares beside it, and a pencil",
} as const satisfies GameArt;
