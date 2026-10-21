// Three proposed drawings for the homepage "Learning materials" block: a kitchen table where a parent and child share
// one workbook, the "Moses: three forties" workbook page coming off a printer, and a file box of seven tabbed dividers,
// one for each reader. Our own shapes; loops run only while on screen and open up on hover (learning-mockups.css).
import type { CSSProperties } from "react";
import type { Mockup } from "./types";
import "./learning-mockups.css";

const vars = (values: Record<string, string | number>) => values as CSSProperties;

/* ---------- 1. The kitchen table ---------- */

function KitchenTable() {
  return <svg className="hf-scene ml-kitchen" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M40 366H560" />
    <g className="ml-window"><rect x="64" y="54" width="92" height="76" rx="3" /><path d="M110 54V130M64 92H156" /></g>
    <g className="hf-layer-lamp">
      <path className="ml-glow" d="M262 90H338L460 258H140Z" />
      <path className="ml-cord" d="M300 20V62" /><path className="ml-shape" d="M276 62H324L340 88H260Z" /><circle className="ml-bulb" cx="300" cy="90" r="4" />
    </g>
    <g className="hf-layer-parent"><circle className="ml-shape" cx="164" cy="156" r="19" />
      <path className="ml-shape ml-coat" d="M122 258C122 206 140 186 164 186C188 186 206 206 206 258" />
      <path className="ml-arm" d="M194 212C212 226 230 236 250 234" /></g>
    <g className="hf-layer-child"><circle className="ml-shape" cx="436" cy="182" r="14" />
      <path className="ml-shape ml-coat ml-coat-child" d="M406 258C406 226 418 210 436 210C454 210 466 226 466 258" /></g>
    <g className="hf-layer-book">
      <path className="ml-page" d="M232 258Q266 248 300 254V206Q266 200 236 208Z" /><path className="ml-page" d="M300 254Q334 248 368 258L364 208Q334 200 300 206Z" />
      <g className="ml-print">{[0, 1, 2, 3, 4].map((r) => <path key={r} d={`M244 ${218 + r * 7}h${44 - ((r * 7) % 11)}`} />)}</g>
      <path className="ml-follow" d="M244 218h20" />
      {[226, 238, 250].map((y) => <path key={y} className="ml-rule" d={`M310 ${y}H356`} />)}
      <path className="ml-answer" pathLength={1} d="M311 223c6-3 9 2 15-1s9 2 15-1 7 1 10 0" />
      <g className="ml-pencil"><path d="M0 0l4-11 18-20 4 3.5-18 20Z" /><path className="ml-pencil-tip" d="M0 0l4-11 4 3.5Z" /><circle className="ml-shape" cx="20" cy="-24" r="5" /></g>
    </g>
    <g className="ml-table"><path d="M70 258H530L552 274H48Z" /><path d="M48 274V282H552V274M78 282V366M522 282V366" /></g>
    <g className="ml-mug"><rect x="486" y="238" width="18" height="20" rx="2" /><path d="M504 243c6 0 6 10 0 10" /><path className="ml-steam" d="M492 230c-3-4 3-6 0-10M499 230c-3-4 3-6 0-10" /></g>
    <g className="hf-layer-card"><g className="ml-card">
      <rect x="392" y="46" width="168" height="80" rx="5" />
      <text className="ml-verse" x="476" y="70" textAnchor="middle">Thy word is a lamp</text>
      <text className="ml-verse" x="476" y="85" textAnchor="middle">unto my feet, and a light</text>
      <text className="ml-verse" x="476" y="100" textAnchor="middle">unto my path.</text>
      <text className="ml-label" x="476" y="116" textAnchor="middle">PSALM 119:105</text>
    </g></g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">ONE WORKBOOK · READ IT · LEARN IT · WRITE IT DOWN</text>
  </svg>;
}

/* ---------- 2. Off the printer ---------- */

/** Moses' life in three forties (Acts 7:23, 30, 36): the court of Egypt, the desert of Midian, the wilderness. */
const FORTIES = [{ name: "EGYPT", tone: "history" }, { name: "MIDIAN", tone: "poetry" }, { name: "WILDERNESS", tone: "prophets" }];

