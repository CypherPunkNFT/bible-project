// The Scripture memory helper's drawing for the tools hub, in the games' drawing kit (src/pages/games/art/: 240 × 160 in
// front of the arched window, ground at y = 150, one slow living detail). Kept in the tool's own folder so parallel tool
// builds never share a drawing file; memory-art.ts gives it its colour and description for the registry.
import { at, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** Lines of words on each page: full on the left, fading to dashes and then to nothing on the right. */
const LEFT = [96, 102, 108, 114, 120, 126];
const RIGHT = [[96, ""], [102, ""], [108, "ga-dash"], [114, "ga-dash"], [120, "ga-h ga-dash"], [126, "ga-h ga-dash"]] as const;

/** An open book whose right-hand page fades line by line, and a heart rising above it. */
export function MemoryScene() {
  return <>
    <P d="M120 92Q96 82 66 86V140Q96 136 120 146Q144 136 174 140V86Q144 82 120 92Z" c="ga-p ga-l" />
    <P d="M120 92V146" c="ga-l" />
    <P d="M62 140V146Q92 142 120 150Q148 142 178 146V140" c="ga-l" />
    {LEFT.map((y) => <P key={`l${y}`} d={`M74 ${y}Q95 ${y - 3} 112 ${y + 2}`} c="ga-i" />)}
    {RIGHT.map(([y, extra], i) => <P key={`r${y}`} d={`M128 ${y + 2}Q${145 - i} ${y - 3} ${166 - i * 6} ${y}`} c={extra ? `ga-f ${extra}` : "ga-f"} />)}
    <g className="ga-pulse"><P d="M120 70C108 60 104 50 112 45C116 43 119 46 120 49C121 46 124 43 128 45C136 50 132 60 120 70Z" c="ga-t ga-l" /></g>
    {[[86, 52, 3], [156, 46, 2.6], [190, 76, 2.4]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 150, 58)} c="ga-h" />
  </>;
}
