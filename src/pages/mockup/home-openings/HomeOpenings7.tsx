// MOCK-UP: four openings for /home_mockup7 (owner, 2026-10-30: "I like the city on this one, the scrolls in before, the gate, the
// rose window, lets get more quality ones like them BUT NOT THEM just that quality and presence"). Each is one object that
// Scripture itself describes, drawn to its own measures: the tabernacle's court (Exodus 26-27), the lampstand (Exodus 25),
// the vine (John 15) and the two bronze pillars of the temple (1 Kings 7). Every quotation is the Berean Standard Bible's.
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { GoldMarquee, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import { PillarsArt, VineArt } from "./HomeOpenings7Art";
import "./home-openings7.css";

export const OPENINGS_7 = [
  { id: "a", name: "The tabernacle" },
  { id: "b", name: "The lampstand" },
  { id: "c", name: "The vine" },
  { id: "d", name: "Two pillars" },
] as const;
export type Opening7Id = (typeof OPENINGS_7)[number]["id"];

export const fixed = (value: number) => value.toFixed(1);

/** The court is fifty cubits by a hundred, drawn with west at the top and the gate, east toward the sunrise, at the foot. */
const CUBIT = 10, LEFT = 60, TOP = 50;
const cubits = (across: number, down: number): [number, number] => [LEFT + across * CUBIT, TOP + down * CUBIT];
// Sixty posts, one every five cubits round the court (Exodus 27:10-16).
const POSTS = [...Array.from({ length: 10 }, (_, i) => [i * 5, 0]), ...Array.from({ length: 20 }, (_, i) => [50, i * 5]), ...Array.from({ length: 10 }, (_, i) => [50 - i * 5, 100]), ...Array.from({ length: 20 }, (_, i) => [0, 100 - i * 5])];
const YARN = ["blue", "purple", "scarlet"];
const LABELS = [
  { at: cubits(25, 25), y: 300, text: "Most Holy Place · the ark" },
  { at: cubits(25, 40), y: 430, text: "Holy Place · lampstand, table, altar of incense" },
  { at: cubits(25, 62), y: 670, text: "Bronze basin" },
  { at: cubits(27.5, 74), y: 790, text: "Altar of burnt offering" },
];

function TabernacleArt() {
  const [gateLeft] = cubits(15, 100), [gateRight, foot] = cubits(35, 100);
  return <figure className="hm7-plan">
    <svg viewBox="0 0 640 1120" aria-hidden="true">
      <rect className="hm7-court" x={LEFT} y={TOP} width={50 * CUBIT} height={100 * CUBIT} />
      <path className="hm7-dimension" d={`M28 ${TOP}V${foot}M22 ${TOP}H34M22 ${foot}H34M${LEFT} 22H${LEFT + 500}M${LEFT} 16V28M${LEFT + 500} 16V28`} />
      <text className="hm7-label hm7-label-centre" x="22" y={TOP + 500} transform={`rotate(-90 22 ${TOP + 500})`}>100 CUBITS</text>
      <text className="hm7-label hm7-label-centre" x={LEFT + 250} y="14">50 CUBITS · WEST</text>
      <path className="hm7-linen" d={`M${gateLeft} ${foot}H${LEFT}V${TOP}H${LEFT + 500}V${foot}H${gateRight}`} />
      {YARN.map((colour, index) => <line className={`hm7-yarn hm7-yarn-${colour}`} x1={gateLeft} x2={gateRight} y1={foot - 6 + index * 6} y2={foot - 6 + index * 6} key={colour} />)}
      {POSTS.map(([across, down], index) => { const [x, y] = cubits(across, down); return <circle className="hm7-post" cx={x} cy={y} r="4.5" style={{ animationDelay: `${index * 18}ms` }} key={`${across}-${down}`} />; })}
      <g className="hm7-tent">
        <rect className="hm7-tent-cloth" x={cubits(20, 20)[0]} y={cubits(20, 20)[1]} width={10 * CUBIT} height={30 * CUBIT} />
        {YARN.map((colour, index) => <rect className={`hm7-yarn hm7-yarn-${colour}`} x={cubits(20, 20)[0] + 4 + index * 4} y={cubits(20, 20)[1] + 4 + index * 4} width={10 * CUBIT - 8 - index * 8} height={30 * CUBIT - 8 - index * 8} key={colour} />)}
        {YARN.map((colour, index) => <line className={`hm7-yarn hm7-yarn-${colour}`} x1={cubits(20, 30)[0] + 14} x2={cubits(30, 30)[0] - 14} y1={cubits(20, 30)[1] - 4 + index * 4} y2={cubits(20, 30)[1] - 4 + index * 4} key={`veil-${colour}`} />)}
        <rect className="hm7-gold" x="297.5" y="292.5" width="25" height="15" /><rect className="hm7-gold" x="305" y="360" width="10" height="10" />
        <rect className="hm7-gold" x="335" y="420" width="10" height="20" />
        <g className="hm7-gold-line">{[-9, -6, -3, 0, 3, 6, 9].map((dx) => <circle cx={282 + dx} cy={430 - Math.abs(dx) * 0.6} r="1.8" key={dx} />)}<path d="M273 426Q282 440 291 426M282 438V446" /></g>
      </g>
      <circle className="hm7-basin" cx="310" cy="670" r="16" />
      <g className="hm7-altar"><rect x="285" y="765" width="50" height="50" /><path d="M295 765V815M305 765V815M315 765V815M325 765V815M285 775H335M285 785H335M285 795H335M285 805H335" />{[[285, 765], [335, 765], [285, 815], [335, 815]].map(([x, y]) => <rect className="hm7-horn" x={x - 4} y={y - 4} width="8" height="8" key={`${x}-${y}`} />)}</g>
      {LABELS.map((label) => <g className="hm7-callout" key={label.text}><path d={`M${label.at[0] + 22} ${label.y}H392`} /><text className="hm7-label" x="398" y={label.y + 3}>{label.text.toUpperCase()}</text></g>)}
      <text className="hm7-label hm7-label-centre" x={LEFT + 250} y={foot + 34}>THE GATE · EAST, TOWARD THE SUNRISE</text>
    </svg>
    <figcaption>The court’s measures are Exodus 27’s; the tent’s place in it follows the usual reconstruction.</figcaption>
  </figure>;
}

const LAMP_Y = 140, SHAFT = 500, RADII = [110, 215, 320];
const turnToward = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI + 90;

/** A cup shaped like an almond blossom with its bud, its mouth turned the way the branch grows. */
function Cup({ x, y, turn }: { x: number; y: number; turn: number }) {
  return <g transform={`translate(${fixed(x)} ${fixed(y)}) rotate(${fixed(turn)})`}><path className="hm7-cup" d="M0 6C-9 0-10-12-5-21C-2-16 2-16 5-21C10-12 9 0 0 6Z" /><circle className="hm7-knop" cy="13" r="5.5" /></g>;
}

function LampstandArt() {
  const lamps = [SHAFT, ...RADII.flatMap((radius) => [SHAFT - radius, SHAFT + radius])].sort((a, b) => a - b);
  const cups = RADII.flatMap((radius) => [0.32, 0.56, 0.8].flatMap((share) => {
    const angle = Math.PI / 2 + (Math.PI / 2) * share, x = Math.cos(angle) * radius, y = LAMP_Y + Math.sin(angle) * radius, turn = turnToward(-Math.sin(angle), Math.cos(angle));
    return [{ x: SHAFT + x, y, turn }, { x: SHAFT - x, y, turn: -turn }];
  }));
  return <figure className="hm7-lampstand">
    <svg viewBox="0 0 1000 680" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="hm7-gold" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="680"><stop offset="0" stopColor="#f6d98f" /><stop offset=".5" stopColor="#d9a845" /><stop offset="1" stopColor="#9c6f1f" /></linearGradient>
        <radialGradient id="hm7-halo"><stop offset="0" stopColor="var(--accent)" stopOpacity=".45" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={SHAFT} cy={LAMP_Y - 20} rx="460" ry="150" fill="url(#hm7-halo)" opacity=".35" />
      {RADII.map((radius) => <path className="hm7-branch" d={`M${SHAFT - radius} ${LAMP_Y}A${radius} ${radius} 0 0 0 ${SHAFT + radius} ${LAMP_Y}`} key={radius} />)}
      <path className="hm7-branch hm7-shaft" d={`M${SHAFT} ${LAMP_Y}V600`} />
      <path className="hm7-base" d="M412 652L462 604H538L588 652ZM392 652H608V664H392Z" />
      {cups.map((cup) => <Cup {...cup} key={`${fixed(cup.x)}-${fixed(cup.y)}`} />)}
      {[196, 306, 412, 540].map((y) => <Cup x={SHAFT} y={y} turn={0} key={y} />)}
      {lamps.map((x, index) => <g className="hm7-lamp" key={x}>
        <circle cx={x} cy={LAMP_Y - 34} r="44" fill="url(#hm7-halo)" />
        <path className="hm7-lamp-bowl" d={`M${x - 24} ${LAMP_Y - 4}C${x - 16} ${LAMP_Y + 10} ${x + 16} ${LAMP_Y + 10} ${x + 24} ${LAMP_Y - 4}L${x + 30} ${LAMP_Y - 10}L${x + 18} ${LAMP_Y - 7}Z`} />
        <path className="hm7-flame" style={{ animationDelay: `${index * 0.37}s` } as CSSProperties} d={`M${x} ${LAMP_Y - 10}C${x - 11} ${LAMP_Y - 20} ${x - 6} ${LAMP_Y - 42} ${x} ${LAMP_Y - 58}C${x + 6} ${LAMP_Y - 42} ${x + 11} ${LAMP_Y - 20} ${x} ${LAMP_Y - 10}Z`} />
      </g>)}
    </svg>
    <figcaption>“three on one side and three on the other” · <Link to="/read/bsb/EXO/25?hl=32">Exodus 25:32</Link></figcaption>
  </figure>;
}

const VIEWS: Record<Opening7Id, (props: OpeningProps) => JSX.Element> = {
  a: (props) => <><section className="home-hero home-wrap hm7-row" aria-labelledby="home-title"><OpeningCopy {...props} /><TabernacleArt /></section><GoldMarquee /></>,
  b: (props) => <><section className="hm7-stage hm7-b" aria-labelledby="home-title"><OpeningCopy {...props} /><LampstandArt /></section><GoldMarquee /></>,
  c: (props) => <><section className="hm7-stage hm7-c" aria-labelledby="home-title"><VineArt /><OpeningCopy {...props} /></section><GoldMarquee /></>,
  d: (props) => <><section className="hm7-stage hm7-d" aria-labelledby="home-title"><PillarsArt /><OpeningCopy {...props} /></section><GoldMarquee /></>,
};

export function Opening7({ version, ...props }: OpeningProps & { version: Opening7Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
