// Four more proposals for the top drawing of the homepage Resources section, none of them a map: a pilgrim's satchel
// opened on a woven cloth with its contents laid out; three stained-glass lancets with a beam of sun crossing them; a
// house cut open to show three rooms; and a botanical plate of one tree with three numbered branches. Each shows
// learning, fellowship and help for life together. Motion rules in overview-more.css.
import { useId, type CSSProperties } from "react";
import type { Mockup } from "./types";
import "./overview-more.css";

type Pt = [number, number];
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;
const tone = (name: string) => ({ color: `var(--${name})` }) as CSSProperties;
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const f = (n: number) => Math.round(n * 10) / 10;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.ceil((to - from) / step)) }, (_, k) => from + k * step);
/** One path of ruled lines: n rows from (x, y), `gap` apart, a little ragged at the line ends. */
const rows = (x: number, y: number, w: number, n: number, gap: number) => range(0, n, 1).map((i) => `M${x} ${f(y + i * gap)}h${f(w - ((i * 5) % 4) * (w / 14))}`).join("");
/** Engraver's hatching: parallel 45-degree strokes filling a box (clip it to the shape). */
const hatch = (x0: number, y0: number, x1: number, y1: number, gap: number) => range(x0 - (y1 - y0), x1, gap).map((x) => `M${f(x)} ${y1}l${y1 - y0} ${y0 - y1}`).join("");
/** A smooth path through the points (Catmull-Rom curves). */
const smooth = (p: Pt[]) => p.slice(1).reduce((d, b, i) => { const a = p[i], prev = p[i - 1] ?? a, next = p[i + 2] ?? b;
  return `${d}C${f(a[0] + (b[0] - prev[0]) / 6)} ${f(a[1] + (b[1] - prev[1]) / 6)} ${f(b[0] - (next[0] - a[0]) / 6)} ${f(b[1] - (next[1] - a[1]) / 6)} ${f(b[0])} ${f(b[1])}`; }, `M${f(p[0][0])} ${f(p[0][1])}`);
/** The halo at a stop flares as the travelling light (one 16s lap) reaches share t of its path. */
const reach = (t: number) => delay(t * 16 - 16.6);
const KINDS = ["epistles", "gospels", "resource-life"];

function Shade({ id, a = 0.12, b = 0.03 }: { id: string; a?: number; b?: number }) {
  return <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity={a} /><stop offset=".55" stopColor="currentColor" stopOpacity=".02" /><stop offset="1" stopColor="currentColor" stopOpacity={b} /></linearGradient>;
}
function Glow({ id, o = 0.3 }: { id: string; o?: number }) {
  return <radialGradient id={id}><stop stopColor="var(--accent)" stopOpacity={o} /><stop offset=".5" stopColor="var(--accent)" stopOpacity={o / 2.5} /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>;
}
/** A sheet drawn twice: its shadow sheet offset behind, then the sheet with its shading. */
function Sheet({ d, shade, dx = 3, dy = 4, className = "mx-page" }: { d: string; shade: string; dx?: number; dy?: number; className?: string }) {
  return <><path className="mx-under" d={d} transform={`translate(${dx} ${dy})`} /><path className={className} d={d} /><path d={d} fill={`url(#${shade})`} /></>;
}
function Tag({ x, y, name, detail, note }: { x: number; y: number; name: string; detail: string; note?: string }) {
  return <text className="mx-label" x={x} y={y} textAnchor="middle"><tspan className="mx-name">{name}</tspan><tspan className="mx-detail" x={x} dy="12.5">{detail}</tspan>{note && <tspan x={x} dy="12">{note}</tspan>}</text>;
}
const Dot = ({ x, y }: { x: number; y: number }) => <circle className="mx-dot" cx={x} cy={y} r="2.4" />;
/** A leader dropped from the drawing to a dot, then the two-line label beneath, in the kind's colour. */
function Key({ x, from, k, ...tag }: { x: number; from: number; k: number; name: string; detail: string; note?: string }) {
  return <g style={tone(KINDS[k])}><path className="mx-leader" d={`M${x} ${from}V328`} /><Dot x={x} y={331} /><Tag x={x} y={347} {...tag} /></g>;
}
function Verse({ y, text, cite }: { y: number; text: string; cite: string }) {
  return <g className="hf-layer-verse"><text className="mx-verse" x="300" y={y} textAnchor="middle">“{text}”</text><text className="mx-ref" x="300" y={y + 19} textAnchor="middle">{cite}</text></g>;
}
/** The three kinds' symbols: a book, a gathering ring, a pin. */
function Marker({ kind, x, y }: { kind: number; x: number; y: number }) {
  if (kind === 0) return <path className="mx-mark" d={`M${x - 5} ${y - 3.5}h10v7h-10ZM${x} ${y - 3.5}v7`} />;
  if (kind === 1) return <><circle className="mx-mark" cx={x} cy={y} r="4" /><circle className="mx-mark-dot" cx={x} cy={y} r="1.3" /></>;
  return <path className="mx-mark" d={`M${x} ${y + 5}c-3.4-4-4.4-5.6-4.4-7.2a4.4 4.4 0 0 1 8.8 0c0 1.6-1 3.2-4.4 7.2Z`} />;
}
const pin = (x: number, y: number) => `M${f(x)} ${f(y)}c-2-2.6-2.6-3.8-2.6-4.7a2.6 2.6 0 0 1 5.2 0c0 .9-.6 2.1-2.6 4.7Z`;

/* ---------- The Pilgrim's Satchel: a haversack opened on a woven cloth, its contents laid out ---------- */

const CLOTH = "M58 192H542L566 318H34Z";
const BAG = "M250 122H350Q358 122 359 130L364 188Q365 198 355 198H245Q235 198 236 188L241 130Q242 122 250 122Z";
const STRAP: Pt[] = [[240, 140], [230, 178], [206, 210], [120, 215], [68, 240], [64, 282], [100, 302], [300, 308], [500, 302], [536, 282], [532, 240], [480, 215], [394, 210], [370, 178], [360, 140]];
const CARDS = [-16, -6, 4, 14];
const SEAL = range(0, 28, 1).map((k) => { const a = (k * Math.PI) / 14, r = k % 2 ? 6.4 : 7.6; return `${k ? "L" : "M"}${f(300 + r * Math.cos(a))} ${f(282 + r * Math.sin(a))}`; }).join("") + "Z";

