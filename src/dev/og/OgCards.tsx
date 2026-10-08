// The link-preview (Open Graph) image designs: 1200 × 630, the site's own fonts, colours and artwork, light mode.
// Development only (og.html); the chosen one is photographed at 1× into public/ by scripts/og-image.mjs.
// Round 2 (owner 2026-10-08): for texts, "Bible Project" really big and one striking drawing: the God family drawing
// from the Study page's Topics card (two orbits, the sun's rays, the Trinity triangle), without the floating words.
import { useLayoutEffect, useRef } from "react";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";

export const OG_DESIGNS = [
  { id: "radiant", name: "Radiant", theme: "light" },
  { id: "beside", name: "Side by side", theme: "light" },
  { id: "free-open", name: "Free and open", theme: "light" },
  { id: "sunrise", name: "Sunrise", theme: "light" },
] as const;
export type OgDesignId = (typeof OG_DESIGNS)[number]["id"];

const Sun = () => <TopicsArtwork kind="god" />;
const Logo = () => <img className="og-logo" src="/favicon.svg" alt="" />;

/** The drawing large across the card, the name very large beneath it. */
function Radiant() {
  return <div className="og-card og-radiant">
    <div className="og-glow" />
    <div className="og-r-art"><Sun /></div>
    <div className="og-r-name"><Logo /><h1>Bible Project</h1></div>
  </div>;
}

/** The name in two very large lines on the left, the drawing on the right. */
function Beside() {
  return <div className="og-card og-beside">
    <div className="og-glow og-glow-right" />
    <div className="og-b-name"><Logo /><h1>Bible<br />Project</h1></div>
    <div className="og-b-art"><Sun /></div>
  </div>;
}

/** The line's font size set so it spans the card's width less 72 px each side (owner: "as wide as it can possibly be,
 * without touching the edges"), measured once the site's fonts have loaded. */
const LINE_WIDTH = 1200 - 2 * 72;
function useFitWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      el.style.fontSize = "100px";
      el.style.fontSize = `${Math.floor((100 * LINE_WIDTH) / el.scrollWidth * 10) / 10}px`;
      el.dataset.fitted = "true";
    };
    fit();
    document.fonts.ready.then(fit).catch((error) => console.error("og: fonts did not load", error));
  }, []);
  return ref;
}

/** A four-pointed star whose sides curve inwards, centred on (x, y), `r` from centre to point. */
function sparkle(x: number, y: number, r: number) {
  const k = r * 0.16;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}
// Owner round 3 (2026-10-08): a cross either side of the drawing, and stars, in card coordinates (1200 × 630).
const CROSSES = [112, 1088];
const STARS: [number, number, number][] = [[200, 214, 15], [1000, 214, 15], [140, 96, 10], [1060, 96, 10], [246, 470, 10], [954, 470, 10], [60, 300, 7], [1140, 300, 7]];

/** The name, the drawing between, and the line "The whole Bible, free and open to all." across the full width. */
function FreeOpen() {
  const line = useFitWidth<HTMLParagraphElement>();
  return <div className="og-card og-free">
    <div className="og-glow" />
    <svg className="og-f-marks" viewBox="0 0 1200 630" aria-hidden="true">
      {CROSSES.map((x) => <path key={x} d={`M${x} 280V400M${x - 34} 316H${x + 34}`} stroke="currentColor" strokeWidth="6" />)}
      {STARS.map(([x, y, r]) => <path key={`${x},${y}`} d={sparkle(x, y, r)} fill="currentColor" opacity={r > 12 ? 0.85 : 0.6} />)}
    </svg>
    <div className="og-f-name"><Logo /><h1>Bible Project</h1></div>
    <div className="og-f-art"><Sun /></div>
    <p className="og-f-line" ref={line}>The whole Bible, <em>free and open to all.</em></p>
  </div>;
}

/** The drawing rising from the bottom edge like a sunrise, the name very large above it. */
function Sunrise() {
  return <div className="og-card og-sunrise">
    <div className="og-glow og-glow-low" />
    <div className="og-s-name"><Logo /><h1>Bible Project</h1></div>
    <div className="og-s-art"><Sun /></div>
  </div>;
}

/** One design at its exact size; `data-og` marks the element the photograph is taken of. */
export function OgCard({ id }: { id: OgDesignId }) {
  const Design = { radiant: Radiant, beside: Beside, "free-open": FreeOpen, sunrise: Sunrise }[id];
  return <div className="og-frame" data-og={id}><Design /></div>;
}
