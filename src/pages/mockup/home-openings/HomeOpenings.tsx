// MOCK-UP: four openings for the homepage on /home_mockup3 (owner, 2026-10-30), built from the owner's three favourites: the
// sun of The hope to come mock-up (design/the-hope-to-come-horizon: js/land.js RISING_SUN, js/scenes.js road), the manuscript
// drawings of Surviving Witnesses and Manuscripts, and the gold marquee. The rest of the page stays the real homepage.
import { ArrowRight, BookOpen } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { HeroArt } from "@/pages/study/manuscripts/HeroArt";
import "@/pages/study/manuscripts/manuscripts.css";
import "./home-openings.css";

export const OPENINGS = [
  { id: "a", name: "Sunrise" },
  { id: "b", name: "The road" },
  { id: "c", name: "The witness" },
  { id: "d", name: "Dawn on the page" },
] as const;
export type OpeningId = (typeof OPENINGS)[number]["id"];

export interface OpeningProps {
  resume: string;
  resumeLabel: string;
  versions: number;
  languages: number;
}

// Every phrase is the Berean Standard Bible's own wording.
export const MARQUEE = ["In the beginning was the Word", "The Word became flesh", "Come and see", "Your word is a lamp to my feet", "Taste and see that the LORD is good", "The truth will set you free", "All Scripture is God-breathed", "Your word is truth", "Faith comes by hearing", "Always be prepared to give a defense", "Carry one another's burdens", "The word of our God stands forever", "Behold, I make all things new"];

export function GoldMarquee() {
  const run = (key: string) => <div className="hm3-marquee-run" key={key}>{MARQUEE.map((words) => <span key={words}>{words}</span>)}</div>;
  return <div className="hm3-marquee" aria-hidden="true"><div className="hm3-marquee-track">{run("first")}{run("second")}</div></div>;
}

/** The line sun of The hope to come's section 01: rays of four lengths and three dotted rings. */
function raysPaths() {
  const [cx, cy] = [800, 600];
  const rays: [string[], string[]] = [[], []];
  for (let i = 0; i < 96; i += 1) {
    const angle = (i * Math.PI * 2) / 96, cos = Math.cos(angle), sin = Math.sin(angle);
    const edge = 1 / Math.hypot(cos / 780, sin / 270), reach = Math.min(edge, i % 8 === 0 ? 900 : i % 4 === 0 ? 700 : i % 2 === 0 ? 420 : 270);
    rays[i % 4 === 0 ? 0 : 1].push(`M${(cx + cos * 131).toFixed(1)} ${(cy + sin * 131).toFixed(1)}L${(cx + cos * reach).toFixed(1)} ${(cy + sin * reach).toFixed(1)}`);
  }
  return { long: rays[0].join(""), fine: rays[1].join("") };
}
const RAYS = raysPaths();

function LineSun() {
  return <svg className="hm3-line-sun" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path className="hm3-ray-long" d={RAYS.long} /><path className="hm3-ray-fine" d={RAYS.fine} />
    <circle className="hm3-sun-fill" cx="800" cy="600" r="110" /><circle className="hm3-sun-line" cx="800" cy="600" r="110" /><circle className="hm3-sun-line hm3-faint" cx="800" cy="600" r="122" />
    {[175, 244, 315].map((r) => <circle className="hm3-ring" cx="800" cy="600" r={r} key={r} />)}
  </svg>;
}

