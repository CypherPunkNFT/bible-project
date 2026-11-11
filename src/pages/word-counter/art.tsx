// The word counter's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a 240 × 160
// scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather than in
// tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** An open Bible with one word picked out on several lines, a magnifying glass over it, and tally marks being counted. */
export function WordCounterScene() {
  return <>
    <P d="M120 70C104 62 84 60 62 64V134C84 130 104 132 120 140Z" c="ga-p ga-l" />
    <P d="M120 70C136 62 156 60 178 64V134C156 130 136 132 120 140Z" c="ga-p ga-l" />
    <P d="M120 70V140" c="ga-i" />
    <P d="M70 76q20-3 42 1M70 86q20-3 42 1M70 96q20-3 42 1M70 106q20-3 42 1M70 116q20-3 42 1M70 126q20-3 42 1" c="ga-f" />
    <P d="M128 77q20-4 42-1M128 87q20-4 42-1M128 97q20-4 42-1M128 107q20-4 42-1M128 117q20-4 42-1" c="ga-f" />
    {[[82, 84], [96, 104], [140, 95], [150, 115]].map(([x, y], i) => <rect key={`${x}-${y}`} className="ga-t ga-pulse" x={x} y={y} width={12} height={5} rx={1.5} style={at(i)} />)}
    <P d={hatch(64, 120, 50, 12, 4)} c="ga-h ga-sm-hide" />
    <P d="M58 134C80 132 104 136 120 144C136 136 160 132 182 134" c="ga-l ga-bold" />
    <g className="ga-bob">
      <circle className="ga-t ga-l" cx={156} cy={58} r={17} />
      <P d="M146 50q6-6 14-4" c="ga-f" />
      <P d="M168 70L186 90" c="ga-l ga-bold" />
    </g>
    <P d="M196 104V128M201 104V128M206 104V128M211 104V128M192 124L216 108" c="ga-i" />
    {[[64, 46, 3.4], [100, 38, 3], [208, 80, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(124, 148, 66)} c="ga-h" />
  </>;
}

export const WORD_COUNTER_ART = {
  Scene: WordCounterScene,
  tone: "prophets",
  alt: "An open Bible with a word picked out on several lines, a magnifying glass over it and tally marks beside it",
} as const satisfies GameArt;
