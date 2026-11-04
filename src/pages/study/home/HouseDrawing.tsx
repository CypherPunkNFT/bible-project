// Our own drawing of one usual plan, cut open: not one excavated house, and not to measure. Its line is the argument: solid where
// excavated houses show it, dashed where a modern reconstruction adds it, dotted where only a passage tells us. Every point comes from
// one oblique projection, so the cut stays true to itself. The buttons listed beside it are the interface; the shapes are extra.

const point = (x: number, y: number, z = 0) => `${(40 + 38 * x + 15 * y).toFixed(1)} ${(400 - 11 * y - 38 * z).toFixed(1)}`;
const shape = (points: [number, number, number?][], close = true) => `M${points.map(([x, y, z]) => point(x, y, z)).join("L")}${close ? "Z" : ""}`;
const box = (x0: number, x1: number, y0: number, y1: number, z = 0) => shape([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
const at = (x: number, y: number, z = 0) => point(x, y, z).split(" ").map(Number) as [number, number];

const PILLARS: [number, number][] = [3, 7].flatMap((x) => [1.5, 3.5, 5.5, 7.5].map((y) => [x, y] as [number, number]));
const JARS: [number, number][] = [[1.4, 10.6], [2.2, 10.9], [3, 10.6], [8.2, 10.3], [6, 6.8]];

/** Where each room can be picked, and where its number sits. */
const ZONES: { id: string; n: string; areas: string[]; badge: [number, number, number] }[] = [
  { id: "door", n: "1", areas: [box(4, 6, -1.2, 1)], badge: [5, -0.4, 0.15] },
  { id: "middle", n: "2", areas: [box(3, 7, 1, 8.5)], badge: [4.2, 7.3, 0.1] },
  { id: "side", n: "3", areas: [box(0, 3, 0, 8.5), box(7, 10, 0, 8.5)], badge: [1.2, 2.8, 0.1] },
  { id: "back", n: "4", areas: [box(0, 10, 8.5, 12), shape([[0, 12, 0], [10, 12, 0], [10, 12, 2.4], [0, 12, 2.4]])], badge: [6.3, 11.2, 0.1] },
  { id: "upper", n: "5", areas: [box(0, 10, 8.5, 12, 2.6), shape([[0, 12, 2.6], [10, 12, 2.6], [10, 12, 4.8], [0, 12, 4.8]])], badge: [5, 10.2, 2.7] },
  { id: "roof", n: "6", areas: [box(0, 10, 8.5, 12, 5)], badge: [5, 10.2, 5.05] },
];

function Jar({ x, y }: { x: number; y: number }) {
  const [sx, sy] = at(x, y);
  return <path fill="var(--surface)" d={`M${sx - 3} ${sy - 19}h6M${sx - 2} ${sy - 19}q-7 5-5 12q2 7 7 7q5 0 7-7q2-7-5-12`} />;
}

function Ground() {
  const [ovenX, ovenY] = at(5.1, 4.2);
  const [stoneX, stoneY] = at(4, 2.6);
  const [cowX, cowY] = at(8.5, 4.5);
  const [loomX, loomY] = at(6.2, 8.1);
  return <g>
    <g className="hh-found">
      <path d={box(0, 10, 0, 12)} fillOpacity=".03" fill="currentColor" />
      <path d={shape([[10, 0, 0], [10, 12, 0], [10, 12, 2.4], [10, 0, 2.4]])} fillOpacity=".05" fill="currentColor" />
      <path d={shape([[0, 12, 0], [10, 12, 0], [10, 12, 2.4], [0, 12, 2.4]])} fillOpacity=".05" fill="currentColor" />
      <path d={shape([[0, 8.5], [10, 8.5]], false)} opacity=".65" />
      <path d={shape([[0, 0, 0], [0, 12, 0], [0, 12, 0.6], [0, 0, 0.6]])} fillOpacity=".08" fill="currentColor" />
      <path d={shape([[0, 0, 0], [4.3, 0, 0], [4.3, 0, 0.6], [0, 0, 0.6]])} fill="var(--surface)" />
      <path d={shape([[5.7, 0, 0], [10, 0, 0], [10, 0, 0.6], [5.7, 0, 0.6]])} fill="var(--surface)" />
      {PILLARS.map(([x, y]) => <path key={`${x}-${y}`} d={shape([[x - 0.1, y, 0], [x + 0.1, y, 0], [x + 0.1, y, 2.4], [x - 0.1, y, 2.4]])} fill="var(--surface)" />)}
      <path d={`M${ovenX - 15} ${ovenY - 22}q-1 20 3 24q12 6 24 0q4-4 3-24`} fill="var(--surface)" />
      <ellipse cx={ovenX} cy={ovenY - 22} rx="15" ry="6" fill="var(--surface)" />
      <path d={`M${stoneX - 16} ${stoneY}q16-9 32 0q-16 7-32 0M${stoneX - 6} ${stoneY - 4}q6-5 12 0`} fill="var(--surface)" />
      {JARS.map(([x, y]) => <Jar key={`${x}-${y}`} x={x} y={y} />)}
    </g>
    <g className="hh-rebuilt">
      <path d={[3, 7].map((x) => shape([[x, 1.5, 2.4], [x, 7.5, 2.4]], false)).join("")} />
      <path d={`M${cowX - 24} ${cowY - 30}h34q8 0 10-4l6-6q6-3 9 2l2 8q-2 4-7 3l-5 1q-2 8-6 10v18M${cowX - 24} ${cowY - 30}q-5 2-5 10v20M${cowX - 16} ${cowY - 14}v14M${cowX + 4} ${cowY - 14}v14M${cowX - 16} ${cowY - 14}h20`} />
      <path d={`M${loomX - 16} ${loomY}v-58M${loomX + 16} ${loomY - 8}v-58M${loomX - 22} ${loomY - 54}l44-8M${loomX - 10} ${loomY - 48}v26M${loomX} ${loomY - 50}v26M${loomX + 10} ${loomY - 52}v26`} />
    </g>
  </g>;
}

function UpperAndRoof() {
  const [bedX, bedY] = at(3, 10.2, 2.6);
  const [flaxX, flaxY] = at(7.6, 10.2, 5);
  return <g>
    <g className="hh-rebuilt">
      <path d={box(0, 10, 8.5, 12, 2.6)} fill="var(--surface)" />
      <path d={shape([[0, 8.5, 2.6], [0, 8.5, 4.8]], false) + shape([[10, 8.5, 2.6], [10, 8.5, 4.8]], false) + shape([[0, 12, 2.6], [0, 12, 4.8]], false) + shape([[10, 12, 2.6], [10, 12, 4.8]], false)} />
      <path d={shape([[0, 12, 4.8], [10, 12, 4.8]], false)} />
      <path d={`M${bedX - 26} ${bedY}q26-11 52 0q-26 9-52 0`} />
    </g>
    <g className="hh-written">
      <path d={box(0, 10, 8.5, 12, 5)} />
      <path d={[[0, 8.5, 10, 8.5], [10, 8.5, 10, 12], [10, 12, 0, 12], [0, 12, 0, 8.5]].map(([x0, y0, x1, y1]) => shape([[x0, y0, 5.45], [x1, y1, 5.45]], false)).join("")} />
      <path d={[[0, 8.5], [10, 8.5], [10, 12], [0, 12]].map(([x, y]) => shape([[x, y, 5], [x, y, 5.45]], false)).join("")} />
      <path d={`M${flaxX - 22} ${flaxY - 2}l40-5M${flaxX - 20} ${flaxY + 3}l42-5M${flaxX - 18} ${flaxY + 8}l42-5`} />
    </g>
  </g>;
}

function Zone({ zone, picked, onPick }: { zone: (typeof ZONES)[number]; picked: boolean; onPick: (id: string) => void }) {
  const [x, y] = at(zone.badge[0], zone.badge[1], zone.badge[2]);
  return <g className={`hh-zone${picked ? " on" : ""}`} onClick={() => onPick(zone.id)} data-room={zone.id}>
    {zone.areas.map((d) => <path key={d} d={d} />)}
    <g className="hh-badge"><circle cx={x} cy={y} r="11" /><text x={x} y={y + 4} textAnchor="middle">{zone.n}</text></g>
  </g>;
}

/** The whole cut; `picked` lights a room, `onPick` lets the pointer choose one. The hero passes neither. */
export function HouseLines({ picked, onPick }: { picked?: string | null; onPick?: (id: string) => void }) {
  return <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <Ground />
    <UpperAndRoof />
    {onPick && ZONES.map((zone) => <Zone key={zone.id} zone={zone} picked={picked === zone.id} onPick={onPick} />)}
  </g>;
}
