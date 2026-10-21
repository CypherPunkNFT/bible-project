// The drawings for the homepage Apologetics blocks: the debate room (two lecterns taking turns to speak, a balance
// weighing the claim against the challenge, a timer and the order of a debate along the floor), the four worldview
// collections (each tradition's own book threaded to an open Bible, with one of its real questions), and six small
// still pictures for the connected fields. Our own shapes, not the inner pages' art; motion rules in home-apologetics.css.
import type { CSSProperties, ReactElement } from "react";
import { OpenBook } from "./HomeFeatureArt";
import "./home-apologetics.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/* ---------- The debate room ---------- */

/** Three arcs of speech leaving a lectern; side -1 faces left. */
function Voice({ x, side, offset }: { x: number; side: 1 | -1; offset: number }) {
  return <g className="ha-voice">{[12, 22, 32].map((r, i) =>
    <path key={r} style={delay(offset + i * 0.25)} d={`M${x + side * r * 0.4} ${222 - r}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${x + side * r * 0.4} ${222 + r}`} />)}</g>;
}

function Lectern({ x }: { x: number }) {
  return <g className="ha-lectern"><path d={`M${x - 30} 252L${x + 30} 244L${x + 26} 262H${x - 26}Z`} /><path d={`M${x - 16} 262L${x - 12} 330H${x + 12}L${x + 16} 262`} /><path d={`M${x - 24} 330H${x + 24}`} /></g>;
}

/** The balance: the beam tilts slowly while the pans stay level, claim on the left, challenge on the right. */
function Balance() {
  return <g className="ha-balance">
    <path className="ha-post" d="M300 166V330M276 330H324" />
    <g className="ha-beam"><path d="M246 166H354" /><circle cx="300" cy="166" r="4" /></g>
    {[[250, "CLAIM", "ha-pan-left"], [350, "CHALLENGE", "ha-pan-right"]].map(([x, label, cls]) => <g key={label} className={`ha-pan ${cls}`}>
      <path d={`M${x} 166L${Number(x) - 22} 214M${x} 166L${Number(x) + 22} 214`} /><path className="ha-dish" d={`M${Number(x) - 28} 214Q${x} 232 ${Number(x) + 28} 214Z`} />
      <rect x={Number(x) - (String(label).length * 5.4 + 12) / 2} y="196" width={String(label).length * 5.4 + 12} height="14" rx="2" /><text x={x} y="206" textAnchor="middle">{label}</text>
    </g>)}
  </g>;
}

const ORDER = [["OPENING", 110], ["REBUTTAL", 230], ["CROSS-EXAMINATION", 370], ["CLOSING", 490]] as const;

export function DebateScene() {
  return <svg className="hf-scene ha-debate-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <ellipse className="hf-orbit" cx="300" cy="230" rx="236" ry="130" />
    <g className="hf-layer-timer"><circle className="ha-timer" cx="300" cy="96" r="22" /><path className="ha-timer-hand" d="M300 96V80" /><circle cx="300" cy="96" r="2.5" className="ha-timer-pin" /></g>
    <g className="hf-layer-voices"><Voice x={168} side={1} offset={0} /><Voice x={432} side={-1} offset={3} /></g>
    <g className="hf-layer-lecterns"><Lectern x={140} /><Lectern x={460} /></g>
    <g className="hf-layer-balance"><Balance /></g>
    <path className="ha-floor" d="M60 330H540" />
    <g className="hf-layer-order">
      <path className="ha-order-line" d="M110 350H490" />
      {ORDER.map(([name, x]) => <g key={name}><path className="ha-order-line" d={`M${x} 345V355`} /><text x={x} y="372" textAnchor="middle">{name}</text></g>)}
      <g className="ha-order-marker"><circle cx="0" cy="350" r="4.5" /></g>
    </g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">LISTEN CLOSELY · WEIGH THE ARGUMENT</text>
  </svg>;
}

/* ---------- Across beliefs ---------- */

/** The four collections at the corners of the ring, each with one question from its own collection. */
const TRADITIONS = [
  { name: "ISLAM", question: "Who is Jesus?", angle: 150 },
  { name: "SECULAR THOUGHT", question: "What counts as a reason?", angle: 30 },
  { name: "BUDDHISM", question: "What is wrong with the world?", angle: 210 },
  { name: "HINDUISM", question: "In whom do we take refuge?", angle: 330 },
];

