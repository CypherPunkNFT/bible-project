// The reading planner's picture on the tools hub, in the games' drawing kit (src/pages/games/art/: 240 × 160 in front of
// the arched window, ground at y = 150, one slow living detail). Kept in the tool's own folder so parallel tool builds
// never share a drawing file; planner-art.ts gives it to the registry.
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** An open Bible with a ribbon, a calendar page with ticked days beside it, and a small clock above. */
export function ReadingPlannerScene() {
  return <>
    <P d="M40 132C62 124 86 124 108 132V82C86 74 62 74 40 82Z" c="ga-p ga-l" />
    <P d="M108 132C130 124 154 124 176 132V82C154 74 130 74 108 82Z" c="ga-t ga-l" />
    <P d="M50 92q24-6 48 0M50 102q24-6 48 0M50 112q24-6 48 0M118 92q24-6 48 0M118 102q24-6 48 0" c="ga-f" />
    <P d={hatch(118, 108, 50, 16, 4)} c="ga-h ga-sm-hide" />
    <P d="M100 80V146L104 140L108 146V82" c="ga-s" />
    <rect className="ga-p ga-l" x={150} y={30} width={56} height={50} rx={3} />
    <rect className="ga-s" x={150} y={30} width={56} height={11} rx={3} />
    <P d="M160 26v8M196 26v8" c="ga-i" />
    {[0, 1, 2, 3].map((col) => [0, 1].map((row) => (
      <P key={`${col}-${row}`} d={`M${158 + col * 12} ${52 + row * 14}l3 3l5-6`} c={col + row * 4 < 6 ? "ga-i" : "ga-f"} />
    )))}
    <circle className="ga-p ga-l" cx={70} cy={44} r={15} />
    <g className="ga-bob" style={at(0, "70px 44px")}><P d="M70 44V34M70 44l7 4" c="ga-i" /></g>
    {[[30, 60, 3], [126, 50, 3.4], [214, 102, 2.6]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d="M30 146H210" c="ga-l ga-bold" />
    <P d={shadow(108, 146, 70)} c="ga-h" />
  </>;
}
