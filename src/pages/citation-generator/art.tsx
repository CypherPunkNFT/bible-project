// The citation generator's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a
// 240 × 160 scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool so
// the tools built side by side never edit one drawing file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** A closed Bible beside a written page with a footnote line marked out, and a pen writing it. */
export function CitationScene() {
  return <>
    <P d="M52 96H104V142H52Z" c="ga-p ga-l" />
    <P d="M52 96L60 88H112L104 96M112 88V134L104 142" c="ga-l" />
    <P d="M78 106V128M70 114H86" c="ga-i" />
    <P d={hatch(54, 132, 48, 8, 4)} c="ga-h ga-sm-hide" />
    <P d="M122 58H186V146H122Z" c="ga-p ga-l" />
    <P d="M132 72H176M132 82H172M132 92H176M132 102H160" c="ga-f" />
    <P d="M128 116H182" c="ga-i" />
    {[[132, 124], [132, 132]].map(([x, y], i) => <rect key={y} className="ga-t ga-pulse" x={x} y={y} width={i ? 30 : 42} height={4} rx={1.5} style={at(i)} />)}
    <P d="M130 112q3-6 7 0M140 112q3-6 7 0" c="ga-i" />
    <g className="ga-bob">
      <P d="M196 70L170 128L176 131L202 73Z" c="ga-t ga-l" />
      <P d="M170 128L168 136L176 131" c="ga-l" />
    </g>
    {[[44, 70, 3.2], [118, 40, 3], [210, 104, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 150, 78)} c="ga-h" />
  </>;
}

export const CITATION_ART = {
  Scene: CitationScene,
  tone: "epistles",
  alt: "A closed Bible beside a written page with a footnote marked out at the bottom and a pen writing it",
} as const satisfies GameArt;