/** Reading VI's view: the sun beyond the hills, and the road winding towards it past the milestones. */
function roadParts() {
  const SUN = [800, 178], beams: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    const angle = (i * Math.PI * 2) / 36, side = (Math.PI / 36) * 0.34, reach = i % 3 === 0 ? 215 : i % 3 === 1 ? 190 : 138;
    const point = (turn: number, far: number) => `${(SUN[0] + Math.cos(turn) * far).toFixed(1)} ${(SUN[1] + Math.sin(turn) * far).toFixed(1)}`;
    beams.push(`M${point(angle - side, 74)}L${point(angle, reach)}L${point(angle + side, 74)}Z`);
  }
  const at = (depth: number) => ({ x: 800 + Math.sin(depth * Math.PI * 1.7) * (34 + depth * 150), y: 196 + Math.pow(depth, 1.3) * 106, half: 4 + Math.pow(depth, 1.55) * 250 });
  const left: string[] = [], right: string[] = [], stones: string[] = [];
  const dashes: { d: string; width: string }[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const { x, y, half } = at(i / 40);
    left.push(`${(x - half).toFixed(1)} ${y.toFixed(1)}`);
    right.unshift(`${(x + half).toFixed(1)} ${y.toFixed(1)}`);
  }
  for (let depth = 0.05; depth < 0.98; depth += 0.035 + depth * 0.05) {
    const from = at(depth), to = at(depth + 0.02 + depth * 0.03);
    dashes.push({ d: `M${from.x.toFixed(1)} ${from.y.toFixed(1)}L${to.x.toFixed(1)} ${to.y.toFixed(1)}`, width: (1 + depth * 6).toFixed(1) });
  }
  [0.16, 0.3, 0.46, 0.64, 0.84].forEach((depth) => {
    const { x, y, half } = at(depth), tall = 4 + depth * 26, wide = 3 + depth * 13;
    [x - half - wide * 2.2, x + half + wide * 1.2].forEach((spot) => stones.push(`M${spot.toFixed(1)} ${y.toFixed(1)}v${(-tall).toFixed(1)}a${(wide / 2).toFixed(1)} ${(wide / 2).toFixed(1)} 0 0 1 ${wide.toFixed(1)} 0v${tall.toFixed(1)}z`));
  });
  return { beams: beams.join(""), edgeLeft: `M${left.join("L")}`, edgeRight: `M${right.join("L")}`, road: `M${left.join("L")}L${right.join("L")}Z`, dashes, stones: stones.join("") };
}
const ROAD = roadParts();

function RoadScene() {
  return <svg className="hm3-road-scene" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g className="hm3-spin"><path className="hm3-beam" d={ROAD.beams} /></g><circle className="hm3-sun-solid" cx="800" cy="178" r="62" />
    <path className="hm3-far" d="M0 300V168C90 150 170 176 270 150S430 112 540 146 700 182 820 150 1010 104 1140 140 1330 182 1440 152 1560 138 1600 150V300Z" />
    <path className="hm3-mid" d="M0 300V232C120 214 240 244 380 226S620 198 780 228 1040 256 1180 228 1460 206 1600 230V300Z" />
    <path className="hm3-near" d="M0 300V216C300 200 560 196 800 194S1300 200 1600 216V300Z" />
    <path className="hm3-road" d={ROAD.road} /><path className="hm3-edge" d={ROAD.edgeLeft} /><path className="hm3-edge" d={ROAD.edgeRight} />
    <g className="hm3-dash">{ROAD.dashes.map((dash) => <path d={dash.d} strokeWidth={dash.width} key={dash.d} />)}</g>
    <path className="hm3-stones" d={ROAD.stones} />
  </svg>;
}

/** The two sheets of Surviving Witnesses' opening (its Folio drawing): a four-column leaf behind, a fragment of it in front. */
function Folio({ kind }: { kind: "columns" | "fragment" }) {
  const id = useId().replace(/:/g, "");
  const shape = kind === "fragment" ? "M105 78 L180 63 211 90 200 124 224 153 202 213 162 232 130 205 98 212 83 157 105 132Z" : "M62 35 Q150 24 242 37 L242 261 Q151 248 62 261Z";
  const cols = kind === "columns" ? 4 : 2, width = 154 / cols;
  return <svg viewBox="0 0 310 300" className="hm3-folio" aria-hidden="true">
    <defs><linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity=".06" /></linearGradient><clipPath id={`${id}-clip`}><path d={shape} /></clipPath></defs>
    <g transform="translate(9 9)"><path d={shape} fill="none" stroke="currentColor" opacity=".16" /></g>
    <rect x="44" y="19" width="216" height="260" rx="3" fill="none" stroke="currentColor" strokeDasharray="2 7" opacity=".16" />
    <path d={shape} fill={`url(#${id}-paper)`} stroke="currentColor" strokeOpacity=".65" />
    <g clipPath={`url(#${id}-clip)`}>{Array.from({ length: 27 }, (_, r) => Array.from({ length: cols }, (_, c) => <path key={`${c}-${r}`} d={`M${76 + c * width} ${57 + r * 7} h${width - 8 - ((r * 7 + c * 3) % 9)}`} stroke="currentColor" strokeWidth={1.4} strokeDasharray="7 2 4 1" opacity={0.36 + (r % 4) * 0.12} />))}</g>
    <path d="M27 35h10m-5-5v10M273 263h10m-5-5v10" stroke="currentColor" opacity=".5" />
  </svg>;
}

