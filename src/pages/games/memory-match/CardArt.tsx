// Memory card match: the playing-card art. A back is an ivory rim around a framed, patterned panel with an oval seal in
// the middle (memory-match.css, "The playing-card back"). Each side of each version has its own design and emblem
// (versions.ts): Who teal with a bust, Story wine red with an open book; Place forest green with a map pin, Event ochre
// with a spark; Begins plum with an opening quotation mark, Ends slate blue with a closing one. Hard deals one plain navy
// back with a star for both kinds, so a back never gives the kind away. The emblems also sit in a face's corners.
import type { ReactNode } from "react";
import type { EmblemKey, Side, VersionKey } from "./versions";

/** The start screen's tile drawings, one per version, in the crossword's theme-tile style (owner, 2026-11-12: "make it
 *  this standard for choosing subgame"): line art on a 24-unit square with round ends. */
const VERSION_DRAWINGS: Record<VersionKey, ReactNode> = {
  // People and stories: two figures.
  people: <><circle cx="8.5" cy="8" r="2.8" /><path d="M3 20a5.5 5.5 0 0 1 11 0" /><circle cx="16.5" cy="7" r="2.4" /><path d="M14.6 13.2A5 5 0 0 1 21.5 18" /></>,
  // Places and events: a pin standing on the land.
  places: <><path d="M12 18s-5.5-4.8-5.5-9.2a5.5 5.5 0 0 1 11 0C17.5 13.2 12 18 12 18z" /><circle cx="12" cy="8.8" r="2" /><path d="M5 18.5c-1.6.4-2.5 1-2.5 1.5 0 1.1 4.3 2 9.5 2s9.5-.9 9.5-2c0-.5-.9-1.1-2.5-1.5" /></>,
  // Verses: quotation marks.
  verses: <><path d="M10 6.5c-3.3.9-5.5 3.6-5.5 7.3v3.7h5v-5h-3" /><path d="M19.5 6.5c-3.3.9-5.5 3.6-5.5 7.3v3.7h5v-5h-3" /></>,
};

export function VersionIcon({ version }: { version: VersionKey }) {
  return <svg className="mm-tile__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{VERSION_DRAWINGS[version]}</svg>;
}

const QUOTE = "M10.2 5.5C6.6 6.7 4 9.6 4 13.6V18.5h6.2v-6.2H7.3c.1-2.4 1.4-4.1 3.6-5zM20.2 5.5c-3.6 1.2-6.2 4.1-6.2 8.1V18.5h6.2v-6.2h-2.9c.1-2.4 1.4-4.1 3.6-5z";

/** A small emblem drawn in currentColor; null draws the plain back's eight-point star. */
export function Emblem({ name }: { name: EmblemKey | null }) {
  return <svg className="mm-emblem" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {name === "bust" && <>
      <circle cx="12" cy="8.2" r="4.2" fill="currentColor" />
      <path d="M3.8 21.5c0-4.6 3.7-7.8 8.2-7.8s8.2 3.2 8.2 7.8z" fill="currentColor" />
    </>}
    {name === "book" && <>
      <path d="M11.2 6.6C9.3 5.3 6.7 4.9 3 5.1v12.8c3.7-.2 6.3.2 8.2 1.4z" fill="currentColor" />
      <path d="M12.8 6.6c1.9-1.3 4.5-1.7 8.2-1.5v12.8c-3.7-.2-6.3.2-8.2 1.4z" fill="currentColor" />
    </>}
    {name === "pin" && <path fill="currentColor" fillRule="evenodd"
      d="M12 1.8a7.4 7.4 0 0 0-7.4 7.4c0 5.4 7.4 13 7.4 13s7.4-7.6 7.4-13A7.4 7.4 0 0 0 12 1.8zm0 10.1a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4z" />}
    {name === "spark" && <path fill="currentColor" d="M12 1.5c.7 5.4 3.1 8.6 9.5 10.5-6.4 1.9-8.8 5.1-9.5 10.5-.7-5.4-3.1-8.6-9.5-10.5C8.9 10.1 11.3 6.9 12 1.5z" />}
    {name === "open" && <path fill="currentColor" d={QUOTE} />}
    {name === "close" && <path fill="currentColor" d={QUOTE} transform="rotate(180 12 12)" />}
    {name === null && <path fill="currentColor" d="M12 2 13.61 8.12 19.07 4.93 15.88 10.39 22 12 15.88 13.61 19.07 19.07 13.61 15.88 12 22 10.39 15.88 4.93 19.07 8.12 13.61 2 12 8.12 10.39 4.93 4.93 10.39 8.12Z" />}
  </svg>;
}

/** The patterned panel and seal of a card back. side null = the plain Hard back, with no word on it. */
export function CardBack({ side }: { side: Side | null }) {
  return <span className={`mm-back is-${side?.art ?? "plain"}`}>
    <span className="mm-back__seal">
      <Emblem name={side?.emblem ?? null} />
      {side && <span className="mm-back__label">{side.label}</span>}
    </span>
  </span>;
}
