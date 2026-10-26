// Four proposed drawings for the homepage block "Academic Studies": one verse carried in a single ruled line from scroll
// to codex to printed page; four framed witnesses threaded to Pilate's question; a tell cut open, its finds kept apart
// from the dates read from them; and a lens on the one stroke that parts two readings. Motion in academic-mockups.css.
import { useId, type CSSProperties } from "react";
import type { Mockup } from "./types";
import "./academic-mockups.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");

/** One path of ruled script: n rows from (x, y), `gap` apart, a little ragged at the line ends unless `even`. */
const rows = (x: number, y: number, w: number, n: number, gap: number, even = false) =>
  Array.from({ length: n }, (_, i) => `M${x} ${y + i * gap}h${even ? w : w - ((i * 5) % 4) * (w / 14)}`).join("");

/** Paper shading laid over every page: darker at two corners, as on the Study page's door cards. */
function Shade({ id }: { id: string }) {
  return <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="currentColor" stopOpacity=".12" /><stop offset=".55" stopColor="currentColor" stopOpacity=".02" /><stop offset="1" stopColor="currentColor" stopOpacity=".15" />
  </linearGradient>;
}

/** A page drawn twice: the shadow leaf offset behind it, then the leaf with its shading. */
function Leaf({ d, shade, dx = 4, dy = 4 }: { d: string; shade: string; dx?: number; dy?: number }) {
  return <><path className="ma-under" d={d} transform={`translate(${dx} ${dy})`} /><path className="ma-page" d={d} /><path d={d} fill={`url(#${shade})`} /></>;
}

/** A small-caps label: a name, then a date in the block's tint, then an optional muted note. */
function Tag({ x, y, name, date, note, anchor = "middle" }: { x: number; y: number; name: string; date: string; note?: string; anchor?: "start" | "middle" | "end" }) {
  return <text className="ma-label" x={x} y={y} textAnchor={anchor}>
    <tspan className="ma-name">{name}</tspan><tspan className="ma-date" x={x} dy="12.5">{date}</tspan>{note && <tspan x={x} dy="12">{note}</tspan>}
  </text>;
}

const Dot = ({ x, y, r = 2.4 }: { x: number; y: number; r?: number }) => <circle className="ma-dot" cx={x} cy={y} r={r} />;

/* ---------- The Long Copy: Isaiah 40:8 in one ruled line, scroll to codex to print ---------- */

const COPIES = [
  { x: 96, name: "GREAT ISAIAH SCROLL", date: "c. 125 BC", note: "HEBREW · PARCHMENT" },
  { x: 232, name: "CODEX SINAITICUS", date: "c. AD 350", note: "GREEK · PARCHMENT" },
  { x: 368, name: "LENINGRAD CODEX", date: "AD 1008", note: "HEBREW · PARCHMENT" },
  { x: 504, name: "KING JAMES BIBLE", date: "1611", note: "ENGLISH · PRINTED" },
];
const LINE = 214; // the row that carries the verse in every copy
/** Each copy's line brightens as the travelling light (14s from x 36 to 564) reaches it. */
const reach = (x: number) => delay(((x - 36) / 528) * 14 - 0.7 - 14);

