// The name tool's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a 240 × 160
// scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather than in
// tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing:
// the three lines on the scroll are letter-like strokes, not real letters.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** An open scroll with a name written three ways on it, a quill writing, and an inkwell. */
export function NameInHebrewScene() {
  return <>
    <P d="M52 62H170V134H52Z" c="ga-p ga-l" />
    <P d="M46 58C46 52 58 52 58 58V138C58 144 46 144 46 138Z" c="ga-t ga-l" />
    <P d="M164 58C164 52 176 52 176 58V138C176 144 164 144 164 138Z" c="ga-t ga-l" />
    <P d="M150 80h-8v-6M138 80h-6M128 74v6h-6M118 80h-8" c="ga-i" />
    <P d="M72 98q4-6 8 0t8 0M94 98q4-6 8 0M108 92v6h8" c="ga-i" />
    <P d="M150 118h-6q-3-6-6 0M134 118h-6v-6M124 118q-4 0-6-6M114 118h-8" c="ga-i" />
    <P d="M70 106q40-3 82 0" c="ga-f ga-pulse" style={at(1)} />
    <P d={hatch(60, 124, 40, 8, 4)} c="ga-h ga-sm-hide" />
    <g className="ga-bob">
      <P d="M184 38C202 44 210 62 200 84L176 112" c="ga-t ga-l" />
      <P d="M200 84C190 74 186 58 184 38" c="ga-f" />
      <P d="M176 112l-3 8" c="ga-l ga-bold" />
    </g>
    <P d="M196 126h22v18h-22Z" c="ga-t ga-l" />
    <P d="M194 126h26" c="ga-l ga-bold" />
    {[[64, 44, 3.2], [118, 38, 3], [214, 104, 2.8]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(116, 148, 70)} c="ga-h" />
  </>;
}

export const NAME_IN_HEBREW_ART = {
  Scene: NameInHebrewScene,
  tone: "revelation",
  alt: "An open scroll with a name written on it in three scripts, a quill pen writing and an inkwell",
} as const satisfies GameArt;
