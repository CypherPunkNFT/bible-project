// The tools hub's hero drawing: a table by a window, set with things from several tools, each in its tool's colour: a
// lit candle (sympathy), an open Bible with a dove over it (prayers), a folded card (life events) and a calendar page
// (birthdays). Same window, lines and slow loops as the games hub's table (src/pages/games/art/HeroArt.tsx), so the two
// heroes read as a pair; with reduced motion it is still.
import type { CSSProperties, ReactNode } from "react";
import { at, hatch, spark } from "@/pages/games/art/draw";
import { P, T } from "@/pages/games/art/parts";

const tone = (name: string) => ({ color: `var(--${name})` }) as CSSProperties;

function Window() {
  return <g>
    <path className="ga-arch" d="M110 262V130A130 130 0 0 1 370 130V262Z" />
    <circle className="ga-sun" cx={240} cy={124} r={58} />
    <P d="M122 262V132A118 118 0 0 1 358 132V262" c="ga-arch-line" />
    <P d="M240 14V214M122 150H358" c="ga-f" />
    <P d="M150 150C170 120 210 102 240 100C270 102 310 120 330 150M134 104C160 70 200 50 240 48C280 50 320 70 346 104" c="ga-h" />
  </g>;
}

function Table({ children }: { children: ReactNode }) {
  return <g>
    {children}
    <P d="M44 214V226H436V214Z" c="ga-p ga-l" /><P d={hatch(46, 216, 388, 8, 5)} c="ga-h" />
    <P d="M36 214H444" c="ga-l ga-bold" />
    <P d="M72 226V292M408 226V292M86 226V286M394 226V286" /><P d="M72 270H408" c="ga-f" />
    <P d="M0 292H480" c="ga-f" /><P d={hatch(60, 293, 360, 6, 6)} c="ga-h" />
  </g>;
}

function Candle() {
  return <g style={tone("prophets")}>
    <circle className="ga-t2 ga-pulse" cx={92} cy={134} r={24} />
    <rect className="ga-p ga-l" x={80} y={152} width={24} height={56} rx={2} />
    <P d={hatch(82, 160, 9, 46, 4)} c="ga-h" />
    <P d="M92 152V146" c="ga-i" />
    <P d="M92 145C86 137 88 129 92 122C96 129 98 137 92 145Z" c="ga-t ga-l ga-flame" />
    <P d="M70 208H114L110 214H74Z" c="ga-p ga-l" />
  </g>;
}

function BibleAndDove() {
  const lines = (left: number) => [0, 1, 2].map((i) => `M${left} ${190 + i * 6}C${left + 12} ${185 + i * 6} ${left + 26} ${185 + i * 6} ${left + 38} ${190 + i * 6}`).join("");
  return <g style={tone("acts")}>
    <P d="M178 188V214C202 206 226 207 240 214C254 207 278 206 302 214V188" />
    <P d="M184 210C204 202 226 202 240 210V184C226 176 204 176 184 184Z" c="ga-p ga-l" />
    <P d="M296 210C276 202 254 202 240 210V184C254 176 276 176 296 184Z" c="ga-p ga-l" />
    <P d={lines(192) + lines(246)} c="ga-f" />
    <g className="ga-bob">
      <P d="M244 142C232 130 220 128 208 130C216 138 226 144 238 146Z" c="ga-t ga-l" />
      <P d="M226 148C234 140 250 138 260 144C264 140 270 140 274 142C270 144 268 148 264 150C254 156 236 156 226 150L212 154Z" c="ga-p ga-l" />
      <P d="M250 144C256 130 266 122 278 120C274 132 266 142 256 148Z" c="ga-t ga-l" />
      <circle className="ga-s" cx={268} cy={143} r={1.3} />
    </g>
  </g>;
}

function FoldedCard() {
  return <g style={tone("poetry")}>
    <P d="M340 160L316 168V212L340 206Z" c="ga-t ga-l" />
    <P d="M340 160L372 166V210L340 206Z" c="ga-p ga-l" />
    <P d="M328 178V196M322 184H334" c="ga-i" />
    <P d="M346 178l20 3M346 186l20 3M346 194l14 2" c="ga-f" />
  </g>;
}

function CalendarPage() {
  return <g style={tone("epistles")}>
    <rect className="ga-p ga-l" x={390} y={166} width={38} height={44} rx={3} />
    <rect className="ga-s" x={390} y={166} width={38} height={11} rx={3} />
    <P d="M399 162v8M419 162v8" c="ga-i" />
    <T x={409} y={195} size={17}>25</T>
  </g>;
}

export function HeroArt() {
  return <svg className="ga-art gm-hero-art" viewBox="0 0 480 300" role="img" focusable="false"
    aria-label="A table by a window, set with a lit candle, an open Bible with a dove over it, a folded card and a calendar page">
    <Window />
    <Table><Candle /><BibleAndDove /><FoldedCard /><CalendarPage /></Table>
    {[[172, 96, 5], [312, 84, 4], [306, 132, 3], [160, 150, 3]].map(([x, y, r], i) => <P key={i} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </svg>;
}