export function LongCopyScene() {
  const shade = `ma-shade-${useUid()}`;
  const book = "M452 166Q478 158 504 166Q530 158 556 166V272Q530 264 504 272Q478 264 452 272Z";
  return <svg className="hf-scene ma-copy-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={shade} /></defs>
    <ellipse className="hf-orbit" cx="300" cy="204" rx="286" ry="92" />
    <g className="hf-layer-verse">
      <text className="ma-verse" x="300" y="86" textAnchor="middle">“The word of our God shall stand for ever.”</text>
      <text className="ma-ref" x="300" y="108" textAnchor="middle">ISAIAH 40:8</text>
    </g>
    <path className="ma-thread" d={`M36 ${LINE}H564`} />
    <g className="hf-layer-copies">
      <g className="ma-copy">
        <path className="ma-page" d="M64 162H128V268H64Z" /><path d="M64 162H128V268H64Z" fill={`url(#${shade})`} />
        <path className="ma-ink ma-hebrew" d={rows(70, 172, 25, 16, 6) + rows(98, 172, 25, 16, 6)} />
        <path className="ma-hi" style={reach(96)} d={`M98 ${LINE}h25`} />
        <path className="ma-rule" d="M60 146V152M60 278V284M132 146V152M132 278V284" />
        <rect className="ma-roller" x="54" y="152" width="12" height="126" rx="6" /><rect className="ma-roller" x="126" y="152" width="12" height="126" rx="6" />
      </g>
      <g className="ma-copy">
        <Leaf d="M188 158H274V272H188Z" shade={shade} />
        <path className="ma-ink ma-uncial ma-fine" d={[192, 212, 232, 252].map((x) => rows(x, 166, 17, 26, 4)).join("")} />
        <path className="ma-hi" style={reach(232)} d={`M232 ${LINE}h17`} />
      </g>
      <g className="ma-copy">
        <Leaf d="M324 158H414V272H324Z" shade={shade} />
        <path className="ma-masora" d="M330 162.5h79M330 267.5h79" />
        <path className="ma-ink ma-hebrew" d={[331, 359, 387].map((x) => rows(x, 166, 22, 17, 6)).join("")} />
        <path className="ma-hi" style={reach(368)} d={`M359 ${LINE}h22`} />
      </g>
      <g className="ma-copy">
        <Leaf d={book} shade={shade} dx={2} dy={4} /><path className="ma-gutter" d="M504 166V272" />
        <path className="ma-rule" d="M477.5 174V266M528.5 174V266M460 171h34M511 171h34" />
        <path className="ma-ink ma-print" d={[458, 480, 509, 531].map((x) => rows(x, 178, 17, 15, 6)).join("")} />
        <path className="ma-hi" style={reach(504)} d={`M509 ${LINE}h17`} />
      </g>
    </g>
    <circle className="ma-traveller" cx="0" cy={LINE} r="3.2" />
    <g className="hf-layer-time">
      <path className="ma-axis" d="M36 306H560M553 302L560 306L553 310" />
      {COPIES.map((c) => <g key={c.name}><path className="ma-leader" d={`M${c.x} 286V302`} /><Dot x={c.x} y={306} r={3} /><Tag {...c} y={328} /></g>)}
    </g>
    <text className="hf-caption" x="300" y="404" textAnchor="middle">ONE PASSAGE · CARRIED ACROSS SEVENTEEN CENTURIES</text>
  </svg>;
}

/* ---------- Four Witnesses: a 2×2 cabinet threaded to Pilate's question ---------- */

const FRAME = "M46 40H290V167.3A40 40 0 0 0 261.3 196H46Z";
const INNER = "M51 45H285V162.5A46 46 0 0 0 256.5 191H51Z";
const P52 = "M126 60L184 57L188 86L182 118L176 146L130 144L122 112L128 88Z";
const STONE = "M404 74L520 70L522 150L392 152L394 132L386 114L400 96Z";
const FOLIO = "M380 236Q417 228 455 236Q492 228 530 236V322Q492 314 455 322Q417 314 380 322Z";
/** Each panel is the top-left frame reflected about the centre; `end` is where the thread lands on its witness. */
const PANELS = [
  { flip: undefined, end: [178, 102] }, { flip: "matrix(-1 0 0 1 600 0)", end: [402, 144] },
  { flip: "matrix(1 0 0 -1 0 412)", end: [206, 267.5] }, { flip: "matrix(-1 0 0 -1 600 412)", end: [383, 270] },
];
const spoke = ([x, y]: number[]) => { const a = Math.atan2(y - 206, x - 300); return `M${300 + 24 * Math.cos(a)} ${206 + 24 * Math.sin(a)}L${x} ${y}`; };

