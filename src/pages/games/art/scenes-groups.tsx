// The youth-group-and-church-night shelf's drawings: Live youth-group quiz, Bible Jeopardy, Hot seat and Two truths and
// a lie (style: parts.tsx).
import { at, hatch, shadow, spark } from "./draw";
import { P, T } from "./parts";

function RaisedPhone({ x, y, turn }: { x: number; y: number; turn: number }) {
  return <g>
    <P d={`M${x + 8} ${y + 32}L${x + 4} 150`} c="ga-i" />
    <rect className="ga-p ga-l" x={x} y={y} width={16} height={28} rx={3} /><rect className="ga-t" x={x + 2} y={y + 3} width={12} height={18} rx={1} />
    <P d={`M${x + 4} ${y + 8}h8M${x + 4} ${y + 12}h8M${x + 4} ${y + 16}h5`} c="ga-f" />
    <P d={`M${x + 1} ${y + 22}c-3 2 -3 8 0 10h14c3 -2 3 -8 0 -10`} c="ga-p ga-l" />
    <P d={`M${x + 3} ${y - 4}a7 7 0 0 1 10 0M${x} ${y - 8}a11 11 0 0 1 16 0`} c="ga-f ga-signal" style={at(turn)} />
  </g>;
}

/** A question on the big screen, its four answers filling as the room votes from the phones held up in front. */
export function LiveQuizScene() {
  const answers: [string, number, number][] = [["A", 64, 48], ["B", 122, 48], ["C", 64, 70], ["D", 122, 70]];
  return <>
    <P d="M120 98V114M98 114H142" c="ga-i" />
    <rect className="ga-p ga-l" x={52} y={18} width={136} height={80} rx={4} /><rect className="ga-f" x={56} y={22} width={128} height={72} rx={2} />
    <P d="M66 32H174" c="ga-i" /><P d="M66 39H138" c="ga-f" />
    {answers.map(([letter, ax, ay], i) => <g key={letter}>
      <rect className="ga-t ga-fill" style={at(i)} x={ax} y={ay} width={54} height={16} rx={3} />
      <rect className="ga-f" x={ax} y={ay} width={54} height={16} rx={3} />
      <T x={ax + 8} y={ay + 8.5} size={8}>{letter}</T>
    </g>)}
    <P d="M166 56l3 3l6 -7" c="ga-i" />
    <RaisedPhone x={30} y={100} turn={0} /><RaisedPhone x={80} y={112} turn={1} /><RaisedPhone x={192} y={104} turn={2} />
  </>;
}

/** A category board of value tiles on an easel; a few are used, and one turns over. */
export function JeopardyScene() {
  const used = new Set(["1-0", "3-1", "0-2"]);
  return <>
    <P d="M84 114L74 148M156 114L166 148M120 114V146" c="ga-i" />
    <rect className="ga-p ga-l" x={52} y={22} width={136} height={92} rx={3} />
    {[0, 1, 2, 3].map((c) => <rect key={c} className="ga-s" x={56 + c * 33} y={26} width={29} height={10} rx={1.5} />)}
    {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => {
      const x = 56 + c * 33, y = 40 + r * 18, key = `${c}-${r}`;
      const turning = key === "2-1";
      return <g key={key} className={turning ? "ga-turn" : undefined} style={turning ? at(0) : undefined}>
        <rect className={turning ? "ga-t ga-l" : "ga-f"} x={x} y={y} width={29} height={15} rx={1.5} />
        {!used.has(key) && <T x={x + 14.5} y={y + 8} size={7} c="ga-txt ga-tone">{String((r + 1) * 100)}</T>}
      </g>;
    }))}
    <P d="M64 116H176" /><rect className="ga-p ga-l" x={150} y={111} width={14} height={4} rx={1} />
    <P d={shadow(120, 146, 56)} c="ga-h" />
  </>;
}

