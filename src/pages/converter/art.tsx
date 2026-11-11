// The converter's drawing for the tools hub, in the games' drawing kit (src/pages/games/art/: 240 × 160 in front of the
// arched window, ground at y = 150, one slow living detail). Kept in the tool's own folder so parallel tool builds never
// share a drawing file; converter-art.ts gives it its colour and description for the registry.
import { at, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** A merchant's balance with a weight in one pan and a coin stack in the other, a measuring rod leaning beside it. */
export function ConverterScene() {
  return <>
    <P d="M170 146L196 40" c="ga-l ga-bold" />
    {[52, 64, 76, 88, 100, 112, 124, 136].map((y, i) => <P key={y} d={`M${194 - i * 3 - (y - 52) * 0.25 + 2} ${y}h-6`} c="ga-f" />)}
    <P d="M100 146V54" c="ga-l ga-bold" />
    <P d="M84 146H116" c="ga-l ga-bold" />
    <circle className="ga-s" cx={100} cy={52} r={3} />
    <g className="ga-bob">
      <P d="M56 60H144" c="ga-l ga-bold" />
      <P d="M60 60L46 96M60 60L74 96M140 60L126 96M140 60L154 96" c="ga-f" />
      <P d="M40 96Q60 108 80 96Z" c="ga-t ga-l" />
      <P d="M120 96Q140 108 160 96Z" c="ga-t ga-l" />
      <P d="M52 96V86Q60 80 68 86V96" c="ga-p ga-l" />
      <P d="M56 86h8" c="ga-i" />
      {[94, 90, 86].map((y) => <ellipse key={y} className="ga-p ga-l" cx={140} cy={y} rx={10} ry={2.6} />)}
    </g>
    {[[34, 46, 3.2], [178, 112, 2.6], [70, 30, 2.4]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(100, 146, 40)} c="ga-h" />
  </>;
}
