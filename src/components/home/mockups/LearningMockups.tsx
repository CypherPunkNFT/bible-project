// Three proposed drawings for the homepage "Learning materials" block: the "Moses: three forties" workbook taken apart
// in an exploded view, a study desk from above with the open spread under a lamp, and a printer's type case holding the
// 41 titles by reader and kind with the one ready title lifted out. Motion and hover in learning-mockups.css.
import { useId, type CSSProperties } from "react";
import { CATALOGUE } from "@/data/resources/learning-catalogue";
import type { Mockup } from "./types";
import "./learning-mockups.css";

const vars = (values: Record<string, string | number>) => values as CSSProperties;
const delay = (seconds: number) => vars({ animationDelay: `${seconds}s` });
const tone = (name: string, extra: Record<string, number> = {}) => vars({ color: `var(--${name})`, ...extra });
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const f = (n: number) => Math.round(n * 10) / 10;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.ceil((to - from) / step)) }, (_, k) => from + k * step);
/** One path of ruled lines: n rows from (x, y), `gap` apart, a little ragged at the line ends. */
const rows = (x: number, y: number, w: number, n: number, gap: number) => range(0, n, 1).map((i) => `M${x} ${f(y + i * gap)}h${f(w - ((i * 5) % 4) * (w / 14))}`).join("");
/** Engraved hatching: horizontal strokes filling a band, each `len(y)` long from `x0(y)`. */
const hatch = (y0: number, y1: number, gap: number, x0: (y: number) => number, len: (y: number) => number) => range(y0, y1, gap).map((y) => `M${f(x0(y))} ${f(y)}h${f(len(y))}`).join("");

function Shade({ id, a = 0.12, b = 0.03, x2 = 1, y2 = 1 }: { id: string; a?: number; b?: number; x2?: number; y2?: number }) {
  return <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}><stop stopColor="currentColor" stopOpacity={a} /><stop offset=".5" stopColor="currentColor" stopOpacity=".02" /><stop offset="1" stopColor="currentColor" stopOpacity={b} /></linearGradient>;
}
function Tag({ x, y, name, detail, note, anchor = "start" }: { x: number; y: number; name: string; detail: string; note?: string; anchor?: "start" | "middle" | "end" }) {
  return <text className="ml-label" x={x} y={y} textAnchor={anchor}><tspan className="ml-name">{name}</tspan><tspan className="ml-detail" x={x} dy="12.5">{detail}</tspan>{note && <tspan x={x} dy="12">{note}</tspan>}</text>;
}
const Dot = ({ x, y }: { x: number; y: number }) => <circle className="ml-dot" cx={x} cy={y} r="2.4" />;
function Verse({ y, text, cite }: { y: number; text: string; cite: string }) {
  return <g className="hf-layer-verse"><text className="ml-verse" x="300" y={y} textAnchor="middle">“{text}”</text><text className="ml-ref" x="300" y={y + 19} textAnchor="middle">{cite}</text></g>;
}

/* ---------- Engraved vignettes for the three forties, drawn on a 92-wide page in the band y 32 to 74 ---------- */

