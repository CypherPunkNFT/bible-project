// The occasion verse picker's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a
// 240 × 160 scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool so the
// tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** An open Bible on a stand with three ribbons for three occasions (two rings, a drop of water, a lily), a dove above. */
export function OccasionVersesScene() {
  return <>
    <P d="M120 128V146M104 146H136" c="ga-l" />
    <P d="M70 96Q94 86 120 96Q146 86 170 96V128Q146 118 120 128Q94 118 70 128Z" c="ga-p ga-l" />
    <P d="M120 96V128" c="ga-l" />
    <P d="M80 102Q98 96 112 102M80 110Q98 104 112 110M128 102Q142 96 160 102M128 110Q142 104 160 110" c="ga-i" />
    <P d={hatch(128, 114, 30, 8, 4)} c="ga-h ga-sm-hide" />
    {[84, 100, 156].map((x) => <P key={x} d={`M${x} 124V134`} c="ga-f" />)}
    <circle className="ga-t ga-l" cx={82} cy={138} r={3.4} />
    <circle className="ga-t ga-l" cx={87} cy={138} r={3.4} />
    <P d="M100 134Q97 138 100 141Q103 138 100 134Z" c="ga-t ga-l" />
    <P d="M156 134Q152 138 156 141Q160 138 156 134M156 141V144" c="ga-l" />
    <g className="ga-lift">
      <P d="M112 46Q120 38 130 44Q140 36 152 40Q142 44 138 52Q130 58 120 54Q114 52 112 46Z" c="ga-p ga-l" />
      <P d="M112 46L104 44L111 50" c="ga-l" />
    </g>
    {[[80, 54, 3.2], [176, 66, 3], [60, 82, 2.6]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 148, 50)} c="ga-h" />
  </>;
}

export const OCCASION_VERSES_ART = {
  Scene: OccasionVersesScene,
  tone: "acts",
  alt: "An open Bible on a stand with three ribbon bookmarks, wedding rings, a drop of water and a lily, and a dove above",
} as const satisfies GameArt;
