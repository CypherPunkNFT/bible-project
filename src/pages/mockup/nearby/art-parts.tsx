// MOCK-UP: the parts the "Close to home" drawings are built from (NearbyArt.tsx). The trees, clouds, flock, ripples,
// flowers and grass are copied from the approved Help for life morning (resource-artwork.data.ts) and use its classes
// (approved-resource-art.css); the people, fire and buildings are ours, styled in nearby-art.css.
import type { CSSProperties, ReactNode } from "react";
import "@/components/stations/approved-resource-art.css";
import "./nearby-art.css";

const TREE = ["M-2 0L0-19L3-34M2-10L11-26M1-18L-9-29",
  "M-16-23C-25-23-26-32-19-36C-23-43-15-49-8-47C-6-55 5-55 10-48C17-52 27-45 23-38C31-32 24-22 16-24C13-18 3-18 0-22C-7-17-14-17-16-23Z",
  "M-17-33Q-12-39-7-35M-9-43Q-3-48 3-43M7-39Q14-45 19-38M-10-26Q-5-31 0-27M6-29Q13-34 19-29M-3-36Q1-40 6-36"];
const CLOUDS = {
  near: ["M6 23C-1 23-2 16 5 14C4 9 10 6 15 9C17 4 24 4 27 10C33 6 40 10 40 15C45 12 52 16 50 21C48 25 42 24 36 24H12Q8 24 6 23Z", "M11 15Q14 12 18 14M27 19Q33 16 38 19"],
  far: ["M5 22C-1 22-2 14 4 12C3 6 9 3 14 6C16-2 27-2 30 5C35 1 42 5 41 11C49 10 53 17 48 21C46 23 41 23 37 23H9Q6 23 5 22Z", "M8 13Q10 9 15 10M29 7Q33 6 35 10M34 19Q39 17 43 19"],
  small: ["M8 24C1 24-1 17 5 13C4 8 9 4 14 6C16-2 27-1 29 7C37 5 43 13 39 19C45 22 41 27 34 27L13 26Q9 26 8 24Z", "M10 15Q10 10 15 10M25 20Q29 18 33 20"],
  mid: ["M4 23C-2 22-1 15 5 14C6 7 14 5 20 10C23 7 28 8 30 12C29 3 39-1 45 5C48 8 48 11 47 14C56 12 61 20 55 24C51 27 43 25 39 25H12Q6 25 4 23Z", "M8 16Q12 12 17 15M34 11Q36 6 41 8M39 21Q45 18 50 21"],
};
const BIRD = "M-9-2Q-4-7 0 0Q4-7 9-2";
const GRASS = "M0 0Q-3-8-8-11M0 0Q1-12 5-16M0 0Q5-6 10-8M-4 0L-9-5";
const PETALS = [0, 1, 2, 3, 4, 5, 6].map((i) => (i * 360) / 7);
const wave = (x: number, y: number, width: number) => { const s = width / 4; return `M${x} ${y}q${s / 2}-1.6 ${s} 0t${s} 0t${s} 0t${s} 0`; };