function Egypt() {
  return <><circle className="ml-sun" cx="19" cy="39" r="3.2" /><path className="ml-solid" d="M12 72L33 44L54 72Z" /><path className="ml-hatch" d={hatch(47, 72, 2.2, () => 33, (y) => (y - 44) * 0.75)} />
    <path className="ml-solid" d="M56 51L69 43.5L82 51ZM56 51h26v3h-26ZM55 70h28v2.5h-28Z" /><path className="ml-col" d={range(58.5, 81, 4.6).map((x) => `M${f(x)} 54V70`).join("")} />
    <path className="ml-hatch" d={hatch(36, 46, 2.4, (y) => 40 + (y % 3), () => 9)} /></>;
}
function Midian() {
  return <><path className="ml-solid" d="M9 66L28 42L40 54L54 38L83 66Z" /><path className="ml-hatch" d={hatch(44, 66, 2.2, (y) => 54 + (y - 38) * 0.2, (y) => (y - 38) * 0.75)} />
    <g className="ml-bush"><path className="ml-flame" d="M45 60c-5-6-2-11 1-16c1 4 5 6 3 11c2-2 3-4 2-7c4 5 3 10-1 12Z" /><path className="ml-solid" d="M38 70c-3-6 3-9 6-7c1-4 7-4 8 0c4-1 7 4 3 7Z" /></g>
    {[[17, 69], [26, 71], [70, 70]].map(([x, y]) => <g key={x}><ellipse className="ml-solid" cx={x} cy={y} rx="4" ry="2.6" /><circle className="ml-solid" cx={x + 4.6} cy={y - 1.6} r="1.5" /></g>)}
    <path className="ml-hatch" d="M60 73h24M62 70.5l2 2.5M68 70.5l2 2.5M74 70.5l2 2.5M80 70.5l2 2.5" /></>;
}
function Wilderness() {
  return <><path className="ml-cloud" d="M47 64c-6 0-6-6-1-7c-5-2-3-8 2-7c-4-3 0-8 4-6c-2-4 4-7 6-3" /><path className="ml-hatch" d={hatch(36, 74, 6, () => 9, () => 0) + "M9 74C30 68 52 76 84 70"} />
    {[[20, 72, 8], [34, 68, 7], [62, 72, 8], [76, 68, 6.5]].map(([x, y, w]) => <g key={x}><path className="ml-solid" d={`M${x - w} ${y}L${x} ${y - w * 1.3}L${x + w} ${y}Z`} />
      <path className="ml-hatch" d={range(1, 5, 1).map((k) => `M${f(x + k * w / 5)} ${f(y - (w - k * w / 5) * 1.3)}V${y}`).join("")} /></g>)}</>;
}

/* ---------- The Exploded Workbook: cover, three forties, activity page and memory-verse card lifted apart ---------- */

const W = 92, H = 126, S = 0.8;
/** A page lying flat, seen from above at an angle: its top corner at (x, y), its width running right-down, its height left-down. */
const iso = (x: number, y: number) => `matrix(${f(0.866 * S * 1000) / 1000} ${S / 2} ${-f(0.866 * S * 1000) / 1000} ${S / 2} ${x} ${y})`;
const corner = (x: number, y: number, u: number, v: number) => [f(x + 0.866 * S * (u - v)), f(y + (S / 2) * (u + v))];
const SHEETS = [
  { name: "THE COVER", detail: "8 SESSIONS · 42 PAGES", tint: "epistles" },
  { name: "EGYPT · AGES 0–40", detail: "THE PALACE · ACTS 7:22", tint: "history" },
  { name: "MIDIAN · 40–80", detail: "THE BUSH · EXODUS 3", tint: "poetry" },
  { name: "WILDERNESS · 80–120", detail: "THE CAMP · TO DEUT. 34", tint: "prophets" },
  { name: "ACTIVITY PAGE", detail: "QUESTIONS · ROOM TO WRITE", tint: "epistles" },
].map((s, k) => ({ ...s, x: 140 + k * 70, y: 272 - k * 38 }));
const PAGE = `M0 0H${W}V${H}H0Z`;

