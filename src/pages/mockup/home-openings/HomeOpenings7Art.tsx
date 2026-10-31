// MOCK-UP: the vine and the two pillars of /home_mockup7. The vine (John 15:5) is drawn once for the left and mirrored for the
// right. The pillars follow 1 Kings 7:15-22: eighteen cubits of cast bronze, capitals shaped like lilies, a network, and
// rows of pomegranates; Jachin to the south (on the left as you face the temple) and Boaz to the north.
import { useId, type CSSProperties } from "react";
import { Link } from "react-router-dom";

const fixed = (value: number) => value.toFixed(1);
type Point = [number, number];

/** A branch as joined cubic curves: its start, then three points for each piece. */
interface Branch { curve: Point[]; width: number; leaves: number[]; grapes: number[] }
const BRANCHES: Branch[] = [
  { curve: [[800, 840], [792, 780], [808, 730], [800, 664]], width: 9, leaves: [], grapes: [] },
  { curve: [[800, 724], [700, 744], [580, 704], [480, 744], [390, 780], [270, 790], [170, 734]], width: 6, leaves: [0.18, 0.4, 0.62, 0.84], grapes: [0.52] },
  { curve: [[800, 672], [700, 612], [580, 652], [470, 572], [380, 506], [330, 420], [220, 392]], width: 5, leaves: [0.16, 0.36, 0.58, 0.8], grapes: [0.66] },
  { curve: [[800, 664], [720, 560], [500, 540], [400, 420], [320, 320], [290, 200], [380, 128], [460, 66], [600, 82], [704, 54]], width: 4.5, leaves: [0.1, 0.26, 0.4, 0.55, 0.7, 0.84, 0.94], grapes: [0.3] },
  { curve: [[480, 744], [430, 694], [320, 654], [240, 614], [170, 578], [110, 604], [66, 524]], width: 3.5, leaves: [0.3, 0.6, 0.86], grapes: [] },
];

function along(curve: Point[], share: number): { at: Point; heading: number } {
  const pieces = (curve.length - 1) / 3, piece = Math.min(pieces - 1, Math.floor(share * pieces)), t = share * pieces - piece;
  const [a, b, c, d] = curve.slice(piece * 3, piece * 3 + 4), u = 1 - t;
  const at: Point = [0, 1].map((k) => u ** 3 * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t ** 3 * d[k]) as Point;
  const [dx, dy] = [0, 1].map((k) => 3 * u * u * (b[k] - a[k]) + 6 * u * t * (c[k] - b[k]) + 3 * t * t * (d[k] - c[k]));
  return { at, heading: (Math.atan2(dy, dx) * 180) / Math.PI };
}
const pathOf = (curve: Point[]) => `M${curve[0].join(" ")}C${curve.slice(1).map((point) => point.map(fixed).join(" ")).join(" ")}`;

/** A tendril: one and a half turns of a tightening spiral from the branch's tip. */
function tendril(curve: Point[]) {
  const { at, heading } = along(curve, 1), turn = (heading * Math.PI) / 180, side = curve[curve.length - 1][1] < 200 ? -1 : 1;
  const centre: Point = [at[0] - Math.sin(turn) * 15 * side, at[1] + Math.cos(turn) * 15 * side], start = Math.atan2(at[1] - centre[1], at[0] - centre[0]);
  return `M${Array.from({ length: 41 }, (_, k) => { const angle = start + side * (k / 40) * Math.PI * 3, reach = 15 * (1 - k / 46); return `${fixed(centre[0] + Math.cos(angle) * reach)} ${fixed(centre[1] + Math.sin(angle) * reach)}`; }).join("L")}`;
}

const LEAF = "M0 0C-6-4-16-2-22-10C-16-12-20-22-14-28C-8-24-6-34 0-40C6-34 8-24 14-28C20-22 16-12 22-10C16-2 6-4 0 0Z";
const GRAPE_ROWS = [4, 3, 3, 2, 1];

function VineHalf() {
  return <g>
    {BRANCHES.map((branch, index) => <g key={index}>
      <path className="hm7-stem" d={pathOf(branch.curve)} pathLength={1} style={{ strokeWidth: branch.width, animationDelay: `${index * 160}ms` }} />
      {index > 0 && <path className="hm7-tendril" d={tendril(branch.curve)} />}
      {branch.leaves.map((share, leaf) => { const { at, heading } = along(branch.curve, share), scale = 0.85 + (leaf % 3) * 0.2;
        return <g transform={`translate(${fixed(at[0])} ${fixed(at[1])}) rotate(${fixed(heading + (leaf % 2 ? 0 : 180))}) scale(${scale})`} key={share}>
          <g className="hm7-leaf" style={{ animationDelay: `${600 + index * 160 + leaf * 90}ms` } as CSSProperties}><path d={LEAF} /><path className="hm7-vein" d="M0 0V-34M0-14L-13-22M0-14L13-22" /></g>
        </g>; })}
      {branch.grapes.map((share) => { const { at } = along(branch.curve, share);
        return <g className="hm7-grapes" key={share}><path className="hm7-tendril" d={`M${fixed(at[0])} ${fixed(at[1])}v12`} />
          {GRAPE_ROWS.flatMap((count, row) => Array.from({ length: count }, (_, k) => <circle cx={fixed(at[0] + (k - (count - 1) / 2) * 11)} cy={fixed(at[1] + 18 + row * 10)} r="6.2" key={`${row}-${k}`} />))}
        </g>; })}
    </g>)}
  </g>;
}