function Satchel({ uid }: { uid: string }) {
  const folds = range(0, 21, 1).map((k) => { const x = 300 + 62 * Math.sin(((k / 10 - 1) * Math.PI) / 2); return `M${f(x)} 124Q${f(x + (x - 300) * 0.05)} 160 ${f(x)} 198`; }).join("");
  return <g className="hf-layer-bag" style={tone("history")}>
    <path className="mx-leather" d="M248 124Q242 102 260 96H340Q358 102 352 124Z" /><path className="mx-stitch" d="M254 120Q250 106 262 101H338Q350 106 346 120" />
    <path className="mx-fill" d="M268 98h9v18h-9ZM323 98h9v18h-9Z" /><path className="mx-rule" d="M272.5 104v.1M272.5 110v.1M327.5 104v.1M327.5 110v.1" strokeLinecap="round" strokeWidth="2" />
    <g transform="rotate(18 326 118)"><path className="mx-page" d="M320 92h12v32h-12Z" /><ellipse className="mx-page" cx="326" cy="92" rx="6" ry="2.2" /><path className="mx-rule" d="M320 104h12M323 92v32" /></g>
    <path className="mx-under" d={BAG} transform="translate(4 3)" /><path className="mx-leather" d={BAG} /><path d={BAG} fill={`url(#${uid}-lg)`} />
    <g clipPath={`url(#${uid}-bag)`}><path className="mx-hatch" d={folds} /><path className="mx-hatch" d={hatch(236, 184, 364, 198, 2.6)} /></g>
    <ellipse className="mx-mouth" cx="300" cy="125" rx="52" ry="4.5" /><path className="mx-stitch" d="M247 130L243 188Q243 192 247 192H353Q357 192 357 188L353 130" />
    <path className="mx-leather" d="M262 148H338V184Q338 188 334 188H266Q262 188 262 184Z" /><path className="mx-stitch" d="M266 160V182Q266 184 268 184H332Q334 184 334 182V160" />
    <path className="mx-leather" d="M260 146H340L336 160Q300 166 264 160Z" /><path className="mx-stitch" d="M265 150H335L332 157Q300 162 268 157Z" />
    <path className="mx-brass" d="M294 158h12v9h-12Z" /><path className="mx-rule" d="M300 158v9M297 167h6" /><path className="mx-leather" d="M297 162h6v18h-6Z" />
    {[240, 360].map((x) => <circle key={x} className="mx-brass-ring" cx={x} cy="140" r="4" />)}
  </g>;
}
function Workbook({ uid }: { uid: string }) {
  const left = "M84 214Q112 207 140 214V286Q112 279 84 286Z", right = "M140 214Q168 207 196 214V286Q168 279 140 286Z";
  return <g className="hf-layer-book" style={tone(KINDS[0])}><g transform="rotate(-4 140 250)">
    <path className="mx-under mx-faint" d="M86 216h108v72h-108Z" transform="translate(9 10)" /><path className="mx-under" d="M86 216h108v72h-108Z" transform="translate(4 5)" />
    <text className="mx-vtitle" x="140" y="203" textAnchor="middle">Moses: three forties</text>
    <Sheet d={left} shade={`${uid}-s`} dx={0} dy={0} /><Sheet d={right} shade={`${uid}-s`} dx={0} dy={0} />
    <path className="mx-bar" d="M92 226h22" /><path className="mx-ink" d={rows(92, 236, 40, 8, 6)} /><path className="mx-gutter" d="M140 214V286" />
    <path className="mx-fill" d="M148 222h40v24h-40Z" /><path className="mx-mount" d="M150 244L160 230L166 236L174 226L186 244Z" /><circle className="mx-sun" cx="156" cy="228" r="2.2" />
    {[256, 266, 276].map((y, k) => <g key={y}><path className="mx-fill" d={`M148 ${y - 4}h5v5h-5Z`} />{k === 0 && <path className="mx-tick" d={`M148.8 ${y - 1.6}l1.6 1.8l3-4`} />}<path className="mx-ink" d={`M157 ${y - 1.5}h${28 - k * 5}`} /></g>)}
    <path className="mx-ribbon" d="M142 286v12l-2 3" />
  </g><g transform="rotate(68 218 254)"><path className="mx-brass" d="M200 251h36v6h-36Z" /><path className="mx-rule" d="M200 254h36M230 251v6" /><path className="mx-fill" d="M200 251L190 254L200 257Z" /></g></g>;
}
function Letter({ uid }: { uid: string }) {
  return <g className="hf-layer-letter" style={tone(KINDS[1])}><g transform="rotate(2 300 256)">
    <path className="mx-under" d="M240 238H360V298H240Z" transform="translate(4 4)" /><path className="mx-page" d="M240 238H360V298H240Z" /><path className="mx-page" d="M240 238L300 214L360 238Z" />
    <g className="mx-sheet"><Sheet d="M254 206H346V284H254Z" shade={`${uid}-s`} dx={2} dy={2} />
      <text className="mx-hand" x="262" y="219">To the brethren,</text><path className="mx-ink" d={rows(262, 228, 76, 6, 6.2)} /><path className="mx-flourish" d="M300 266c6-5 10 2 16-3s8 2 14-1" /></g>
    <path className="mx-page" d="M240 250L300 280L360 250V298H240Z" /><path d="M240 250L300 280L360 250V298H240Z" fill={`url(#${uid}-s)`} /><path className="mx-rule" d="M240 298L292 276M360 298L308 276" />
    <path className="mx-ribbon-tone" d="M296 286l-6 12l4-1l2 4l3-13M304 286l6 12l-4-1l-2 4l-3-13" /><path className="mx-seal" d={SEAL} /><circle className="mx-rule" cx="300" cy="282" r="4" /><path className="mx-rule" d="M300 279v6M297 282h6" />
  </g></g>;
}
function Lantern({ uid }: { uid: string }) {
  return <g className="hf-layer-lamp" style={tone(KINDS[2])}>
    <circle className="mx-lamp-glow" cx="432" cy="262" r="48" fill={`url(#${uid}-g)`} />
    <ellipse className="mx-under" cx="434" cy="301" rx="20" ry="4" /><path className="mx-brass" d="M416 290h32v9h-32Z" /><path className="mx-glass" d="M419 290V246H445V290Z" /><path d="M419 290V246H445V290Z" fill={`url(#${uid}-g)`} />
    <path className="mx-flame" d="M432 283c-4-5-5-9-1-16c1 4 6 8 1 16Z" /><path className="mx-wire" d="M418 246V290M446 246V290M432 246V258M419 262Q432 266 445 262M419 276Q432 280 445 276" />
    <path className="mx-brass" d="M414 247L421 234H443L450 247Z" /><path className="mx-rule" d="M424 238h16M422 242h20" /><path className="mx-brass" d="M426 234V226H438V234Z" /><circle className="mx-brass-ring" cx="432" cy="219" r="7" />
    {CARDS.map((a, k) => <g key={a} transform={`rotate(${a} 504 302)`}><g className="mx-card" style={{ "--fan": `${(k - 1.5) * 3}deg` } as CSSProperties}>
      <path className="mx-under" d="M482 236h44v60h-44Z" transform="translate(2 2)" /><path className="mx-page" d="M482 236h44v60h-44Z" />
      <path className="mx-street" d="M486 248h36M486 260h36M486 272h36M494 240v44M506 240v44M518 240v44" /><path className="mx-avenue" d={`M484 ${280 - k * 4}L524 ${244 + k * 3}`} />
      {k === 3 && <><path className="mx-pin" d={pin(498, 258) + pin(512, 268) + pin(504, 278)} /><path className="mx-rule" d="M482 284h44" /><text className="mx-label mx-name" x="504" y="292.5" textAnchor="middle">MIAMI</text></>}
    </g></g>)}
  </g>;
}
function SatchelScene() {
  const uid = useUid(), strap = smooth(STRAP);
  const fringe = range(0, 1.01, 0.05).map((t) => `M${f(58 - 24 * t)} ${f(192 + 126 * t)}l-6 1.5M${f(542 + 24 * t)} ${f(192 + 126 * t)}l6 1.5`).join("");
  return <svg className="hf-scene mx-satchel" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-s`} /><Glow id={`${uid}-g`} o={0.34} /><clipPath id={`${uid}-bag`}><path d={BAG} /></clipPath><clipPath id={`${uid}-cl`}><path d={CLOTH} /></clipPath>
      <linearGradient id={`${uid}-lg`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="currentColor" stopOpacity=".18" /><stop offset=".4" stopColor="currentColor" stopOpacity=".02" /><stop offset="1" stopColor="currentColor" stopOpacity=".26" /></linearGradient>
      <linearGradient id={`${uid}-cg`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--history)" stopOpacity=".04" /><stop offset="1" stopColor="var(--history)" stopOpacity=".14" /></linearGradient></defs>
    <Verse y={52} text="The LORD shall preserve thy going out and thy coming in" cite="PSALM 121:8" />
    <path className="mx-cloth" d={CLOTH} /><path d={CLOTH} fill={`url(#${uid}-cg)`} />
    <g clipPath={`url(#${uid}-cl)`}><path className="mx-weave" d={range(195, 318, 3.2).map((y, k) => `M${(k * 23) % 40} ${f(y)}H600`).join("")} /></g>
    <path className="mx-band" d="M67 199H533L554 310H46Z" /><path className="mx-band mx-band-thin" d="M73 204H527L548 305H52Z" /><path className="mx-fringe" d={fringe} />
    <path className="mx-strap-edge" d={strap} /><path className="mx-strap" d={strap} /><path className="mx-strap-stitch" d={strap} />
    <Satchel uid={uid} /><Workbook uid={uid} /><Letter uid={uid} /><Lantern uid={uid} />
    <path className="mx-glow" d={strap} pathLength={100} />
    {[[140, 0.36], [300, 0.5], [470, 0.64]].map(([x, t], k) => <circle key={x} className="mx-halo" style={{ ...tone(KINDS[k]), ...reach(t) }} cx={x} cy="306" r="10" />)}
    <Key x={140} from={300} k={0} name="LEARNING" detail="WORKBOOKS · LESSONS" note="MOSES · 8 SESSIONS" />
    <Key x={300} from={304} k={1} name="FELLOWSHIP" detail="FREE · NATIONAL" note="CHECKED OCT 2026" />
    <Key x={470} from={308} k={2} name="HELP FOR LIFE" detail="NATIONAL HOTLINES" note="MAPS IN 15 CITIES" />
    <text className="hf-caption" x="300" y="408" textAnchor="middle">PACKED FOR THE ROAD · A BOOK · A LETTER · A LIGHT</text>
  </svg>;
}

/* ---------- The Three Lancets: stained glass in a stone wall, a beam of sun crossing all three ---------- */

const LANCETS = [{ c: 148, w: 76, s: 190 }, { c: 300, w: 92, s: 176 }, { c: 452, w: 76, s: 190 }];
const SILL = 300, R3 = Math.sqrt(3) / 2;
/** A pointed (equilateral) arch on springing line s, grown outward by g. */
const arch = (c: number, w: number, s: number, g = 0) => { const l = c - w / 2 - g, r = c + w / 2 + g, rad = w + 2 * g;
  return `M${f(l)} ${SILL}V${s}A${rad} ${rad} 0 0 1 ${c} ${f(s - rad * R3)}A${rad} ${rad} 0 0 1 ${f(r)} ${s}V${SILL}Z`; };
/** The joints of the stone surround: radial voussoir joints round the head, level joints down both jambs. */
function joints(c: number, w: number, s: number) {
  const rad = w + 6, tick = (cx: number, a: number) => { const t = (a * Math.PI) / 180, x = cx + rad * Math.cos(t), y = s + rad * Math.sin(t); return `M${f(x)} ${f(y)}l${f(9 * Math.cos(t))} ${f(9 * Math.sin(t))}`; };
  return range(186, 240, 9).map((a) => tick(c + w / 2 + 3, a)).join("") + range(306, 360, 9).map((a) => tick(c - w / 2 - 3, a)).join("")
    + range(s + 10, SILL, 13).map((y) => `M${c - w / 2 - 12} ${y}h9M${c + w / 2 + 3} ${y}h9`).join("");
}
function Motif({ kind }: { kind: number }) {
  if (kind === 0) return <><path className="mx-rays" d={range(-150, -20, 20).map((a) => { const t = (a * Math.PI) / 180; return `M${f(10 * Math.cos(t))} ${f(-6 + 10 * Math.sin(t))}l${f(6 * Math.cos(t))} ${f(6 * Math.sin(t))}`; }).join("")} />
    <path className="mx-pane-light" d="M-15 -3Q-7.5 -7 0 -3V12Q-7.5 8 -15 12ZM0 -3Q7.5 -7 15 -3V12Q7.5 8 0 12Z" /><path className="mx-came-thin" d="M-12 1h9M-12 5h9M3 1h9M3 5h9M0 -3V12" /></>;
  if (kind === 1) return <><path className="mx-came-thin" d="M0 -20V-14" /><path className="mx-pane-light" d="M-5 -10L-3 -14H3L5 -10Z" />
    {[-11, -4, 4, 11].map((x, k) => <g key={x}><circle className="mx-pane-tone" cx={x} cy={k % 3 ? -3 : 0} r="3.4" /><path className="mx-pane-tone" d={`M${x - 5} 10Q${x} ${k % 3 ? 0 : 3} ${x + 5} 10Z`} /></g>)}
    <path className="mx-pane-light" d="M-16 8Q0 3 16 8V12Q0 16 -16 12Z" /><path className="mx-came-thin" d="M-12 12V18M12 12V18" /></>;
  return <><path className="mx-pane-tone" d="M-15 -4L0 -17L15 -4V14H-15Z" /><path className="mx-pane-light" d="M-6 14V2Q-6 -6 0 -6Q6 -6 6 2V14Z" /><path className="mx-came-thin" d="M-15 -4H15M-11 -1h4M7 -1h4" /><path className="mx-pane-light" d="M-6 14H6L11 19H-11Z" /></>;
}
export function LancetsScene() {
  const uid = useUid();
  const ashlar = range(106, SILL, 12).map((y, k) => `M80 ${y}H520` + range(80 + (k % 2) * 13, 520, 26).map((x) => `M${x} ${y}v12`).join("")).join("");
  return <svg className="hf-scene mx-lancets" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Glow id={`${uid}-g`} o={0.4} /><Shade id={`${uid}-s`} a={0.14} b={0.05} />
      <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="var(--accent)" stopOpacity="0" /><stop offset=".5" stopColor="var(--accent)" stopOpacity=".42" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
      {LANCETS.map((l, i) => <clipPath key={i} id={`${uid}-c${i}`}><path d={arch(l.c, l.w, l.s)} /></clipPath>)}
      <clipPath id={`${uid}-all`}>{LANCETS.map((l) => <path key={l.c} d={arch(l.c, l.w, l.s)} />)}</clipPath></defs>
    <Verse y={44} text="Ye are the light of the world." cite="MATTHEW 5:14" />
    <path className="mx-under" d="M80 100H520V300H80Z" transform="translate(5 5)" /><path className="mx-stone" d="M80 100H520V300H80Z" /><path d="M80 100H520V300H80Z" fill={`url(#${uid}-s)`} /><path className="mx-course" d={ashlar} />
    <path className="mx-stone" d="M72 92H528V102H72Z" /><path className="mx-rule" d="M72 98H528" />
    {[216, 384].map((x) => <g key={x}><circle className="mx-stone" cx={x} cy="140" r="14" /><circle className="mx-rule" cx={x} cy="140" r="10.5" />
      {[[0, -5], [5, 0], [0, 5], [-5, 0]].map(([dx, dy]) => <circle key={dx * 3 + dy} className="mx-oculus" cx={x + dx} cy={140 + dy} r="4.6" />)}</g>)}
    {LANCETS.map((l, i) => <g key={l.c} style={tone(KINDS[i])}>
      <path className="mx-stone" d={arch(l.c, l.w, l.s, 12)} /><path d={arch(l.c, l.w, l.s, 12)} fill={`url(#${uid}-s)`} /><path className="mx-mould" d={arch(l.c, l.w, l.s, 3)} /><path className="mx-joint" d={joints(l.c, l.w, l.s)} />
      <g className={`hf-layer-glass${i}`} clipPath={`url(#${uid}-c${i})`}>
        <path className="mx-glass" d={arch(l.c, l.w, l.s)} /><circle className="mx-glass-glow" cx={l.c} cy={l.s} r={l.w} fill={`url(#${uid}-g)`} />
        <path className="mx-quarry" d={hatch(l.c - l.w, 80, l.c + l.w, SILL, 9) + range(l.c - l.w - 230, l.c + l.w, 9).map((x) => `M${f(x)} 80l220 220`).join("")} />
        <path className="mx-came" d={arch(l.c, l.w - 12, l.s - 4)} /><path className="mx-came-thin" d={range(l.s + 6, SILL, 11).map((y) => `M${l.c - l.w / 2} ${y}h6M${l.c + l.w / 2 - 6} ${y}h6`).join("")} />
        <path className="mx-bar-iron" d={`M${l.c - l.w / 2 + 6} ${l.s + 52}h${l.w - 12}M${l.c - l.w / 2 + 6} ${l.s + 92}h${l.w - 12}`} />
        {[-6, 0, 6].map((dx) => <circle key={dx} className="mx-pane-light" cx={l.c + dx} cy={f(l.s - l.w * R3 + (dx ? 24 : 18))} r="3.4" />)}
        <g className="mx-medal"><circle className="mx-pane-light" cx={l.c} cy={l.s - 6 + (i === 1 ? 0 : 6)} r={l.w * 0.3 + 3} /><circle className="mx-came" cx={l.c} cy={l.s - 6 + (i === 1 ? 0 : 6)} r={l.w * 0.3 + 3} /><circle className="mx-came-thin" cx={l.c} cy={l.s - 6 + (i === 1 ? 0 : 6)} r={l.w * 0.3 - 1} />
          <g transform={`translate(${l.c} ${l.s - 6 + (i === 1 ? 0 : 6)}) scale(${f((l.w * 0.3) / 24 * 100) / 100})`}><Motif kind={i} /></g></g>
        <circle className="mx-pane-light" cx={l.c} cy={l.s + 72} r="13" /><circle className="mx-came" cx={l.c} cy={l.s + 72} r="13" /><Marker kind={i} x={l.c} y={l.s + 72} />
      </g>
      <path className="mx-came" d={arch(l.c, l.w, l.s)} />
      <ellipse className="mx-pool" style={delay(-i * 1.6)} cx={l.c} cy="319" rx={l.w / 2} ry="4" />
    </g>)}
    <g clipPath={`url(#${uid}-all)`}><g className="mx-beam"><path d="M-120 60h64v260h-64Z" fill={`url(#${uid}-b)`} transform="skewX(-14)" /></g></g>
    {LANCETS.map((l, i) => <circle key={l.c} className="mx-halo" style={{ ...tone(KINDS[i]), ...reach((l.c + 40) / 720) }} cx={l.c} cy={l.s - 6 + (i === 1 ? 0 : 6)} r={l.w * 0.42} />)}
    <path className="mx-stone" d="M68 300H532V307H68Z" /><path className="mx-rule" d="M64 311H536" />
    {[["LEARNING", "WORKBOOKS", "LESSONS"], ["FELLOWSHIP", "BIBLE STUDY", "PRAYER"], ["HELP FOR LIFE", "NATIONAL HOTLINES", "LOCAL CHARITIES"]].map(([name, ...lines], k) =>
      <g key={name} style={tone(KINDS[k])}><path className="mx-leader" d={`M${LANCETS[k].c} 313V326`} /><Dot x={LANCETS[k].c} y={329} />
        <text className="mx-label mx-lancet-tag" x={LANCETS[k].c} y="348" textAnchor="middle"><tspan className="mx-name">{name}</tspan>
          {lines.map((line) => <tspan key={line} className="mx-detail" x={LANCETS[k].c} dy="12">{line}</tspan>)}</text></g>)}
  </svg>;
}

/* ---------- The House of Three Rooms: a house cut open, a schoolroom, a table, a kitchen with the door ajar ---------- */

const ROOF = "M52 150L116 98H484L548 150Z";
const SECTIONS = "M70 150H530V158H70ZM70 158H82V298H70ZM518 158H530V298H518ZM218 158H226V232H218ZM374 158H382V232H374ZM62 298H538V306H62Z";
const spines = (x: number, base: number, n: number) => range(0, n, 1).map((k) => `M${f(x + k * 2.7)} ${base}v-${k % 7 === 3 ? 15 : 19 + (k % 2)}h2.1v${k % 7 === 3 ? 15 : 19 + (k % 2)}Z`).join("");
const PANTRY = [[396, 186], [408, 186], [420, 186], [432, 186]];
const MAP_PINS = range(0, 15, 1).map((k): Pt => [474 + (k % 5) * 8 + ((k * 3) % 4), 178 + Math.floor(k / 5) * 11 + ((k * 7) % 5)]);

function Bust({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return <><circle className="mx-fill" cx={x} cy={y} r={r} /><path className="mx-fill" d={`M${x - r * 1.7} ${y + r * 4}Q${x} ${y - r * 1.2} ${x + r * 1.7} ${y + r * 4}Z`} /></>;
}
function HouseScene() {
  const uid = useUid();
  const tiles = range(104, 150, 7).map((y, k) => `M40 ${y}H560` + range(60 + (k % 2) * 7, 560, 14).map((x) => `M${x} ${y}v-6`).join("")).join("");
  return <svg className="hf-scene mx-house" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-s`} /><Glow id={`${uid}-g`} o={0.36} /><clipPath id={`${uid}-r`}><path d={ROOF} /></clipPath><clipPath id={`${uid}-w`}><path d={SECTIONS} /></clipPath>
      <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--accent)" stopOpacity=".34" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
    <Verse y={46} text="Except the LORD build the house, they labour in vain that build it" cite="PSALM 127:1" />
    <path className="mx-under" d="M70 150H530V306H70Z" transform="translate(5 5)" />
    {[[82, 218], [226, 374], [382, 518]].map(([a, b], i) => <g key={a} style={tone(KINDS[i])}><path className="mx-room" d={`M${a} 158H${b}V298H${a}Z`} /><path d={`M${a} 158H${b}V298H${a}Z`} fill={`url(#${uid}-s)`} /></g>)}
    <g style={tone(KINDS[0])}>
      <path className="mx-paperwall" d={range(88, 218, 6).map((x) => `M${x} 160V296`).join("")} />
      <path className="mx-fill" d="M90 166H148V222H90Z" /><path className="mx-spine" d={spines(92, 194, 20) + spines(92, 220, 21)} /><path className="mx-band-line" d="M92 179h54M92 189h54M92 205h56M92 215h56" /><path className="mx-spine" d="M146 194l-6-17l2-.6l6 17Z" /><path className="mx-rule" d="M90 194H148" />
      <path className="mx-fill" d="M158 168H210V206H158Z" /><path className="mx-board" d="M161 171H207V203H161Z" /><text className="mx-chalk" x="184" y="184" textAnchor="middle">Moses</text><text className="mx-chalk mx-chalk-small" x="184" y="197" textAnchor="middle">40 · 40 · 40</text><path className="mx-rule" d="M156 208H212" />
      <Bust x={128} y={232} r={6.5} /><Bust x={178} y={240} r={4.8} />
      <path className="mx-fill" d="M108 256H198V261H108Z" /><path className="mx-rule" d="M114 261V298M192 261V298" /><path className="mx-page" d="M140 256Q147 251 153 254Q159 251 166 256Z" /><path className="mx-fill" d="M112 248h16v4h-16ZM113 252h15v4h-15Z" />
    </g>
    <g style={tone(KINDS[1])}>
      <path className="mx-dots" d={range(232, 372, 10).flatMap((x) => range(164, 296, 10).map((y) => `M${x} ${y}h.1`)).join("")} />
      <path className="mx-lightcone" d="M290 186L252 256H348L310 186Z" fill={`url(#${uid}-cone)`} />
      <path className="mx-fill" d="M236 170H268V212H236Z" /><path className="mx-pane" d="M239 173H265V209H239Z" /><path className="mx-rule" d="M252 173V209M239 191H265" /><path className="mx-curtain" d="M236 170Q244 186 238 212M268 170Q260 186 266 212" />
      <path className="mx-fill" d="M334 174H364V204H334Z" /><path className="mx-ink" d={rows(339, 182, 20, 4, 5.5)} />
      <path className="mx-rule" d="M300 158V176" /><path className="mx-brass" d="M288 186L294 176H306L312 186Z" /><path className="mx-flame mx-bulb" d="M296 186a4 3 0 0 0 8 0Z" />
      {[258, 284, 316, 342].map((x, k) => <g key={x} className="mx-person" style={delay(-k * 0.8)}><Bust x={x} y={k % 3 ? 234 : 238} /></g>)}
      <path className="mx-fill" d="M244 256H356V261H244Z" /><path className="mx-cloth-edge" d={range(244, 356, 8).map((x) => `M${x} 261q4 7 8 0`).join("")} /><path className="mx-rule" d="M252 268V298M348 268V298" />
      <path className="mx-page" d="M288 256Q294 251 300 254Q306 251 312 256Z" /><path className="mx-fill" d="M262 251h6v5h-6ZM332 251h6v5h-6Z" />
    </g>
    <g style={tone(KINDS[2])}>
      <path className="mx-tiles" d={range(240, 298, 8).map((y) => `M382 ${y}H518`).join("") + range(386, 518, 8).map((x) => `M${x} 240V298`).join("")} />
      <path className="mx-fill" d="M390 166H440V232H390Z" /><path className="mx-rule" d="M390 188H440M390 210H440" />
      {PANTRY.map(([x, y]) => <path key={x} className="mx-jar" d={`M${x - 4} ${y}v-12h8v12ZM${x - 3} ${y - 12}v-2h6v2`} />)}
      {[398, 414, 430].map((x) => <path key={x} className="mx-loaf" d={`M${x - 7} 209Q${x - 6} 199 ${x} 199Q${x + 6} 199 ${x + 7} 209Z M${x - 3} 201l-1 4M${x + 1} 200l-1 5`} />)}
      {[396, 404, 412, 424, 432].map((x, k) => <circle key={x} className="mx-jar" cx={x} cy={k % 2 ? 227 : 228} r="3.6" />)}
      <path className="mx-fill" d="M448 176h14v22h-14Z" /><circle className="mx-brass-ring" cx="452" cy="181" r="2.4" /><circle className="mx-brass-ring" cx="458" cy="181" r="2.4" /><path className="mx-fill" d="M444 188q-3 0-3 4v8q0 4 3 4h2v-16Z" />
      <path className="mx-rule" d="M445 204q2 2-1 4t1 4t-1 4t1 4" />
      <path className="mx-fill" d="M470 168H512V214H470Z" /><path className="mx-street" d="M470 180H512M470 192H512M470 204H512M480 168V214M494 168V214M504 168V214" /><path className="mx-avenue" d="M472 212L510 170" />
      {MAP_PINS.map(([x, y], k) => <path key={k} className="mx-pin mx-city" style={delay(k * 0.4)} d={pin(x, y)} />)}
      <path className="mx-doorway" d="M472 298V246Q472 232 488 232Q504 232 504 246V298Z" /><path className="mx-arch" d="M472 298V246Q472 232 488 232Q504 232 504 246V298" />
      <path className="mx-door" d="M472 244L483 250V302L472 298Z" /><path className="mx-spill" d="M474 298H504L516 304H466Z" />
      <path className="mx-fill" d="M392 272H452V276H392Z" /><path className="mx-rule" d="M396 276V298M448 276V298" />
      <path className="mx-basket" d="M400 272Q402 262 422 262Q442 262 444 272Z" /><path className="mx-rule" d="M406 264v8M414 263v9M422 262v10M430 263v9M438 264v8" /><path className="mx-loaf" d="M408 262Q410 254 418 254Q426 254 428 262Z" />
    </g>
    <path className="mx-section" d={SECTIONS} /><g clipPath={`url(#${uid}-w)`}><path className="mx-hatch" d={hatch(60, 150, 540, 306, 3)} /></g>
    <path className="mx-stones" d={range(62, 538, 24).map((x, k) => `M${x + 1} 307h${k % 2 ? 22 : 20}v10h-${k % 2 ? 22 : 20}Z`).join("")} /><path className="mx-ground" d="M28 318H572" />
    <path className="mx-grass" d={[...range(32, 60, 5), ...range(542, 570, 5)].map((x, k) => `M${x} 318l${k % 2 ? 1.5 : -1.5} -5`).join("")} />
    <g className="hf-layer-roof">
      <path className="mx-brick" d="M448 74h20v26h-20Z" /><path className="mx-rule" d="M448 82h20M448 90h20M458 74v8M454 82v8M462 90v8" /><path className="mx-brick" d="M444 70h28v5h-28Z" />
      {[0, 1, 2].map((k) => <path key={k} className="mx-smoke" style={delay(-k * 2.2)} d="M458 66c-6-3 4-6-2-10" />)}
      <path className="mx-under" d={ROOF} transform="translate(4 3)" /><path className="mx-roof" d={ROOF} /><g clipPath={`url(#${uid}-r)`}><path className="mx-tile" d={tiles} /></g><path className="mx-ridge" d="M116 98H484M52 150H548" />
    </g>
    <path className="mx-trail" d="M90 291H510" /><path className="mx-glow" d="M90 291H510" pathLength={100} />
    {[150, 300, 450].map((x, k) => <circle key={x} className="mx-halo" style={{ ...tone(KINDS[k]), ...reach((x - 90) / 420) }} cx={x} cy="291" r="10" />)}
    <Key x={150} from={320} k={0} name="LEARNING" detail="WORKBOOKS · LESSONS" note="LITTLE ONES TO LEADERS" />
    <Key x={300} from={320} k={1} name="FELLOWSHIP" detail="FREE · NATIONAL" note="STUDY · PRAYER" />
    <Key x={450} from={320} k={2} name="HELP FOR LIFE" detail="NATIONAL HOTLINES" note="CRISIS · FOOD · GRIEF" />
    <text className="hf-caption" x="300" y="408" textAnchor="middle">THREE ROOMS · ONE HOUSE · DOORS LEFT OPEN</text>
  </svg>;
}

/* ---------- The Tree of Three Branches: a botanical plate, each branch's specimen ringed and numbered ---------- */

type Bez = [Pt, Pt, Pt, Pt];
const BRANCHES: Bez[] = [[[300, 224], [272, 206], [240, 190], [208, 182]], [[300, 222], [298, 196], [302, 172], [300, 158]], [[300, 224], [328, 206], [360, 190], [392, 182]]];
const LENSES: Pt[] = [[186, 176], [300, 134], [414, 176]];
const bez = ([a, b, c, d]: Bez, t: number): Pt => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
const half = ([a, b, c, d]: Bez): Bez => { const m = (p: Pt, q: Pt, w = 0.5): Pt => [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w], ab = m(a, b), bc = m(b, c), abc = m(ab, bc); return [a, ab, abc, m(abc, m(bc, m(c, d)))]; };
/** A side twig leaving the branch at share t, turned off it by `turn` radians, `len` long. */
const twig = (b: Bez, t: number, turn: number, len: number): Bez => { const [x, y] = bez(b, t), [x2, y2] = bez(b, t + 0.01), a = Math.atan2(y2 - y, x2 - x) + turn, a2 = a - turn * 0.4;
  return [[x, y], [x + Math.cos(a) * len * 0.4, y + Math.sin(a) * len * 0.4], [x + Math.cos(a2) * len * 0.75, y + Math.sin(a2) * len * 0.75], [x + Math.cos(a2) * len, y + Math.sin(a2) * len]]; };
const TWIGS = [[0.3, -0.7, 30], [0.55, 0.75, 26], [0.75, -0.8, 22]];
const bd = (b: Bez) => `M${f(b[0][0])} ${f(b[0][1])}C${b.slice(1).map((p) => `${f(p[0])} ${f(p[1])}`).join(" ")}`;
/** Leaves set alternately along a branch, each with its midrib, turned off the branch by 55 degrees. */
function leaves(b: Bez, from: number) {
  return range(from, 0.95, 0.075).map((t, k) => { const [x, y] = bez(b, t), [x2, y2] = bez(b, t + 0.01), a = Math.atan2(y2 - y, x2 - x) + (k % 2 ? 1 : -1) * 0.95, c = Math.cos(a), s = Math.sin(a), L = 12 - t * 3;
    const tip = [x + c * L, y + s * L], n = [-s * 3.2, c * 3.2], m = [x + c * L * 0.5, y + s * L * 0.5];
    return { leaf: `M${f(x)} ${f(y)}Q${f(m[0] + n[0])} ${f(m[1] + n[1])} ${f(tip[0])} ${f(tip[1])}Q${f(m[0] - n[0])} ${f(m[1] - n[1])} ${f(x)} ${f(y)}Z`, rib: `M${f(x)} ${f(y)}L${f(tip[0])} ${f(tip[1])}` }; });
}
function Specimen({ kind }: { kind: number }) {
  if (kind === 0) return <><path className="mx-stem" d="M0 16V6" /><path className="mx-leafy" d="M0 8C-6 1-18 0-19-9C-10-12-3-7 0-1ZM0 8C6 1 18 0 19-9C10-12 3-7 0-1Z" />
    <path className="mx-vein" d="M0 8V-1M-3 4l-12-6M-4 1l-11-5M-4-2l-8-4M3 4l12-6M4 1l11-5M4-2l8-4" /></>;
  if (kind === 1) return <><path className="mx-stem" d="M0-18V-9M0-14q8-4 12 1q2 4-2 5" /><path className="mx-leafy" d="M0-15Q-10-22-17-13Q-9-9 0-15Z" />
    {[[-7.5, -6], [0, -6], [7.5, -6], [-4, 0], [4, 0], [-7.5, 6], [0, 6], [7.5, 6], [-4, 12], [4, 12], [0, 17]].map(([x, y]) => <circle key={`${x}${y}`} className="mx-berry" cx={x} cy={y} r="3.6" />)}</>;
  return <><path className="mx-stem" d="M-14 16Q0 4 12-14" /><path className="mx-leafy" d={[[-8, 9, -1], [-1, 2, 1], [5, -6, -1], [-4, 6, 1], [3, -2, -1]].map(([x, y, side]) => `M${x} ${y}q${side * 10} -2 ${side * 13} -10q${side * -9} 0 ${side * -13} 10Z`).join("")} />
    <circle className="mx-berry" cx="12" cy="-14" r="5.5" /><path className="mx-vein" d="M9-19l1.5 2l1.5-3l1.5 3l1.5-2" /></>;
}
function TreeScene() {
  const uid = useUid(), arc = smooth([LENSES[0], [232, 140], LENSES[1], [368, 140], LENSES[2]]);
  const trunk = "M284 304C291 282 292 248 292 226Q300 218 308 226C308 248 309 282 316 304Z";
  const river = range(0, 3, 1).map((k) => `M52 ${314 + k * 4.5}` + range(0, 31, 1).map((j) => `q8 ${j % 2 ? 2 : -2} 16 0`).join("")).join("");
  const slip = (x: number, leafX: number, title: string, a: string, b: string, fig: string) => <g className={`hf-layer-slip${x < 300 ? "l" : "r"}`}>
    <Sheet d={`M${x} 234h144v64h-144Z`} shade={`${uid}-s`} /><path className="mx-rule" d={`M${x + 4} 238h136v56h-136Z`} />
    <path className="mx-leafy" d={`M${leafX} 290C${leafX - 12} 276 ${leafX - 13} 254 ${leafX} 242C${leafX + 13} 254 ${leafX + 12} 276 ${leafX} 290Z`} />
    <path className="mx-vein" d={`M${leafX} 290V244` + range(250, 286, 6).map((y) => `M${leafX} ${y}l-7 -5M${leafX} ${y}l7 -5`).join("")} />
    <text className="mx-fig" x={leafX < x + 72 ? x + 136 : x + 8} y="248" textAnchor={leafX < x + 72 ? "end" : "start"}>{fig}</text><text className="mx-vtitle" x={x + (leafX < x + 72 ? 90 : 56)} y="258" textAnchor="middle">{title}</text>
    <path className="mx-rule" d={`M${x + (leafX < x + 72 ? 50 : 16)} 264h76`} /><text className="mx-label mx-detail" x={x + (leafX < x + 72 ? 90 : 56)} y="276" textAnchor="middle">{a}</text><text className="mx-label" x={x + (leafX < x + 72 ? 90 : 56)} y="287" textAnchor="middle">{b}</text>
  </g>;
  return <svg className="hf-scene mx-plate" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Shade id={`${uid}-s`} a={0.1} b={0.04} /><Glow id={`${uid}-g`} o={0.22} /><clipPath id={`${uid}-t`}><path d={trunk} /></clipPath></defs>
    <Verse y={50} text="The leaves of the tree were for the healing of the nations." cite="REVELATION 22:2" />
    <path className="mx-under" d="M40 82H560V328H40Z" transform="translate(5 5)" /><path className="mx-plate-paper" d="M40 82H560V328H40Z" /><path d="M40 82H560V328H40Z" fill={`url(#${uid}-s)`} />
    <path className="mx-frame" d="M46 88H554V322H46Z" /><path className="mx-rule" d="M50 92H550V318H50Z" />
    <text className="mx-label mx-name" x="58" y="105">PLATE III</text><text className="mx-label" x="542" y="105" textAnchor="end">OCT · MMXXVI</text>
    <circle cx="300" cy="190" r="130" fill={`url(#${uid}-g)`} className="mx-sunlit" />
    <path className="mx-river" d={river} />
    <g className="hf-layer-tree">
      <path className="mx-root" d="M296 302C280 307 262 309 244 315M298 303C290 310 278 313 266 317M302 303C310 310 322 313 334 317M304 302C320 307 338 309 356 315M300 304V317M270 309l-8 2M330 309l8 2" />
      <path className="mx-ground" d="M196 302H404" /><path className="mx-soil" d={range(204, 400, 6).map((x, k) => `M${x} 305l-2 ${k % 2 ? 3 : 2}`).join("")} />
      {BRANCHES.map((b, i) => { const twigs = TWIGS.map(([t, turn, len]) => twig(b, t, (i === 1 ? (t > 0.5 ? 1 : -1) : i ? -1 : 1) * turn, len)), ls = [...leaves(b, 0.12), ...twigs.flatMap((w) => leaves(w, 0.25))];
        return <g key={i} className="mx-bough" style={{ ...tone(KINDS[i]), ...delay(-i * 2.4) }}>
          <path className="mx-branch-edge mx-thick" d={bd(half(b))} /><path className="mx-branch-edge" d={bd(b) + twigs.map(bd).join("")} /><path className="mx-branch mx-thick" d={bd(half(b))} /><path className="mx-branch" d={bd(b) + twigs.map(bd).join("")} />
          {ls.map((l, k) => <g key={k}><path className="mx-leafy" d={l.leaf} /><path className="mx-vein" d={l.rib} /></g>)}
        </g>; })}
      <path className="mx-bark" d={trunk} /><g clipPath={`url(#${uid}-t)`}><path className="mx-hatch" d={range(284, 318, 2.6).map((x, k) => `M${f(x)} 304C${f(x + (k % 3) - 1)} 280 ${f(x - (k % 2))} 250 ${f(x)} 220`).join("")} /></g>
      <path className="mx-rule" d="M296 262q3 4 0 8M305 244q-3 4 0 8" />
    </g>
    <path className="mx-trail" d={arc} /><path className="mx-glow" d={arc} pathLength={100} />
    {LENSES.map(([x, y], i) => <g key={x} style={tone(KINDS[i])}>
      <circle className="mx-halo" style={reach(i / 2)} cx={x} cy={y} r="32" />
      <g className="mx-lens"><circle className="mx-under" cx={x + 2} cy={y + 3} r="25" /><circle className="mx-lens-face" cx={x} cy={y} r="25" /><circle className="mx-lens-ring" cx={x} cy={y} r="21.5" />
        <g transform={`translate(${x} ${y})`}><Specimen kind={i} /></g></g>
      <text className="mx-fig" x={i === 1 ? x : i ? x + 31 : x - 31} y={i === 1 ? y - 31 : y - 16} textAnchor={i === 1 ? "middle" : i ? "start" : "end"}>{`Fig. ${i + 1}`}</text>
    </g>)}
    <g style={tone(KINDS[0])}>{slip(56, 78, "Moses: three forties", "8 SESSIONS", "42 PAGES", "Fig. 1a")}</g>
    <g style={tone(KINDS[2])}>{slip(400, 522, "Close to home", "15 CITIES", "MIAMI · DALLAS", "Fig. 3a")}</g>
    {[[128, "FIG. 1 · LEARNING", "WORKBOOKS · LESSONS", "7 READERS · 41 TITLES"], [300, "FIG. 2 · FELLOWSHIP", "FREE · NATIONAL", "STUDY · PRAYER · CHURCH"], [472, "FIG. 3 · HELP FOR LIFE", "NATIONAL HOTLINES", "CRISIS · FOOD · GRIEF"]].map(([x, name, detail, note], k) =>
      <g key={k} style={tone(KINDS[k])}><Tag x={x as number} y={349} name={name as string} detail={detail as string} note={note as string} /></g>)}
    <text className="hf-caption" x="300" y="408" textAnchor="middle">THREE BRANCHES · ONE ROOT · GATHERED OCTOBER 2026</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The Pilgrim's Satchel", note: "An engraved leather haversack opened on a woven cloth with its contents laid out: the workbook Moses: three forties on a stack of others, a sealed letter of introduction to the brethren, and a lantern beside a fan of city maps, a light running the length of the shoulder strap under Psalm 121:8; on hover the bag lifts, the letter slides out and the maps fan wider.", Scene: SatchelScene },
  { name: "The Three Lancets", note: "Three pointed stained-glass windows in a coursed stone wall, each leaded in diamond panes around a medallion (an open book, friends at a lamplit table, a lit doorway) with a ribbon and a roundel, a beam of sun crossing all three and pooling coloured light on the floor under Matthew 5:14; on hover the glass brightens and the medallions swell.", Scene: LancetsScene },
  { name: "The House of Three Rooms", note: "A house drawn in section with its front cut away: a schoolroom with forty-one spines, a chalkboard and a little one beside a leader; a lamplit table of friends; a kitchen with a pantry of bread, a wall telephone, a pinned map of fifteen cities and a door ajar, one light walking the floor through all three under Psalm 127:1; on hover the roof lifts and the door opens wider.", Scene: HouseScene },
  { name: "The Tree of Three Branches", note: "A botanical plate of one tree by a river, its three branches each ending in a ringed and numbered specimen (book-shaped leaves, a cluster of grapes, healing leaves with a fruit) with two pressed-leaf slips for Moses: three forties and fifteen cities, a light arcing from figure to figure under Revelation 22:2; on hover the branches lift and the specimens swell.", Scene: TreeScene },
];
