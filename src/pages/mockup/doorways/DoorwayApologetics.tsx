// MOCK-UP: the Apologetics row of the doorway design sheet (/doorways_mockup). Owner, 2026-10-31: "Apologetics is
// alright." So the first drawing is today's orbit-and-cross, re-fit and enlarged to the taller frame; the other four are
// quieter relatives on the same theme of a reasoned defence: a shield, a balance, a keystone arch and a pillar.
import type { DoorwayVariant } from "./doorway-types";

const Node = ({ x, y }: { x: number; y: number }) => <g><circle cx={x} cy={y} r="9" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy={y} r="3" fill="currentColor" /></g>;

/** Voussoirs of a half-round arch about (160,128), inner radius 50, outer 76; the middle stone is the keystone. */
const STONES = Array.from({ length: 9 }, (_, i) => {
  const at = (r: number, a: number) => `${(160 + r * Math.cos(a)).toFixed(1)} ${(128 - r * Math.sin(a)).toFixed(1)}`;
  const a0 = Math.PI - (i * Math.PI) / 9, a1 = a0 - Math.PI / 9, outer = i === 4 ? 84 : 76;
  return `M${at(50, a0)}L${at(outer, a0)}A${outer} ${outer} 0 0 1 ${at(outer, a1)}L${at(50, a1)}A50 50 0 0 0 ${at(50, a0)}Z`;
});

function CurrentEnlarged() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <circle cx="160" cy="90" r="68" stroke="currentColor" opacity=".35" /><circle cx="160" cy="90" r="46" stroke="currentColor" strokeDasharray="2 5" opacity=".5" />
    <ellipse cx="160" cy="90" rx="158" ry="46" transform="rotate(-16 160 90)" stroke="currentColor" opacity=".5" />
    <path d="M160 14V44M38 127L119 104M282 127L201 104" stroke="currentColor" opacity=".4" /><path d="M145 73H175M160 61V107" stroke="currentColor" strokeWidth="2" />
    {[[160, 14], [30, 129], [290, 129]].map(([x, y]) => <Node key={x} x={x} y={y} />)}
    <g fill="currentColor" fontSize="9" letterSpacing="1.5" textAnchor="middle"><text x="34" y="157">REASON</text><text x="286" y="157">WITNESS</text></g>
  </svg>;
}

function Shield() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <circle cx="160" cy="86" r="80" stroke="currentColor" opacity=".18" /><circle cx="160" cy="86" r="66" stroke="currentColor" strokeDasharray="2 5" opacity=".4" />
    <path d="M22 86H86M234 86H298" stroke="currentColor" opacity=".35" />{[[22, 86], [298, 86]].map(([x, y]) => <Node key={x} x={x} y={y} />)}
    <g fill="currentColor" fontSize="8" letterSpacing="1.5" textAnchor="middle"><text x="40" y="112">REASON</text><text x="280" y="112">WITNESS</text></g>
    <path d="M106 22Q160 10 214 22V80Q214 132 160 160Q106 132 106 80Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d="M114 29Q160 19 206 29V80Q206 126 160 151Q114 126 114 80Z" fill="currentColor" fillOpacity=".06" stroke="currentColor" opacity=".45" />
    <path d="M160 44V128M134 72H186" stroke="currentColor" strokeWidth="2" />
    <path d="M90 150H230L222 159 230 168H90L98 159Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" />
    <text x="160" y="162" fill="currentColor" fontSize="8" letterSpacing="2" textAnchor="middle">1 PETER 3:15</text>
  </svg>;
}

