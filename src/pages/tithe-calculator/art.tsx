// The tithe calculator's drawing for the tools hub, in the games' drawing kit (src/pages/games/art/: 240 × 160 in front
// of the arched window, ground at y = 150, one slow living detail). Kept in the tool's own folder so parallel tool
// builds never share a drawing file; tithe-art.ts gives it its colour and description for the registry.
import { at, shadow, spark } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

/** An offering bowl with a coin dropping into it, a sheaf of wheat on one side and a stack of nine coins on the other. */
export function TitheScene() {
  return <>
    <P d="M54 146C52 116 46 92 38 70M54 146C56 116 60 92 70 68M54 146C54 112 54 88 54 62" c="ga-l" />
    {[[38, 70], [70, 68], [54, 62]].map(([x, y]) => <P key={`${x}-${y}`} d={`M${x} ${y}q-5-9 0-18q5 9 0 18`} c="ga-p ga-l" />)}
    <P d="M44 118q10 5 20 0" c="ga-l ga-bold" />
    <P d="M98 112H182Q178 142 140 144Q102 142 98 112Z" c="ga-t ga-l" />
    <P d="M98 112H182" c="ga-l ga-bold" />
    <P d="M120 144L116 150H164L160 144" c="ga-l" />
    {[[126, 108], [140, 106], [154, 108]].map(([x, y]) => <ellipse key={x} className="ga-p ga-l" cx={x} cy={y} rx={9} ry={2.6} />)}
    <g className="ga-drop"><circle className="ga-p ga-l" cx={140} cy={74} r={6} /><P d="M137 74h6" c="ga-i" /></g>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ellipse key={i} className="ga-p ga-l" cx={206} cy={146 - i * 4.6} rx={11} ry={2.8} />)}
    {[[30, 40, 3], [204, 70, 2.6], [110, 34, 2.4]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(140, 150, 36)} c="ga-h" />
  </>;
}
