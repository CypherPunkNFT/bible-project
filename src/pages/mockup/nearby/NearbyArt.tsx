// MOCK-UP (/close_to_home_mockup): drawings for the left of the centred "Close to home" opening, beside the approved Help
// for life morning on the right (owner, 2026-10-23: "2x2 grid of something that looks great just like the help for life
// right drawing"). From the first four the owner chose the village; the second four are in its spirit with no chapel
// ("lets do another set of 4 but no chapels now"), then four about community rather than buildings ("focused on community not buidings"). Built from the morning's own parts (art-parts.tsx), so they share its
// palette and its slow living motion.
import type { ComponentType } from "react";
import { Church, Cloud, Fire, Flock, Foreground, Frame, Ground, House, Person, Ripples, Tree } from "./art-parts";

/** The owner's pick from the first four: a village around its church, a river catching the light. */
function Village() {
  return <Frame>
    <Cloud x={10} y={18} s={0.62} kind="mid" /><Cloud x={200} y={26} s={0.8} kind="near" /><Cloud x={150} y={4} s={0.45} kind="small" />
    <Flock x={70} y={44} s={0.66} delay={-20} />
    <Ground d="M8 100Q50 84 96 94Q140 104 180 90Q228 76 272 94" kind="land-far" />
    <Ground d="M8 118Q60 108 110 114Q170 120 220 110Q250 106 272 112" kind="land-far" />
    <Ground d="M8 136Q90 131 140 134Q200 137 272 132" kind="land-fine" />
    <House x={30} w={18} h={14} base={135} lit /><House x={56} w={22} h={17} base={134} smoke /><House x={84} w={16} h={12} base={134} lit />
    <House x={184} w={20} h={15} base={135} lit /><House x={210} w={24} h={18} base={135} /><House x={240} w={18} h={13} base={133} lit />
    <Church x={140} base={134} tall={50} />
    <Tree x={20} y={135} s={0.26} /><Tree x={106} y={134} s={0.3} /><Tree x={174} y={135} s={0.32} /><Tree x={264} y={133} s={0.28} />
    <path d="M8 146Q100 140 150 146T272 144" className="river-edge" />
    <Ripples rows={[[127, 153, 26, true], [123, 162, 34, true], [117, 172, 46, true], [26, 156, 64], [188, 157, 60], [36, 171, 54], [194, 173, 52]]} />
    <Foreground line="M8 188Q57 175 93 189Q121 199 159 190Q219 177 272 186" />
  </Frame>;
}

/** Families on blankets on a hill under a great tree, a basket between them, a child flying a kite. */
function Picnic() {
  return <Frame>
    <Cloud x={150} y={14} s={0.62} kind="far" /><Cloud x={228} y={34} s={0.42} kind="small" />
    <Flock x={120} y={50} s={0.6} delay={-12} />
    <Ground d="M8 104Q50 92 96 98Q140 104 180 94Q228 84 272 96" kind="land-far" />
    <Ground d="M8 152Q70 122 140 114Q200 108 240 118Q260 124 272 128" />
    <Tree x={212} y={114} s={0.95} />
    <g className="na-kite"><path d="M98 125Q84 98 72 70" className="land-fine" />
      <path d="M72 50L80 60L72 72L64 60Z" className="na-light" /><path d="M64 60H80M72 50V72" className="na-gold" /><path d="M72 72q-4 6 0 10t0 10" className="na-gold" /></g>
    <Person x={86} y={140} /><Person x={100} y={137} s={0.7} />
    <path d="M114 128L158 123L168 133L122 139Z" className="na-blanket" />
    <Person x={128} y={133} sit /><Person x={148} y={130} sit /><Person x={160} y={133} s={0.72} sit />
    <path d="M136 126h9l-1 5h-7ZM137 126q3.5-4 7 0" className="na-rail" />
    <path d="M180 118L212 115L219 123L186 126Z" className="na-blanket" />
    <Person x={192} y={122} s={0.9} sit /><Person x={208} y={120} s={0.9} sit />
    <Foreground line="M8 191Q57 180 93 193Q121 201 159 193Q219 181 272 189" />
  </Frame>;
}

/** People walking a path together through the fields, hand in hand, more of them further along. */
function Walking() {
  const hands = (y: number, xs: number[], s: number) => xs.slice(1).map((x, i) => `M${xs[i] + 5 * s} ${y - 12 * s}L${x - 5 * s} ${y - 12 * s}`).join("");
  return <Frame>
    <Cloud x={14} y={20} s={0.7} kind="near" /><Cloud x={196} y={14} s={0.8} kind="mid" />
    <Flock x={90} y={44} s={0.62} delay={-4} />
    <Ground d="M8 100Q56 86 104 94Q150 102 196 90Q236 82 272 94" kind="land-far" />
    <Ground d="M8 120Q70 108 140 112Q210 116 272 106" />
    <Tree x={52} y={118} s={0.42} /><Tree x={72} y={120} s={0.28} /><Tree x={226} y={110} s={0.4} /><Tree x={244} y={109} s={0.26} />
    <path d="M118 192C128 170 156 160 148 140S136 118 146 110M162 192C166 172 186 160 174 140S156 118 152 110" className="land-fine" />
    <path d={hands(129, [146, 154], 0.55)} className="na-rail" />
    <Person x={146} y={129} s={0.55} delay={0} /><Person x={154} y={129} s={0.55} delay={-0.4} />
    <path d={hands(172, [138, 156, 172], 1.05)} className="na-rail" />
    <Person x={138} y={172} s={1.05} delay={-0.2} /><Person x={156} y={172} s={0.7} delay={-0.6} /><Person x={172} y={172} s={1.1} delay={-1} />
    <Person x={186} y={169} delay={-0.8} />
    <Foreground line="M8 192Q57 181 93 193Q121 201 159 194Q219 181 272 190" />
  </Frame>;
}