export function WorldviewsScene() {
  return <svg className="hf-scene ha-worldviews-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <ellipse className="hf-orbit" cx="300" cy="222" rx="214" ry="124" />
    <ellipse className="hf-orbit hf-orbit-inner" cx="300" cy="222" rx="120" ry="70" />
    <g className="hf-layer-threads">{TRADITIONS.map((t, i) => {
      const x = 300 + 214 * Math.cos((t.angle * Math.PI) / 180), y = 222 - 124 * Math.sin((t.angle * Math.PI) / 180);
      const d = `M${x} ${y}Q${(x + 300) / 2} ${y < 222 ? y + 40 : y - 40} 300 222`;
      return <g key={t.name}><path className="ha-thread" d={d} /><path className="ha-question-dot" pathLength={1} style={delay(i * 1.4)} d={d} /></g>;
    })}</g>
    <g className="hf-layer-bible"><g transform="translate(300 214) scale(.5) translate(-300 -295)"><OpenBook /></g></g>
    <g className="hf-layer-books">{TRADITIONS.map((t, i) => {
      const x = 300 + 214 * Math.cos((t.angle * Math.PI) / 180), y = 222 - 124 * Math.sin((t.angle * Math.PI) / 180);
      const below = y > 222;
      return <g key={t.name} className="ha-tradition" style={delay(-i * 1.2)}>
        <rect x={x - 15} y={y - 19} width="30" height="38" rx="2.5" /><path d={`M${x - 10} ${y - 19}V${y + 19}M${x - 4} ${y - 8}h12M${x - 4} ${y - 2}h9`} />
        <text className="ha-tradition-name" x={x} y={below ? y + 36 : y - 40} textAnchor="middle">{t.name}</text>
        <text className="ha-tradition-question" x={x} y={below ? y + 52 : y - 26 - 30} textAnchor="middle">{t.question}</text>
      </g>;
    })}</g>
    <text className="hf-caption" x="300" y="412" textAnchor="middle">EACH TRADITION’S OWN TEXTS · OPEN BESIDE SCRIPTURE</text>
  </svg>;
}

/* ---------- The six connected fields ---------- */

const FIELD_ART: Array<() => ReactElement> = [
  // God & reality: a centre held by its orbits.
  () => <><circle cx="240" cy="92" r="9" fill="currentColor" />{[[60, 22], [104, 38], [150, 56]].map(([rx, ry], i) => <ellipse key={rx} cx="240" cy="92" rx={rx} ry={ry} strokeDasharray={i === 1 ? "2 5" : undefined} opacity={0.7 - i * 0.15} />)}<circle cx="300" cy="92" r="4" fill="currentColor" /><circle cx="152" cy="74" r="5" /><circle cx="372" cy="120" r="3.5" fill="currentColor" /></>,
  // Jesus & resurrection: the opened tomb at dawn, its stone rolled aside.
  () => <><path d="M120 156H360M196 156V106a44 44 0 0 1 88 0V156" /><path d="M210 156V110a30 30 0 0 1 60 0V156" opacity=".5" /><circle cx="318" cy="130" r="25" /><circle cx="318" cy="130" r="16" opacity=".4" />{[-60, -30, 0, 30, 60].map((a) => <path key={a} transform={`rotate(${a} 240 54)`} d="M240 40V22" opacity=".6" />)}</>,
  // Bible & reliability: one text carried copy to copy.
  () => <>{[108, 210, 312].map((x, i) => <g key={x}><path d={`M${x} 46h60v86h-60Z`} opacity={0.55 + i * 0.2} />{[0, 1, 2, 3, 4, 5].map((r) => <path key={r} d={`M${x + 10} ${62 + r * 11}h${40 - ((r * 7) % 11)}`} opacity=".5" />)}</g>)}<path d="M174 89h30M276 89h30" strokeDasharray="3 4" /><path d="m198 84 6 5-6 5M300 84l6 5-6 5" /><circle cx="384" cy="54" r="12" /><path d="m378 54 4 4 8-8" /></>,
  // Suffering & doubt: rain, and light still breaking through.
  () => <><path d="M176 88a26 26 0 0 1 22-36a34 34 0 0 1 62 6a22 22 0 0 1 6 30Z" />{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${192 + i * 16} 100l-6 16`} opacity=".55" />)}<circle cx="300" cy="62" r="14" opacity=".8" />{[0, 1, 2].map((i) => <path key={i} transform={`rotate(${-30 + i * 30} 300 62)`} d="M300 40V32" />)}<path d="M150 156H330M240 156v-20q0-12 12-16M240 140q-2-12-14-14" /></>,
  // Religions & worldviews: four roads meeting at one place.
  () => <>{[[92, 34], [388, 34], [92, 152], [388, 152]].map(([x, y]) => <g key={`${x}${y}`}><path d={`M${x} ${y}Q${(x + 240) / 2} ${y < 92 ? y + 50 : y - 50} 240 92`} strokeDasharray="3 5" /><circle cx={x} cy={y} r="5" fill="currentColor" /></g>)}<circle cx="240" cy="92" r="16" /><path d="M240 84v16M233 90h14" /></>,
  // Faith & witness: two people in conversation over an open book.
  () => <>{[184, 296].map((x) => <g key={x}><circle cx={x} cy="66" r="14" /><path d={`M${x - 26} 132q0-38 26-38t26 38`} /></g>)}<path d="M206 58q34-22 68 0" strokeDasharray="2 5" /><path d="M216 146q12-6 24 0q12-6 24 0v-18q-12-6-24 0q-12-6-24 0ZM240 128v18" /><path d="M150 152H330" opacity=".5" /></>,
];

export function FieldArt({ index }: { index: number }) {
  const Art = FIELD_ART[index] ?? FIELD_ART[0];
  return <svg viewBox="0 0 480 185" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><Art /></svg>;
}
