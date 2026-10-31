// The three wise men on camels, walking along the top of the closing scroll as along the crest of a dune (owner, 2026-10-31:
// "add the three wise men on cammels ... same as the covenant study", then "THE WISE MEN ON THE SCROLL AS IF IT WERE A SAND
// DUNE"). The caravan of the covenant-signs study's "Count the stars" ground F (design/covenants-signs/js/
// drawings-stars-more.js, caravan()), drawn the same way with the same seed: nine camels in one line, every third with a
// rider, the faint lead ropes between them and the tracks under them. Here their ground is the scroll's back sheet: this
// drawing lies exactly over Scroll A (same view box, same fitting), the camels stand on that sheet's edge, and the line ends
// just short of the sun's outer ring, wherever the scroll has placed the sun.
import { useLayoutEffect, useRef, useState } from "react";

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const fixed = (n: number) => n.toFixed(1);
/** Scroll A's back sheet edge (HomeArtOpenings.tsx: contour() with the far sheet's base 340 and phase 0.6). */
const crest = (x: number) => 340 + Math.sin(x / 270 + 0.6) * 30 + Math.sin(x / 96 + 0.6 * 2.3) * 7;
const slope = (x: number) => (Math.atan2(crest(x + 12) - crest(x - 12), 24) * 180) / Math.PI;
const CAMEL = "M-18-19C-17-27-10-28-6-35C-3-40 2-38 4-31C6-27 10-25 14-26C16-31 16-39 19-43C21-46 26-46 28-44L30-42L24-40C22-36 22-28 20-22C18-17 14-15 12-14L14 0H11L8-13H-6L-9 0H-12L-12-13C-16-14-18-16-18-19Z";
const RIDER = "M-4-37C-5-44-3-48 0-49C3-48 5-44 3-37ZM0-54a3 3 0 1 0 .01 0Z";
const PACK = "M-14-29C-11-37 4-39 8-30C4-27-10-26-14-29Z";
/** Scroll A's drawing: 1600 by 560 units. The lead camel's nose stays this far left of the sun's centre, clear of its rings. */
const LENGTH = 1600, HEIGHT = 560, SUN_CLEAR = 275;

/** The camels, ropes and tracks in the study's order, so the same seed draws the same caravan, led from `lead`. */
function drawCaravan(lead: number) {
  const random = seeded(7717);
  const camels: { transform: string; d: string }[] = [];
  let ropes = "", tracks = "", last = lead;
  for (let x = lead, i = 0; i < 9; i++) {
    const size = 0.62 + random() * 0.1, y = crest(x);
    const load = i % 3 === 0 ? RIDER : random() < 0.6 ? PACK : "";
    camels.push({ transform: `translate(${fixed(x)} ${fixed(y)}) rotate(${fixed(slope(x))}) scale(${fixed(size)})`, d: CAMEL + load });
    const next = x - (34 + random() * 22);
    if (i < 8) ropes += `M${fixed(next + 18)} ${fixed(crest(next) - 26 * size)}Q${fixed(x - 26)} ${fixed(y - 12)} ${fixed(x - 11)} ${fixed(y - 13)}`;
    last = x;
    x = next;
  }
  for (let x = last - 60; x < lead + 10; x += 9 + random() * 12) tracks += `M${fixed(x)} ${fixed(crest(x) + 4 + random() * 2)}h${fixed(2 + random() * 3)}`;
  return { camels, ropes, tracks };
}

/** Lies over Scroll A in the same section; reads where the scroll put its sun and walks the caravan up to it. */
export function ScrollCaravan() {
  const frame = useRef<SVGSVGElement>(null);
  const [sun, setSun] = useState(0);
  useLayoutEffect(() => {
    const section = frame.current?.parentElement, disc = section?.querySelector(".hm4-sun-disc");
    if (!disc) return;
    const read = () => setSun(Number(disc.getAttribute("cx")) || 0);
    read();
    const observer = new MutationObserver(read);
    observer.observe(disc, { attributes: true, attributeFilter: ["cx"] });
    return () => observer.disconnect();
  }, []);
  if (!sun) return <svg ref={frame} className="hm4-scroll-art hm6-caravan" viewBox={`0 0 ${LENGTH} ${HEIGHT}`} aria-hidden="true" />;
  const { camels, ropes, tracks } = drawCaravan(sun - SUN_CLEAR);
  return <svg ref={frame} className="hm4-scroll-art hm6-caravan" viewBox={`0 0 ${LENGTH} ${HEIGHT}`} preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
    <path className="hm6-caravan-tracks" d={tracks} />
    {camels.map(({ transform, d }) => <path className="hm6-caravan-camel" transform={transform} d={d} key={transform} />)}
    <path className="hm6-caravan-ropes" d={ropes} />
  </svg>;
}
