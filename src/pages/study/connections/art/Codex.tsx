import { LINE_COUNT, textLine } from "./geometry";

const LAYERS = 5;
/** The one point at the foot of the spine where every edge along the bottom comes together. */
const FOOT = 100;

/** The page block's edges on one side, drawn for the left; the right is its mirror. Each layer runs down the slanted
 *  outer edge, then sweeps along the bottom to the foot of the spine. */
function PageEdges() {
  return (
    <>
      {Array.from({ length: LAYERS }, (_, i) => {
        const k = i + 1;
        const top = { x: -71 - 4.6 * k, y: -31 + 3.4 * k };
        const bottom = { x: top.x - 30, y: 49.4 + 3.2 * k };
        return (
          <g key={k} strokeWidth={k === LAYERS ? 1.3 : 0.8} opacity={k === LAYERS ? 1 : 0.85 - k * 0.08}>
            <path d={`M${top.x} ${top.y} L${bottom.x} ${bottom.y}`} />
            <path d={`M${bottom.x} ${bottom.y} C${bottom.x * 0.55} ${bottom.y + 2 + k * 0.6} ${bottom.x * 0.22} ${FOOT - 30 + k * 0.4} 0 ${FOOT}`} />
          </g>
        );
      })}
      <path d={`M${-71 - 4.6 * LAYERS} ${-31 + 3.4 * LAYERS} h7`} strokeWidth={1.3} />
    </>
  );
}

/** One page, drawn for the left; the right is its mirror: its top curling into the gutter, its outer edge slanting out
 *  as the page nears the reader, and its bottom edge sweeping down to the spine. */
function Page() {
  return <path d="M0 0 C-4 -18 -30 -31 -55 -31 H-71 L-101 49.4 C-70 50 -36 55 0 81 Z" strokeWidth={1.4} />;
}

/** An open Bible in line art, seen from the front and a little above, in the shape of the app icon: tall pages flaring out
 *  from the spine, a stack of page edges down each outer side that sweep together to one point under the spine, and ruled
 *  lines that arch across the pages. The origin is the top of the gutter. */
export function Codex() {
  const rows = Array.from({ length: LINE_COUNT }, (_, i) => i);
  return (
    <g>
      <PageEdges />
      <g transform="scale(-1 1)"><PageEdges /></g>
      <Page />
      <g transform="scale(-1 1)"><Page /></g>
      <path d={`M0 81 V${FOOT}`} strokeWidth={1} />
      {rows.map((i) => <path key={`l${i}`} d={textLine("L", i)} strokeWidth={0.8} opacity={0.6} />)}
      {rows.map((i) => <path key={`r${i}`} d={textLine("R", i)} strokeWidth={0.8} opacity={0.6} />)}
    </g>
  );
}
