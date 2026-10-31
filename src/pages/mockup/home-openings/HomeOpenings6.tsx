// MOCK-UP: four openings for /home_mockup6 (owner, 2026-10-30: "wildly different but cohesive and visually beautiful - think
// symmetry and simplicity with complexity and beauty"). One language for both: the title on the centre line, fine gold lines,
// perfect symmetry, and each drawing made by repeating one simple rule until it becomes intricate. The gate: arches nested
// inside one another, the marquee running over the outermost. The city: Revelation 21's foursquare plan. The ring (A) and four
// corners (C) were taken out on the owner's word, 2026-10-30; a copy of all four is in design/home-openings-6-removed/.
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { GoldMarquee, MARQUEE, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import "./home-openings6.css";

export const OPENINGS_6 = [
  { id: "b", name: "The gate" },
  { id: "d", name: "The city" },
] as const;
export type Opening6Id = (typeof OPENINGS_6)[number]["id"];

const fixed = (value: number) => value.toFixed(1);
const stillMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A pointed arch of span `span`, its arcs struck from radius 0.62 of the span; also points along it for beads. */
function arch(span: number, spring: number, bottom: number) {
  const radius = span * 0.62, left = 500 - span / 2, sweep = Math.acos((radius - span / 2) / radius), apex = spring - Math.sqrt(radius ** 2 - (radius - span / 2) ** 2);
  const along = (share: number) => { const angle = Math.PI + sweep * share; return [left + radius + Math.cos(angle) * radius, spring + Math.sin(angle) * radius]; };
  const beads: [number, number][] = [];
  for (let k = 1; k < 16; k += 1) { const [x, y] = along(k / 16); beads.push([x, y], [1000 - x, y]); }
  for (let y = spring + 34; y < bottom; y += 34) beads.push([left, y], [1000 - left, y]);
  return { d: `M${fixed(left)} ${bottom}L${fixed(left)} ${spring}A${fixed(radius)} ${fixed(radius)} 0 0 1 500 ${fixed(apex)}A${fixed(radius)} ${fixed(radius)} 0 0 1 ${fixed(1000 - left)} ${spring}L${fixed(1000 - left)} ${bottom}`, beads };
}
const ARCH_KINDS = ["solid", "hair", "beads", "hair", "dots", "hair", "solid", "hair", "beads", "solid"];
const ARCHES = ARCH_KINDS.map((kind, index) => ({ kind, ...arch(940 - index * 38, 600, 900) }));
const GATE_RUN = MARQUEE.join("  ✦  ") + "  ✦  ";

function GateArt() {
  const measure = useRef<SVGTextElement>(null);
  const [run, setRun] = useState(0);
  useLayoutEffect(() => {
    const read = () => setRun(measure.current?.getComputedTextLength() ?? 0);
    read();
    document.fonts?.ready.then(read).catch((error: unknown) => console.error("home_mockup6: fonts did not finish loading for the gate's lettering", error));
  }, []);
  return <svg className="hm6-art hm6-gate" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <path className="hm6-gate-door" d={`${ARCHES[ARCHES.length - 1].d}Z`} />
    {ARCHES.map((item, index) => <g className={`hm6-arch hm6-arch-${item.kind}`} style={{ animationDelay: `${index * 90}ms` } as CSSProperties} key={item.d}>
      <path d={item.d} id={index === 0 ? "hm6-gate-outer" : undefined} />
      {item.kind === "beads" && item.beads.map(([x, y]) => <circle cx={fixed(x)} cy={fixed(y)} r="3.2" key={`${fixed(x)}-${fixed(y)}`} />)}
    </g>)}
    <text className="hm6-gate-text" ref={measure} visibility="hidden">{GATE_RUN}</text>
    {run > 0 && <text className="hm6-gate-text" dy="-9"><textPath href="#hm6-gate-outer" startOffset={stillMotion() ? 0 : -run}>{GATE_RUN + GATE_RUN}{!stillMotion() && <animate attributeName="startOffset" from={-run} to={0} dur={`${Math.round(run / 30)}s`} repeatCount="indefinite" />}</textPath></text>}
  </svg>;
}

// Revelation 21:19-20, first foundation outermost.
const FOUNDATIONS = [["jasper", "#6f9a7e"], ["sapphire", "#2f5fa7"], ["chalcedony", "#8fb0c4"], ["emerald", "#2e8b57"], ["sardonyx", "#b5654a"], ["carnelian", "#b23a2e"], ["chrysolite", "#bcb441"], ["beryl", "#5fb4b4"], ["topaz", "#dfa636"], ["chrysoprase", "#5aa86a"], ["jacinth", "#d0703a"], ["amethyst", "#8b5fb5"]];
const GATES = [250, 500, 750].flatMap((along) => [[along, 70], [along, 930], [70, along], [930, along]]);

function CityArt() {
  return <svg className="hm6-art hm6-city" viewBox="0 0 1000 1000" aria-hidden="true">
    <defs><radialGradient id="hm6-lamp"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
    <rect className="hm6-city-ground" x="70" y="70" width="860" height="860" />
    <circle cx="500" cy="500" r="330" fill="url(#hm6-lamp)" />
    {FOUNDATIONS.map(([name, colour], index) => { const inset = 80 + index * 8; return <rect className="hm6-foundation" x={inset} y={inset} width={1000 - inset * 2} height={1000 - inset * 2} style={{ stroke: colour, animationDelay: `${index * 70}ms` }} key={name}><title>{`The ${["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"][index]} foundation: ${name}`}</title></rect>; })}
    <rect className="hm6-wall" x="70" y="70" width="860" height="860" />
    <path className="hm6-street" d="M500 70V172M500 828V930M70 500H172M828 500H930" />
    {[[70, 70], [930, 70], [70, 930], [930, 930]].map(([x, y]) => <rect className="hm6-tower" x={x - 16} y={y - 16} width="32" height="32" key={`${x}-${y}`} />)}
    {GATES.map(([x, y]) => <circle className="hm6-pearl" cx={x} cy={y} r="17" key={`${x}-${y}`} />)}
  </svg>;
}

const VIEWS: Record<Opening6Id, (props: OpeningProps) => JSX.Element> = {
  b: (props) => <section className="hm6-stage hm6-b" aria-labelledby="home-title"><GateArt /><OpeningCopy {...props} /><p className="hm6-note">“I am the gate.” · <Link to="/read/bsb/JHN/10?hl=9">John 10:9</Link></p></section>,
  d: (props) => <><section className="hm6-stage hm6-d" aria-labelledby="home-title"><CityArt /><OpeningCopy {...props} /><p className="hm6-note">“the twelve gates were twelve pearls” · <Link to="/read/bsb/REV/21?hl=21">Revelation 21:21</Link></p></section><GoldMarquee /></>,
};

export function Opening6({ version, ...props }: OpeningProps & { version: Opening6Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
