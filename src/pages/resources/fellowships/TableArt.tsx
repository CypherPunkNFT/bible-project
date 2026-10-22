// Acts 2:42 as line art beside the Fellowships title, in the house style of Help for life's Door: an evening room, a lamp
// hanging over one long table, seven people around it, an open Bible in the lamp's light with a page that turns, bread
// and a cup whose steam rises, the moon and stars in the window and a verse on the wall. 320 × 240. Styles in
// fellowships.css (.fw-table); every motion loops slowly and holds still for anyone who asks for reduced motion.
import type { CSSProperties } from "react";

const BEHIND = [96, 128, 160, 192, 224];
const i = (n: number) => ({ "--i": String(n) }) as CSSProperties;

/** One person seated behind the table: head and shoulders; the table top hides the rest. */
function Seated({ x, n }: { x: number; n: number }) {
  return <g className="fwt-person" style={i(n)}>
    <path className="fwt-pf" d={`M${x - 17} 140C${x - 17} 120 ${x - 11} 112 ${x} 112C${x + 11} 112 ${x + 17} 120 ${x + 17} 140Z`} />
    <path d={`M${x - 17} 140C${x - 17} 120 ${x - 11} 112 ${x} 112C${x + 11} 112 ${x + 17} 120 ${x + 17} 140`} />
    <circle className="fwt-pf fwt-head" cx={x} cy={101} r={8.5} />
  </g>;
}

export function TableArt() {
  return <figure className="fw-table" aria-label="Line drawing: seven people gathered at one long table under a hanging lamp, an open Bible in its light, bread and a cup on the table, the moon and stars in the window">
    <svg viewBox="0 0 320 240" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <radialGradient id="fwt-glow">
          <stop offset="0" style={{ stopColor: "var(--c)", stopOpacity: "0.45" } as CSSProperties} />
          <stop offset=".55" style={{ stopColor: "var(--c)", stopOpacity: "0.14" } as CSSProperties} />
          <stop offset="1" style={{ stopColor: "var(--c)", stopOpacity: "0" } as CSSProperties} />
        </radialGradient>
      </defs>
      {/* The window: moon and stars. */}
      <rect x={24} y={38} width={58} height={64} rx={2} className="fwt-f" />
      <path className="fwt-f" d="M53 38V102M24 70H82" />
      <path className="fwt-moon" d="M43 47a8 8 0 1 0 7 12a6.5 6.5 0 1 1-7-12Z" />
      {[[68, 50, 0], [74, 86, 1], [34, 90, 2], [62, 62, 3], [40, 76, 4]].map(([x, y, n]) => <circle key={n} className="fwt-star" style={i(n)} cx={x} cy={y} r={1} />)}
      {/* A verse on the wall. */}
      <rect x={242} y={46} width={54} height={36} rx={2} className="fwt-f" />
      <path className="fwt-f" d="M250 57h38M250 64h30M250 71h34" />
      {/* The lamp and its light. */}
      <path d="M160 0V34" className="fwt-f" />
      <ellipse className="fwt-glow" cx={160} cy={58} rx={92} ry={70} fill="url(#fwt-glow)" stroke="none" />
      <path className="fwt-cone" d="M150 44L94 138H226L170 44Z" />
      <path className="fwt-shade" d="M146 44H174L167 33H153Z" />
      <circle className="fwt-bulb" cx={160} cy={47} r={3} />
      {/* The people at the ends, then those behind the table. */}
      <g className="fwt-person" style={i(5)}><path className="fwt-pf" d="M28 170C28 144 35 130 46 130C57 130 64 144 64 170Z" /><path d="M28 170C28 144 35 130 46 130C57 130 64 144 64 170" /><circle className="fwt-pf fwt-head" cx={46} cy={118} r={8.5} /></g>
      <g className="fwt-person" style={i(6)}><path className="fwt-pf" d="M256 170C256 144 263 130 274 130C285 130 292 144 292 170Z" /><path d="M256 170C256 144 263 130 274 130C285 130 292 144 292 170" /><circle className="fwt-pf fwt-head" cx={274} cy={118} r={8.5} /></g>
      {BEHIND.map((x, n) => <Seated key={x} x={x} n={n} />)}
      {/* The table. */}
      <path className="fwt-pf" d="M78 138H242L264 158H56Z" />
      <path d="M78 138H242L264 158H56ZM56 158V164H264V158M66 164V206M254 164V206M92 164V196M228 164V196" />
      <ellipse className="fwt-f" cx={160} cy={212} rx={124} ry={7} />
      <path className="fwt-f" d="M8 206H50M270 206H312" />
      {/* On the table: the open Bible in the light, its page turning; bread; a cup with steam. */}
      <ellipse cx={160} cy={150} rx={42} ry={9} fill="url(#fwt-glow)" stroke="none" className="fwt-glow" />
      <path className="fwt-book" d="M160 150C150 144 138 144 130 147V155C138 152 150 152 160 157ZM160 150C170 144 182 144 190 147V155C182 152 170 152 160 157Z" />
      <path className="fwt-lines" d="M136 150.5c6-1.5 12-1.5 18 .5M136 153.5c6-1.5 12-1.5 18 .5M166 151c6-2 12-2 18-.5M166 154c6-2 12-2 18-.5" />
      <path className="fwt-page" d="M160 150C170 144 182 144 190 147V155C182 152 170 152 160 157Z" />
      {[0, 1, 2, 3, 4].map((n) => <circle key={n} className="fwt-mote" style={i(n)} cx={150 + n * 5} cy={144} r={1} fill="currentColor" stroke="none" />)}
      <ellipse className="fwt-pf" cx={110} cy={148} rx={13} ry={5.5} />
      <path d="M104 146l3-3M110 146l3-3M116 146l3-3" />
      <path className="fwt-pf" d="M201 134H213L211 142C210 145 204 145 203 142Z" />
      <path d="M207 144V150M202 151H212" />
      <path className="fwt-steam" style={i(0)} d="M205 130c-3-4 3-6 0-10" />
      <path className="fwt-steam" style={i(1)} d="M210 130c-3-4 3-6 0-10" />
    </svg>
    <figcaption>“And they continued stedfastly in the apostles’ doctrine and fellowship, and in breaking of bread, and in prayers.”<cite>Acts 2:42</cite></figcaption>
  </figure>;
}