function Papyrus({ clip }: { clip: string }) {
  const ticks = Array.from({ length: 9 }, (_, i) => `M${i % 5 ? 106 : 104} ${58 + i * 9.9}h${i % 5 ? 4 : 8}`).join("");
  return <>
    <clipPath id={clip}><path d={P52} /></clipPath>
    <path className="ma-papyrus" d={P52} />
    <g clipPath={`url(#${clip})`}>
      <path className="ma-fibre" d={rows(118, 58, 74, 23, 4, true)} /><path className="ma-fibre ma-fibre-v" d={Array.from({ length: 14 }, (_, i) => `M${124 + i * 5} 56v92`).join("")} />
      <path className="ma-ink ma-uncial" d={rows(132, 70, 46, 10, 8)} /><path className="ma-hi" d="M132 102h46" />
    </g>
    <path className="ma-scale" d={`M108 58V146${ticks}M104 146h8`} /><text className="ma-label" x="100" y="105" textAnchor="end">8.9 CM</text>
    <Tag x={62} y={170} anchor="start" name="PAPYRUS 52 · JOHN 18" date="c. AD 125–175" />
  </>;
}

function PilateStone({ shade }: { shade: string }) {
  return <>
    <path className="ma-stone ma-stone-top" d="M404 74L412 66L528 62L520 70Z" /><path className="ma-stone ma-stone-side" d="M520 70L528 62L530 142L522 150Z" />
    <path className="ma-stone" d={STONE} /><path d={STONE} fill={`url(#${shade})`} />
    <path className="ma-rule" d="M412 142l6-2M446 145l5-1M478 141l6-2M398 104l4 3" />
    <text className="ma-inscription" textAnchor="end">
      <tspan x="514" y="94"><tspan className="ma-ghost">[…]</tspan>S TIBERIEVM</tspan>
      <tspan x="514" y="112"><tspan className="ma-ghost">[PO]</tspan>NTIVS <tspan className="ma-hi-text">PILATVS</tspan></tspan>
      <tspan x="514" y="130"><tspan className="ma-ghost">[PRAEF]</tspan>ECTVS IVDA<tspan className="ma-ghost">[EA]</tspan>E</tspan>
    </text>
    <Tag x={538} y={170} anchor="end" name="PILATE STONE · CAESAREA" date="AD 26–36 · FOUND 1961" />
  </>;
}

function Sinaiticus({ shade }: { shade: string }) {
  return <>
    <Leaf d="M110 228H210V318H110Z" shade={shade} dx={5} />
    <path className="ma-ink ma-uncial ma-fine" d={[0, 1, 2, 3].map((c) => rows(117 + c * 22.5, 236, 18, 22, 3.5)).join("")} />
    <path className="ma-hi" d="M184.5 267.5h16" />
    <Tag x={62} y={346} anchor="start" name="CODEX SINAITICUS" date="c. AD 350 · FOUR COLUMNS" />
  </>;
}

function Printed({ shade }: { shade: string }) {
  return <>
    <Leaf d={FOLIO} shade={shade} dx={2} dy={4} /><path className="ma-gutter" d="M455 236V322" />
    <path className="ma-rule" d="M417 244V316M492 244V316M388 241h58M463 241h58" />
    <path className="ma-ink ma-print" d={[386, 419, 461, 494].map((x) => rows(x, 246, 29, 12, 6)).join("")} />
    <path className="ma-hi" d="M386 270h29" />
    <Tag x={538} y={346} anchor="end" name="KING JAMES BIBLE · LONDON" date="1611 · ROBERT BARKER" />
  </>;
}