function SheetArt({ k, shade }: { k: number; shade: string }) {
  const Art = [null, Egypt, Midian, Wilderness][k];
  if (k === 0) return <><path className="ml-neat" d="M5 5H87V121H5ZM7.5 7.5H84.5V118.5H7.5Z" /><text className="ml-plane-title" x="46" y="52" textAnchor="middle">Moses</text><text className="ml-plane-sub" x="46" y="62" textAnchor="middle">three forties</text>
    {["history", "poetry", "prophets"].map((t, i) => <rect key={t} className="ml-band" style={tone(t)} x={16 + i * 20.5} y="72" width="19.5" height="5" />)}<path className="ml-rule" d="M16 82v-3M36.5 82v-3M57 82v-3M77.5 82v-3" />
    <path className="ml-hatch" d={hatch(92, 112, 2.6, () => 16, (y) => 60 - (y % 5) * 3)} /></>;
  if (Art) return <><rect className="ml-pic" x="8" y="32" width="76" height="42" /><Art /><path className="ml-ink" d={rows(10, 84, 72, 5, 5)} />
    <rect className="ml-key" x="9" y="109" width="74" height="10" /><path className="ml-ink" d="M13 114h52" /><path d={PAGE} fill={`url(#${shade})`} /></>;
  return <>{range(0, 40, 1).map((i) => <circle key={i} className="ml-grid" cx={14 + (i % 8) * 9} cy={36 + Math.floor(i / 8) * 7} r=".9" />)}<rect className="ml-found" x="22" y="47" width="38" height="5" rx="2.5" />
    {[72, 90, 108].map((y, i) => <g key={y}><rect className="ml-check" x="9" y={y - 4} width="5" height="5" />{i === 0 && <path className="ml-tick" d={`M9.8 ${y - 1.6}l1.6 1.8l3-4`} />}<path className="ml-ink" d={`M18 ${y - 1.5}h${50 - i * 8}`} /><path className="ml-rule" d={`M18 ${y + 5}H84M18 ${y + 11}H84`} /></g>)}
    <path className="ml-answer" pathLength={1} d="M19 76c4-2 6 1 10-1s6 2 10 0 5 1 9-1" /></>;
}

function ExplodedScene() {
  const uid = useUid(), shade = `${uid}-s`, centres = SHEETS.map((s) => corner(s.x, s.y, 46, 80)), card = { x: 490, y: 82 };
  const axis = `M${centres.map((c) => c.join(" ")).join("L")}L${corner(card.x, card.y, 46, 28).join(" ")}`;
  return <svg className="hf-scene ml-exploded" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={shade} a={0.1} b={0.04} /></defs>
    <Verse y={48} text="And Moses was an hundred and twenty years old when he died" cite="DEUTERONOMY 34:7" />
    <path className="ml-assembly" d={[[0, H], [W, H], [0, 0]].map(([u, v]) => `M${corner(SHEETS[0].x, SHEETS[0].y, u, v).join(" ")}L${corner(SHEETS[4].x, SHEETS[4].y, u, v).join(" ")}`).join("")} />
    {SHEETS.map((s, k) => { const [bx, by] = corner(s.x, s.y, W, H);
      return <g key={s.name} className="hf-layer-sheet" style={tone(s.tint, { "--k": k })}>
        {(k === 0 ? [6, 4, 2] : [3]).map((d) => <path key={d} className="ml-under" d={PAGE} transform={`translate(0 ${d}) ${iso(s.x, s.y)}`} />)}
        <g transform={iso(s.x, s.y)}><path className="ml-page" d={PAGE} /><path d={PAGE} fill={`url(#${shade})`} /><SheetArt k={k} shade={shade} /></g>
        <circle className="ml-halo" style={delay(k * 2.4 - 14)} cx={centres[k][0]} cy={centres[k][1]} r="12" />
        <path className="ml-leader" d={`M${bx + 4} ${by}H415`} /><Dot x={418} y={by} /><Tag x={426} y={by + 2} name={s.name} detail={s.detail} />
      </g>; })}
    <g className="hf-layer-card" style={vars({ "--k": 5 })}>
      <path className="ml-under" d="M0 0H92V56H0Z" transform={`translate(0 3) ${iso(card.x, card.y)}`} />
      <g transform={iso(card.x, card.y)}><rect className="ml-page" width="92" height="56" rx="4" /><path className="ml-neat" d="M5 5H87V51H5Z" /><text className="ml-plane-sub" x="46" y="22" textAnchor="middle">an hundred and twenty</text><path className="ml-ink" d={rows(14, 31, 64, 3, 6)} /><circle className="ml-sun" cx="46" cy="47" r="1.8" /></g>
      <path className="ml-leader" d="M448 104H426" /><Dot x={423} y={104} /><Tag x={415} y={101} anchor="end" name="MEMORY-VERSE CARD" detail="CUT OUT · LEARN IT" />
    </g>
    <path className="ml-glow" d={axis} pathLength={100} />
    <text className="hf-caption" x="300" y="408" textAnchor="middle">EGYPT 0–40 · MIDIAN 40–80 · WILDERNESS 80–120</text>
  </svg>;
}

