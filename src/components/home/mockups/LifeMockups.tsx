// Three proposed drawings for the homepage block "Help for life": an engraved harbour where a lighthouse beam finds
// seven moored boats, one for each kind of help, with fifteen city lights on the far shore; the inn of Luke 10 cut open
// to show seven lit rooms, each a kind of help; and a wayfinding post with seven arms above a plaque of fifteen cities.
// Motion rules in life-mockups.css.
import { useId, type CSSProperties } from "react";
import type { Mockup } from "./types";
import "./life-mockups.css";

type Pt = [number, number];
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;
const tone = (name: string) => ({ color: `var(--${name})` }) as CSSProperties;
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const f = (n: number) => Math.round(n * 10) / 10;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.ceil((to - from) / step)) }, (_, k) => from + k * step);

/** The seven kinds of help on the Help for life page, each with a real service from its list and its own tint. */
const HELP: Array<{ name: string; detail: string; short?: string; tint: string }> = [
  { name: "CRISIS", detail: "988 · CALL OR TEXT", short: "988 · 24/7", tint: "accent" },
  { name: "PREGNANCY", detail: "OPTION LINE", tint: "poetry" },
  { name: "HEALING", detail: "AFTER AN ABORTION", short: "AFTER ABORTION", tint: "prophets" },
  { name: "FAMILIES", detail: "BABIES · CHILDREN", short: "SAFE HAVEN", tint: "gospels" },
  { name: "FOOD", detail: "FOOD BANKS · MEALS", short: "FOOD BANKS", tint: "history" },
  { name: "GRIEF", detail: "GRIEFSHARE", tint: "epistles" },
  { name: "RECOVERY", detail: "CELEBRATE RECOVERY", tint: "resource-life" },
];
const CITIES = ["MIAMI", "ATLANTA", "DALLAS", "OKLAHOMA CITY", "JACKSONVILLE", "TAMPA", "ORLANDO", "CHARLESTON", "CHARLOTTE", "NASHVILLE", "MEMPHIS", "BIRMINGHAM", "LOUISVILLE", "HOUSTON", "SAVANNAH"];

/** Paper shading: darker at two corners, so every sheet and room reads as lit from one side. */
function Shade({ id, a = 0.12, b = 0.15 }: { id: string; a?: number; b?: number }) {
  return <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity={a} /><stop offset=".55" stopColor="currentColor" stopOpacity=".02" /><stop offset="1" stopColor="currentColor" stopOpacity={b} /></linearGradient>;
}
function Glow({ id, o = 0.5 }: { id: string; o?: number }) {
  return <radialGradient id={id}><stop stopColor="var(--accent)" stopOpacity={o} /><stop offset=".5" stopColor="var(--accent)" stopOpacity={o / 3} /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>;
}
/** Fine engraved ruling, laid as a fill over hills and walls. */
function Ruling({ id, gap = 2.6, angle = 0 }: { id: string; gap?: number; angle?: number }) {
  return <pattern id={id} width="8" height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}><path className="mf-engrave" d={`M0 ${gap / 2}H8`} /></pattern>;
}
function Tag({ x, y, name, detail, anchor = "middle" }: { x: number; y: number; name: string; detail: string; anchor?: "start" | "middle" | "end" }) {
  return <text className="mf-label" x={x} y={y} textAnchor={anchor}><tspan className="mf-name">{name}</tspan><tspan className="mf-detail" x={x} dy="12.5">{detail}</tspan></text>;
}
const Dot = ({ x, y }: { x: number; y: number }) => <circle className="mf-dot" cx={x} cy={y} r="2.4" />;
function Verse({ text, cite }: { text: string; cite: string }) {
  return <g className="hf-layer-verse"><text className="mf-verse" x="300" y="50" textAnchor="middle">{text}</text><text className="mf-ref" x="300" y="69" textAnchor="middle">{cite}</text></g>;
}
const wave = (x: number, y: number, n: number, w = 10, h = 1.3) => `M${x} ${y}q${w / 2} ${-h} ${w} 0` + `t${w} 0`.repeat(n);

/* ---------- The Harbour Light: a lighthouse beam finds seven moored boats; fifteen lights on the far shore ---------- */

