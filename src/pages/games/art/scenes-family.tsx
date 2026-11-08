// The family-and-party shelf's drawings: Family charades, Emoji stories, Memory card match and Who's older? (style:
// parts.tsx).
import type { ReactNode } from "react";
import { at, hatch, shadow, spark } from "./draw";
import { P, T } from "./parts";

function Watcher({ x, y }: { x: number; y: number }) {
  return <g><circle className="ga-p ga-l" cx={x} cy={y} r={6} /><P d={`M${x - 11} ${y + 20}C${x - 11} ${y + 10} ${x + 11} ${y + 10} ${x + 11} ${y + 20}`} c="ga-p ga-l" /></g>;
}

function Bubble({ x, y, mark, turn }: { x: number; y: number; mark: string; turn: number }) {
  return <g className="ga-pop" style={at(turn)}>
    <P d={`M${x - 9} ${y - 7}h18a4 4 0 0 1 4 4v6a4 4 0 0 1 -4 4h-7l-4 5v-5h-7a4 4 0 0 1 -4 -4v-6a4 4 0 0 1 4 -4z`} c="ga-p ga-l" />
    <T x={x} y={y} size={10}>{mark}</T>
  </g>;
}

/** A player miming with the phone on their forehead, arms waving, while four watchers guess. */
export function CharadesScene() {
  return <>
    <g className="ga-wave-l" style={at(0, "108px 70px")}><P d="M108 70C98 64 92 54 88 43" /><circle className="ga-p ga-l" cx={88} cy={40} r={3} /></g>
    <g className="ga-wave-r" style={at(0, "132px 70px")}><P d="M132 70C142 66 150 58 156 49" /><circle className="ga-p ga-l" cx={157} cy={46} r={3} /></g>
    <P d="M80 36q-4 4 -2 9M85 30q-6 2 -8 8M165 40q4 4 2 9M160 34q6 2 8 8" c="ga-f" />
    <P d="M106 66C103 86 103 102 107 116H133C137 102 137 86 134 66C128 63 112 63 106 66Z" c="ga-t ga-l" />
    <P d="M106 88H134" c="ga-f" /><P d="M128 92l3 20M124 92l2 20" c="ga-h" />
    <P d="M113 116L108 146h-6M127 116L133 146h6" c="ga-i" />
    <circle className="ga-p ga-l" cx={120} cy={53} r={11} />
    <P d="M115 55q2 1.5 4 0M121 55q2 1.5 4 0M116 59q4 3 8 0" c="ga-i" />
    <rect className="ga-s" x={108} y={31} width={24} height={13} rx={2} /><P d="M112 36h16M112 40h10" c="ga-on-l" />
    <Watcher x={40} y={126} /><Watcher x={64} y={130} /><Watcher x={178} y={130} /><Watcher x={202} y={126} />
    <Bubble x={52} y={102} mark="?" turn={0} /><Bubble x={190} y={104} mark="!" turn={1} />
  </>;
}

/** The story of Noah in three round pictures (ark, rain, rainbow) and a blank answer to guess. */
export function EmojiStoriesScene() {
  const rings = [54, 120, 186];
  return <>
    {rings.map((cx) => <g key={cx}><circle className="ga-p ga-l" cx={cx} cy={66} r={26} /><circle className="ga-t" cx={cx} cy={66} r={22} /></g>)}
    <P d="M38 70h32l-5 9h-22zM45 70v-8h18v8M43 62l11 -7l11 7" /><rect className="ga-f" x={51} y={64} width={6} height={4} />
    <P d="M36 84q3 -2 5 0t5 0t5 0t5 0t5 0t5 0t5 0" c="ga-f" />
    <P d="M104 64C99 56 107 48 115 52C117 44 131 44 133 52C141 50 145 60 137 64Z" c="ga-p ga-l" />
    {["M110 70l-2 6", "M120 70l-2 6", "M130 70l-2 6", "M115 79l-2 6", "M125 79l-2 6"].map((d, i) => <P key={d} d={d} c="ga-i ga-rain" style={at(i)} />)}
    {[18, 13, 8].map((r, i) => <path key={r} className={`${i === 1 ? "ga-i" : "ga-l"} ga-draw`} style={at(i)} pathLength={1} d={`M${186 - r} 76A${r} ${r} 0 0 1 ${186 + r} 76`} />)}
    <P d="M168 80h36" c="ga-f" />
    <P d="M84 66h6M87 63l3 3l-3 3M150 66h6M153 63l3 3l-3 3" c="ga-i" />
    <rect className="ga-p ga-l" x={72} y={106} width={96} height={22} rx={11} />
    <T x={120} y={117} size={13}>?</T><P d="M86 122h10M100 122h10M130 122h10M144 122h10" c="ga-f" />
    <P d={shadow(120, 128, 46)} c="ga-h" />
  </>;
}

