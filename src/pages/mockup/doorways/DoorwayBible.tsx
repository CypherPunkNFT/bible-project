// MOCK-UP: the Bible row of the doorway design sheet (/doorways_mockup): five takes on the Bible card's drawing.
// Owner's note: the Bible "should be nicer... longer", so it reads as a real, dignified book rather than a children's book.
import type { DoorwayVariant } from "./doorway-types";

/** A page edge as a quadratic curve: start x, y, control x, y, end x, y. */
type Curve = readonly [number, number, number, number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mirror = (c: Curve): Curve => [320 - c[0], c[1], 320 - c[2], c[3], 320 - c[4], c[5]];

/** Text lines for one column of a page: rows that bend between the page's top and bottom edges. */
function lines(top: Curve, bottom: Curve, u0: number, u1: number, rows: number, t0 = .1, t1 = .9): string {
  let d = "";
  for (let r = 0; r < rows; r++) {
    const c = top.map((v, i) => lerp(v, bottom[i], lerp(t0, t1, r / (rows - 1))));
    for (let k = 0; k <= 5; k++) {
      const u = lerp(u0, u1, k / 5), m = 1 - u;
      d += `${k ? "L" : "M"}${(m * m * c[0] + 2 * m * u * c[2] + u * u * c[4]).toFixed(1)} ${(m * m * c[1] + 2 * m * u * c[3] + u * u * c[5]).toFixed(1)}`;
    }
  }
  return d;
}

/** Both pages of an open book (left page given, right mirrored), shifted down by d and outward by out. */
function spread(top: Curve, bottom: Curve, d = 0, out = 0): string {
  const [ax, ay, cx, cy, , gy] = top, [bx, by, dx, dy, , hy] = bottom;
  return `M160 ${gy + d}Q${cx} ${cy + d} ${ax - out} ${ay + d}L${bx - out} ${by + d}Q${dx} ${dy + d} 160 ${hy + d}`
    + `Q${320 - dx} ${dy + d} ${320 - bx + out} ${by + d}L${320 - ax + out} ${ay + d}Q${320 - cx} ${cy + d} 160 ${gy + d}Z`;
}

/** Cover board, stacked page edges, the top pages and the gutter of an open book. */
function OpenBook({ top, bottom, depth }: { top: Curve; bottom: Curve; depth: number[] }) {
  const deepest = depth[0];
  return <>
    <path d={spread(top, bottom, deepest + 3, deepest + 6)} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.3" />
    {depth.map((d) => <path key={d} d={spread(top, bottom, d, d * .9)} fill="var(--surface)" stroke="currentColor" strokeOpacity=".45" />)}
    <path d={spread(top, bottom)} fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d={`M160 ${top[5]}V${bottom[5]}`} stroke="currentColor" opacity=".55" />
  </>;
}

function TallOpen() {
  const top: Curve = [44, 22, 108, 12, 160, 30], bottom: Curve = [44, 150, 108, 140, 160, 157];
  const columns = [[.1, .46], [.54, .9]].flatMap(([a, b]) => [lines(top, bottom, a, b, 15), lines(mirror(top), mirror(bottom), a, b, 15)]);
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <OpenBook top={top} bottom={bottom} depth={[9, 6, 3]} />
    <path d="M160 30Q151 25 138 23V152Q151 153 160 157ZM160 30Q169 25 182 23V152Q169 153 160 157Z" fill="currentColor" fillOpacity=".07" />
    <path d={columns.join("")} stroke="currentColor" opacity=".34" />
    <path d="M186 21V177L190.5 172 195 177V22" fill="currentColor" opacity=".75" />
  </svg>;
}

function Lectern() {
  const top: Curve = [70, 22, 116, 12, 160, 28], bottom: Curve = [52, 96, 108, 89, 160, 101];
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M150 140H170L167 150Q174 154 167 158L170 168H150L153 158Q146 154 153 150Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".7" />
    <path d="M118 175Q124 166 160 166Q196 166 202 175Z" fill="var(--surface)" stroke="currentColor" /><path d="M100 176H220" stroke="currentColor" strokeWidth="1.4" />
    <OpenBook top={top} bottom={bottom} depth={[6, 3]} />
    <path d={[lines(top, bottom, .12, .88, 11), lines(mirror(top), mirror(bottom), .12, .88, 11)].join("")} stroke="currentColor" opacity=".34" />
    <path d="M36 108H284L276 119H44Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M36 108H284L276 119H44Z" fill="currentColor" fillOpacity=".12" />
    <path d="M128 119H192V138L160 150 128 138Z" fill="var(--surface)" stroke="currentColor" />
    <path d="M133 119V135L160 145 187 135V119" stroke="currentColor" opacity=".3" />
    <path d="M160 125V139M154 130H166" stroke="currentColor" strokeWidth="1.4" />
    <path d="M155 100L154 132 156.5 129 159 132 159.5 101ZM161 101L162.5 126 165 123 167.5 126 165 100Z" fill="currentColor" fillOpacity=".7" />
  </svg>;
}

function Standing() {
  const band = (t: number) => `M110 ${lerp(24, 170, t)}Q124 ${lerp(15, 164, t)} 142 ${lerp(16, 164, t)}`;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M94 170V94A82 82 0 0 1 258 94V170" stroke="currentColor" opacity=".2" />
    <path d="M106 170V98A70 70 0 0 1 246 98V170" stroke="currentColor" opacity=".1" />
    <path d="M40 171H300" stroke="currentColor" opacity=".45" />
    <ellipse cx="176" cy="171" rx="82" ry="4" fill="currentColor" fillOpacity=".1" />
    <path d="M110 24Q124 15 142 16V164Q124 164 110 170Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M110 24Q124 15 142 16V164Q124 164 110 170Z" fill="currentColor" fillOpacity=".17" />
    {[.15, .3, .7, .85].map((t) => <g key={t} stroke="currentColor"><path d={band(t)} strokeWidth="1.3" /><path d={band(t + .022)} opacity=".4" /></g>)}
    <path d="M126 76V110M120 86H132" stroke="currentColor" strokeWidth="1.3" />
    <rect x="142" y="16" width="100" height="148" rx="3" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <rect x="142" y="16" width="100" height="148" rx="3" fill="currentColor" fillOpacity=".08" />
    <rect x="150" y="24" width="84" height="132" rx="1.5" stroke="currentColor" opacity=".55" />
    <rect x="155" y="29" width="74" height="122" stroke="currentColor" opacity=".25" />
    {[[155, 29], [229, 29], [155, 151], [229, 151]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 4}L${x + 4} ${y} ${x} ${y + 4} ${x - 4} ${y}Z`} fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" />)}
    <path d="M192 52V110M176 70H208" stroke="currentColor" strokeWidth="2" />
    <text x="193" y="134" textAnchor="middle" fontSize="8" letterSpacing="2" fill="currentColor">HOLY BIBLE</text>
  </svg>;
}

function GiltClosed() {
  // Top cover corners A (back left), B (back right), C (front right), D (front left); the spine is the front face D–C.
  const at = (u: number, v: number) => `${(52 + 162 * u + 62 * v).toFixed(1)} ${(50 - 32 * u + 74 * v).toFixed(1)}`;
  const spineX = (u: number) => 114 + 162 * u, spineY = (u: number) => 124 - 32 * u;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <ellipse cx="170" cy="140" rx="136" ry="22" fill="currentColor" fillOpacity=".06" />
    <path d="M276 92L214 18V46L276 120Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M273 97L217 30V41L273 108Z" fill="currentColor" fillOpacity=".16" />
    <path d={[0, 1, 2, 3].map((i) => `M272 ${99.5 + i * 2.5}L218 ${33.5 + i * 2.5}`).join("")} stroke="currentColor" opacity=".45" />
    <path d="M114 124L276 92V120L114 152Q107 138 114 124Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M114 124L276 92V120L114 152Q107 138 114 124Z" fill="currentColor" fillOpacity=".17" />
    {[.14, .26, .74, .86].map((u) => <g key={u} stroke="currentColor"><path d={`M${spineX(u)} ${spineY(u)}Q${spineX(u) - 3} ${spineY(u) + 14} ${spineX(u)} ${spineY(u) + 28}`} strokeWidth="1.3" /><path d={`M${spineX(u) + 3.5} ${spineY(u) - .7}Q${spineX(u) + .5} ${spineY(u) + 13} ${spineX(u) + 3.5} ${spineY(u) + 27.3}`} opacity=".4" /></g>)}
    <text x="195" y="141" textAnchor="middle" fontSize="8" letterSpacing="2" fill="currentColor" transform="rotate(-11.2 195 138)">HOLY BIBLE</text>
    <path d={`M${at(0, 0)}L${at(1, 0)} ${at(1, 1)} ${at(0, 1)}Z`} fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d={`M${at(0, 0)}L${at(1, 0)} ${at(1, 1)} ${at(0, 1)}Z`} fill="currentColor" fillOpacity=".08" />
    <path d={`M${at(.06, .1)}L${at(.94, .1)} ${at(.94, .9)} ${at(.06, .9)}Z`} stroke="currentColor" opacity=".5" />
    <path d={`M${at(.1, .18)}L${at(.9, .18)} ${at(.9, .82)} ${at(.1, .82)}Z`} stroke="currentColor" opacity=".22" />
    <g transform="matrix(162 -32 62 74 52 50)" stroke="currentColor">
      <ellipse cx=".5" cy=".5" rx=".14" ry=".24" fill="currentColor" fillOpacity=".12" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <ellipse cx=".5" cy=".5" rx=".1" ry=".17" strokeOpacity=".5" vectorEffect="non-scaling-stroke" />
      <ellipse cx=".5" cy=".5" rx=".035" ry=".06" fill="currentColor" stroke="none" />
    </g>
    <path d="M257.4 69.8V97Q262 112 302 118" stroke="currentColor" strokeWidth="4" opacity=".75" />
    <path d="M245 55V83Q250 101 288 108" stroke="currentColor" strokeWidth="4" opacity=".4" />
  </svg>;
}

function TurningPage() {
  const top: Curve = [48, 42, 104, 30, 160, 50], bottom: Curve = [32, 140, 98, 131, 160, 150];
  const leaf = Array.from({ length: 10 }, (_, r) => {
    const t = .1 + r * .085, y0 = lerp(56, 146, t), x1 = lerp(216, 222, t), y1 = lerp(22, 126, t);
    return `M166 ${y0.toFixed(1)}Q${lerp(186, 196, t)} ${lerp(30, 136, t).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }).join("");
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <OpenBook top={top} bottom={bottom} depth={[8, 5, 2.5]} />
    <path d={[lines(top, bottom, .1, .88, 12), lines(mirror(top), mirror(bottom), .1, .88, 12)].join("")} stroke="currentColor" opacity=".34" />
    <path d="M222 14Q252 70 238 140L224 128C232 98 230 50 222 14Z" fill="currentColor" fillOpacity=".08" />
    <path d="M160 50C176 32 198 18 222 14C230 50 232 98 224 128C204 133 180 141 160 150Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M160 50C176 32 198 18 222 14C230 50 232 98 224 128C204 133 180 141 160 150Z" fill="currentColor" fillOpacity=".05" />
    <path d={leaf} stroke="currentColor" opacity=".22" />
    <path d="M144 46L142 172 146 167.5 150 172 152 48Z" fill="currentColor" opacity=".75" />
  </svg>;
}

export const BIBLE_DOORWAYS: DoorwayVariant[] = [
  { name: "Tall open book", Art: TallOpen },
  { name: "Open on the lectern", Art: Lectern },
  { name: "Standing, closed", Art: Standing },
  { name: "Gilt-edged, lying closed", Art: GiltClosed },
  { name: "Turning the page", Art: TurningPage },
];
