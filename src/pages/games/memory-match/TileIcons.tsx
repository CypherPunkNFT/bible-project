// Memory card match: the start screen's tiles for the versions and their decks, drawn like What came first?'s (owner,
// 2026-11-12: "the what cards need to be like these"): a line drawing in an arched window, in its own book colour. Most
// drawings and colours are the crossword's own (crossword/ThemeIcons.tsx, themes.ts), so the games read alike.
import type { CSSProperties, ReactNode } from "react";
import { P } from "../art/parts";
import "../art/game-art.css";
import "./tiles.css";

const DRAWINGS = {
  // The versions. People: two figures.
  people: <><circle cx="8.5" cy="8" r="2.8" /><path d="M3 20a5.5 5.5 0 0 1 11 0" /><circle cx="16.5" cy="7" r="2.4" /><path d="M14.6 13.2A5 5 0 0 1 21.5 18" /></>,
  // Places: a pin standing on the land.
  places: <><path d="M12 18s-5.5-4.8-5.5-9.2a5.5 5.5 0 0 1 11 0C17.5 13.2 12 18 12 18z" /><circle cx="12" cy="8.8" r="2" /><path d="M5 18.5c-1.6.4-2.5 1-2.5 1.5 0 1.1 4.3 2 9.5 2s9.5-.9 9.5-2c0-.5-.9-1.1-2.5-1.5" /></>,
  // Verses: quotation marks.
  verses: <><path d="M10 6.5c-3.3.9-5.5 3.6-5.5 7.3v3.7h5v-5h-3" /><path d="M19.5 6.5c-3.3.9-5.5 3.6-5.5 7.3v3.7h5v-5h-3" /></>,
  // The decks. Mixed: an open book.
  book: <><path d="M12 7.5C9.5 5.6 6.4 5.2 3 6v12.5c3.4-.8 6.5-.4 9 1.5 2.5-1.9 5.6-2.3 9-1.5V6c-3.4-.8-6.5-.4-9 1.5z" /><path d="M12 7.5V20" /><path d="M5.5 9.5c1.6-.2 3 0 4.2.6M5.5 12.5c1.6-.2 3 0 4.2.6M18.5 9.5c-1.6-.2-3 0-4.2.6M18.5 12.5c-1.6-.2-3 0-4.2.6" /></>,
  // The beginning: the sun rising over the first hills, under Abraham's stars.
  sunrise: <><path d="M2.5 19.5h19" /><path d="M7 19.5a5 5 0 0 1 10 0" /><path d="M12 11.5v-1.5M7.2 13.6l-1-1M16.8 13.6l1-1M4.5 17h-1.5M19.5 17h1.5" /><path d="M5 5.2l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5zM18.5 4l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z" /></>,
  // The Exodus: the two tablets.
  tablets: <><path d="M2.5 20.5V8.5a3.75 3.75 0 0 1 7.5 0v12zM14 20.5V8.5a3.75 3.75 0 0 1 7.5 0v12z" /><path d="M4.75 10.5h3M4.75 13.5h3M4.75 16.5h2M16.25 10.5h3M16.25 13.5h3M16.25 16.5h2" /></>,
  // Judges and kings: a crown.
  crown: <><path d="M4.5 17 3 7.5l5 4 4-6.5 4 6.5 5-4-1.5 9.5z" /><path d="M4.5 20h15" /><circle cx="12" cy="13.5" r="1" /></>,
  // The prophets: a scroll.
  scroll: <><path d="M7 5.5h11v13" /><path d="M5 5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 0 4H7a2 2 0 0 1-2-2z" /><path d="M5 5.5v13a2 2 0 0 0 2 2h11a2 2 0 0 0 0-4H7" /><path d="M9 10.5h6M9 13.5h4" /></>,
  // Psalms: David's lyre.
  lyre: <><path d="M8.5 17.5C4.5 15 2.5 9.5 4 5c.4-1.2 1.6-1.6 2.6-1" /><path d="M15.5 17.5c4-2.5 6-8 4.5-12.5-.4-1.2-1.6-1.6-2.6-1" /><path d="M3.6 8h16.8" /><path d="M8 17.5h8a1.5 1.5 0 0 1 0 3H8a1.5 1.5 0 0 1 0-3z" /><path d="M10.5 8v9.5M13.5 8v9.5" /></>,
  // Jesus and the Gospels: a fish.
  fish: <><path d="M3 12c2.8-4.2 7.4-5.3 11.2-3.2 1.3.7 2.5 1.8 3.3 3.2-.8 1.4-2 2.5-3.3 3.2C10.4 17.3 5.8 16.2 3 12z" /><path d="M17.5 12 21 8.5v7z" /><circle cx="7.2" cy="11.3" r=".7" /></>,
  // The early church and the letters: a quill over a line of writing.
  quill: <><path d="M20 3.5C13.5 4.5 8.5 9.5 7 17" /><path d="M20 3.5c-.4 5.6-4.6 10.2-11.6 11.4" /><path d="M11.2 9.8l3.3.9M9.6 12.6l2.6.6" /><path d="M7 17l-1.5 3" /><path d="M10 20.5h10" /></>,
  // Women of the Bible: a woman in a head covering.
  veil: <><path d="M12 3.5c-3 0-5 2.3-5 5.2 0 2.2.6 3.6 1.3 4.6C5.6 14.6 4 17 4 20.5h16c0-3.5-1.6-5.9-4.3-7.2.7-1 1.3-2.4 1.3-4.6 0-2.9-2-5.2-5-5.2z" /><circle cx="12" cy="9" r="2.4" /></>,
  // Parables: the sower's seed, sprouting.
  seed: <><path d="M12 20.5V11" /><path d="M12 13c-3.5 0-6-2.3-6-5.5 3.5 0 6 2.3 6 5.5zM12 11c0-3.2 2.5-5.5 6-5.5 0 3.2-2.5 5.5-6 5.5z" /><path d="M5 20.5h14" /></>,
  // Family charades' players (owner, 2026-11-13). Little ones: a small child with a ball.
  little: <><circle cx="9.5" cy="10" r="2.6" /><path d="M5 20.5a4.5 4.5 0 0 1 9 0" /><circle cx="17.5" cy="18.3" r="2.2" /><path d="M15.6 17.2c1.3.4 2.5.4 3.8 0" /></>,
  // Kids: two children side by side.
  kids: <><circle cx="7.5" cy="9.5" r="2.4" /><path d="M3.5 20.5a4 4 0 0 1 8 0" /><circle cx="16.5" cy="9.5" r="2.4" /><path d="M12.5 20.5a4 4 0 0 1 8 0" /></>,
  // Family charades' Miracles: the loaves in a basket.
  basket: <><path d="M3.5 13.5h17l-2 7h-13z" /><path d="M6 13.5a3 2.6 0 0 1 6 0M12 13.5a3 2.6 0 0 1 6 0M9 11a3 2.4 0 0 1 6 0" /><path d="M7 16.5h10" /></>,
  // Christmas and Easter: the cross on its hill, under the star.
  cross: <><path d="M3 20.5c3.5-2.6 14.5-2.6 18 0" /><path d="M12 18.6V8.5M8.5 11.5h7" /><path d="M18.5 3.5l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z" /></>,
} satisfies Record<string, ReactNode>;