const PLATE = "M48 88H552L560 96V310L552 318H48L40 310V96Z";
const NEAT = "M51 93H549L555 99V307L549 313H51L45 307V99Z";
const HEAD = "M40 196L54 190L80 188H112L148 191L158 202L152 218L162 236L154 256L166 282L158 318H40Z";
/** Faceted boulders: the outline, then the lit top face left clear of the hatching. */
const BOULDERS = [
  ["M56 236L70 218L92 214L106 226L104 248L84 256L62 252Z", "M70 218L92 214L106 226L88 232L66 230Z"],
  ["M110 266L122 250L142 254L152 270L140 288L118 288Z", "M122 250L142 254L152 270L134 268L114 262Z"],
  ["M46 292L58 278L80 280L92 296L80 312L54 312Z", "M58 278L80 280L92 296L72 294L50 290Z"],
  ["M116 214L128 202L146 206L150 220L136 228L120 226Z", "M128 202L146 206L150 220L134 216L118 212Z"],
  ["M64 202L76 194L94 198L98 210L82 214L68 212Z", "M76 194L94 198L98 210L84 206L66 204Z"],
];
const LAMP: Pt = [96, 116];
const SWEEP = [56, 6]; // the beam's angle below the horizon, degrees, as it travels from the rocks to the far boats
const BOATS = HELP.map((h, i) => { const x = 190 + i * 57, y = 250 + [0, 14, 4, 18, 6, 16, 2][i], a = (Math.atan2(y - 38 - LAMP[1], x - LAMP[0]) * 180) / Math.PI;
  return { ...h, x, y, reach: (SWEEP[0] - a) / (SWEEP[0] - SWEEP[1]) }; });