function OffThePrinter() {
  return <svg className="hf-scene ml-printer" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M40 376H560" />
    <clipPath id="ml-paper-slot"><rect x="0" y="0" width="600" height="296" /></clipPath>
    <g clipPath="url(#ml-paper-slot)"><g className="hf-layer-page"><g className="ml-sheet-out">
      <rect className="ml-page" x="206" y="70" width="188" height="226" rx="2" />
      <text className="ml-title" x="220" y="100">Moses</text><text className="ml-label" x="380" y="98" textAnchor="end">THREE FORTIES</text>
      <path className="ml-rule" d="M220 132H380" />
      {FORTIES.map((f, i) => <g key={f.name}>
        <rect className="ml-forty" style={vars({ "--tone": `var(--${f.tone})`, animationDelay: `${i * 0.6}s` })} x={221 + i * 53.3} y="129" width="51.3" height="6" rx="1" />
        <text className="ml-tiny" x={246.7 + i * 53.3} y="148" textAnchor="middle">{f.name}</text>
      </g>)}
      {[0, 40, 80, 120].map((age, i) => <text key={age} className="ml-tiny" x={220 + i * 53.3} y="124" textAnchor="middle">{age}</text>)}
      <text className="ml-verse ml-verse-sm" x="220" y="172">Moses was an hundred and twenty</text>
      <text className="ml-verse ml-verse-sm" x="220" y="185">years old when he died.</text>
      <text className="ml-label" x="220" y="200">DEUTERONOMY 34:7</text>
      <text className="ml-question" x="220" y="224">What did each forty teach him?</text>
      {[240, 254, 268, 282].map((y) => <path key={y} className="ml-rule" d={`M220 ${y}H380`} />)}
    </g></g></g>
    <g className="ml-machine">
      <path d="M182 286H418Q430 286 430 298V350Q430 356 424 356H176Q170 356 170 350V298Q170 286 182 286Z" />
      <path className="ml-slot" d="M200 296H400" /><path d="M190 356L172 376H428L410 356" />
      <circle className="ml-status" cx="404" cy="326" r="4" /><path className="ml-slot" d="M196 326h40M196 336h24" />
    </g>
    <g className="hf-layer-sizes">
      <rect className="ml-size" x="48" y="212" width="44" height="62" rx="2" /><rect className="ml-size ml-size-letter" x="100" y="212" width="48" height="62" rx="2" />
      <text className="ml-label" x="70" y="292" textAnchor="middle">A4</text><text className="ml-label" x="124" y="292" textAnchor="middle">US LETTER</text>
    </g>
    <g className="hf-layer-stack">
      {Array.from({ length: 8 }, (_, i) => <rect key={i} className="ml-stack-sheet" style={vars({ "--i": i })} x={456 + i * 2.5} y={212 - i * 3} width="60" height="62" rx="2" />)}
      <text className="ml-label" x="496" y="292" textAnchor="middle">8 SESSIONS</text><text className="ml-label" x="496" y="305" textAnchor="middle">42 PAGES</text>
    </g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">MOSES: THREE FORTIES · THE FIRST WORKBOOK</text>
  </svg>;
}

/* ---------- 3. The reader's file ---------- */

/** The seven readers, little ones to leaders, as divider tabs; widths follow the label (about 6.5px a letter). */
const READERS = [
  ["LITTLE ONES", "poetry"], ["CHILDREN", "history"], ["TEENS", "prophets"], ["YOUNG ADULTS", "gospels"],
  ["ADULTS", "epistles"], ["FAMILIES", "resource-life"], ["LEADERS", "accent"],
].reduce<{ name: string; tone: string; x: number; w: number }[]>((list, [name, tone]) => {
  const last = list[list.length - 1], w = name.length * 6.5 + 10;
  return [...list, { name, tone, x: last ? last.x + last.w + 3 : 71, w }];
}, []);

function ReadersFile() {
  return <svg className="hf-scene ml-file" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M40 352H560" />
    <g className="hf-layer-dividers">{READERS.map((r, k) => { const y = 104 + k * 22; return <g key={r.name} className="ml-divider" style={vars({ "--k": k, "--tone": `var(--${r.tone})` })}>
      <g className="ml-divider-lift" style={vars({ animationDelay: `${k * 2}s` })}>
        <path className="ml-card-body" d={`M66 ${y}H534V300H66Z`} />
        <path className="ml-tab" d={`M${r.x} ${y + 1}V${y - 14}Q${r.x} ${y - 18} ${r.x + 4} ${y - 18}H${r.x + r.w - 4}Q${r.x + r.w} ${y - 18} ${r.x + r.w} ${y - 14}V${y + 1}`} />
        <text className="ml-label ml-tab-text" x={r.x + r.w / 2} y={y - 6.5} textAnchor="middle">{r.name}</text>
      </g>
    </g>; })}</g>
    <g className="hf-layer-box">
      <path className="ml-box" d="M50 262H550L540 352H60Z" />
      <rect className="ml-page" x="226" y="282" width="148" height="46" rx="3" />
      <text className="ml-title" x="300" y="304" textAnchor="middle">41 titles</text>
      <text className="ml-label" x="300" y="319" textAnchor="middle">9 KINDS · 7 READERS</text>
    </g>
    <text className="hf-caption" x="300" y="402" textAnchor="middle">FROM LITTLE ONES TO LEADERS · A4 &amp; US LETTER</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "Kitchen Table", note: "A parent and child share one workbook under a hanging lamp, one following the passage while the other writes an answer; on hover the lamp brightens and both lean in.", Scene: KitchenTable },
  { name: "Off the Printer", note: "The first page of “Moses: three forties” rises out of a printer with his life in three forty-year spans, beside A4 and US Letter sheets and the eight sessions; on hover the page lifts free and the stack fans out.", Scene: OffThePrinter },
  { name: "The Reader’s File", note: "A file box of seven tabbed dividers, little ones to leaders, each lifting in turn as if someone is looking for theirs; on hover they all fan up out of the box.", Scene: ReadersFile },
];
