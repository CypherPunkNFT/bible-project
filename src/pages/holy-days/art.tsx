// The holy days calendar's picture on the tools hub, drawn with the games' kit (src/pages/games/art/) and kept in the
// tool's own folder so the shared tools/art/ files stay untouched: a wall calendar with one day ringed, and an oil lamp
// whose flame flickers slowly.
import type { GameArt } from "@/pages/games/art/draw";
import { shadow, spark, at } from "@/pages/games/art/draw";
import { P } from "@/pages/games/art/parts";

export function HolyDaysScene() {
  const cells = [0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2, 3, 4, 5, 6].map((col) => [62 + col * 14, 64 + row * 12]));
  return <>
    <rect className="ga-p ga-l" x={54} y={34} width={106} height={102} rx={4} />
    <P d="M54 54H160" />
    <P d="M54 34H160V54H54Z" c="ga-t ga-l" />
    {[74, 107, 140].map((x) => <P key={x} d={`M${x} 28v12`} c="ga-i" />)}
    {cells.map(([x, y], i) => <circle key={i} className="ga-f" cx={x + 2} cy={y + 4} r={1.3} />)}
    <circle className="ga-l" cx={106} cy={92} r={6.5} />
    <P d="M170 132h40c0 -10 -10 -16 -20 -16s-20 6 -20 16Z" c="ga-t ga-l" />
    <P d="M206 124c6 -2 10 -6 10 -10" c="ga-l" />
    <P d="M176 118c-2 -4 0 -9 4 -12c4 3 6 8 4 12Z" c="ga-t ga-l ga-flame" />
    {[[184, 62, 3], [204, 82, 2.4]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(107, 144, 60)} c="ga-h" />
    <P d={shadow(190, 140, 24)} c="ga-h" />
  </>;
}

export const HOLY_DAYS_ART = {
  Scene: HolyDaysScene,
  tone: "acts",
  alt: "A wall calendar with one day ringed, beside a small lit oil lamp",
} as const satisfies GameArt;