function Boat({ x, y }: { x: number; y: number }) {
  return <>
    <path className="mf-wake" d={wave(x - 20, y + 9, 3) + wave(x - 14, y + 13, 3, 7, 1)} />
    <path className="mf-rope" d={`M${x + 17} ${y - 5}Q${x + 24} ${y + 2} ${x + 27} ${y + 8}`} /><circle className="mf-buoy" cx={x + 27} cy={y + 8} r="2" />
    <path className="mf-hull" d={`M${x - 18} ${y - 6}Q${x} ${y - 2} ${x + 18} ${y - 7}L${x + 12} ${y + 4}Q${x} ${y + 6} ${x - 13} ${y + 4}Z`} />
    <path className="mf-plank" d={`M${x - 15} ${y - 1}Q${x} ${y + 2} ${x + 15} ${y - 2}`} />
    <path className="mf-mast" d={`M${x} ${y - 4}V${y - 38}M${x} ${y - 12}H${x + 14}`} /><path className="mf-sail" d={`M${x + 1.5} ${y - 34}L${x + 13} ${y - 13}H${x + 1.5}Z`} />
    <path className="mf-lantern" d={`M${x - 2.5} ${y - 42}h5v6h-5Z`} /><circle className="mf-flame-dot" cx={x} cy={y - 39} r="1.3" />
  </>;
}
function Lighthouse({ glow }: { glow: string }) {
  return <>
    <circle className="mf-halo-big" cx={LAMP[0]} cy={LAMP[1]} r="30" fill={`url(#${glow})`} />
    <path className="mf-tower" d="M82 188L87 132H105L110 188Z" /><path className="mf-tower-shade" d="M96 132H105L110 188H96Z" />
    <path className="mf-band" d="M85.6 150H106.4L107.3 162H84.7ZM83.8 172H108.2L109 182H83Z" />
    <path className="mf-fill" d="M92 188V181Q96 176 100 181V188Z" /><path className="mf-pane" d="M94.5 137h3v6h-3ZM94.5 164h3v5h-3Z" />
    <path className="mf-fill" d="M83 128h26v4h-26Z" /><path className="mf-rule" d={`M84 122H108${range(85, 108, 3.7).map((x) => `M${f(x)} 122V128`).join("")}`} />
    <path className="mf-glass" d="M89 110h14v12h-14Z" /><path className="mf-rule" d="M93.7 110V122M98.3 110V122" /><circle className="mf-lamp" cx={LAMP[0]} cy={LAMP[1]} r="3" />
    <path className="mf-fill" d="M87 110Q96 97 105 110Z" /><path className="mf-rule" d="M96 101V92M93 94.5H99" />
    <path className="mf-fill" d="M114 190V174H146V190Z" /><path className="mf-fill" d="M111 175L130 163L149 175Z" /><path className="mf-fill" d="M139 168V160H143V170" />
    <path className="mf-window" d="M119 178h7v6h-7Z" /><path className="mf-rule" d="M133 190V181h6V190M115 186H146" />
  </>;
}
function HarbourScene() {
  const uid = useUid(), clip = `${uid}-c`, head = `${uid}-h`, glow = `${uid}-g`;
  return <svg className="hf-scene mf-harbour" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-s`} /><Glow id={glow} /><clipPath id={clip}><path d={PLATE} /></clipPath><clipPath id={head}><path d={HEAD} /></clipPath>
      <linearGradient id={`${uid}-b`}><stop stopColor="var(--accent)" stopOpacity=".42" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${uid}-w`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".04" /><stop offset="1" stopColor="currentColor" stopOpacity=".14" /></linearGradient></defs>
    <Verse text="“…so he bringeth them unto their desired haven.”" cite="PSALM 107:30" />
    <path className="mf-under" d={PLATE} transform="translate(5 5)" /><path className="mf-paper" d={PLATE} /><path d={PLATE} fill={`url(#${uid}-s)`} />
    <g clipPath={`url(#${clip})`}>
      <path className="mf-sky" d={range(94, 210, 3.4).map((y) => `M40 ${f(y)}H560`).join("")} />
      <path d="M40 212H560V318H40Z" fill={`url(#${uid}-w)`} />
      {[[0, 9, "far"], [9, 18, "mid"], [18, 27, "near"]].map(([a, b, depth]) => <path key={depth} className={`mf-sea mf-sea-${depth}`} d={range(+a, +b, 1).map((k) => wave(40 - ((k * 7) % 20), 213 + k * 4, 26)).join("")} />)}
      <path className="mf-shore" d="M300 212C330 203 360 201 392 205S452 197 492 200S540 203 560 204V212Z" /><path className="mf-hachure" d={range(306, 556, 5).map((x) => `M${x} 211l2.5 -4`).join("")} />
      <g className="mf-beam-wrap"><path className="mf-beam" d={`M${LAMP[0]} ${LAMP[1]}L620 92V140Z`} fill={`url(#${uid}-b)`} /></g>
    </g>
    <g className="hf-layer-sky">
      <path className="mf-moon" d="M236 104A13 13 0 1 0 250 126A10 10 0 1 1 236 104Z" />
      <path className="mf-gull" d="M300 142q4-4 7 0q3-4 7 0M326 128q3-3 5.5 0q2.5-3 5.5 0M286 160q3-3 5 0q2-3 5 0" />
      <path className="mf-under" d="M414 104H540V140H414Z" transform="translate(3 3)" /><path className="mf-paper" d="M414 104H540V140H414Z" /><path className="mf-rule" d="M418 108H536M418 136H536" />
      <text className="mf-label mf-name" x="477" y="119" textAnchor="middle">CLOSE TO HOME</text><text className="mf-label mf-detail" x="477" y="131" textAnchor="middle">LOCAL MAPS · 15 CITIES</text>
      <path className="mf-leader" d="M477 143V196" /><Dot x={477} y={198} />
      {range(0, 15, 1).map((k) => <circle key={k} className="mf-city" style={delay(-k * 0.53)} cx={318 + k * 15.5} cy={f(207 - Math.sin(k * 1.3) * 1.5 - (k > 5 && k < 11 ? 2 : 0))} r="1.4" />)}
    </g>
    <g className="hf-layer-light">
      <path className="mf-rock" d={HEAD} /><path className="mf-hachure" clipPath={`url(#${head})`} d={range(-140, 140, 4).map((k) => `M${40 + k} 318L${170 + k} 188`).join("")} />
      {BOULDERS.map(([d, top]) => <g key={d}><path className="mf-boulder" d={d} /><path className="mf-facet" d={top} /></g>)}
      <path className="mf-foam" d="M158 206q6 4 2 10M156 224q8 4 4 10M166 244q6 4 0 10M160 266q8 4 4 10M168 290q6 4 0 10" />
      <Lighthouse glow={glow} />
    </g>
    <g className="hf-layer-boats">{BOATS.map((b, i) => <g key={b.name} style={tone(b.tint)}><g className="mf-boat" style={delay(-i * 0.8)}>
      <circle className="mf-reach" style={delay(b.reach * 14 - 14 - 0.7)} cx={b.x} cy={b.y - 39} r="10" /><Boat x={b.x} y={b.y} /></g>
      <path className="mf-leader" d={`M${b.x} ${b.y + 17}V${i % 2 ? 323 : 353}`} /><Dot x={b.x} y={i % 2 ? 326 : 356} /><Tag {...b} detail={b.short ?? b.detail} x={b.x} y={i % 2 ? 341 : 371} />
    </g>)}</g>
    <path className="mf-neat" d={NEAT} /><path className="mf-notch" d="M40 96h8v-8M560 96h-8v-8M40 310h8v8M560 310h-8v8" />
    <text className="hf-caption" x="300" y="410" textAnchor="middle">SEVEN LIGHTS IN ONE HARBOUR · FIFTEEN ON THE FAR SHORE</text>
  </svg>;
}