export function VineArt() {
  return <figure className="hm7-vine">
    <svg viewBox="0 0 1600 840" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <VineHalf /><g transform="translate(1600 0) scale(-1 1)"><VineHalf /></g>
    </svg>
    <figcaption>“I am the vine and you are the branches.” · <Link to="/read/bsb/JHN/15?hl=5">John 15:5</Link></figcaption>
  </figure>;
}

const POMEGRANATE = "M0-7C5-7 8-3 8 1C8 6 4 9 0 9C-4 9-8 6-8 1C-8-3-5-7 0-7ZM-3-7L-4-11L-1-9L0-12L1-9L4-11L3-7Z";
const PETALS = [-56, -28, 0, 28, 56];

function Pillar({ x, name, gradient }: { x: number; name: string; gradient: string }) {
  const half = 52, net = `${name}-net`;
  return <g className="hm7-pillar">
    <rect className="hm7-plinth" x={x - 96} y="800" width="192" height="60" /><rect className="hm7-plinth" x={x - 80} y="780" width="160" height="20" />
    <text className="hm7-pillar-name" x={x} y="838">{name.toUpperCase()}</text>
    <rect x={x - half} y="300" width={half * 2} height="480" fill={`url(#${gradient})`} />
    {[312, 322, 762, 770].map((y) => <rect className="hm7-astragal" x={x - half - 3} y={y} width={half * 2 + 6} height="4" key={y} />)}
    <path d={`M${x - half} 300C${x - 80} 282 ${x - 84} 232 ${x - 68} 206H${x + 68}C${x + 84} 232 ${x + 80} 282 ${x + half} 300Z`} fill={`url(#${gradient})`} />
    <clipPath id={net}><path d={`M${x - half} 300C${x - 80} 282 ${x - 84} 232 ${x - 68} 206H${x + 68}C${x + 84} 232 ${x + 80} 282 ${x + half} 300Z`} /></clipPath>
    <g className="hm7-network" clipPath={`url(#${net})`}>{Array.from({ length: 18 }, (_, k) => <path d={`M${x - 100 + k * 12} 200l90 110M${x + 100 - k * 12} 200l-90 110`} key={k} />)}</g>
    <path className="hm7-chain" d={`M${x - 70} 236Q${x} 268 ${x + 70} 236`} />
    {[214, 290].map((y) => Array.from({ length: 9 }, (_, k) => <path className="hm7-pomegranate" transform={`translate(${x - 60 + k * 15} ${y})`} d={POMEGRANATE} key={`${y}-${k}`} />))}
    <rect className="hm7-abacus" x={x - 74} y="196" width="148" height="10" />
    {PETALS.map((turn) => <path className="hm7-lily" transform={`translate(${x} 196) rotate(${turn})`} d="M0 0C-16-10-18-40 0-62C18-40 16-10 0 0Z" key={turn} />)}
  </g>;
}

export function PillarsArt() {
  const id = useId().replace(/:/g, "");
  return <figure className="hm7-pillars">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bronze`} x1="0" x2="1"><stop offset="0" stopColor="#5a3c22" /><stop offset=".3" stopColor="#c8955a" /><stop offset=".45" stopColor="#f0c88a" /><stop offset=".7" stopColor="#a8763f" /><stop offset="1" stopColor="#4e331c" /></linearGradient>
        <radialGradient id={`${id}-light`}><stop offset="0" stopColor="var(--accent)" stopOpacity=".16" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="800" cy="480" rx="420" ry="360" fill={`url(#${id}-light)`} />
      <path className="hm7-porch" d="M500 780V150H1100V780M470 150H1130M470 132H1130M520 116H1080M680 780V430H920V780M800 430V780" />
      {[0, 1, 2].map((step) => <rect className="hm7-step" x={180 - step * 40} y={860 + step * 14} width={1240 + step * 80} height="14" key={step} />)}
      <Pillar x={360} name="Jachin" gradient={`${id}-bronze`} /><Pillar x={1240} name="Boaz" gradient={`${id}-bronze`} />
    </svg>
    <figcaption>“The pillar to the south he named Jachin, and the pillar to the north he named Boaz.” · <Link to="/read/bsb/1KI/7?hl=21">1 Kings 7:21</Link></figcaption>
  </figure>;
}
