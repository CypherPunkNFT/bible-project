// The Apologetics hub's featured-collection artwork, drawn from the approved Islam collection card
// (art.tsx): the same mosque centrepiece and the same object catalogue, recomposed for the spotlight's
// taller slot and widened from four objects to six. The card's own 3:1 field stays as it is.
import { CardCenterpiece } from './centerpieces';
import { CardIslamObject } from './artifacts';
import './cards.css';

/** Flanking the mosque, three a side, by their catalogue numbers. */
const objects = [
  { number: 47, x: 78, y: 94, scale: .78 },
  { number: 45, x: 78, y: 208, scale: .76 },
  { number: 49, x: 78, y: 322, scale: .76 },
  { number: 52, x: 542, y: 94, scale: .74 },
  { number: 51, x: 542, y: 208, scale: .74 },
  { number: 48, x: 542, y: 322, scale: .72 },
];

/** Two squares turned against each other: the eight-point star the rest of the field repeats. */
function Star({ x, y, r, opacity = .5 }: { x: number; y: number; r: number; opacity?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <rect x={-r} y={-r} width={r * 2} height={r * 2} />
    <rect x={-r} y={-r} width={r * 2} height={r * 2} transform="rotate(45)" />
  </g>;
}

/**
 * A 31:21 field. The mosque sits inside the turning orbit; the objects sit outside it, so neither
 * crowds the other as the card narrows.
 */
export function IslamSpotlightArt() {
  return <svg className="ap-spotlight-wide wc-wide-islam" viewBox="0 0 620 420" fill="none" aria-hidden="true" focusable="false" data-world="islam">
    <circle className="wc-card-orbit" cx="310" cy="206" r="152" strokeDasharray="1 8" opacity=".62" />
    <circle className="wc-card-halo" cx="310" cy="206" r="138" opacity=".1" />
    <g className="wc-card-centerpiece" transform="translate(310 214) scale(.92) translate(-270 -190)"><CardCenterpiece world="islam" /></g>
    {objects.map((object) => <g className="wc-card-object" data-artifact={object.number} key={object.number}
      transform={`translate(${object.x} ${object.y}) scale(${object.scale})`}>
      <CardIslamObject number={object.number} />
    </g>)}
    <g className="wc-card-details" opacity=".32">
      <Star x={310} y={30} r={7} /><Star x={310} y={382} r={7} />
      <Star x={178} y={68} r={5} opacity={.36} /><Star x={442} y={344} r={5} opacity={.36} />
      <path d="M214 36q96-16 192 0M196 388q114 20 228 0" strokeDasharray="1 7" />
      <circle cx="78" cy="30" r="2" /><circle cx="542" cy="390" r="2" />
    </g>
  </svg>;
}
