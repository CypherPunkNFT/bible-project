// Three proposals for the top drawing of the homepage Resources section, each a map folded in three panels (learning,
// fellowship, help for life) with one trail through all three: an engraved surveyor's sheet with compass rose, cartouche
// and legend; a traveller's map half-opened on a lamplit table; and a folding map whose panels each frame a small scene.
// Motion rules in overview-mockups.css.
import { useId, type CSSProperties } from "react";
import type { Mockup } from "./types";
import "./overview-mockups.css";

type Pt = [number, number];
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;
const tone = (name: string) => ({ color: `var(--${name})` }) as CSSProperties;
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const f = (n: number) => Math.round(n * 10) / 10;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.ceil((to - from) / step)) }, (_, k) => from + k * step);
/** One path of ruled lines: n rows from (x, y), `gap` apart, a little ragged at the line ends. */
const rows = (x: number, y: number, w: number, n: number, gap: number) => range(0, n, 1).map((i) => `M${x} ${y + i * gap}h${f(w - ((i * 5) % 4) * (w / 14))}`).join("");
/** A smooth path through the points (Catmull-Rom curves). */
const smooth = (p: Pt[]) => p.slice(1).reduce((d, b, i) => { const a = p[i], prev = p[i - 1] ?? a, next = p[i + 2] ?? b;
  return `${d}C${f(a[0] + (b[0] - prev[0]) / 6)} ${f(a[1] + (b[1] - prev[1]) / 6)} ${f(b[0] - (next[0] - a[0]) / 6)} ${f(b[1] - (next[1] - a[1]) / 6)} ${f(b[0])} ${f(b[1])}`; }, `M${f(p[0][0])} ${f(p[0][1])}`);
/** How far along the trail (0 to 1) point `index` sits, by chord length, so a waypoint brightens as the light reaches it. */
const share = (p: Pt[], index: number) => { const seg = p.slice(1).map((b, i) => Math.hypot(b[0] - p[i][0], b[1] - p[i][1]));
  return seg.slice(0, index).reduce((s, v) => s + v, 0) / seg.reduce((s, v) => s + v, 0); };
const reach = (t: number, seconds: number) => delay(t * seconds - seconds - 0.5);

/** Paper shading across a panel: opacity a at the left edge, b at the right, as a fold catches or loses the light. */
function Fold({ id, a, b, mid = 0.02 }: { id: string; a: number; b: number; mid?: number }) {
  return <linearGradient id={id} x1="0" y1="0" x2="1" y2=".15">
    <stop stopColor="currentColor" stopOpacity={a} /><stop offset=".5" stopColor="currentColor" stopOpacity={mid} /><stop offset="1" stopColor="currentColor" stopOpacity={b} />
  </linearGradient>;
}
function Tag({ x, y, name, detail, note, anchor = "middle" }: { x: number; y: number; name: string; detail: string; note?: string; anchor?: "start" | "middle" | "end" }) {
  return <text className="mo-label" x={x} y={y} textAnchor={anchor}>
    <tspan className="mo-name">{name}</tspan><tspan className="mo-detail" x={x} dy="12.5">{detail}</tspan>{note && <tspan x={x} dy="12">{note}</tspan>}
  </text>;
}
const Dot = ({ x, y, r = 2.4 }: { x: number; y: number; r?: number }) => <circle className="mo-dot" cx={x} cy={y} r={r} />;
function Verse({ y, text, cite }: { y: number; text: string; cite: string }) {
  return <g className="hf-layer-verse"><text className="mo-verse" x="300" y={y} textAnchor="middle">“{text}”</text><text className="mo-ref" x="300" y={y + 19} textAnchor="middle">{cite}</text></g>;
}
/** The three kinds' map symbols: a book, a gathering ring, a pin. */
function Marker({ kind, x, y }: { kind: number; x: number; y: number }) {
  if (kind === 0) return <path className="mo-mark" d={`M${x - 5} ${y - 3.5}h10v7h-10ZM${x} ${y - 3.5}v7`} />;
  if (kind === 1) return <><circle className="mo-mark" cx={x} cy={y} r="4" /><circle className="mo-mark-dot" cx={x} cy={y} r="1.3" /></>;
  return <path className="mo-mark" d={`M${x} ${y + 5}c-3.4-4-4.4-5.6-4.4-7.2a4.4 4.4 0 0 1 8.8 0c0 1.6-1 3.2-4.4 7.2Z`} />;
}
const pin = (x: number, y: number) => `M${f(x)} ${f(y)}c-2.4-3-3-4.4-3-5.4a3 3 0 0 1 6 0c0 1-.6 2.4-3 5.4Z`;
const KINDS = ["epistles", "gospels", "resource-life"];