export type TileIconKey = keyof typeof DRAWINGS;

/** Each drawing's book colour (the site's section palette), the same as the crossword gives the same drawing. */
const TONES: Record<TileIconKey, string> = {
  people: "poetry", places: "history", verses: "revelation", book: "epistles", sunrise: "poetry", tablets: "history",
  crown: "revelation", scroll: "prophets", lyre: "acts", fish: "gospels", quill: "epistles", veil: "acts", seed: "poetry",
  little: "acts", kids: "epistles", basket: "prophets", cross: "revelation",
};

/** The tile's colour, as the --mm-tone its drawing, edge and short line use. */
const toneOf = (name: TileIconKey) => ({ "--mm-tone": `var(--${TONES[name]})` }) as CSSProperties;

/** What came first?'s tile art (owner, 2026-11-12): the drawing standing in the hub's faint arched window
 *  (../art/game-art.css), scaled from its 24-unit square into the 120×80 arch. Decorative: the tile's name says it. */
function TileArt({ name }: { name: TileIconKey }) {
  return <svg className="ga-art mm-tile__art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <path className="ga-arch" d="M30 74V40A30 30 0 0 1 90 40V74Z" />
    <path className="ga-arch-line" d="M34 74V41A26 26 0 0 1 86 41V74" />
    <P d="M12 74H108" c="ga-f" />
    <svg x={39} y={22} width={42} height={42} viewBox="0 0 24 24" overflow="visible" fill="none" stroke="currentColor"
      strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round">{DRAWINGS[name]}</svg>
  </svg>;
}

interface TileProps {
  icon: TileIconKey; name: string; subtitle: string; pressed: boolean; onClick: () => void;
  /** The tile can't be picked now (charades: too few scenes for this age); its short line says why. */
  disabled?: boolean;
  /** The short line is part of the choice (charades' ages, or why a tile is off): read out, and kept on a phone. */
  said?: boolean;
}

/** A version or deck tile: the drawing in its arch, the name, and a short line under it that the button's name leaves
 *  out, unless the line says something the choice needs. */
export function Tile({ icon, name, subtitle, pressed, onClick, disabled = false, said = false }: TileProps) {
  const spoken = said || disabled;
  return <button type="button" className="mm-tile" style={toneOf(icon)} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
    <TileArt name={icon} />
    <span className="mm-tile__name">{name}</span>
    {subtitle && <span className={`mm-tile__note${spoken ? " is-said" : ""}`} aria-hidden={spoken ? undefined : "true"}>
      {subtitle}</span>}
  </button>;
}