/* ---------- The Study Desk: the open spread from above, seven reader tabs, verse cards, a lamp ---------- */

const READERS = CATALOGUE.audiences.map((a, k) => ({ ...a, tint: ["poetry", "history", "prophets", "gospels", "epistles", "resource-life", "accent"][k] }));
const DETAILS = ["3–5 · READ ALOUD", "6–11 · LESSONS", "12–17 · SERIES", "18–25 · PLANS", "18+ · WORKBOOKS", "AT THE TABLE", "WHO TEACH"];
const LEFT = "M150 124Q220 116 290 126V318Q220 310 150 318Z", RIGHT = "M290 126Q360 116 430 124V318Q360 310 290 318Z";
const QUESTIONS = ["What did Moses see?", "Why did he turn aside?", "What was he told to do?"];

export function DeskScene() {
  const uid = useUid();
  return <svg className="hf-scene ml-desk" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-l`} a={0.03} b={0.16} x2={1} y2={0} /><Shade id={`${uid}-r`} a={0.16} b={0.03} x2={1} y2={0} /><clipPath id={`${uid}-c`}><rect x="24" y="92" width="552" height="278" rx="10" /></clipPath>
      <radialGradient id={`${uid}-g`}><stop stopColor="var(--accent)" stopOpacity=".2" /><stop offset=".55" stopColor="var(--accent)" stopOpacity=".08" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
    <Verse y={48} text="Study to shew thyself approved unto God" cite="2 TIMOTHY 2:15" />
    <rect className="ml-under" x="24" y="92" width="552" height="278" rx="10" transform="translate(0 5)" /><rect className="ml-wood" x="24" y="92" width="552" height="278" rx="10" />
    <g clipPath={`url(#${uid}-c)`}><path className="ml-grain" d={range(96, 370, 5).map((y, k) => `M${24 + ((k * 37) % 60)} ${y}C180 ${y - 1.6 + (k % 3)} 380 ${y + 1.8 - (k % 2)} 576 ${y - 0.6}`).join("")} />
      <ellipse className="ml-pool" cx="290" cy="220" rx="230" ry="140" fill={`url(#${uid}-g)`} /></g>
    <g className="hf-layer-cards">{[-16, -7, 2].map((r, i) => <g key={r} className="ml-fan" style={vars({ "--r": r })}>
      <rect className="ml-under" x="44" y="244" width="84" height="52" rx="4" transform="translate(2 3)" /><rect className="ml-page" x="44" y="244" width="84" height="52" rx="4" />
      {i === 2 ? <><text className="ml-card-text" x="86" y="264" textAnchor="middle">Thy word have I hid</text><text className="ml-card-text" x="86" y="276" textAnchor="middle">in mine heart</text><text className="ml-ref" x="86" y="288" textAnchor="middle">PSALM 119:11</text></> : <path className="ml-ink" d={rows(54, 258, 64, 4, 8)} />}
    </g>)}<Tag x={86} y={334} anchor="middle" name="MEMORY-VERSE CARDS" detail="CUT OUT · KEEP" /></g>
    <g className="hf-layer-lamp"><path className="ml-cord" d="M78 92C80 104 76 112 78 118" /><circle className="ml-shade" cx="78" cy="146" r="30" /><circle className="ml-shade-ring" cx="78" cy="146" r="23" /><path className="ml-shade-ring" d={range(0, 360, 12).map((a) => { const t = (a * Math.PI) / 180; return `M${f(78 + 16 * Math.cos(t))} ${f(146 + 16 * Math.sin(t))}L${f(78 + 29 * Math.cos(t))} ${f(146 + 29 * Math.sin(t))}`; }).join("")} /><circle className="ml-shade-ring" cx="78" cy="146" r="15" /><circle className="ml-bulb" cx="78" cy="146" r="6" /></g>
    <g className="hf-layer-book">
      {[6, 3].map((d) => <path key={d} className="ml-under" d={LEFT + RIGHT} transform={`translate(0 ${d})`} />)}
      <path className="ml-page" d={LEFT} /><path d={LEFT} fill={`url(#${uid}-l)`} /><path className="ml-page" d={RIGHT} /><path d={RIGHT} fill={`url(#${uid}-r)`} /><path className="ml-gutter" d="M290 126V318" />
      <text className="ml-label" x="162" y="142">SESSION 3 · MIDIAN</text>
      <g transform="translate(150 99) scale(1.53)" style={tone("poetry")}><rect className="ml-pic" x="8" y="32" width="76" height="42" /><Midian /></g>
      <text className="ml-label ml-detail" x="162" y="226">EXODUS 3:1–6</text><path className="ml-ink" d={rows(162, 236, 116, 5, 6)} />
      <rect className="ml-key" x="160" y="268" width="120" height="32" /><path className="ml-keybar" d="M160 268v32" /><text className="ml-card-text" x="167" y="283">“the bush was not consumed.”</text><text className="ml-ref" x="167" y="294">EXODUS 3:2 · KEY VERSE</text>
      <text className="ml-folio" x="220" y="312" textAnchor="middle">17</text><text className="ml-folio" x="360" y="312" textAnchor="middle">18</text>
      <text className="ml-heading" x="302" y="146">Questions</text>
      {QUESTIONS.map((q, i) => { const y = 166 + i * 46; return <g key={q}><circle className="ml-num" cx="306" cy={y - 3} r="4.5" /><text className="ml-num-text" x="306" y={y - 0.6} textAnchor="middle">{i + 1}</text>
        <text className="ml-card-text" x="315" y={y}>{q}</text><path className="ml-rule" d={`M302 ${y + 12}H420M302 ${y + 22}H420M302 ${y + 32}H420`} /></g>; })}
      <path className="ml-answer" pathLength={1} d="M304 176c6-3 9 2 15-1s9 2 15-1 9 2 15-1 7 1 12 0" />
      <g className="ml-pencil"><g transform="rotate(28)"><path className="ml-pencil-body" d="M0 0L9 -3H46V3H9Z" /><path className="ml-rule" d="M9 0H46" /><path className="ml-pencil-tip" d="M0 0L4 -1.3V1.3Z" /><path className="ml-rubber" d="M46 -3h7v6h-7Z" /></g></g>
      <path className="ml-ribbon" d="M291 316C292 330 288 340 294 356l3-5 3 4C296 340 300 330 296 316" />
      {READERS.map((r, k) => { const y = 132 + k * 25; return <g key={r.id} className="ml-tab" style={tone(r.tint, { "--k": k })}>
        <path className="ml-tab-shape" d={`M428 ${y}H442Q446 ${y} 446 ${y + 4}V${y + 14}Q446 ${y + 18} 442 ${y + 18}H428Z`} /><path className="ml-rule" d={`M434 ${y + 5}v8`} />
        <path className="ml-leader" d={`M449 ${y + 9}H459`} /><Dot x={462} y={y + 9} /><Tag x={470} y={y + 8} name={r.name.toUpperCase()} detail={DETAILS[k]} /></g>; })}
    </g>
    <path className="ml-clip" d="M470 104h34a5 5 0 0 1 0 10h-30a3.5 3.5 0 0 1 0-7h26" />
    <text className="hf-caption" x="300" y="408" textAnchor="middle">THE PASSAGE · ITS KEY VERSES · QUESTIONS · ROOM TO WRITE</text>
  </svg>;
}

/* ---------- The Type Case: the 41 titles sorted by reader and kind, the one ready title lifted out ---------- */

const KINDS = ["story", "activity", "cards", "lesson", "plan", "devotional", "maps", "guide", "workbook"];
const SHORT: Record<string, string> = { story: "READ-ALOUD", activity: "ACTIVITIES", cards: "VERSE CARDS", lesson: "LESSONS", plan: "READING PLANS", devotional: "DEVOTIONALS", maps: "CHARTS · MAPS", guide: "LEADER GUIDES", workbook: "WORKBOOKS" };
const CX = 92, CY = 150, CW = 38, CH = 26;
const READY = CATALOGUE.items.find((i) => i.status === "ready");
const cellOf = (audience: string, kind: string) => CATALOGUE.items.filter((i) => i.audience === audience && i.kind === kind);

function Spines({ col, row, tint }: { col: number; row: number; tint: string }) {
  const titles = cellOf(READERS[row].id, KINDS[col]), x0 = CX + col * CW + (CW - (titles.length * 8 - 2.5)) / 2, base = CY + (row + 1) * CH - 3;
  if (!titles.length) return <rect className="ml-empty" x={CX + col * CW + 3} y={CY + row * CH + 3} width={CW - 6} height={CH - 6} />;
  return <g style={tone(tint)}>{titles.map((t, i) => { const x = x0 + i * 8, h = 15 + ((i * 3 + col) % 4); return t.status === "ready"
    ? <rect key={t.id} className="ml-ghost" x={x} y={base - h} width="5.5" height={h} rx="1" />
    : <g key={t.id}><rect className="ml-spine" x={x} y={base - h} width="5.5" height={h} rx="1" /><path className="ml-rule" d={`M${x + 1} ${base - h + 3.5}h3.5M${x + 1} ${base - 3}h3.5`} /></g>; })}</g>;
}

function TypeCaseScene() {
  const uid = useUid(), row = READERS.findIndex((r) => r.id === READY?.audience), col = KINDS.indexOf(READY?.kind ?? ""), cy = CY + row * CH + CH / 2, cx = CX + col * CW + CW / 2;
  const arc = `M${CX + 9 * CW - 10} ${cy}C${CX + 9 * CW + 22} ${cy} ${CX + 9 * CW + 30} ${cy - 30} 474 ${cy - 38}`, route = `M${CX + 4} ${cy}H${CX + 9 * CW - 10}${arc.replace(/^M[^C]*/, "")}`;
  return <svg className="hf-scene ml-case" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-c`} a={0.16} b={0.02} x2={0} y2={1} /><Shade id={`${uid}-v`} a={0.06} b={0.12} />
      <pattern id={`${uid}-h`} width="4" height="4" patternUnits="userSpaceOnUse"><path className="ml-hatch" d="M0 4L4 0" /></pattern>
      <radialGradient id={`${uid}-g`}><stop stopColor="var(--accent)" stopOpacity=".5" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
    <Verse y={48} text="And thou shalt teach them diligently unto thy children" cite="DEUTERONOMY 6:7" />
    {KINDS.map((k, c) => { const x = CX + c * CW + CW / 2; return <g key={k}><path className="ml-leader" d={`M${x} 147V141`} /><text className="ml-tiny" x={x + 2} y="136" transform={`rotate(-42 ${x + 2} 136)`}>{SHORT[k]}</text></g>; })}
    <g className="hf-layer-case">
      <rect className="ml-under" x="84" y="140" width="358" height="214" rx="3" transform="translate(5 5)" /><rect className="ml-wood ml-frame" x="84" y="140" width="358" height="214" rx="3" />
      <path className="ml-grain" d={range(142, 150, 2.2).map((y) => `M88 ${f(y)}H438`).join("") + range(334, 352, 2.4).map((y) => `M88 ${f(y)}H${y > 340 && y < 348 ? 236 : 438}`).join("") + [86.5, 89, 437, 439.5].map((x) => `M${x} 151V331`).join("")} />
      <rect className="ml-bed" x={CX} y={CY} width={9 * CW} height={7 * CH} /><rect x={CX} y={CY} width={9 * CW} height={7 * CH} fill={`url(#${uid}-v)`} />
      {READERS.map((r, ri) => KINDS.map((k, ci) => <g key={r.id + k}><rect x={CX + ci * CW} y={CY + ri * CH} width={CW} height={CH} fill={`url(#${uid}-c)`} />
        {!cellOf(r.id, k).length && <rect x={CX + ci * CW + 3} y={CY + ri * CH + 3} width={CW - 6} height={CH - 6} fill={`url(#${uid}-h)`} />}<Spines col={ci} row={ri} tint={r.tint} /></g>))}
      <path className="ml-divider" d={range(1, 9, 1).map((c) => `M${CX + c * CW} ${CY}V${CY + 7 * CH}`).join("") + range(1, 7, 1).map((r) => `M${CX} ${CY + r * CH}H${CX + 9 * CW}`).join("")} />
      <rect className="ml-neat-frame" x={CX} y={CY} width={9 * CW} height={7 * CH} />
      <ellipse className="ml-cell-glow" cx={cx} cy={cy} rx="30" ry="20" fill={`url(#${uid}-g)`} />
      <rect className="ml-holder" x="238" y="337" width="50" height="11" rx="1.5" /><text className="ml-tiny ml-holder-text" x="263" y="345" textAnchor="middle">{CATALOGUE.items.length} TITLES</text><path className="ml-pull" d="M253 350q10 7 20 0" />
      {READERS.map((r, ri) => <g key={r.id} style={tone(r.tint)}><Tag x={78} y={CY + ri * CH + 11} anchor="end" name={r.name.toUpperCase()} detail={r.age.toUpperCase()} /></g>)}
    </g>
    <path className="ml-route" d={arc} /><path className="ml-glow" d={route} pathLength={100} />
    <g className="hf-layer-cover">{[6, 3].map((d) => <rect key={d} className="ml-under" x={474 + d} y={160 + d} width="88" height="118" rx="2" />)}
      <rect className="ml-page" x="474" y="160" width="88" height="118" rx="2" /><rect x="474" y="160" width="88" height="118" fill={`url(#${uid}-v)`} /><path className="ml-neat" d="M479 165H557V273H479ZM481.5 167.5H554.5V270.5H481.5Z" />
      <circle className="ml-halo ml-halo-cover" cx="518" cy="200" r="30" /><text className="ml-plane-title" x="518" y="198" textAnchor="middle">Moses</text><text className="ml-plane-sub" x="518" y="210" textAnchor="middle">three forties</text>
      {["history", "poetry", "prophets"].map((t, i) => <rect key={t} className="ml-band" style={tone(t)} x={486 + i * 21.5} y="222" width="20.5" height="5" />)}
      {[0, 40, 80, 120].map((a, i) => <text key={a} className="ml-tiny" x={486 + i * 21.5} y="237" textAnchor="middle">{a}</text>)}
      <path className="ml-hatch" d={hatch(246, 266, 2.6, () => 488, (y) => 60 - (y % 5) * 3)} /><path className="ml-stamp" d="M540 160v16l5-4 5 4v-16" />
      <Tag x={518} y={302} anchor="middle" name={READY?.title.toUpperCase() ?? ""} detail={`${READY?.sessions ?? 8} SESSIONS · 42 PAGES`} note="A4 · US LETTER · READY" /></g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">{CATALOGUE.items.length} TITLES · {CATALOGUE.kinds.length} KINDS · {READERS.length} READERS · ONE READY NOW</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The Exploded Workbook", note: "“Moses: three forties” taken apart like an engineer's drawing: the cover, an engraved page for each forty (the palace of Egypt, the burning bush in Midian, the tents of the wilderness), the activity page and a memory-verse card lifting off along dashed assembly lines, each labelled, a light climbing through them under Deuteronomy 34:7; on hover the layers part further.", Scene: ExplodedScene },
  { name: "The Study Desk", note: "The open spread seen from above on a wooden desk: the passage with its engraved bush and key verse on the left, three questions with room to write on the right (one being answered), seven coloured tabs for the readers from little ones to leaders, verse cards, a ribbon and a lamp whose light drifts across the page; on hover the tabs fan out and the cards spread.", Scene: DeskScene },
  { name: "The Type Case", note: "A printer's type case holding the real catalogue, seven readers by nine kinds, one spine per title (41), with the one ready title, “Moses: three forties”, lifted out of its compartment and lit, a light running along its row to it; on hover the cover rises and the case settles.", Scene: TypeCaseScene },
];