/* ---------- The Surveyor's Map: an engraved sheet, compass rose, cartouche, legend, contours ---------- */

const SX = [92, 231, 369, 508], ST = 92, SB = 318, IN = 7;
const SURVEY: Pt[] = [[99, 258], [161, 226], [252, 214], [300, 196], [392, 236], [439, 232], [501, 206]];
const STOPS = [
  { at: 1, name: "LEARNING", detail: "WORKBOOKS · LESSONS", note: "FOR 7 READERS" },
  { at: 3, name: "FELLOWSHIP", detail: "FREE · NATIONAL", note: "STUDY · PRAYER" },
  { at: 5, name: "HELP FOR LIFE", detail: "NATIONAL HOTLINES", note: "MAPS IN 15 CITIES" },
];
const TOWNS: Pt[] = [[386, 180], [404, 172], [420, 190], [462, 176], [478, 194], [392, 206], [488, 248], [384, 258], [404, 268], [466, 256], [392, 288], [410, 300], [452, 304], [424, 210], [470, 166]];
const TREES: Pt[] = [[110, 290], [122, 300], [136, 292], [188, 292], [202, 300], [214, 288], [120, 276]];
const MOUNTS = [[192, 160, 1.2], [172, 168, 0.9], [214, 168, 1], [182, 184, 0.75], [204, 186, 0.8]];
const FIELDS = [[104, 176, 22, 16, -6], [130, 180, 18, 22, 4], [106, 198, 20, 14, 8]];
const LANES = [[0, 1], [1, 2], [2, 13], [13, 5], [3, 4], [4, 14], [7, 8], [8, 11], [11, 10], [9, 6], [12, 11]];
const HOUSES: Pt[] = [[328, 262], [344, 256], [336, 278], [354, 274]];