function Scales() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <ellipse cx="160" cy="92" rx="150" ry="58" stroke="currentColor" opacity=".14" /><circle cx="160" cy="40" r="22" stroke="currentColor" strokeDasharray="2 5" opacity=".4" />
    <path d="M160 40V150" stroke="currentColor" strokeWidth="1.6" /><path d="M160 6V24M153 12H167" stroke="currentColor" strokeWidth="1.6" />
    <path d="M62 40H258" stroke="currentColor" strokeWidth="1.6" /><path d="M62 40L32 104M62 40L92 104M258 40L228 104M258 40L288 104" stroke="currentColor" opacity=".5" />
    <circle cx="160" cy="40" r="5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />{[62, 258].map((x) => <circle key={x} cx={x} cy="40" r="2.5" fill="currentColor" />)}
    <path d="M44 101Q53 94 62 99Q71 94 80 101V91Q71 85 62 90Q53 85 44 91ZM62 90V99" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.2" />
    <g fill="var(--surface)" stroke="currentColor" strokeWidth="1.2"><circle cx="247" cy="99" r="5" /><circle cx="258" cy="98" r="6" /><circle cx="269" cy="99" r="5" /><circle cx="252" cy="89" r="5" /><circle cx="264" cy="89" r="5" /></g>
    {[62, 258].map((x) => <path key={x} d={`M${x - 34} 104H${x + 34}Q${x} 132 ${x - 34} 104Z`} fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />)}
    <path d="M136 150H184L194 162H126ZM112 168H208" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.2" />
    <g fill="currentColor" fontSize="8" letterSpacing="1.5" textAnchor="middle"><text x="62" y="146">SCRIPTURE</text><text x="258" y="146">EVIDENCE</text></g>
  </svg>;
}

function Keystone() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M44 128A116 116 0 0 1 276 128" stroke="currentColor" opacity=".18" /><path d="M62 128A98 98 0 0 1 258 128" stroke="currentColor" strokeDasharray="2 5" opacity=".45" />
    <path d="M160 2V30" stroke="currentColor" opacity=".4" /><circle cx="160" cy="14" r="3" fill="currentColor" />
    {STONES.map((d, i) => <path key={i} d={d} fill={i === 4 ? "currentColor" : "var(--surface)"} fillOpacity={i === 4 ? .16 : 1} stroke="currentColor" strokeWidth={i === 4 ? 1.5 : 1.2} />)}
    <path d="M160 54V72M154 60H166" stroke="currentColor" strokeWidth="1.6" />
    <path d="M84 128H110V166H84ZM210 128H236V166H210Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.2" />
    <path d="M84 147H110M210 147H236" stroke="currentColor" opacity=".4" /><path d="M36 166H284" stroke="currentColor" strokeWidth="1.4" /><path d="M64 173H256" stroke="currentColor" opacity=".35" />
    <g fill="currentColor" fontSize="8" letterSpacing="1.5"><text x="74" y="152" textAnchor="end">REASON</text><text x="246" y="152">WITNESS</text></g>
  </svg>;
}

function Pillar() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <circle cx="160" cy="92" r="80" stroke="currentColor" opacity=".16" /><circle cx="160" cy="92" r="62" stroke="currentColor" strokeDasharray="2 5" opacity=".4" />
    <path d="M40 92H100M220 92H280" stroke="currentColor" opacity=".35" />
    <g fill="currentColor" fontSize="8" letterSpacing="1.5" textAnchor="middle"><text x="62" y="84">PILLAR</text><text x="254" y="84">FOUNDATION</text></g>
    <path d="M144 44H176L178 136H142Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M151 48V132M157 48V132M163 48V132M169 48V132" stroke="currentColor" opacity=".35" />
    <path d="M136 37Q160 50 184 37" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d="M128 28H192V37H128Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M160 4V22M154 10H166" stroke="currentColor" strokeWidth="1.6" />
    <path d="M138 136H182V142H138ZM134 142H186V148H134Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    {[[104, 148], [80, 156], [56, 164]].map(([x, y], i) => <path key={x} d={`M${x} ${y}H${320 - x}V${y + 8}H${x}Z`} fill="currentColor" fillOpacity={.05 + i * .04} stroke="currentColor" strokeWidth="1.2" />)}
    <path d="M24 176H296" stroke="currentColor" opacity=".3" />
  </svg>;
}

export const APOLOGETICS_DOORWAYS: DoorwayVariant[] = [
  { name: "Current, enlarged", Art: CurrentEnlarged },
  { name: "Shield of faith", Art: Shield },
  { name: "Scales of evidence", Art: Scales },
  { name: "Keystone arch", Art: Keystone },
  { name: "Pillar and foundation", Art: Pillar },
];