function WitnessArt() {
  return <div className="hm3-witness" aria-hidden="true">
    <div className="hm3-orbit hm3-orbit-one" /><div className="hm3-orbit hm3-orbit-two" />
    <span className="hm3-witness-label">THE PHYSICAL TRACE</span>
    <div className="hm3-sheet hm3-sheet-back"><Folio kind="columns" /></div><div className="hm3-sheet hm3-sheet-front"><Folio kind="fragment" /></div>
    <span className="hm3-witness-note"><i />A surviving part.<br /><span>A larger story.</span></span>
    <small>Illustrative forms · not manuscript facsimiles</small>
  </div>;
}

export function OpeningCopy({ resume, resumeLabel, versions, languages }: OpeningProps) {
  return <div className="home-hero-copy">
    <p className="home-eyebrow"><span className="home-live-dot" />The Bible, open to you</p>
    <h1 id="home-title">One Word.<br /><em>A world to<br className="home-hero-break" /> discover.</em></h1>
    <p className="home-hero-lead">Read the Scriptures. Follow the connections.<br />Bring your questions. See the bigger story.</p>
    <div className="home-hero-actions"><Link className="home-button" to={resume}><BookOpen size={17} aria-hidden />{resumeLabel}<ArrowRight size={17} aria-hidden /></Link></div>
    <p className="home-hero-foot">Free to explore. Open to everyone.<span>{versions} Bible versions · {languages} languages</span></p>
  </div>;
}

/** The sun at the foot of the first screen and the title standing in its rays, under the marquee. */
function SunriseOpening(props: OpeningProps) {
  return <><GoldMarquee /><section className="home-hero hm3-a" aria-labelledby="home-title"><LineSun /><OpeningCopy {...props} /></section></>;
}

/** Title in the sky, a verse across from it, and the land below with the sun beyond the hills; the marquee is the land's foot. */
function RoadOpening(props: OpeningProps) {
  return <><section className="home-hero hm3-b" aria-labelledby="home-title">
    <div className="hm3-b-sky home-wrap"><OpeningCopy {...props} />
      <figure className="hm3-verse"><blockquote>“Your word is a lamp to my feet and a light to my path.”</blockquote><figcaption><Link to="/read/bsb/PSA/119?hl=105">Psalm 119:105</Link> · Berean Standard Bible</figcaption></figure>
    </div>
    <RoadScene />
  </section><GoldMarquee /></>;
}

/** The homepage as it stands, with the surviving leaf where the open Bible was and the marquee under it. */
function WitnessOpening(props: OpeningProps) {
  return <><section className="home-hero home-wrap hm3-c" aria-labelledby="home-title"><OpeningCopy {...props} /><WitnessArt /></section><GoldMarquee /></>;
}

/** All three together: scroll, leaf and fragment with the line sun rising behind them. */
function DawnOpening(props: OpeningProps) {
  return <><section className="hm3-d" aria-labelledby="home-title"><div className="hm3-d-sun"><LineSun /></div>
    <div className="home-hero home-wrap hm3-d-row"><OpeningCopy {...props} /><div className="ms-root hm3-d-art"><HeroArt /></div></div>
  </section><GoldMarquee /></>;
}

const VIEWS: Record<OpeningId, (props: OpeningProps) => JSX.Element> = { a: SunriseOpening, b: RoadOpening, c: WitnessOpening, d: DawnOpening };

export function HomeOpening({ version, ...props }: OpeningProps & { version: OpeningId }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