/** The piano-key border: alternate bars between the paper edge and the neatline, in step across all three panels. */
function keys(i: number) {
  const a = Math.max(SX[i], SX[0] + IN), b = Math.min(SX[i + 1], SX[3] - IN);
  const side = i === 0 ? SX[0] : i === 2 ? SX[3] - IN : -1;
  return range(99, 501, 12).filter((x) => x >= a && x + 6 <= b).map((x) => `M${x} ${ST}h6v${IN}h-6ZM${x} ${SB - IN}h6v${IN}h-6Z`).join("")
    + (side < 0 ? "" : range(99, 311, 12).map((y) => `M${side} ${y}h${IN}v6h-${IN}Z`).join(""));
}
function Rose({ x, y }: { x: number; y: number }) {
  const rad = (a: number) => (a * Math.PI) / 180, px = (a: number, r: number) => `${f(x + r * Math.sin(rad(a)))} ${f(y - r * Math.cos(rad(a)))}`;
  const ticks = range(0, 360, 10).map((a) => `M${px(a, a % 90 ? 18.5 : 16.5)}L${px(a, 21)}`).join("");
  const half = (side: number) => range(0, 360, 45).map((a) => `M${x} ${y}L${px(a, a % 90 ? 11 : 18)}L${px(a + side * 45, a % 90 ? 2.2 : 3.8)}Z`).join("");
  return <g className="mo-rose-wrap"><circle className="mo-rose-ring" cx={x} cy={y} r="21" /><circle className="mo-rose-ring mo-rose-dash" cx={x} cy={y} r="14" /><path className="mo-rose-tick" d={ticks} />
    <g className="mo-rose"><path className="mo-rose-light" d={half(1)} /><path className="mo-rose-dark" d={half(-1)} /></g><circle className="mo-dot" cx={x} cy={y} r="1.6" />
    <text className="mo-label mo-name" x={x} y={y - 25} textAnchor="middle">N</text></g>;
}
function Hill({ x, y, rx, ry, n, rot }: { x: number; y: number; rx: number; ry: number; n: number; rot: number }) {
  const hachure = range(0, 360, 15).map((a) => { const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t); return `M${f(x + rx * c)} ${f(y + ry * s)}l${f(c * 4)} ${f(s * 4)}`; }).join("");
  return <g transform={`rotate(${rot} ${x} ${y})`}>{range(0, n, 1).map((k) => <ellipse key={k} className="mo-contour" cx={x} cy={y} rx={f(rx * (1 - k / n))} ry={f(ry * (1 - k / n))} />)}<path className="mo-hachure" d={hachure} /></g>;
}
function SurveyDetail({ i }: { i: number }) {
  if (i === 0) return <><Rose x={130} y={138} />
    {MOUNTS.map(([x, y, m]) => <g key={x + y}><path className="mo-mount" d={`M${f(x - 11 * m)} ${y}Q${f(x - 4 * m)} ${f(y - 13 * m)} ${x} ${f(y - 16 * m)}Q${f(x + 4 * m)} ${f(y - 13 * m)} ${f(x + 11 * m)} ${y}`} />
      <path className="mo-hachure" d={range(1, 5, 1).map((k) => `M${f(x + k * 2.2 * m)} ${f(y - (15 - k * 3.2) * m)}L${f(x + k * 1.4 * m)} ${y - 1}`).join("")} /></g>)}
    {FIELDS.map(([x, y, w, h, a], k) => <g key={k} transform={`rotate(${a} ${x + w / 2} ${y + h / 2})`}><rect className="mo-field" x={x} y={y} width={w} height={h} />
      <path className="mo-hachure" d={k % 2 ? range(x + 2.5, x + w - 1, 3).map((v) => `M${v} ${y + 1.5}v${h - 3}`).join("") : range(y + 2.5, y + h - 1, 3).map((v) => `M${x + 1.5} ${v}h${w - 3}`).join("")} /></g>)}
    <path className="mo-tree" d={TREES.map(([x, y]) => `M${x} ${y}v-4`).join("")} />{TREES.map(([x, y]) => <circle key={x + y} className="mo-tree-top" cx={x} cy={y - 7} r="3.2" />)}</>;
  if (i === 1) { const lake = [262, 270], water = range(-9, 10, 2.5).map((dy) => { const w = 22 * Math.sqrt(1 - (dy / 12) ** 2) - 4; return `M${f(lake[0] - w)} ${lake[1] + dy}h${f(2 * w)}`; }).join("");
    return <><path className="mo-cartouche" d="M246 108H354Q362 108 362 116V138Q362 146 354 146H246Q238 146 238 138V116Q238 108 246 108Z" />
      <path className="mo-curl" d="M238 116q-8 0-8 6t6 4M362 116q8 0 8 6t-6 4M238 138q-8 0-8-6M362 138q8 0 8-6" /><path className="mo-rule" d="M244 113H356M244 141H356" />
      <text className="mo-cart-title" x="300" y="127" textAnchor="middle">A Map of Resources</text><text className="mo-label mo-detail" x="300" y="138" textAnchor="middle">CHECKED OCT 2026</text>
      <path className="mo-river" d="M236 150C254 176 236 214 254 258" /><path className="mo-river-core" d="M236 150C254 176 236 214 254 258" />
      {[0, 3, 6, 9, 12].map((g) => <ellipse key={g} className="mo-shore" cx={lake[0]} cy={lake[1]} rx={22 + g} ry={12 + g * 0.7} />)}<path className="mo-water" d={water} />
      {HOUSES.map(([x, y]) => <path key={x} className="mo-house" d={`M${x - 4} ${y}h8v-6l-4-4l-4 4Z`} />)}<path className="mo-rule" d="M346 296v-12m-3 3h6" /><path className="mo-keys" d="M312 162h8v3h-8ZM328 162h8v3h-8ZM344 162h8v3h-8Z" /><path className="mo-neat" d="M312 162h40v3h-40ZM312 158v4M332 158v4M352 158v4" /><path className="mo-house" d="M342 304h8v-8h-8Z" /></>; }
  return <><rect className="mo-legend" x="384" y="106" width="112" height="50" rx="2" /><rect className="mo-legend-inner" x="387.5" y="109.5" width="105" height="43" rx="1" />
    {STOPS.map((s, k) => <g key={s.name} style={tone(KINDS[k])}><Marker kind={k} x={397} y={121 + k * 13} /><text className="mo-label mo-name" x="408" y={124 + k * 13}>{s.name}</text></g>)}
    <path className="mo-lane" d={LANES.map(([a, b]) => `M${TOWNS[a][0]} ${TOWNS[a][1]}L${TOWNS[b][0]} ${TOWNS[b][1]}`).join("")} />
    {TOWNS.map(([x, y], k) => <circle key={k} className="mo-town" style={delay(k * 0.4)} cx={x} cy={y} r="2" />)}<Hill x={478} y={288} rx={16} ry={10} n={3} rot={8} /></>;
}
function SurveyScene() {
  const uid = useUid(), trail = smooth(SURVEY), shades = [[0.03, 0.16], [0.14, 0.05], [0.12, 0.04]];
  return <svg className="hf-scene mo-survey" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs>{shades.map(([a, b], i) => <Fold key={i} id={`${uid}-f${i}`} a={a} b={b} />)}</defs>
    <Verse y={52} text="This is the way, walk ye in it" cite="ISAIAH 30:21" />
    <path className="mo-under" d={`M${SX[0]} ${ST}H${SX[3]}V${SB}H${SX[0]}Z`} transform="translate(5 5)" />
    {[0, 1, 2].map((i) => { const a = Math.max(SX[i], SX[0] + IN), b = Math.min(SX[i + 1], SX[3] - IN), box = `M${SX[i]} ${ST}H${SX[i + 1]}V${SB}H${SX[i]}Z`;
      return <g key={i} className={`hf-layer-p${i}`}>
        <path className="mo-paper" d={box} /><path d={box} fill={`url(#${uid}-f${i})`} />
        <path className="mo-grat" d={range(122, 500, 46).filter((x) => x > a + 4 && x < b - 4).map((x) => `M${x} ${ST + IN}V${SB - IN}`).join("") + [134, 176, 218, 260].map((y) => `M${a} ${y}H${b}`).join("")} />
        <path className="mo-keys" d={keys(i)} /><path className="mo-neat" d={`M${a} ${ST + IN}H${b}M${a} ${SB - IN}H${b}${i === 0 ? `M${a} ${ST + IN}V${SB - IN}` : ""}${i === 2 ? `M${b} ${ST + IN}V${SB - IN}` : ""}`} />
        <SurveyDetail i={i} />
      </g>; })}
    <path className="mo-trail" d={trail} /><path className="mo-glow" d={trail} pathLength={100} />
    {STOPS.map((s, k) => { const [x, y] = SURVEY[s.at]; return <g key={s.name} style={tone(KINDS[k])}>
      <circle className="mo-halo" style={reach(share(SURVEY, s.at), 16)} cx={x} cy={y} r="11" /><Marker kind={k} x={x} y={y} />
      <path className="mo-leader" d={`M${x} ${y + 8}V328`} /><Dot x={x} y={331} /><Tag x={x} y={347} {...s} /></g>; })}
    <text className="hf-caption" x="300" y="408" textAnchor="middle">THREE COUNTRIES · ONE ROAD · SURVEYED OCTOBER 2026</text>
  </svg>;
}

