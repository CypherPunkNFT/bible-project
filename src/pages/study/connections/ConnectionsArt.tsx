// The Connections page's heading drawing: an open Bible in line art, set against a soft wall of books, and from marked
// verses all over one page, threads that arch over the gutter to marked verses all over the other, each in the colour of
// the section it comes from. They play in two halves on a 16-second loop: first each thread joins two verses of one colour
// (the law quoted in the law, a prophet in a prophet), then each joins two different colours (the history in the Gospels,
// a psalm in the epistles). Under reduced motion it holds still on the first half (connections.css).
import { Bible } from "./art/Bible";
import { spreadLinks } from "./art/links";
import { Wall } from "./art/Wall";
import { wallRow } from "./art/wall-books";

const FIRST = spreadLinks(41, true);
const SECOND = spreadLinks(58, false);
const BOOKS = wallRow(7, 4, 246, 104, [50, 100], [11, 18]);

export function ConnectionsArt() {
  return (
    <svg className="cx-art" viewBox="-125 -58 250 168" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(-125 0)"><Wall books={BOOKS} opacity={0.17} /></g>
      <g style={{ color: "var(--accent)" }}><Bible first={FIRST} second={SECOND} rise={0.4} /></g>
    </svg>
  );
}
