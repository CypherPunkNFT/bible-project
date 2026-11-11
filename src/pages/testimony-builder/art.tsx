// The Testimony builder's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a 240 × 160
// scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather than in
// tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** The written lines on the sheet: a heading, then paragraphs, the last line half written. */
const LINES: readonly [number, number, number][] = [[78, 66, 112], [78, 78, 150], [78, 84, 146], [78, 90, 138], [78, 100, 150], [78, 106, 144], [78, 112, 126], [78, 122, 110]];

/** A sheet of paper with a testimony written on it, a small heart over the heading, and a pen finishing the last line. */
export function TestimonyScene() {
  return <>
    <P d="M66 40H166L172 46V146H72L66 140Z" c="ga-p ga-l" />
    <P d={hatch(160, 46, 10, 96, 4)} c="ga-h ga-sm-hide" />
    <P d="M66 40L72 46H172" c="ga-f" />
    <P d="M78 54H118" c="ga-i" />
    {LINES.map(([x, y, end], i) => <P key={y} d={`M${x} ${y}H${end}`} c={i === 0 ? "ga-i" : "ga-f"} />)}
    <P d="M78 94H150M78 116H150" c="ga-h ga-sm-hide" />
    <g className="ga-pulse">
      <P d="M134 56C128 51 126 45 130 42C132 41 134 42 134 44C134 42 136 41 138 42C142 45 140 51 134 56Z" c="ga-t ga-l" />
    </g>
    <g className="ga-bob">
      <P d="M112 126L186 92L190 100L118 134Z" c="ga-t ga-l" />
      <P d="M112 126L104 134L118 134" c="ga-l" />
      <P d="M182 93L186 101" c="ga-i" />
    </g>
    {[[48, 56, 3.2], [196, 52, 3], [214, 110, 2.6]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 148, 62)} c="ga-h" />
  </>;
}

export const TESTIMONY_SCENE_ART = {
  Scene: TestimonyScene,
  tone: "acts",
  alt: "A sheet of paper with a testimony written on it, a small heart above the heading, and a pen finishing the last line",
} as const satisfies GameArt;