function WitnessesScene() {
  const uid = useUid(), shade = `ma-shade-${uid}`;
  const art = [<Papyrus key="p" clip={`ma-p52-${uid}`} />, <PilateStone key="s" shade={shade} />, <Sinaiticus key="c" shade={shade} />, <Printed key="k" shade={shade} />];
  return <svg className="hf-scene ma-witness-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={shade} /></defs>
    {PANELS.map((p, i) => <g key={i} className={`ma-panel ma-panel-${i}`}>
      <path className="ma-frame" d={FRAME} transform={p.flip} /><path className="ma-frame-inner" d={INNER} transform={p.flip} />
      {art[i]}
      <path className="ma-spoke" d={spoke(p.end)} /><circle className="ma-end" style={delay(i * 1.5 - 6)} cx={p.end[0]} cy={p.end[1]} r="2.6" />
    </g>)}
    <g className="hf-layer-seal">
      <circle className="ma-ring" cx="300" cy="206" r="37" /><circle className="ma-seal" cx="300" cy="206" r="30" /><circle className="ma-seal-inner" cx="300" cy="206" r="26" />
      <text className="ma-seal-text" x="300" y="203" textAnchor="middle">What is</text><text className="ma-seal-text" x="300" y="216" textAnchor="middle">truth?</text>
    </g>
    <text className="hf-caption" x="300" y="406" textAnchor="middle">FOUR WITNESSES · ONE QUESTION · JOHN 18:38</text>
  </svg>;
}

/* ---------- The Tell: a mound cut open, what was found kept apart from what is concluded ---------- */

/** Layer boundaries across the cut face, x 150 to 500: the heights of one curve's start, two controls and end. */
const BOUNDS = [[158, 104, 104, 150], [196, 186, 202, 192], [246, 238, 252, 240], [294, 300, 286, 296], [340, 340, 340, 340]];
const stratum = (top: number[], bottom: number[]) =>
  `M150 ${top[0]}C260 ${top[1]} 390 ${top[2]} 500 ${top[3]}L500 ${bottom[3]}C390 ${bottom[2]} 260 ${bottom[1]} 150 ${bottom[0]}Z`;
const cubic = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
const LAYERS = [
  { name: "ROMAN", date: "63 BC–AD 324", find: "COIN", stuff: "STRUCK METAL", at: [410, 166], edge: 10, label: 174 },
  { name: "HELLENISTIC", date: "332–63 BC", find: "STAMPED JAR", stuff: "FIRED CLAY", at: [300, 220], edge: 16, label: 218 },
  { name: "IRON AGE II", date: "c. 1000–586 BC", find: "OSTRACON", stuff: "INK ON SHERD", at: [360, 268], edge: 22, label: 266 },
  { name: "LATE BRONZE", date: "c. 1550–1200 BC", find: "CLAY TABLET", stuff: "CUNEIFORM", at: [250, 317], edge: 18, label: 314 },
];

function Find({ i }: { i: number }) {
  if (i === 0) return <><circle className="ma-object" r="8" /><circle className="ma-rule" r="5.5" /><path className="ma-ink" d="M-2 -3q3 -1 3 2q0 2 -2 3" /></>;
  if (i === 1) return <><path className="ma-object" d="M-3 -21h6v6C11 -13 11 3 4 13L0 21L-4 13C-11 3 -11 -13 -3 -15Z" /><path className="ma-object" style={{ fill: "none" }} d="M-3 -19q-9 0 -9 7v3M3 -19q9 0 9 7v3" /><circle className="ma-rule" cx="0" cy="-6" r="2.2" /></>;
  if (i === 2) return <><path className="ma-object" d="M-16 -10L12 -14L20 -2L10 14L-12 12L-20 0Z" /><path className="ma-ink ma-hebrew" d={rows(-12, -5, 24, 3, 6)} /></>;
  return <><rect className="ma-object" x="-16" y="-13" width="32" height="26" rx="4" />
    <path className="ma-ink" d={Array.from({ length: 15 }, (_, k) => `M${-11 + (k % 5) * 5.5} ${-7 + Math.floor(k / 5) * 7}l2.5 1.5l-2.5 1.5m0 -3v3`).join("")} /></>;
}