/** A twelve-point mane around a lion's face, for the face-up card. */
function Lion({ cx, cy }: { cx: number; cy: number }) {
  const mane = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 ? 8.5 : 11.5, a = (i / 24) * Math.PI * 2;
    return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join("") + "Z";
  return <g>
    <P d={mane} c="ga-t ga-l" /><circle className="ga-p ga-l" cx={cx} cy={cy} r={6.5} />
    <circle className="ga-s" cx={cx - 2.4} cy={cy - 1.5} r={.9} /><circle className="ga-s" cx={cx + 2.4} cy={cy - 1.5} r={.9} />
    <P d={`M${cx - 1.5} ${cy + 1.2}h3l-1.5 1.6zM${cx} ${cy + 2.8}v1.4M${cx - 2} ${cy + 4.6}q2 1 4 0`} c="ga-i" />
  </g>;
}

function CardBack({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return <g className={flip ? "ga-flip" : undefined}>
    <rect className="ga-p ga-l" x={x} y={y} width={34} height={46} rx={3} /><rect className="ga-f" x={x + 3} y={y + 3} width={28} height={40} rx={1.5} />
    <P d={hatch(x + 5, y + 5, 24, 36, 5)} c="ga-h ga-sm-hide" />
    <P d={`M${x + 17} ${y + 15}l6 8l-6 8l-6 -8z`} c="ga-p ga-l" />
  </g>;
}

/** A grid of face-down cards, with Daniel turned up and his lion found: one more card turns over and back. */
export function MemoryMatchScene() {
  const xs = [40, 82, 124, 166];
  return <>
    {[0, 1].flatMap((row) => xs.map((x, col) => {
      const key = `${row}-${col}`, y = 22 + row * 56;
      if (key === "0-1") return <g key={key}><rect className="ga-p ga-l" x={x} y={y} width={34} height={46} rx={3} /><T x={x + 17} y={y + 23} size={7.5}>Daniel</T></g>;
      if (key === "1-2") return <g key={key}><rect className="ga-p ga-l" x={x} y={y} width={34} height={46} rx={3} /><Lion cx={x + 17} cy={y + 22} /></g>;
      return <CardBack key={key} x={x} y={y} flip={key === "0-3"} />;
    }))}
    <P d="M108 70C112 76 122 72 130 77" c="ga-f ga-dash" />
    {[[120, 72, 3], [34, 70, 2.4], [208, 74, 2.8]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 126, 80)} c="ga-h" />
  </>;
}

/** An oval portrait on a nail and string. */
function Cameo({ cx, children }: { cx: number; children: ReactNode }) {
  return <g>
    <P d={`M${cx - 10} 34L${cx} 14L${cx + 10} 34`} c="ga-f" /><circle className="ga-s" cx={cx} cy={13} r={1.6} />
    <ellipse className="ga-p ga-l" cx={cx} cy={74} rx={34} ry={42} /><ellipse className="ga-t ga-f" cx={cx} cy={74} rx={30} ry={38} />
    {children}
  </g>;
}

/** Two portraits face each other, an old patriarch and a young king, with an hourglass between that turns over. */
export function WhosOlderScene() {
  return <>
    <Cameo cx={70}>
      <P d="M54 106C56 98 62 92 70 92C78 92 84 98 86 106" c="ga-p ga-l" />
      <P d="M58 66C56 50 84 50 82 66C84 76 86 86 88 94M58 66C56 76 54 86 52 94" />
      <circle className="ga-p ga-l" cx={70} cy={64} r={9} />
      <P d="M62 68C62 82 68 90 70 92C72 90 78 82 78 68" c="ga-p ga-l" /><P d="M66 74v10M70 76v12M74 74v10" c="ga-f" />
      <P d="M65 62q2 1 4 0M71 62q2 1 4 0" c="ga-i" />
    </Cameo>
    <Cameo cx={170}>
      <P d="M154 106C156 98 162 92 170 92C178 92 184 98 186 106" c="ga-p ga-l" />
      <circle className="ga-p ga-l" cx={170} cy={66} r={9} />
      <P d="M161 55l2 -9l4 5l3 -7l3 7l4 -5l2 9z" c="ga-s" />
      <P d="M162 70C163 78 177 78 178 70M165 64q2 1 4 0M171 64q2 1 4 0" c="ga-i" />
    </Cameo>
    <g className="ga-tip" style={at(0, "120px 78px")}>
      <P d="M108 54H132M108 102H132" c="ga-i" /><P d="M110 54V102M130 54V102" c="ga-f" />
      <P d="M113 57C113 72 120 74 120 78C120 82 113 84 113 99M127 57C127 72 120 74 120 78C120 82 127 84 127 99" />
      <P d="M115 62H125C124 68 121 71 120 72C119 71 116 68 115 62Z" c="ga-s" /><P d="M114 98C116 92 119 90 120 89C121 90 124 92 126 98Z" c="ga-s" />
      <P d="M120 74V89" c="ga-f" />
    </g>
    <P d={shadow(120, 140, 70)} c="ga-h" />
  </>;
}