/* ---------- The Open Inn: the inn of Luke 10 cut open, seven lit rooms, the door left open ---------- */

/** Each room: which kind of help, its back wall, where its light sits, and where its leader leaves the house. */
const ROOMS = [
  { help: 5, wall: "M206 150L300 112L394 150Z", lx: 300, ly: 138, side: -1, ty: 134, ex: 232 },
  { help: 1, wall: "M206 155H297V198H206Z", lx: 252, ly: 178, side: -1, ty: 178, ex: 200 },
  { help: 2, wall: "M303 155H394V198H303Z", lx: 348, ly: 178, side: 1, ty: 178, ex: 400 },
  { help: 0, wall: "M206 203H297V246H206Z", lx: 252, ly: 226, side: -1, ty: 226, ex: 200 },
  { help: 3, wall: "M303 203H394V246H303Z", lx: 348, ly: 226, side: 1, ty: 226, ex: 400 },
  { help: 4, wall: "M206 251H280V300H206Z", lx: 243, ly: 278, side: -1, ty: 278, ex: 200 },
  { help: 6, wall: "M320 251H394V300H320Z", lx: 357, ly: 278, side: 1, ty: 278, ex: 400 },
];
const CUT = "M200 150H400V155H200ZM200 198H400V203H200ZM200 246H400V251H200ZM200 155H206V300H200ZM394 155H400V300H394ZM297 155H303V198H297ZM297 203H303V246H297ZM280 251H286V300H280ZM314 251H320V300H314Z";
const ROOF = "M182 156L300 94L418 156H400V150L300 106L200 150V156Z";
const chair = (x: number, floor: number, s: number, dir: number) => `M${x} ${floor}V${floor - 7 * s}H${x + dir * 8 * s}V${floor}M${x + dir * 8 * s} ${floor - 7 * s}V${floor - 16 * s}`;