/** A circle of people seated around a fire by the lake, its flame flickering and sparks rising. */
function Fireside() {
  return <Frame>
    <Cloud x={20} y={16} s={0.6} kind="far" /><Cloud x={204} y={24} s={0.56} kind="small" />
    <Flock x={150} y={44} s={0.55} delay={-22} />
    <Ground d="M8 104Q60 90 110 98Q170 106 220 94Q250 88 272 96" kind="land-far" />
    <Tree x={40} y={110} s={0.3} /><Tree x={232} y={102} s={0.32} />
    <path d="M8 114H272" className="river-edge" />
    <Ripples rows={[[120, 122, 40, true], [20, 124, 70], [184, 125, 70], [60, 132, 50], [170, 134, 60]]} />
    <Ground d="M8 140Q90 132 150 136Q220 140 272 134" />
    <Person x={112} y={160} s={0.82} sit /><Person x={128} y={156} s={0.78} sit /><Person x={154} y={156} s={0.78} sit /><Person x={170} y={160} s={0.82} sit />
    <Fire x={141} y={172} />
    <Person x={92} y={178} s={1.08} sit /><Person x={192} y={178} s={1.08} sit /><Person x={210} y={176} s={0.72} sit />
    <Foreground line="M8 193Q57 183 93 195Q121 203 159 196Q219 183 272 191" />
  </Frame>;
}

/** A long table set in a meadow, people seated along it, bread and cups, lights strung between two trees. */
function LongTable() {
  const bulbs = Array.from({ length: 9 }, (_, i) => { const t = (i + 1) / 10, u = 1 - t; return [u * u * 52 + 2 * t * u * 140 + t * t * 228, u * u * 98 + 2 * t * u * 132 + t * t * 98]; });
  return <Frame>
    <Cloud x={88} y={10} s={0.6} kind="mid" /><Cloud x={176} y={26} s={0.42} kind="small" />
    <Flock x={100} y={40} s={0.55} delay={-16} />
    <Ground d="M8 112Q60 98 110 106Q170 114 220 100Q250 94 272 102" kind="land-far" />
    <Ground d="M8 136Q80 128 140 132Q210 136 272 128" />
    <Tree x={34} y={150} s={0.95} /><Tree x={246} y={148} s={0.95} />
    <path d="M52 98Q140 132 228 98" className="land-fine" />
    {bulbs.map(([x, y], i) => <circle key={i} cx={x} cy={y + 2} r="1.9" className="na-light" style={{ animationDelay: `${-i * 0.7}s` }} />)}
    {[82, 100, 118, 136, 154, 172, 190].map((x, i) => <Person key={x} x={x} y={162} s={i === 4 ? 0.72 : 0.95} sit />)}
    <path d="M70 158H202L208 166H64Z" className="na-building" />
    <path d="M70 166V178M202 166V178M64 166v3M208 166v3" className="land" />
    <path d="M86 164q0-3 4.5-3q4.5 0 4.5 3M150 164q0-3 4.5-3q4.5 0 4.5 3M113 160h4q0 3-2 4q-2-1-2-4ZM175 160h4q0 3-2 4q-2-1-2-4ZM129 163h8M193 163h6" className="na-gold" />
    <Foreground line="M8 192Q57 181 93 193Q121 201 159 194Q219 181 272 190" />
  </Frame>;
}

export const PICKED = { id: "village", name: "The village", Art: Village,
  note: "Your pick from the first four: houses gathered around their church in a valley, lights in the windows, smoke rising, the river catching the church's light." };

export const NEARBY_ART: { id: string; name: string; note: string; Art: ComponentType }[] = [
  { id: "picnic", name: "The picnic", Art: Picnic,
    note: "Families on blankets on a hill under a great tree, a basket between them, and a child flying a kite that sways in the wind." },
  { id: "walking", name: "Walking together", Art: Walking,
    note: "People walking a path through the fields hand in hand, a child between them, more of them further along the way." },
  { id: "fireside", name: "Around the fire", Art: Fireside,
    note: "A circle of people seated around a fire by the lake, the flame flickering, sparks rising, its glow on the water behind." },
  { id: "long-table", name: "The long table", Art: LongTable,
    note: "A long table set in a meadow, people seated all along it with bread and cups, lights strung between two trees twinkling above." },
];
