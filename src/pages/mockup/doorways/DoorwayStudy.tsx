// MOCK-UP: the Study row of the doorway design sheet (/doorways_mockup): five takes on the Study card's drawing.
// Owner's note: "study, I don't know", so the first keeps today's four-Gospels idea refit to the taller frame and the other four try new ones.
import type { DoorwayVariant } from "./doorway-types";

const GOSPELS = ["MATTHEW", "MARK", "LUKE", "JOHN"];
/** Chapters in each of the 66 books, Genesis to Revelation (1,189 in all). */
const CHAPTERS = [50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4,
  28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22];
const STARTS = CHAPTERS.reduce<number[]>((acc, n) => [...acc, acc[acc.length - 1] + n], [0]);
const chapterX = (chapter: number) => 16 + (chapter / 1189) * 288;

function Converging() {
  const ys = [32, 68, 112, 148];
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M10 172L74 96 104 126 140 86 196 166M190 166L246 100 272 124 312 84" stroke="currentColor" strokeOpacity=".1" />
    {ys.map((y, i) => <g key={y}>
      <text x="12" y={y + 3} fill="currentColor" opacity=".75" fontSize="8" letterSpacing="1.5">{GOSPELS[i]}</text>
      <path d={`M70 ${y}C124 ${y} 122 90 180 90S236 ${y} 290 ${y}`} stroke="currentColor" strokeWidth="1.2" opacity={.35 + i * .14} />
      <circle cx="294" cy={y} r="3.5" fill="currentColor" opacity={.4 + i * .14} />
    </g>)}
    <circle cx="180" cy="90" r="31" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="180" cy="90" r="23" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 4" />
    <path d="M180 72V110M168 84H192" stroke="currentColor" strokeWidth="2" />
  </svg>;
}

function CrossReferences() {
  const arcs = Array.from({ length: 46 }, (_, i) => {
    const a = (i * 7919 + 97) % 1189, b = (i * 104729 + 331) % 1189;
    return [chapterX(Math.min(a, b)), chapterX(Math.max(a, b))];
  }).filter(([a, b]) => b - a > 10);
  const arc = (a: number, b: number) => { const rx = (b - a) / 2; return `M${a.toFixed(1)} 140A${rx.toFixed(1)} ${Math.min(rx * .95, 126).toFixed(1)} 0 0 1 ${b.toFixed(1)} 140`; };
  const lead = [chapterX(STARTS[22] + 52), chapterX(STARTS[42] + 23)];
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    {arcs.map(([a, b], i) => <path key={i} d={arc(a, b)} stroke="currentColor" opacity={.12 + (i % 5) * .07} />)}
    <path d={arc(lead[0], lead[1])} stroke="currentColor" strokeWidth="1.6" />
    {lead.map((x) => <circle key={x} cx={x} cy="140" r="3" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />)}
    {CHAPTERS.map((n, i) => <rect key={i} x={chapterX(STARTS[i])} y="146" width={Math.max(chapterX(n) - 16 - .5, .8)} height="9" fill="currentColor" opacity={i % 2 ? .55 : .25} />)}
    <path d={`M${chapterX(STARTS[39]) - .6} 143V160`} stroke="currentColor" strokeWidth="1.2" />
    <g fill="currentColor" fontSize="8" letterSpacing="1.5" opacity=".75"><text x="16" y="172">GENESIS</text><text x="304" y="172" textAnchor="end">REVELATION</text></g>
  </svg>;
}

