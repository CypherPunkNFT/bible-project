// Four settings for the Connections heading drawing, with the Bible drawn in the proportions of the app icon's book: gold
// line art, tall pages, a thick cover band, fine lines of text. All play the same 16-second loop.
import type { ReactNode } from "react";
import { Bible } from "@/pages/study/connections/art/Bible";
import { spreadLinks } from "@/pages/study/connections/art/links";
import { Wall } from "@/pages/study/connections/art/Wall";
import { wallRow } from "@/pages/study/connections/art/wall-books";

const VIEW_BOX = "-125 -58 250 168";
const GOLD = { color: "var(--accent)" };

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg className="cxa-scene" viewBox={VIEW_BOX} aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const MATCHED = spreadLinks(41, true);
const MISMATCHED = spreadLinks(58, false);
/** A fuller web: six of each. */
const MATCHED_MORE = [...MATCHED, ...spreadLinks(63, true).slice(0, 2)];
const MISMATCHED_MORE = [...MISMATCHED, ...spreadLinks(77, false).slice(0, 2)];

/** A. The Bible alone, in gold. */
export function BookScene() {
  return <Scene><g style={GOLD}><Bible first={MATCHED} second={MISMATCHED} rise={0.4} /></g></Scene>;
}

/** B. The same, with a soft wall of books behind it. */
export function BookWallScene() {
  return (
    <Scene>
      <g transform="translate(-125 0)"><Wall books={wallRow(7, 4, 246, 104, [50, 100], [11, 18])} opacity={0.17} /></g>
      <g style={GOLD}><Bible first={MATCHED} second={MISMATCHED} rise={0.4} /></g>
    </Scene>
  );
}

/** C. On a table, in the page's own ink. */
export function TableScene() {
  return (
    <Scene>
      <ellipse cx={0} cy={100} rx={100} ry={7} stroke="none" style={{ fill: "var(--ink)" }} fillOpacity={0.1} />
      <path d="M-125 104 H125" strokeWidth={0.8} opacity={0.4} />
      <Bible first={MATCHED} second={MISMATCHED} rise={0.4} />
    </Scene>
  );
}

/** D. A fuller web of threads over lighter text. */
export function WebScene() {
  return <Scene><g style={GOLD}><Bible first={MATCHED_MORE} second={MISMATCHED_MORE} rise={0.4} weight={0.9} textOpacity={0.4} /></g></Scene>;
}