function TellScene() {
  const uid = useUid();
  const tufts = [0.1, 0.3, 0.42, 0.62, 0.78, 0.9].map((t) => { const x = cubic(150, 260, 390, 500, t), y = cubic(158, 104, 104, 150, t); return `M${x - 3} ${y - 4}L${x} ${y}L${x + 3} ${y - 5}`; }).join("");
  return <svg className="hf-scene ma-tell-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs>
      <pattern id={`${uid}-0`} width="8" height="8" patternUnits="userSpaceOnUse"><circle className="ma-grain-dot" cx="4" cy="4" r=".8" /></pattern>
      <pattern id={`${uid}-1`} width="11" height="7" patternUnits="userSpaceOnUse"><path className="ma-grain" d="M1 3.5h4" /></pattern>
      <pattern id={`${uid}-2`} width="18" height="13" patternUnits="userSpaceOnUse"><ellipse className="ma-grain" cx="5" cy="4" rx="2.4" ry="1.5" /><ellipse className="ma-grain" cx="13" cy="10" rx="1.8" ry="1.2" /></pattern>
      <pattern id={`${uid}-3`} width="6" height="6" patternUnits="userSpaceOnUse"><path className="ma-grain" d="M0 6L6 0" /></pattern>
    </defs>
    <text className="ma-label ma-head" x="138" y="134" textAnchor="end">WHAT IS CONCLUDED</text>
    <text className="ma-label ma-head" x="514" y="134">WHAT SURVIVES</text>
    <path className="ma-rule" d="M28 141H138M514 141H592" />
    {LAYERS.map((l, i) => { const [x, y] = l.at, d = stratum(BOUNDS[i], BOUNDS[i + 1]);
      return <g key={l.name} className="ma-stratum-layer" style={{ "--i": i } as CSSProperties}>
        <path className="ma-stratum" style={{ fill: `color-mix(in srgb, currentColor ${4 + i * 3}%, var(--surface))` }} d={d} /><path d={d} fill={`url(#${uid}-${i})`} />
        {i === 0 && <><path className="ma-tuft" d={tufts} /><path className="ma-stake" d="M325 116V82" /><path className="ma-flag" d="M325 82L342 87L325 92Z" /></>}
        <path className="ma-leader" d={`M141 ${l.label - 3}H150`} /><Tag x={138} y={l.label} anchor="end" name={l.name} date={l.date} />
        <g transform={`translate(${x} ${y})`}><ellipse className="ma-halo" style={delay(i * 2 - 8)} rx="22" ry="16" /><Find i={i} /></g>
        <path className="ma-leader" d={`M${x + l.edge} ${y}H505`} /><Dot x={508} y={y} /><Tag x={515} y={y + 2} anchor="start" name={l.find} date={l.stuff} />
      </g>; })}
    <path className="ma-probe" d="M200 128V336" /><path className="ma-stake" d="M194 128H206" />
    <text className="hf-caption" x="300" y="406" textAnchor="middle">WHAT SURVIVES · AND WHAT IS CONCLUDED FROM IT</text>
  </svg>;
}

/* ---------- One Stroke: a lens on 1 Timothy 3:16, where a bar turns "who" into "God" ---------- */

/** The two uncial letters in question: O and a lunate sigma, ΟϹ "who"; with a bar and an overline they read ΘϹ "God". */
function Letters({ x, y, s = 1, bar }: { x: number; y: number; s?: number; bar: "on" | "off" | "pulse" }) {
  return <g className="ma-letters" transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse rx="6.5" ry="7.5" /><path d="M21.2 -5.7A6.5 7.5 0 1 0 21.2 5.7" />
    {bar !== "off" && <path className={bar === "pulse" ? "ma-stroke" : "ma-stroke-fixed"} d="M-6.5 0H6.5M-8 -12H24" />}
  </g>;
}