/** The stopwatch's twelve ticks, longer every quarter. */
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, inner = i % 3 ? 30 : 26;
  const point = (r: number) => `${(150 + r * Math.sin(a)).toFixed(1)} ${(66 - r * Math.cos(a)).toFixed(1)}`;
  return `M${point(inner)}L${point(34)}`;
}).join("");

/** An empty chair under a lamp, heat rising from the seat, and a sixty-second stopwatch whose hand sweeps. */
export function HotSeatScene() {
  return <>
    <P d="M78 0V18" c="ga-f" /><P d="M66 28L52 96H104L90 28Z" c="ga-t2" /><P d="M66 28L72 18H84L90 28Z" c="ga-p ga-l" />
    <P d="M144 18h12v6h-12zM150 24v2M178 30l6 -6l4 4l-6 6" />
    <circle className="ga-p ga-l" cx={150} cy={66} r={40} /><circle className="ga-f" cx={150} cy={66} r={34} />
    <P d="M150 66V32A34 34 0 0 1 179.4 49Z" c="ga-t" /><P d={TICKS} c="ga-i" />
    <T x={150} y={86} size={13}>60</T>
    <g className="ga-sweep" style={at(0, "150px 66px")}><P d="M150 70V36" c="ga-i ga-bold" /></g>
    <circle className="ga-s" cx={150} cy={66} r={2.6} />
    <P d="M54 58H66V98H54Z" c="ga-t ga-l" /><P d={hatch(55, 59, 10, 38, 3)} c="ga-h ga-sm-hide" />
    <P d="M54 98H100V104H54Z" c="ga-p ga-l" /><P d="M56 104V146M98 104V146" /><P d="M56 128H98" c="ga-f" />
    {[70, 80, 90].map((x, i) => <P key={x} d={`M${x} 94c-3 -4 3 -6 0 -10c-3 -4 3 -6 0 -10`} c="ga-f ga-heat" style={at(i)} />)}
    <P d={shadow(77, 146, 30)} c="ga-h" />
  </>;
}

function Statement({ x, y, lie }: { x: number; y: number; lie?: boolean }) {
  return <g>
    <rect className="ga-p ga-l" x={x} y={y} width={52} height={72} rx={5} />
    <P d={`M${x + 8} ${y + 14}h36M${x + 8} ${y + 21}h30M${x + 8} ${y + 28}h34`} c="ga-f" />
    {lie ? <>
      <P d={`M${x + 12} ${y + 46}C${x + 12} ${y + 40} ${x + 40} ${y + 40} ${x + 40} ${y + 46}C${x + 40} ${y + 56} ${x + 33} ${y + 62} ${x + 26} ${y + 57}C${x + 19} ${y + 62} ${x + 12} ${y + 56} ${x + 12} ${y + 46}Z`} c="ga-s" />
      <ellipse className="ga-p" cx={x + 20} cy={y + 47} rx={3.5} ry={2.2} /><ellipse className="ga-p" cx={x + 32} cy={y + 47} rx={3.5} ry={2.2} />
      <P d={`M${x + 12} ${y + 46}l-4 -3M${x + 40} ${y + 46}l4 -3`} c="ga-i" />
    </> : <>
      <circle className="ga-t ga-l" cx={x + 26} cy={y + 52} r={9} /><P d={`M${x + 21} ${y + 52}l3.5 3.5l6.5 -7`} c="ga-i" />
    </>}
  </g>;
}

/** Three statements fanned like cards: two ticked true, and the middle one, the lie, lifting to show its mask. */
export function TwoTruthsScene() {
  return <>
    <g transform="rotate(-18 120 150)"><Statement x={94} y={40} /></g>
    <g transform="rotate(18 120 150)"><Statement x={94} y={40} /></g>
    <g className="ga-lift"><Statement x={94} y={36} lie /></g>
    {[[150, 30, 3], [86, 26, 2.4]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 136, 54)} c="ga-h" />
  </>;
}
