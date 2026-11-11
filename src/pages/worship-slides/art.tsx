// The worship slide maker's picture on the tools hub, in the games' drawing style (src/pages/games/art/parts.tsx: a
// 240 × 160 scene in front of the arched window, ground at y = 150, one slow living detail). Kept beside the tool rather
// than in tools/art/scenes.tsx so the tools built side by side never edit one file. No SVG ids and no words in the drawing.
import type { GameArt } from "@/pages/games/art/draw";
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** A projection screen on its stand showing a verse, a small projector on a stool casting its beam onto it. */
export function WorshipSlidesScene() {
  return <>
    <P d="M120 104V146M104 146L120 132L136 146" c="ga-l" />
    <rect className="ga-p ga-l" x={64} y={24} width={112} height={74} rx={2} />
    <rect className="ga-t" x={70} y={30} width={100} height={62} />
    <P d="M60 24H180" c="ga-l" />
    <g className="ga-pulse">
      <P d="M84 46H156M80 56H160M88 66H152" c="ga-i" />
      <P d="M106 80H134" c="ga-f" />
    </g>
    <P d="M40 120L70 92M40 120L70 34M40 120L64 60" c="ga-h ga-sm-hide" />
    <rect className="ga-p ga-l" x={26} y={114} width={24} height={14} rx={2} />
    <circle className="ga-t ga-l" cx={44} cy={121} r={4} />
    <P d="M30 128L28 146M46 128L48 146M26 136H50" c="ga-f" />
    <P d={hatch(190, 120, 22, 26, 4)} c="ga-h ga-sm-hide" />
    {[[196, 44, 3.4], [206, 70, 2.8], [30, 70, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 148, 40)} c="ga-h" />
  </>;
}

export const WORSHIP_SLIDES_ART = {
  Scene: WorshipSlidesScene,
  tone: "prophets",
  alt: "A projection screen showing lines of a verse, with a small projector casting light onto it",
} as const satisfies GameArt;