/* ---------- The Lamplit Map: a traveller's map half-opened on a table, lamplight walking the road ---------- */

/** Each panel as four corners: top-left, top-right, bottom-right, bottom-left. The right panel is still lifting open. */
const QUADS: Pt[][] = [[[150, 176], [250, 176], [233, 322], [100, 322]], [[250, 176], [350, 176], [367, 322], [233, 322]], [[350, 176], [430, 152], [462, 298], [367, 322]]];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const at = (q: Pt[], u: number, v: number) => lerp(lerp(q[0], q[1], u), lerp(q[3], q[2], u), v);
const quad = (q: Pt[]) => `M${q.map((p) => p.join(" ")).join("L")}Z`;
const grid = (q: Pt[], n: number) => range(1, n, 1).map((k) => { const t = k / n, a = at(q, t, 0), b = at(q, t, 1), c = at(q, 0, t), d = at(q, 1, t);
  return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}`; }).join("");
const ring = (q: Pt[], u: number, v: number, ru: number, rv: number) => `${range(0, 360, 15).map((a, k) => { const t = (a * Math.PI) / 180, w = 1 + 0.12 * Math.sin(3 * t + ru * 40), p = at(q, u + ru * w * Math.cos(t), v + rv * w * Math.sin(t)); return `${k ? "L" : "M"}${f(p[0])} ${f(p[1])}`; }).join("")}Z`;
const ROAD = ([[0, 0.08, 0.6], [0, 0.4, 0.84], [0, 0.66, 0.26], [1, 0, 0.5], [1, 0.32, 0.72], [1, 0.68, 0.22], [2, 0, 0.42], [2, 0.42, 0.3], [2, 0.55, 0.74], [2, 0.94, 0.6]] as const).map(([p, u, v]) => at(QUADS[p], u, v));
const WAYS = [
  { at: 2, tx: 150, ty: 110, name: "LEARNING", detail: "WORKBOOKS · LESSONS", note: "FOR 7 READERS", kind: 0 },
  { at: 5, tx: 300, ty: 110, name: "FELLOWSHIP", detail: "FREE · NATIONAL", note: "CHECKED OCT 2026", kind: 1 },
  { at: 7, tx: 450, ty: 110, name: "HELP FOR LIFE", detail: "NATIONAL HOTLINES", note: "CRISIS · FOOD · GRIEF", kind: 2 },
  { at: 1, tx: 150, ty: 366, name: "MOSES: THREE FORTIES", detail: "8 SESSIONS · 42 PAGES", kind: 0 },
  { at: 4, tx: 300, ty: 366, name: "BIBLE STUDY · PRAYER", detail: "STUDENTS · CHURCHES", kind: 1 },
  { at: 8, tx: 450, ty: 366, name: "LOCAL MAPS · 15 CITIES", detail: "MIAMI · ATLANTA · DALLAS", kind: 2 },
];
const RIVER = ([[0, 0.48, 0], [0, 0.6, 0.45], [0, 1, 0.7], [1, 0.22, 0.9], [1, 0.3, 1]] as const).map(([p, u, v]) => at(QUADS[p], u, v));
const VILLAGE: Pt[] = [[0.62, 0.62], [0.76, 0.56], [0.68, 0.76], [0.84, 0.7], [0.78, 0.88]];
const CITY_UV = range(0, 16, 1).map((k): Pt => [0.14 + (k % 4) * 0.22 + ((k * 7) % 5) * 0.012, 0.46 + Math.floor(k / 4) * 0.15 + ((k * 3) % 5) * 0.01]).filter((_, k) => k !== 10);

const TABLE = "M44 158H556Q562 158 564 164L594 338H6L36 164Q38 158 44 158Z";

function LampScene() {
  const uid = useUid(), road = smooth(ROAD), [p0, p1, p2] = QUADS, river = smooth(RIVER);
  return <svg className="hf-scene mo-lamplit" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Fold id={`${uid}-a`} a={0.02} b={0.15} /><Fold id={`${uid}-b`} a={0.16} b={0.05} /><Fold id={`${uid}-c`} a={0.3} b={0.12} mid={0.2} />
      <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".14" /><stop offset="1" stopColor="currentColor" stopOpacity=".03" /></linearGradient>
      <radialGradient id={`${uid}-l`}><stop stopColor="var(--accent)" stopOpacity=".22" /><stop offset=".45" stopColor="var(--accent)" stopOpacity=".12" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient><clipPath id={`${uid}-k`}><path d={TABLE} /></clipPath></defs>
    <Verse y={52} text="Thy word is a lamp unto my feet, and a light unto my path." cite="PSALM 119:105" />
    <path className="mo-table" d={TABLE} /><path d={TABLE} fill={`url(#${uid}-t)`} />
    <g clipPath={`url(#${uid}-k)`}><path className="mo-grain" d={range(164, 338, 5).map((y, k) => `M${(k * 37) % 70} ${y}C150 ${y - 1.6 + (k % 3)} 320 ${y + 1.8 - (k % 2)} 600 ${y - 0.6}`).join("")} />
      <ellipse className="mo-pool" cx="80" cy="304" rx="120" ry="40" fill={`url(#${uid}-l)`} /></g>
    <path className="mo-table-edge" d="M6 338H594V346Q594 349 590 349H10Q6 349 6 346Z" />
    <path className="mo-cast" d="M350 176L456 184L502 322H367Z" />
    <g className="hf-layer-flat">
      {[p0, p1].map((q, i) => <g key={i}><path className="mo-under" d={quad(q)} transform="translate(3 4)" /><path className="mo-paper" d={quad(q)} /><path d={quad(q)} fill={`url(#${uid}-${i ? "b" : "a"})`} /><path className="mo-grid" d={grid(q, 8)} /></g>)}
      <g style={tone(KINDS[0])}>{[0.16, 0.11, 0.06].map((r) => <path key={r} className="mo-contour" d={ring(p0, 0.26, 0.42, r, r * 1.3)} />)}</g>
      <path className="mo-river" d={river} /><path className="mo-river-core" d={river} />
      <g style={tone(KINDS[1])}>{VILLAGE.map(([u, v], k) => { const [x, y] = at(p1, u, v); return <path key={k} className="mo-house" d={`M${f(x - 4)} ${f(y)}h8v-6l-4-4l-4 4Z${k === 1 ? "M" + f(x) + " " + f(y - 10) + "v-6m-2.5 2h5" : ""}`} />; })}</g>
      <path className="mo-road" d={[[0.1, 0.05, 0.9, 0.95], [0.75, 0, 0.45, 1]].map(([u1, v1, u2, v2], i) => { const a = at(QUADS[i], u1, v1), b = at(QUADS[i], u2, v2); return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; }).join("")} />
      <path className="mo-crease" d="M250 176L233 322" />
    </g>
    <g className="hf-layer-lift">
      <path className="mo-paper" d={quad(p2)} /><path d={quad(p2)} fill={`url(#${uid}-c)`} /><path className="mo-grid" d={grid(p2, 8)} /><path className="mo-crease" d="M350 176L367 322" />
      <g style={tone(KINDS[2])}>{CITY_UV.map(([u, v], k) => { const [x, y] = at(p2, u, v); return <path key={k} className="mo-pin mo-city" style={delay(k * 0.45)} d={pin(x, y)} />; })}</g>
    </g>
    <path className="mo-trail" d={road} /><path className="mo-lamplight" d={road} pathLength={100} /><path className="mo-glow" d={road} pathLength={100} />
    {WAYS.map((w) => { const [x, y] = ROAD[w.at], up = w.ty < 200, dy = up ? 36 : -14, ang = Math.atan2(w.ty + dy - y, w.tx - x);
      return <g key={w.name} style={tone(KINDS[w.kind])}><path className="mo-leader" d={`M${f(x + 7 * Math.cos(ang))} ${f(y + 7 * Math.sin(ang))}L${w.tx} ${w.ty + dy}`} /><Dot x={w.tx} y={w.ty + dy} />
        <circle className="mo-halo" style={reach(share(ROAD, w.at), 16)} cx={f(x)} cy={f(y)} r="10" /><Marker kind={w.kind} x={f(x)} y={f(y)} /><Tag x={w.tx} y={w.ty} {...w} /></g>; })}
    <g className="hf-layer-lamp">
      <circle className="mo-lamp-halo" cx="50" cy="262" r="58" fill={`url(#${uid}-l)`} />
      <ellipse className="mo-brass" cx="50" cy="333" rx="24" ry="5" /><path className="mo-brass" d="M30 331Q27 306 50 300Q73 306 70 331Z" /><path className="mo-rule" d="M33 318H67M31 325H69" />
      <path className="mo-handle" d="M69 322q13-1 13-10t-12-8" /><path className="mo-brass" d="M43 300V292H57V300Z" /><path className="mo-rule" d="M47 254V236M53 290l2-14" /><path className="mo-chimney" d="M43 292Q33 272 42 254V232H58V254Q67 272 57 292Z" />
      <path className="mo-flame" d="M50 284c-5-6-6-11-1-20c1 5 7 10 1 20Z" />
    </g>
    <g transform="rotate(-16 540 316)"><path className="mo-brass" d="M512 312h62v7h-62Z" /><path className="mo-rule" d="M512 315.5h62M562 312v7" /><path className="mo-pencil-tip" d="M512 312L500 315.5L512 319Z" /></g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">OPEN IT WHERE YOU ARE · ONE ROAD THROUGH ALL THREE</text>
  </svg>;
}

/* ---------- Three Windows: a folding map whose panels each frame a scene, the trail running beneath ---------- */

/** Each panel's plane: local (u, v) on a 156 × 250 sheet, sheared so the three zig-zag like a folding screen. */
const SHEETS = [{ x: 66, top: 100, k: -12 / 156 }, { x: 222, top: 88, k: 12 / 156 }, { x: 378, top: 100, k: -12 / 156 }];
const PATHS = ["M0 222C26 236 50 230 78 222S130 206 156 222", "M0 222C30 210 52 214 78 222S128 238 156 222", "M0 222C24 234 54 230 78 222S136 210 156 222"];
const WINDOWS = [
  { name: "LEARNING", lines: ["WORKBOOKS", "LESSONS"] },
  { name: "FELLOWSHIP", lines: ["BIBLE STUDY", "PRAYER"] },
  { name: "HELP FOR LIFE", lines: ["NATIONAL HOTLINES", "LOCAL CHARITIES"] },
];
/** A window's label, larger than the other maps' tags: the name, then its two coloured lines. */
function WindowTag({ name, lines }: { name: string; lines: string[] }) {
  return <text className="mo-label mo-window-tag" x="78" y="158" textAnchor="middle">
    <tspan className="mo-name">{name}</tspan>{lines.map((line) => <tspan key={line} className="mo-detail" x="78" dy="13.5">{line}</tspan>)}
  </text>;
}
const FRAME = "M20 14H136A6 6 0 0 0 142 20V134A6 6 0 0 0 136 140H20A6 6 0 0 0 14 134V20A6 6 0 0 0 20 14Z";

function Workbook({ shade }: { shade: string }) {
  const left = "M26 46Q52 40 78 46V124Q52 118 26 124Z", right = "M78 46Q104 40 130 46V124Q104 118 78 124Z";
  return <g className="mo-book">
    <text className="mo-vtitle" x="78" y="34" textAnchor="middle">Moses: three forties</text>
    {[left, right].map((d) => <g key={d}><path className="mo-under" d={d} transform="translate(2 3)" /><path className="mo-page" d={d} /><path d={d} fill={`url(#${shade})`} /></g>)}
    <path className="mo-head-bar" d="M33 57h24" /><path className="mo-ink" d={rows(33, 66, 38, 9, 6)} /><path className="mo-gutter" d="M78 46V124" />
    <rect className="mo-pic" x="86" y="52" width="36" height="28" /><path className="mo-mountain" d="M88 78L98 64L104 70L112 58L120 78Z" /><circle className="mo-sun" cx="94" cy="59" r="2.5" />
    {[90, 100, 110].map((y, k) => <g key={y}><rect className="mo-check" x="86" y={y - 4} width="5" height="5" />{k === 0 && <path className="mo-tick" d={`M86.8 ${y - 1.6}l1.6 1.8l3-4`} />}<path className="mo-ink" d={`M95 ${y - 1.5}h${26 - k * 4}`} /></g>)}
    <path className="mo-ribbon" d="M80 124v12l-2 3" />
  </g>;
}
function Gathering({ glow }: { glow: string }) {
  const back = [46, 64, 92, 110];
  return <g>
    <ellipse className="mo-roomglow" cx="78" cy="74" rx="56" ry="40" fill={`url(#${glow})`} />
    <path className="mo-pane" d="M24 26h18v22h-18ZM33 26v22M24 37h18" /><path className="mo-rule" d="M119 26v18M113 32h12" /><path className="mo-rule" d="M18 124H138" />
    <path className="mo-rule" d="M78 18V34" /><path className="mo-shade-lamp" d="M67 42L72 34H84L89 42Z" /><path className="mo-bulb" d="M74 42a4 3 0 0 0 8 0Z" />
    {back.map((x, k) => <g key={x} className="mo-person" style={delay(-k * 0.7)}><circle className="mo-fill" cx={x} cy={k % 3 ? 70 : 74} r="5.5" /><path className="mo-fill" d={`M${x - 9} 94Q${x} ${k % 3 ? 76 : 80} ${x + 9} 94Z`} /></g>)}
    {[30, 126].map((x) => <g key={x}><circle className="mo-fill" cx={x} cy="88" r="5.5" /><path className="mo-fill" d={`M${x - 9} 112Q${x} 94 ${x + 9} 112Z`} /></g>)}
    <ellipse className="mo-fill" cx="78" cy="98" rx="42" ry="11" /><path className="mo-rule" d="M52 106V124M104 106V124" />
    <path className="mo-page" d="M70 97Q74 94 78 96Q82 94 86 97V101Q82 99 78 101Q74 99 70 101Z" /><path className="mo-fill" d="M50 94h7v4h-7ZM99 94h7v4h-7Z" />
    {[60, 96].map((x) => <g key={x}><circle className="mo-fill" cx={x} cy="116" r="6.5" /><path className="mo-fill" d={`M${x - 12} 137Q${x} 120 ${x + 12} 137Z`} /></g>)}
  </g>;
}
function Doorway() {
  const pins = range(0, 15, 1).map((k): Pt => [87 + (k % 5) * 10.5 + ((k * 7) % 4), 60 + Math.floor(k / 5) * 22 + ((k * 5) % 7)]);
  return <g>
    <path className="mo-wall" d="M20 132V48H72V132" /><path className="mo-doorlight" d="M28 132V66Q28 50 46 50Q64 50 64 66V132Z" /><path className="mo-arch" d="M28 132V66Q28 50 46 50Q64 50 64 66V132" />
    <path className="mo-door-leaf" d="M28 64L39 70V136L28 132Z" /><path className="mo-spill" d="M30 132H64L76 139H20Z" /><path className="mo-rule" d="M22 134H70M46 26V36" /><circle className="mo-bulb" cx="46" cy="40" r="3" />
    <text className="mo-vtitle" x="107" y="32" textAnchor="middle">Close to home</text>
    <rect className="mo-page" x="80" y="40" width="54" height="84" /><path className="mo-street" d="M92 40V124M106 40V124M120 40V124M80 58H134M80 80H134M80 102H134" /><path className="mo-avenue" d="M80 118L134 46" />
    {pins.map(([x, y], k) => <path key={k} className="mo-pin mo-city" style={delay(k * 0.35)} d={pin(x, y)} />)}
  </g>;
}
export function WindowsScene() {
  const uid = useUid(), shade = `${uid}-s`, glow = `${uid}-g`;
  const art = [<Workbook key="w" shade={shade} />, <Gathering key="g" glow={glow} />, <Doorway key="d" />];
  return <svg className="hf-scene mo-windows" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <defs><Fold id={`${uid}-0`} a={0.02} b={0.14} /><Fold id={`${uid}-1`} a={0.15} b={0.03} /><Fold id={shade} a={0.12} b={0.04} />
      <radialGradient id={glow}><stop stopColor="var(--accent)" stopOpacity=".32" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
    <Verse y={50} text="Bear ye one another's burdens, and so fulfil the law of Christ." cite="GALATIANS 6:2" />
    {SHEETS.map((s, i) => <g key={i} className={`hf-layer-w${i}`} style={tone(KINDS[i])}><g transform={`matrix(1 ${f(s.k * 1000) / 1000} 0 1 ${s.x} ${s.top})`}>
      <path className="mo-under" d="M0 0H156V250H0Z" transform="translate(4 5)" /><path className="mo-paper" d="M0 0H156V250H0Z" /><path d="M0 0H156V250H0Z" fill={`url(#${uid}-${i % 2})`} />
      <path className="mo-neat" d="M5 5H151V245H5Z" /><path className="mo-rule" d={range(9, 150, 8).map((x, k) => `M${x} 5v${k % 3 ? -2.5 : -5}M${x} 245v${k % 3 ? 2.5 : 5}`).join("")} />
      <path className="mo-band" d={range(0, 7, 1).map((k) => `M8 ${200 + k * 6.5}C40 ${197 + k * 6.5 + (k % 2) * 5} 100 ${204 + k * 6.5 - (k % 3) * 3} 148 ${200 + k * 6.5}`).join("")} />
      <path className="mo-under" d={FRAME} transform="translate(3 3)" /><path className="mo-frame" d={FRAME} /><path className="mo-frame-inner" d="M18 18H138V136H18Z" />
      {art[i]}
      <WindowTag {...WINDOWS[i]} /><Dot x={78} y={194} /><path className="mo-leader" d="M78 197V214" />
      <path className="mo-trail" d={PATHS[i]} /><path className="mo-glow mo-glow-third" style={delay(i * 4)} d={PATHS[i]} pathLength={100} />
      <circle className="mo-halo mo-halo-third" style={delay(i * 4 + 0.6)} cx="78" cy="222" r="10" /><Marker kind={i} x={78} y={222} />
    </g></g>)}
    <text className="hf-caption" x="300" y="406" textAnchor="middle">THREE WINDOWS · ONE ROAD BENEATH THEM</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The Surveyor's Map", note: "An engraved three-panel sheet with a piano-key border, compass rose, cartouche, contour hills, a lake, a village, fifteen towns and a legend keyed to learning, fellowship and help for life, a light walking the road between them under Isaiah 30:21; on hover the panels part and the rose turns.", Scene: SurveyScene },
  { name: "The Lamplit Map", note: "A traveller's map half-opened on a wooden table beside an oil lamp, its right panel still lifting, lamplight walking the road past six labelled stops (Moses: three forties, Bible study and prayer, fifteen city maps) under Psalm 119:105; on hover the panel opens further and the lamp brightens.", Scene: LampScene },
  { name: "Three Windows", note: "A folding map stood up like a screen, each panel framing a scene (an open workbook, a table of friends under a lamp, a lit doorway beside a street map of fifteen pins) with the road running beneath all three under Galatians 6:2; on hover the panels part and the door opens wider.", Scene: WindowsScene },
];