function Reading({ y, word, who, source, bar }: { y: number; word: string; who: string; source: string; bar: "on" | "off" }) {
  return <>
    <rect className="ma-card-under" x="416" y={y + 4} width="166" height="70" rx="3" />
    <rect className="ma-card" x="412" y={y} width="166" height="70" rx="3" /><rect className="ma-card-inner" x="416" y={y + 4} width="158" height="62" rx="2" />
    <Letters x={434} y={y + 37} s={1.15} bar={bar} />
    <Tag x={480} y={y + 24} anchor="start" name={word} date={who} note={source} />
  </>;
}

function ReadingsScene() {
  const uid = useUid(), shade = `ma-shade-${uid}`, lens = `ma-lens-${uid}`;
  return <svg className="hf-scene ma-readings-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={shade} /><clipPath id={lens}><circle cx="262" cy="214" r="54" /></clipPath></defs>
    <text className="ma-verse" x="300" y="56" textAnchor="middle">“God was manifest in the flesh”</text>
    <text className="ma-ref" x="300" y="76" textAnchor="middle">1 TIMOTHY 3:16</text>
    <g className="hf-layer-folio">
      <Leaf d="M96 98L318 94L322 352L92 356Z" shade={shade} dx={6} dy={5} />
      <path className="ma-ink ma-uncial" d={rows(112, 116, 86, 33, 7) + rows(214, 116, 90, 33, 7)} />
    </g>
    <g className="hf-layer-card-a"><path className="ma-leader" d="M317.4 193.8L356 153H405" /><Dot x={408} y={153} /><Reading y={118} word="READS “WHO”" who="SINAITICUS" source="FIRST HAND" bar="off" /></g>
    <g className="hf-layer-card-b"><path className="ma-leader" d="M317.4 234.2L356 269H405" /><Dot x={408} y={269} /><Reading y={234} word="READS “GOD”" who="LATER COPIES" source="KJV 1611" bar="on" /></g>
    <g className="hf-layer-lens"><g className="ma-lens-bob">
      <path className="ma-handle" d="M302 254L340 292" /><path className="ma-handle-core" d="M308 260L336 288" />
      <circle className="ma-glass" cx="262" cy="214" r="54" />
      <g clipPath={`url(#${lens})`}>
        <text className="ma-magnified ma-faint" x="196" y="190">ΕΥCΕΒΕΙΑCΜΥCΤΗΡΙΟΝ</text>
        <Letters x={226} y={214} bar="pulse" />
        <text className="ma-magnified" x="252" y="221.5">ΕΦΑΝΕΡΩΘΗ</text>
        <text className="ma-magnified ma-faint" x="204" y="252">ΕΝCΑΡΚΙΕΔΙΚΑΙΩΘΗ</text>
      </g>
      <circle className="ma-lens-ring" cx="262" cy="214" r="54" /><circle className="ma-lens-rim" cx="262" cy="214" r="59" />
    </g></g>
    <text className="hf-caption" x="300" y="406" textAnchor="middle">ONE STROKE APART · WEIGH THE READINGS</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The Long Copy", note: "Isaiah 40:8 carried in one ruled line from the Great Isaiah Scroll through Codex Sinaiticus and the Leningrad Codex to the 1611 King James Bible, a light travelling along it; on hover the four copies lift off the timeline.", Scene: LongCopyScene },
  { name: "Four Witnesses", note: "A two-by-two cabinet of framed witnesses (Papyrus 52, the Pilate Stone, Codex Sinaiticus, the 1611 King James Bible) threaded to a seal carrying Pilate's question from John 18:38; on hover the panels part and the seal grows.", Scene: WitnessesScene },
  { name: "The Tell", note: "A mound cut open into four dated layers, each find on the right kept apart from the date concluded from it on the left; on hover the layers separate.", Scene: TellScene },
  { name: "One Stroke", note: "A lens over a Greek folio at 1 Timothy 3:16, where one small bar turns “who” into “God”, with both readings on cards; on hover the lens lifts and the cards draw apart.", Scene: ReadingsScene },
];