function Furniture() {
  const jars = [264, 277, 290].flatMap((y) => [215, 222, 229, 236, 241].slice(0, y === 277 ? 4 : 5).map((x) => `M${x} ${y}v-7h4.5v7ZM${x - 0.5} ${y - 7}h5.5`)).join("");
  return <g className="mf-things">
    <circle className="mf-pane" cx="300" cy="126" r="6" /><path className="mf-rule" d="M294 126H306M300 120V132" />
    <path className="mf-fill" d="M264 150V133Q264 131 266 131H268V141H278V150M264 141H278M336 150V133Q336 131 334 131H332V141H322V150M322 141H336" />
    <path className="mf-rule" d="M294 141H306M300 141V150M296 150H304M300 141V137" /><circle className="mf-flame-dot" cx="300" cy="135" r="1.5" />
    <path className="mf-pane" d="M214 162h18v20h-18Z" /><path className="mf-rule" d="M223 162V182M214 172H232M211 161Q216 172 212 186M235 161Q230 172 234 186" />
    <path className="mf-pane" d="M240 165h14v11h-14Z" /><path className="mf-heart" d="M247 173.5c-4-2.6-3-6 0-4.3c3-1.7 4 1.7 0 4.3Z" />
    <path className="mf-fill" d="M266 196Q278 200 292 195M269 197V183M286 197V183M266 183H288L292 162M288 170L291 171M268 183Q276 178 285 183" />
    <path className="mf-pane" d="M368 184V170Q378 160 388 170V184Z" /><path className="mf-sun" d="M372 184A6 6 0 0 1 384 184Z" /><path className="mf-rule" d="M378 176V172M372.5 178l-2-2M383.5 178l2-2" />
    <path className="mf-fill" d="M316 185H356V188H316ZM319 188V198M353 188V198" /><path className="mf-fill" d="M332 185L330 178H340L338 185Z" /><path className="mf-leaf" d="M335 178Q329 170 325 172Q330 177 335 178M335 178Q338 168 344 168Q341 175 335 178M335 178V169" />
    <circle className="mf-fill" cx="224" cy="212" r="5" /><path className="mf-rule" d="M224 212V209M224 212H226.5" />
    <path className="mf-fill" d="M218 226h54v3h-54ZM221 229V246M269 229V246M250 229h17v6h-17Z" /><path className="mf-fill" d="M230 226L232 220H244L246 226Z" /><path className="mf-mast" d="M229 219Q238 213 247 219M244 223q6 1 5 3" />
    <path className="mf-rule" d="M262 226V214L257 211" /><path className="mf-shade-lamp" d="M251 209L259 205L262 211Z" /><path className="mf-fill" d="M278 246V233H290V246M290 233V214" />
    <path className="mf-fill" d="M314 222H354V246M314 246V222M314 227H354M314 240H354" /><path className="mf-rule" d={range(318, 352, 4).map((x) => `M${x} 227V240`).join("")} />
    <path className="mf-rule" d="M334 203V209M324 209H344M324 209V213M334 209V216M344 209V213" /><circle className="mf-flame-dot" cx="324" cy="214.5" r="1.4" /><circle className="mf-flame-dot" cx="344" cy="214.5" r="1.4" /><path className="mf-heart" d="M334 220c-3-2-2.3-4.6 0-3.3c2.3-1.3 3 1.3 0 3.3Z" />
    <path className="mf-fill" d="M368 238h8v8h-8ZM378 238h8v8h-8ZM373 230h8v8h-8Z" /><path className="mf-pane" d="M370 210h16v11h-16Z" /><circle className="mf-sun" cx="378" cy="215.5" r="2.4" />
    <path className="mf-fill" d="M212 258V300M246 258V300M210 264H248M210 277H248M210 290H248" /><path className="mf-jar" d={jars} />
    <path className="mf-fill" d="M250 286H278V288H250ZM253 288V300M275 288V300" /><path className="mf-loaf" d="M255 286Q258 278 265 279Q271 278 273 286Z" /><path className="mf-rule" d="M261 281l-1 3M265 280l-1 3.5M269 281l-1 3M258 251V256M266 251V258M262 251V255" />
    <path className="mf-doorlight" d="M290 300V272Q300 262 310 272V300Z" /><path className="mf-arch" d="M290 300V272Q300 262 310 272V300" /><path className="mf-fill" d="M310 272L305 275V302L310 300Z" /><path className="mf-rule" d="M300 251V256" /><path className="mf-lantern" d="M297 256h6v7h-6Z" />
    <path className="mf-pane" d="M330 257h54v10h-54Z" /><path className="mf-script" d="M335 262H379" />
    {[[334, 292, 0.8, 1], [357, 292, 0.8, 1], [380, 292, 0.8, -1], [345, 300, 1, 1], [369, 300, 1, -1]].map(([x, y, s, dir]) => <path key={x} className="mf-fill" d={chair(x - (dir * 8 * s) / 2, y, s, dir)} />)}
  </g>;
}
function InnScene() {
  const uid = useUid(), glow = `${uid}-g`;
  return <svg className="hf-scene mf-inn" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-s`} /><Glow id={glow} o={0.55} /><Ruling id={`${uid}-r`} gap={2.4} angle={90} /><Ruling id={`${uid}-x`} gap={2.2} angle={45} />
      {[["d", 0.1], ["e", 0.5]].map(([k, o]) => <linearGradient key={k} id={`${uid}-${k}`} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="230" y2="0"><stop stopColor="currentColor" stopOpacity="0" /><stop offset="1" stopColor="currentColor" stopOpacity={o} /></linearGradient>)}
      <pattern id={`${uid}-t`} width="8" height="5" patternUnits="userSpaceOnUse"><path className="mf-engrave" d="M0 4.5H8M2 0V4.5M6 0V0" /></pattern></defs>
    <Verse text="“…and brought him to an inn, and took care of him.”" cite="LUKE 10:34" />
    <g className="hf-layer-sky">
      <path className="mf-moon" d="M86 96A12 12 0 1 0 100 116A9 9 0 1 1 86 96Z" />
      {[[134, 98], [160, 114], [62, 136], [444, 98], [506, 92], [534, 114], [470, 112]].map(([x, y], i) => <circle key={x} className="mf-star" style={delay(-i * 0.9)} cx={x} cy={y} r="1.3" />)}
      {[0, 1, 2].map((i) => <circle key={i} className="mf-smoke" style={delay(-i * 2)} cx="358" cy="94" r={3 + i} />)}
    </g>
    <path d="M40 352C130 340 214 322 290 302H310C240 332 150 362 40 384Z" fill={`url(#${uid}-d)`} /><path d="M40 352C130 340 214 322 290 302M310 302C240 332 150 362 40 384" stroke={`url(#${uid}-e)`} strokeWidth=".9" /><path className="mf-rule" d={range(0, 7, 1).map((k) => `M${f(70 + k * 34)} ${f(370 - k * 10.5)}q${f(6 - k * 0.6)} -3 ${f(12 - k * 1.2)} -2`).join("")} /><path className="mf-trail" d="M62 367C140 350 218 330 300 302" /><path className="mf-glow" d="M62 367C140 350 218 330 300 302" pathLength={100} />
    <path className="mf-ground" d="M60 300H540" /><path className="mf-rule" d={range(166, 434, 9).map((x, k) => `M${x + (k % 2) * 4} ${305 + (k % 3) * 5}q3 -2.5 6 0`).join("")} />
    <path className="mf-grass" d={[72, 90, 132, 160, 440, 470, 500, 528].map((x) => `M${x} 300l-2 -5M${x} 300v-6M${x} 300l2 -5`).join("")} />
    <path className="mf-spill" d="M286 300H314L334 318H266Z" />
    <g className="hf-layer-house">
      <path className="mf-under" d="M200 150H400V300H200Z" transform="translate(5 4)" />
      {ROOMS.map((r, i) => <g key={i}><path className="mf-wallpaper" d={r.wall} /><path d={r.wall} fill={`url(#${uid}-r)`} /><path d={r.wall} fill={`url(#${uid}-s)`} />
        <ellipse className="mf-room-glow" style={delay(i * 2 - 14)} cx={r.lx} cy={r.ly} rx="44" ry="24" fill={`url(#${glow})`} /></g>)}
      <path className="mf-wallpaper" d="M286 251H314V300H286Z" />
      <Furniture />
      <path className="mf-cut" d={CUT} /><path d={CUT} fill={`url(#${uid}-x)`} />
      <g className="hf-layer-roof"><path className="mf-fill" d="M352 122V102H364V128Z" /><path d="M352 122V102H364V128Z" fill={`url(#${uid}-t)`} /><path className="mf-fill" d="M350 98h16v4h-16Z" />
      <path className="mf-roof" d={ROOF} /><path d={ROOF} fill={`url(#${uid}-t)`} /><path className="mf-rule" d="M190 150L300 101L410 150" /></g>
      <path className="mf-rule" d="M200 236H190V238" /><path className="mf-lantern" d="M186 238h8v10h-8Z" /><circle className="mf-flame-dot" cx="190" cy="243" r="1.5" />
    </g>
    {ROOMS.map((r) => { const h = HELP[r.help], tx = r.side < 0 ? 176 : 424, dot = r.side < 0 ? 184 : 416;
      return <g key={h.name} style={tone(h.tint)}><path className="mf-leader" d={`M${r.ex} ${r.ty - 3}H${dot - r.side * 3}`} /><Dot x={dot} y={r.ty - 3} /><Tag x={tx} y={r.ty} anchor={r.side < 0 ? "end" : "start"} {...h} /></g>; })}
    <path className="mf-leader" d="M372 131H413" /><Dot x={416} y={131} /><Tag x={424} y={134} anchor="start" name="CLOSE TO HOME" detail="LOCAL MAPS · 15 CITIES" />
    <text className="hf-caption" x="300" y="408" textAnchor="middle">A ROOM FOR EVERY NEED · THE DOOR LEFT OPEN</text>
  </svg>;
}

/* ---------- The Wayfinder: a signpost with seven arms, a lantern, and a plaque of fifteen cities ---------- */

const ARMS = HELP.map((h, i) => { const right = i % 2 === 0, k = Math.floor(i / 2);
  return { ...h, s: right ? 1 : -1, y: right ? 100 + k * 40 : 126 + k * 40, len: right ? [176, 158, 170, 150][k] : [164, 172, 156][k], tilt: right ? [-2, 1, -1.5, -1][k] : [-1, 1, -1][k] }; });
const PLAQUE = "M136 254H464A8 8 0 0 0 472 262V328A8 8 0 0 0 464 336H136A8 8 0 0 0 128 328V262A8 8 0 0 0 136 254Z";
const HILLS = ["M40 300C64 288 92 290 116 302S170 318 220 320S380 318 430 312S500 284 528 290S552 298 560 302V344H40Z", "M40 326C70 314 100 316 134 328S330 334 390 330S470 318 500 316S544 322 560 328V344H40Z"];

function Arm({ a, i, shade }: { a: (typeof ARMS)[number]; i: number; shade: string }) {
  const x = (d: number) => 300 + a.s * d, y = a.y, anchor = a.s > 0 ? "start" : "end";
  const board = `M${x(0)} ${y}H${x(a.len)}L${x(a.len + 13)} ${y + 13}L${x(a.len)} ${y + 26}H${x(0)}Z`;
  return <g style={tone(a.tint)} transform={`rotate(${a.tilt} 300 ${y + 13})`}>
    <path className="mf-under" d={board} transform="translate(3 3)" /><path className="mf-board" d={board} /><path d={board} fill={`url(#${shade})`} />
    <path className="mf-grain" d={range(0, 5, 1).map((k) => `M${x(10)} ${y + 5 + k * 4}h${a.s * (a.len - 12 - (k % 2) * 9)}`).join("")} />
    <path className="mf-groove" d={`M${x(9)} ${y + 3.5}H${x(a.len - 1)}L${x(a.len + 8.5)} ${y + 13}L${x(a.len - 1)} ${y + 22.5}H${x(9)}Z`} />
    <circle className="mf-nail" cx={x(12)} cy={y + 7} r="1.1" /><circle className="mf-nail" cx={x(12)} cy={y + 19} r="1.1" />
    <text className="mf-label mf-name" x={x(18)} y={y + 11.5} textAnchor={anchor}>{a.name}</text><text className="mf-label mf-detail mf-small" x={x(18)} y={y + 21} textAnchor={anchor}>{a.detail}</text>
    <circle className="mf-medal" cx={x(a.len - 5)} cy={y + 13} r="5" /><circle className="mf-medal-dot" cx={x(a.len - 5)} cy={y + 13} r="1.6" />
    <path className="mf-glint" style={delay(i * 2 - 14)} d={board} />
  </g>;
}
export function WayfinderScene() {
  const uid = useUid(), shade = `${uid}-s`, glow = `${uid}-g`;
  return <svg className="hf-scene mf-way" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={shade} /><Glow id={glow} o={0.6} /><Ruling id={`${uid}-r`} gap={2.2} />
      <linearGradient id={`${uid}-p`}><stop stopColor="currentColor" stopOpacity=".05" /><stop offset="1" stopColor="currentColor" stopOpacity=".3" /></linearGradient></defs>
    <Verse text="“Come unto me, all ye that labour and are heavy laden, and I will give you rest.”" cite="MATTHEW 11:28" />
    <path className="mf-rays" d={range(196, 345, 6).map((deg) => { const t = (deg * Math.PI) / 180; return `M${f(300 + 130 * Math.cos(t))} ${f(344 + 130 * Math.sin(t))}L${f(300 + 262 * Math.cos(t))} ${f(344 + 262 * Math.sin(t))}`; }).join("")} />
    {HILLS.map((d, k) => <g key={d}><path className={`mf-hill mf-hill-${k}`} d={d} /><path d={d} fill={`url(#${uid}-r)`} /></g>)}
    <path className="mf-ground" d="M40 344H560" />
    <g className="hf-layer-left">{ARMS.map((a, i) => a.s < 0 && <Arm key={a.name} a={a} i={i} shade={shade} />)}</g>
    <g className="hf-layer-right">{ARMS.map((a, i) => a.s > 0 && <Arm key={a.name} a={a} i={i} shade={shade} />)}</g>
    <path className="mf-post" d="M294 96H306V344H294Z" /><path d="M294 96H306V344H294Z" fill={`url(#${uid}-p)`} /><path className="mf-grain" d="M297 100V340M301 104V336M303.5 112V328" />
    <path className="mf-board" d="M291 96L300 86L309 96Z" /><path className="mf-fill" d="M292 96h16v4h-16Z" />
    <g className="mf-swing">
      <circle className="mf-halo-big" cx="262" cy="110" r="36" fill={`url(#${glow})`} />
      <path className="mf-iron" d="M294 100H262V102M294 108Q282 108 278 100M266 100q-4 -4 0 -6" />
      <path className="mf-fill" d="M255 104L262 99.5L269 104Z" /><path className="mf-glass" d="M257 104h10v12h-10Z" /><path className="mf-rule" d="M260.3 104V116M263.7 104V116" /><path className="mf-fill" d="M255 116h14v2.5h-14Z" />
      <path className="mf-flame" d="M262 114c-2.4-2.4-2.6-4.6 0-8c2.6 3.4 2.4 5.6 0 8Z" />
    </g>
    <g className="hf-layer-plaque">
      <path className="mf-under" d={PLAQUE} transform="translate(4 4)" /><path className="mf-board" d={PLAQUE} /><path d={PLAQUE} fill={`url(#${shade})`} />
      <path className="mf-groove" d="M138 259H462A6 6 0 0 0 467 264V326A6 6 0 0 0 462 331H138A6 6 0 0 0 133 326V264A6 6 0 0 0 138 259Z" />
      {[[140, 264], [460, 264], [140, 326], [460, 326]].map(([x, y]) => <circle key={x + y} className="mf-nail" cx={x} cy={y} r="1.3" />)}
      <text className="mf-label mf-detail" x="300" y="270" textAnchor="middle">CLOSE TO HOME · LOCAL MAPS IN 15 CITIES</text>
      <path className="mf-rule" d="M190 276H292M308 276H410M300 272.5L303.5 276L300 279.5L296.5 276Z" />
      {CITIES.map((c, k) => <text key={c} className="mf-city-name" x={177 + (k % 4) * 82} y={290 + Math.floor(k / 4) * 11} textAnchor="middle">{c}</text>)}
    </g>
    {[[284, 343, 9, 4], [314, 344, 10, 4.5], [300, 347, 7, 3], [272, 346, 5, 2.5]].map(([cx, cy, rx, ry]) => <ellipse key={cx} className="mf-stone" cx={cx} cy={cy} rx={rx} ry={ry} />)}
    <path className="mf-grass" d={[64, 92, 148, 200, 404, 452, 506, 534].map((x) => `M${x} 344l-2 -5M${x} 344v-6M${x} 344l2 -5`).join("")} />
    <text className="hf-caption" x="300" y="372" textAnchor="middle">A WAY FOR EVERY BURDEN · AND ONE CLOSE TO HOME</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The Harbour Light", note: "An engraved harbour under Psalm 107:30: a lighthouse on hatched rocks sweeps its beam across seven moored boats, one per kind of help (crisis 988, pregnancy, healing after abortion, families, food, grief, recovery), each lantern lighting as the beam finds it, with fifteen city lights on the far shore; on hover the boats rise and the beam brightens.", Scene: HarbourScene },
  { name: "The Open Inn", note: "The inn of the Good Samaritan (Luke 10:34) cut open like an old engraving: seven rooms lit in turn (a phone desk for crisis, a rocking chair, a sunrise window for healing, a nursery, a pantry, two chairs for grief, a circle of chairs for recovery), the front door open onto the road; on hover the roof lifts.", Scene: InnScene },
  { name: "The Wayfinder", note: "A carved signpost under Matthew 11:28: seven arms, each naming a kind of help and a real service, a lantern swinging from its bracket, and a plaque listing the fifteen cities with local maps; light passes from arm to arm, and on hover the arms open outward.", Scene: WayfinderScene },
];