export function Frame({ children }: { children: ReactNode }) {
  return <svg className="resource-approved na-art" viewBox="0 0 280 210" aria-hidden="true" focusable="false"><g className="morning-art resource-life-landscape">{children}</g></svg>;
}
/** A line of land with the page colour below it, hiding whatever lies further back. */
export function Ground({ d, kind = "land" }: { d: string; kind?: string }) {
  return <><path d={`${d}L272 208H8Z`} className="land-mask" /><path d={d} className={kind} /></>;
}
export function Tree({ x, y, s }: { x: number; y: number; s: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><path d={TREE[0]} className="tree-trunk" /><path d={TREE[1]} className="tree-crown" /><path d={TREE[2]} className="leaf-detail" /><path d="M-7 1Q0-2 7 1" className="land-fine" /></g>;
}
export function Cloud({ x, y, s, kind }: { x: number; y: number; s: number; kind: keyof typeof CLOUDS }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className={`resource-cloud cloud-${kind}`}><path d={CLOUDS[kind][0]} /><path className="cloud-fold" d={CLOUDS[kind][1]} /></g></g>;
}
/** Three birds crossing the whole drawing, as in the morning. */
export function Flock({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  const style = { "--flight-start": `${-x / s - 45}px`, "--flight-end": `${(305 - x) / s}px`, "--flight-delay": `${delay}s` } as CSSProperties;
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className="lake-flock" style={style}>
    <path d={BIRD} className="bird-line" /><g transform="translate(23 -10) scale(0.8)"><path d={BIRD} className="bird-line" /></g><g transform="translate(15 13) scale(0.7)"><path d={BIRD} className="bird-line" /></g>
  </g></g>;
}
/** Rows of water: [x, y, width, catches the gold light]. */
export function Ripples({ rows }: { rows: [number, number, number, boolean?][] }) {
  return <>{rows.map(([x, y, width, gold], i) => <g key={i} className="lake-ripple" style={{ "--ripple-delay": `${-i * 1.3}s`, "--ripple-time": `${7 + (i % 3)}s` } as CSSProperties}>
    <path d={wave(x, y, width)} className={gold ? "lake-reflection" : "lake-water"} /></g>)}</>;
}
function Flower({ x, y, s, lean }: { x: number; y: number; s: number; lean: number }) {
  const m = lean / 2;
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className="morning-flower">
    <path d={`M0 0Q${lean / 4}-12 ${lean}-26M${m}-9Q-14-11-12-16Q-1-16 ${m}-9M${m}-14Q14-18 15-23Q4-22 ${m}-14`} className="stem" />
    <g transform={`translate(${lean} -26)`}>{PETALS.map((r) => <ellipse key={r} cx="0" cy="-4.6" rx="2.2" ry="3.8" transform={`rotate(${r})`} className="flower-petal" />)}<circle r="2.1" className="flower-core" /></g>
  </g></g>;
}
function Grass({ x, y, s }: { x: number; y: number; s: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><path d={GRASS} className="grass" /></g>;
}
/** The morning's foreground: a near bank with flowers, grass and stones. */
export function Foreground({ line }: { line: string }) {
  return <><Ground d={line} /><g className="al-foreground">
    <Flower x={31} y={204} s={0.84} lean={-4} /><Flower x={51} y={207} s={0.65} lean={3} /><Flower x={247} y={205} s={0.8} lean={4} />
    <Grass x={15} y={204} s={0.7} /><Grass x={264} y={204} s={0.7} /><Grass x={72} y={202} s={0.56} /><Grass x={114} y={205} s={0.46} /><Grass x={175} y={204} s={0.82} /><Grass x={197} y={201} s={0.42} />
    <path d="M211 196q4-6 9-2q3 4-1 4h-9ZM225 199q4-4 7-1q2 3-1 3h-6ZM137 201q4-6 9-2q3 4-1 4h-9ZM151 204q4-4 7-1q2 3-1 3h-6Z" className="land-fine" />
  </g></>;
}

/** A church: nave behind, tower and spire in front, the cross in gold, the windows and door lit. */
export function Church({ x, base, tall }: { x: number; base: number; tall: number }) {
  const top = base - tall;
  return <g>
    <path d={`M${x - 26} ${base - 24}H${x + 26}V${base}H${x - 26}Z`} className="na-building" />
    <path d={`M${x - 29} ${base - 23}L${x} ${base - 40}L${x + 29} ${base - 23}Z`} className="na-building" />
    <path d={`M${x - 21} ${base - 6}v-8q2.5-4 5 0v8zM${x + 16} ${base - 6}v-8q2.5-4 5 0v8z`} className="na-light" />
    <path d={`M${x - 8} ${base}V${top}H${x + 8}V${base}Z`} className="na-building" />
    <path d={`M${x - 10} ${top + 1}L${x} ${top - 26}L${x + 10} ${top + 1}Z`} className="na-building" />
    <path d={`M${x} ${top - 26}V${top - 38}M${x - 4.5} ${top - 33.5}H${x + 4.5}`} className="na-gold" />
    <circle cx={x} cy={top + 12} r="3.6" className="na-light" />
    <path d={`M${x - 4} ${base}V${base - 9}Q${x} ${base - 14} ${x + 4} ${base - 9}V${base}Z`} className="na-light" />
  </g>;
}
/** A gabled house; a lit window glows; with smoke, a chimney on the right slope. */
export function House({ x, w, h, base, lit, smoke }: { x: number; w: number; h: number; base: number; lit?: boolean; smoke?: boolean }) {
  const eave = base - h, apex = eave - w * 0.45;
  const cx = x + w * 0.72, roofY = apex + ((w * 0.22) / (w * 0.5 + 2)) * (w * 0.45 + 1), top = apex - 1;
  return <g>
    {smoke && <><path d={`M${cx} ${roofY + 2}V${top}H${cx + 3.5}V${roofY + 2}Z`} className="na-building" /><path d={`M${cx + 1.75} ${top - 2}q-4-5 0-9t0-9t1-8`} className="na-smoke" /></>}
    <path d={`M${x} ${eave}H${x + w}V${base}H${x}Z`} className="na-building" />
    <path d={`M${x - 2} ${eave + 1}L${x + w / 2} ${apex}L${x + w + 2} ${eave + 1}Z`} className="na-building" />
    <path d={`M${x + w * 0.22} ${eave + h * 0.3}h${w * 0.24}v${h * 0.28}h${-w * 0.24}Z`} className={lit ? "na-light" : "land-fine"} />
    <path d={`M${x + w * 0.6} ${base}v${-h * 0.46}h${w * 0.2}v${h * 0.46}`} className="land-fine" />
  </g>;
}
/** A person in a long coat, standing or seated, drawn in the morning's line; a child is a smaller person. */
export function Person({ x, y, s = 1, sit, delay }: { x: number; y: number; s?: number; sit?: boolean; delay?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className={delay === undefined ? undefined : "na-walk"} style={delay === undefined ? undefined : { animationDelay: `${delay}s` }}>
    <path d={sit ? "M-4.5-10Q0-12.5 4.5-10L7 0H-7Z" : "M-4.5-17Q0-19.5 4.5-17L6.5 0H-6.5Z"} className="na-person" />
    <circle cy={sit ? -15 : -22.5} r="3.4" className="na-person" />
  </g></g>;
}
/** A fire of two logs, its flame flickering and sparks rising, a warm glow around it. */
export function Fire({ x, y }: { x: number; y: number }) {
  return <g>
    <ellipse cx={x} cy={y - 6} rx="34" ry="16" className="na-glow" />
    <path d={`M${x - 12} ${y}L${x + 12} ${y - 5}M${x - 12} ${y - 5}L${x + 12} ${y}`} className="na-rail" />
    <g className="na-flame"><path d={`M${x} ${y - 3}C${x - 9} ${y - 11} ${x - 3} ${y - 19} ${x} ${y - 27}C${x + 3} ${y - 19} ${x + 10} ${y - 12} ${x} ${y - 3}Z`} className="na-light" />
      <path d={`M${x} ${y - 5}C${x - 3} ${y - 9} ${x - 1} ${y - 13} ${x} ${y - 17}C${x + 1} ${y - 13} ${x + 4} ${y - 9} ${x} ${y - 5}Z`} className="na-gold" /></g>
    {[[-4, 0], [3, -1.4], [0, -2.8]].map(([dx, delay]) => <circle key={delay} cx={x + dx} cy={y - 30} r="0.9" className="na-spark" style={{ animationDelay: `${delay}s` }} />)}
  </g>;
}
