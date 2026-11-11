// The daily-puzzle shelf's drawings: Bible Wordle, Map quest, Timeline sort, Odd one out and Bible crossword (style:
// parts.tsx).
import type { ReactNode } from "react";
import { at, hatch, shadow, spark } from "./draw";
import { P, T } from "./parts";

/** Wordle tile states: correct (solid), present (tinted), absent (paper). */
type TileKind = "c" | "p" | "x";

function Tile({ x, y, letter, kind, turn }: { x: number; y: number; letter: string; kind: TileKind; turn?: number }) {
  const box = kind === "c" ? "ga-s" : kind === "p" ? "ga-t ga-l" : "ga-p ga-f";
  return <g className={turn === undefined ? undefined : "ga-turn"} style={turn === undefined ? undefined : at(turn)}>
    <rect className={box} x={x} y={y} width={26} height={26} rx={3} />
    <T x={x + 13} y={y + 14} size={14} c={kind === "c" ? "ga-txt ga-on" : kind === "x" ? "ga-txt ga-mute" : "ga-txt"}>{letter}</T>
  </g>;
}

/** Two rows on a ledge: a guess (BREAD) marked tile by tile, then the answer (GRACE), whose tiles turn in order. */
export function WordleScene() {
  const guess: [string, TileKind][] = [["B", "x"], ["R", "c"], ["E", "p"], ["A", "p"], ["D", "x"]];
  const x = (i: number) => 43 + i * 32;
  return <>
    {guess.map(([letter, kind], i) => <Tile key={i} x={x(i)} y={38} letter={letter} kind={kind} />)}
    {[..."GRACE"].map((letter, i) => <Tile key={i} x={x(i)} y={74} letter={letter} kind="c" turn={i} />)}
    <P d="M34 110H206L200 120H40Z" c="ga-p ga-l" />
    <P d={hatch(42, 112, 156, 7, 3.4)} c="ga-h ga-sm-hide" />
    <P d={shadow(120, 121, 70)} c="ga-h" />
    {[[30, 30, 4], [210, 46, 3.4], [214, 22, 2.4]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </>;
}

/** A folded map: sea to the west, the Sea of Galilee, the Jordan and the Dead Sea, a dashed route and a pin that drops. */
export function MapQuestScene() {
  const waves = [[46, 52], [66, 72], [48, 94], [72, 112], [54, 122]].map(([wx, wy]) => `M${wx} ${wy}q4 -3 8 0t8 0`).join("");
  return <>
    <P d="M34 30L92 22L150 30L206 22V128L150 136L92 128L34 136Z" c="ga-p ga-l" />
    <P d="M36 32L92 24L114 27C108 42 118 52 110 66C104 78 108 92 102 104C98 114 102 124 98 130L92 128L36 134Z" c="ga-t" />
    <P d="M114 27C108 42 118 52 110 66C104 78 108 92 102 104C98 114 102 124 98 130" c="ga-i" />
    <P d={waves} c="ga-f" />
    <P d="M92 22V128M150 30V136" c="ga-f" /><P d="M95 25V128M98 26V129M153 30V135M156 29V134" c="ga-h ga-sm-hide" />
    <ellipse className="ga-l" cx={158} cy={52} rx={4} ry={6} /><ellipse className="ga-t ga-l" cx={162} cy={108} rx={4.5} ry={9} />
    <P d="M158 58C162 66 154 74 160 82C164 90 158 96 162 99" c="ga-f" />
    <P d="M126 48l5 -6l5 6M174 72l5 -6l5 6M128 92l5 -6l5 6M182 42l4 -5l4 5M186 112l4 -5l4 5" c="ga-f" />
    <P d="M118 122C124 106 130 98 138 84" c="ga-f ga-dash" />
    <circle className="ga-f" cx={60} cy={108} r={11} /><P d="M60 95L63 108L60 121L57 108ZM47 108L60 105L73 108L60 111Z" c="ga-i" />
    <T x={60} y={90} size={7} c="ga-txt ga-small">N</T>
    <ellipse className="ga-l ga-ring" cx={140} cy={81} rx={9} ry={3} />
    <g className="ga-drop"><P d="M140 80C134 70 130 65 130 59A10 10 0 0 1 150 59C150 65 146 70 140 80Z" c="ga-s" /><circle className="ga-p" cx={140} cy={59} r={3.6} /></g>
    <P d={shadow(120, 136, 84)} c="ga-h" />
  </>;
}

function EventCard({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <g><rect className="ga-p ga-l" x={x} y={y} width={40} height={48} rx={3} /><rect className="ga-f" x={x + 3} y={y + 3} width={34} height={42} rx={1.5} />{children}</g>;
}

const ark = (x: number, y: number) => <>
  <P d={`M${x + 7} ${y + 28}h26l-4 7h-18zM${x + 12} ${y + 28}v-7h16v7M${x + 10} ${y + 21}l10 -6l10 6`} />
  <P d={`M${x + 6} ${y + 40}q3 -2 5 0t5 0t5 0t5 0t5 0t5 0`} c="ga-f" />
</>;
const sea = (x: number, y: number) => <>
  <P d={`M${x + 8} ${y + 42}C${x + 9} ${y + 30} ${x + 12} ${y + 18} ${x + 15} ${y + 8}M${x + 32} ${y + 42}C${x + 31} ${y + 30} ${x + 28} ${y + 18} ${x + 25} ${y + 8}`} />
  <P d={`M${x + 6} ${y + 18}l5 -2M${x + 6} ${y + 26}l5 -2M${x + 6} ${y + 34}l5 -2M${x + 29} ${y + 16}l5 2M${x + 29} ${y + 24}l5 2M${x + 29} ${y + 32}l5 2`} c="ga-h" />
  <P d={`M${x + 20} ${y + 10}V${y + 42}`} c="ga-f ga-dash" />
  <circle className="ga-s" cx={x + 20} cy={y + 24} r={1.5} /><circle className="ga-s" cx={x + 20} cy={y + 31} r={1.5} />
</>;
const crown = (x: number, y: number) => <>
  <P d={`M${x + 9} ${y + 32}l2 -15l6 8l3 -11l3 11l6 -8l2 15z`} c="ga-t ga-l" /><P d={`M${x + 9} ${y + 37}h22`} />
  <circle className="ga-s" cx={x + 20} cy={y + 13} r={1.6} />
</>;

/** Events on a dated line: the ark and the crown in place, the parted sea lifted and sliding into its empty slot. */
export function TimelineScene() {
  const ticks = Array.from({ length: 10 }, (_, i) => `M${30 + i * 20} 112v8`).join("");
  return <>
    <P d="M18 116H222" c="ga-i" /><P d={ticks} c="ga-f" />
    {[60, 120, 180].map((cx) => <circle key={cx} className="ga-s" cx={cx} cy={116} r={2.6} />)}
    <P d="M60 102V113M180 102V113" c="ga-f" />
    <EventCard x={40} y={54}>{ark(40, 54)}</EventCard>
    <EventCard x={160} y={54}>{crown(160, 54)}</EventCard>
    <rect className="ga-f ga-dash" x={100} y={54} width={40} height={48} rx={3} />
    <P d="M114 46C104 52 104 60 110 66M106 62l4 4l4 -3" c="ga-f ga-dash" />
    <g className="ga-slide"><g transform="rotate(-10 136 34)"><EventCard x={116} y={10}>{sea(116, 10)}</EventCard></g></g>
    <P d={hatch(18, 121, 204, 6, 4)} c="ga-h ga-sm-hide" />
  </>;
}

function Sheep({ cx, cy }: { cx: number; cy: number }) {
  return <g>
    <P d={`M${cx - 14} ${cy}C${cx - 19} ${cy - 7} ${cx - 11} ${cy - 14} ${cx - 5} ${cy - 11}C${cx - 2} ${cy - 17} ${cx + 8} ${cy - 16} ${cx + 9} ${cy - 10}C${cx + 16} ${cy - 12} ${cx + 19} ${cy - 3} ${cx + 14} ${cy + 1}C${cx + 16} ${cy + 8} ${cx + 7} ${cy + 10} ${cx + 3} ${cy + 7}C${cx - 1} ${cy + 11} ${cx - 9} ${cy + 10} ${cx - 9} ${cy + 6}C${cx - 16} ${cy + 8} ${cx - 19} ${cy + 3} ${cx - 14} ${cy}Z`} c="ga-p ga-l" />
    <P d={`M${cx - 6} ${cy - 3}q2 -2 4 0M${cx + 2} ${cy + 1}q2 -2 4 0M${cx - 2} ${cy - 8}q2 -2 4 0`} c="ga-f" />
    <ellipse className="ga-s" cx={cx + 17} cy={cy - 6} rx={4.5} ry={6} /><P d={`M${cx + 14} ${cy - 9}l-5 -2`} c="ga-i" />
    <P d={`M${cx - 7} ${cy + 8}v9M${cx + 7} ${cy + 8}v9`} c="ga-i" />
  </g>;
}

function Goat({ cx, cy }: { cx: number; cy: number }) {
  return <g>
    <P d={`M${cx - 14} ${cy - 6}H${cx + 8}C${cx + 13} ${cy - 6} ${cx + 15} ${cy - 2} ${cx + 15} ${cy + 2}V${cy + 3}C${cx + 15} ${cy + 7} ${cx + 11} ${cy + 9} ${cx + 7} ${cy + 9}H${cx - 12}C${cx - 16} ${cy + 9} ${cx - 18} ${cy + 6} ${cx - 18} ${cy + 2}V${cy - 1}C${cx - 18} ${cy - 4} ${cx - 16} ${cy - 6} ${cx - 14} ${cy - 6}Z`} c="ga-t ga-l" />
    <P d={`M${cx + 10} ${cy - 5}L${cx + 15} ${cy - 16}C${cx + 17} ${cy - 20} ${cx + 22} ${cy - 20} ${cx + 24} ${cy - 16}L${cx + 27} ${cy - 8}C${cx + 28} ${cy - 5} ${cx + 25} ${cy - 4} ${cx + 23} ${cy - 6}L${cx + 15} ${cy + 1}`} c="ga-p ga-l" />
    <P d={`M${cx + 17} ${cy - 18}C${cx + 13} ${cy - 27} ${cx + 6} ${cy - 27} ${cx + 4} ${cy - 21}M${cx + 20} ${cy - 19}C${cx + 18} ${cy - 28} ${cx + 11} ${cy - 30} ${cx + 8} ${cy - 26}M${cx + 25} ${cy - 6}l1 6l-3 -2M${cx - 17} ${cy - 4}l-4 -6`} c="ga-i" />
    <circle className="ga-s" cx={cx + 21} cy={cy - 13} r={1} />
    <P d={`M${cx - 13} ${cy + 9}v13M${cx - 8} ${cy + 9}v13M${cx + 5} ${cy + 9}v13M${cx + 10} ${cy + 9}v13`} c="ga-i" />
    <P d={hatch(cx - 16, cy + 1, 28, 7, 3)} c="ga-h ga-sm-hide" />
  </g>;
}

/** Three sheep and a goat on a hillside (Matthew 25), the goat ringed. */
export function OddOneOutScene() {
  return <>
    <P d="M14 132C70 120 150 118 226 128V150H14Z" c="ga-t" /><P d="M14 132C70 120 150 118 226 128" c="ga-f" />
    <Sheep cx={40} cy={112} /><Sheep cx={90} cy={107} /><Goat cx={142} cy={100} /><Sheep cx={200} cy={109} />
    <circle className="ga-l ga-dash ga-pulse" cx={146} cy={98} r={30} />
    {[[150, 58, 3], [176, 70, 2.4]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </>;
}

/** A crossword sheet half filled in (MOSES across, MANNA, SEA and SINAI down, ARK across) and a pencil writing in it. */
export function CrosswordScene() {
  const rows = ["MOSES", "A#E#I", "N#A#N", "N###.", "AR.#."];
  const blank = new Set(["2,2", "4,2"]); // squares still to fill: the A of SEA and the K of ARK
  const x = (col: number) => 70 + col * 20, y = (row: number) => 40 + row * 20;
  return <>
    <P d="M58 30H182V146H58Z" c="ga-p ga-l" />
    <P d={hatch(60, 128, 120, 16, 3.4)} c="ga-h ga-sm-hide" />
    {rows.flatMap((row, r) => [...row].map((letter, col) => letter === "#"
      ? <rect key={`${r}-${col}`} className="ga-s" x={x(col) + 2} y={y(r) + 2} width={16} height={16} />
      : <g key={`${r}-${col}`}>
        <rect className={r === 0 || col === 0 ? "ga-t ga-f" : "ga-p ga-f"} x={x(col)} y={y(r)} width={20} height={20} />
        {letter !== "." && !blank.has(`${r},${col}`) && <T x={x(col) + 10} y={y(r) + 11} size={11}>{letter}</T>}
      </g>))}
    <P d="M70 40H170V140H70Z" c="ga-l" />
    <g className="ga-bob">
      <P d="M163 113L167 101L201 59L209 65L175 107Z" c="ga-p ga-l" />
      <P d="M163 113L167 101L175 107Z" c="ga-t ga-l" /><P d="M201 59L209 65L213 60L205 54Z" c="ga-s" />
      <P d="M171 104L205 62" c="ga-f" />
    </g>
    <P d={shadow(120, 150, 64)} c="ga-h" />
    {[[40, 40, 3.4], [206, 30, 2.6]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </>;
}
