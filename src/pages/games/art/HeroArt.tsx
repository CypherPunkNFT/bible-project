// The hub's hero drawing: the games table. A long table under a hanging lamp, in front of the same arched window as the
// game pictures, with a prop from several games on it, each in its game's colour: an open Bible with a question rising
// from it (the quiz), letter tiles (Wordle), fanned cards (Two truths) and a map with a pin (Map quest). The lamp sways,
// its flame flickers and the props move in slow loops (game-art.css); with reduced motion it is still.
import type { CSSProperties, ReactNode } from "react";
import { at, hatch, spark } from "./draw";
import { P, T } from "./parts";

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

function Lamp() {
  return <g className="ga-sway" style={at(0, "240px 0px")}>
    <P d="M231 70L150 214H330L249 70Z" c="ga-t2" />
    <P d="M240 0V36" c="ga-f" /><P d="M230 44L240 36L250 44" />
    <P d="M226 44H254L249 70H231Z" c="ga-p ga-l" />
    <P d="M240 66C235 60 237 54 240 49C243 54 245 60 240 66Z" c="ga-t ga-l ga-flame" />
  </g>;
}

function Table({ children }: { children: ReactNode }) {
  return <g>
    <P d="M20 214V136M50 214V136M20 136C26 128 44 128 50 136M20 162H50M20 188H50" c="ga-f" />
    <P d="M430 214V136M460 214V136M430 136C436 128 454 128 460 136M430 162H460M430 188H460" c="ga-f" />
    {children}
    <P d="M44 214V226H436V214Z" c="ga-p ga-l" /><P d={hatch(46, 216, 388, 8, 5)} c="ga-h" />
    <P d="M36 214H444" c="ga-l ga-bold" />
    <P d="M72 226V292M408 226V292M86 226V286M394 226V286" /><P d="M72 270H408" c="ga-f" />
    <P d="M0 292H480" c="ga-f" /><P d={hatch(60, 293, 360, 6, 6)} c="ga-h" />
  </g>;
}

function OpenBible() {
  const lines = (left: number) => [0, 1, 2].map((i) => `M${left} ${188 + i * 6}C${left + 12} ${183 + i * 6} ${left + 26} ${183 + i * 6} ${left + 38} ${188 + i * 6}`).join("");
  return <g style={tone("revelation")}>
    <P d="M58 186V214C82 206 104 207 114 214C124 207 146 206 170 214V186" />
    <P d="M64 210C82 202 102 202 114 210V182C102 174 82 174 64 182Z" c="ga-p ga-l" />
    <P d="M164 210C146 202 126 202 114 210V182C126 174 146 174 164 182Z" c="ga-p ga-l" />
    <P d={lines(70) + lines(120)} c="ga-f" />
    <g className="ga-bob"><P d="M104 140C104 132 108 128 114 128C120 128 124 132 124 137C124 143 119 145 116 148C115 149 114 151 114 155" c="ga-l ga-heavy" /><circle className="ga-s" cx={114} cy={162} r={2.4} /></g>
  </g>;
}

function Tiles() {
  return <g style={tone("epistles")}>
    {[..."PSALM"].map((letter, i) => <g key={i} className="ga-turn" style={at(i)}>
      <rect className="ga-s" x={182 + i * 22} y={184} width={20} height={20} rx={2.5} /><T x={192 + i * 22} y={194.5} size={11} c="ga-txt ga-on">{letter}</T>
    </g>)}
    <P d="M176 214L180 205H292L296 214Z" c="ga-p ga-l" />
  </g>;
}

function Cards() {
  return <g style={tone("acts")}>
    {[-16, 16, 0].map((angle) => <g key={angle} transform={`rotate(${angle} 322 214)`}>
      <rect className="ga-p ga-l" x={309} y={170} width={26} height={38} rx={3} />
      <P d="M313 178h18M313 183h14" c="ga-f" />
      {angle === 0 ? <P d="M316 196l3 3l6 -7" c="ga-i" /> : <circle className="ga-t ga-l" cx={322} cy={196} r={4.5} />}
    </g>)}
  </g>;
}

function MapPin() {
  return <g style={tone("poetry")}>
    <P d="M348 212L360 190H436L430 212Z" c="ga-p ga-l" />
    <P d="M384 191C380 198 388 204 380 212" c="ga-i" /><P d="M360 202q3 -2 6 0t6 0M364 208q3 -2 6 0" c="ga-f" />
    <ellipse className="ga-l ga-ring" cx={408} cy={201} rx={7} ry={2.4} />
    <g className="ga-drop"><P d="M408 200C403 192 400 188 400 183A8 8 0 0 1 416 183C416 188 413 192 408 200Z" c="ga-s" /><circle className="ga-p" cx={408} cy={183} r={3} /></g>
  </g>;
}

export function HeroArt() {
  return <svg className="ga-art gm-hero-art" viewBox="0 0 480 300" role="img" focusable="false"
    aria-label="A games table under a hanging lamp, set with an open Bible, letter tiles, playing cards and a map with a pin">
    <Window /><Lamp />
    <Table><OpenBible /><Tiles /><Cards /><MapPin /></Table>
    {[[172, 96, 5], [312, 84, 4], [286, 132, 3], [192, 140, 3]].map(([x, y, r], i) => <P key={i} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </svg>;
}