function AnnotatedPage() {
  const lengths = [104, 104, 104, 70, 104, 104, 104, 104, 46, 104, 104, 104, 104, 82, 104];
  const cards = [[14, "CONTEXT"], [70, "WORD"], [126, "CROSS-REF"]] as const;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M34 12H148L162 26V168H34Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M148 12V26H162" stroke="currentColor" opacity=".5" />
    <rect x="66" y="39" width="58" height="9" rx="1.5" fill="currentColor" fillOpacity=".16" />
    <path d={lengths.map((w, i) => `M46 ${30 + i * 9}h${w}`).join("")} stroke="currentColor" opacity=".38" />
    <path d="M58 98H114M58 100.5H114" stroke="currentColor" strokeWidth="1.1" opacity=".85" />
    <ellipse cx="122" cy="129" rx="20" ry="7" stroke="currentColor" strokeWidth="1.2" />
    <path d="M42 64H39V86H42" stroke="currentColor" opacity=".7" />
    <g stroke="currentColor" strokeDasharray="3 3" opacity=".6"><path d="M124 43C160 43 166 30 196 30" /><path d="M114 99C150 99 160 86 196 86" /><path d="M142 129C170 129 176 142 196 142" /></g>
    {[[124, 43], [114, 99], [142, 129]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.2" fill="currentColor" />)}
    {cards.map(([y, label]) => <g key={label}>
      <rect x="196" y={y} width="108" height="38" rx="3" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" />
      <text x="206" y={y + 14} fill="currentColor" fontSize="8" letterSpacing="1.5">{label}</text>
      <path d={`M206 ${y + 23}H292M206 ${y + 30}H262`} stroke="currentColor" opacity=".35" />
    </g>)}
  </svg>;
}

function Magnifier() {
  const [cx, cy, r] = [198, 80, 44];
  const big = [-28, -14, 0, 14, 28].map((dy) => { const half = Math.sqrt(r * r - dy * dy) - 9; return `M${(cx - half).toFixed(1)} ${cy + dy}H${(cx + half).toFixed(1)}`; });
  const rows = Array.from({ length: 13 }, (_, i) => 38 + i * 8.6);
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M160 28Q112 16 36 24V154Q112 146 160 160Q208 146 284 154V24Q208 16 160 28Z" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeWidth="1.3" />
    <path d="M160 28V160" stroke="currentColor" opacity=".45" />
    <path d={rows.map((y) => `M50 ${y.toFixed(1)}H148M172 ${y.toFixed(1)}H270`).join("")} stroke="currentColor" opacity=".3" />
    <circle cx={cx} cy={cy} r={r} fill="var(--surface)" />
    <circle cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity=".05" />
    <rect x="176" y="72" width="42" height="16" rx="2" fill="currentColor" fillOpacity=".15" />
    <path d={big.join("")} stroke="currentColor" strokeWidth="2.6" opacity=".5" />
    <path d="M168 58A38 38 0 0 1 190 44" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".45" />
    <rect x="-8" y="2" width="16" height="9" rx="2" transform="translate(229 111) rotate(-45)" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <rect x="-5.5" y="11" width="11" height="50" rx="5.5" transform="translate(229 111) rotate(-45)" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <rect x="-5.5" y="11" width="11" height="50" rx="5.5" transform="translate(229 111) rotate(-45)" fill="currentColor" fillOpacity=".2" />
    <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="3" />
    <circle cx={cx} cy={cy} r={r + 5} stroke="currentColor" opacity=".25" />
  </svg>;
}

function Desk() {
  const rows = Array.from({ length: 11 }, (_, i) => 52 + i * 8.4);
  const script = [0, 1, 2, 4, 5, 7, 8, 9].map((i, k) => `M222 ${54 + i * 11}q3-2.5 6 0${"t6 0".repeat(5 + (k * 5) % 6)}`);
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <ellipse cx="160" cy="92" rx="154" ry="86" fill="currentColor" fillOpacity=".045" />
    <g transform="rotate(-6 104 92)">
      <path d="M104 47Q66 36 24 42V152Q66 146 104 158Q142 146 184 152V42Q142 36 104 47Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.2" />
      <path d="M104 42Q68 31 30 37V146Q68 140 104 151Q140 140 178 146V37Q140 31 104 42Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
      <path d="M104 42V151" stroke="currentColor" opacity=".5" />
      <path d={rows.map((y) => `M40 ${y.toFixed(1)}H96M112 ${y.toFixed(1)}H168`).join("")} stroke="currentColor" opacity=".32" />
      <path d="M124 38V128L128 124 132 128V36" fill="currentColor" opacity=".7" />
    </g>
    <g transform="rotate(8 246 98)">
      <rect x="204" y="28" width="86" height="140" rx="3" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
      <path d={Array.from({ length: 11 }, (_, i) => `M206 ${54 + i * 11}H288`).join("")} stroke="currentColor" opacity=".16" />
      <path d="M216 30V166" stroke="currentColor" opacity=".3" />
      <path d={script.join("")} stroke="currentColor" opacity=".5" />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={212 + i * 9.5} cy="28" r="2.6" fill="var(--surface)" stroke="currentColor" />)}
    </g>
    <g transform="translate(196 170) rotate(-52)">
      <rect x="0" y="-3.5" width="94" height="7" rx="3.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
      <path d="M0 -3.5L-11 0 0 3.5Z" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.1" />
      <path d="M66 -3.5V3.5M70 -3.5V3.5" stroke="currentColor" opacity=".6" />
    </g>
  </svg>;
}

export const STUDY_DOORWAYS: DoorwayVariant[] = [
  { name: "Four Gospels, one Christ", Art: Converging },
  { name: "Cross-reference arcs", Art: CrossReferences },
  { name: "Annotated page", Art: AnnotatedPage },
  { name: "Magnifier on the text", Art: Magnifier },
  { name: "Desk: Bible and notebook", Art: Desk },
];
