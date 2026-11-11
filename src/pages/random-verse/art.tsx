// The random verse's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a 240 × 160
// scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather than in
// tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** A promise jar full of rolled verses, one slip lifting out of it, unrolled. */
export function RandomVerseScene() {
  return <>
    <P d="M92 66C86 76 84 92 84 112V134Q84 144 94 144H146Q156 144 156 134V112C156 92 154 76 148 66Z" c="ga-p ga-l" />
    <rect className="ga-t ga-l" x={94} y={52} width={52} height={12} rx={3} />
    <P d={hatch(88, 112, 22, 28, 4)} c="ga-h ga-sm-hide" />
    {[[100, 128, -18], [124, 132, 12], [112, 116, 30], [136, 114, -10], [98, 104, 8], [128, 98, -24]].map(([x, y, turn]) => (
      <g key={`${x}-${y}`} transform={`rotate(${turn} ${x} ${y})`}>
        <rect className="ga-t ga-f" x={x - 11} y={y - 4} width={22} height={8} rx={4} />
        <P d={`M${x - 5} ${y - 4}V${y + 4}`} c="ga-f" />
      </g>
    ))}
    <P d="M150 74Q154 84 154 100" c="ga-f" />
    <g className="ga-lift">
      <P d="M152 20H198Q202 20 202 24V44Q202 48 198 48H152Q148 48 148 44V24Q148 20 152 20Z" c="ga-p ga-l" />
      <P d="M156 28H194M156 34H190M156 40H178" c="ga-i" />
    </g>
    {[[136, 30, 3.4], [210, 58, 3], [70, 60, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 148, 46)} c="ga-h" />
  </>;
}

export const RANDOM_VERSE_ART = {
  Scene: RandomVerseScene,
  tone: "poetry",
  alt: "A jar full of rolled-up verses, with one slip lifting out of it",
} as const satisfies GameArt;
