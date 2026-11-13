// Memory card match: one card (design sections 11 and 12; redesign from docs/visual-audits/memory-match.md). A real
// button inside a grid slot. The back names its side ("Who" or "Story", "Place" or "Event", "Begins" or "Ends", from the
// version played) on Easy and Medium and nothing on Hard. The front's words
// are in the page only while the card is face up, matched or turning back, so a face-down card can't be read by a
// screen reader, found by text search or selected by accident. The faces live in one grid cell, so a card grows with
// long words instead of clipping them. The turn is CSS (memory-match.css): the state here changes at once.
import type { CSSProperties, KeyboardEvent } from "react";
import { forwardRef } from "react";
import type { Card as CardSpec } from "./deal";
import { CardBack, Emblem } from "./CardArt";
import { spoken } from "./game";
import { toneColor } from "./tones";
import type { Version } from "./versions";

/** down: face down. up: turned this move. matched: a pair, still on the board (settling, then flying to the shelf).
 *  taken: a pair that has left the board, leaving its empty slot. closing: turning back, its words kept a moment. */
export type CardFace = "down" | "up" | "matched" | "taken" | "closing";


interface CardProps {
  card: CardSpec;
  /** The version played: the words, emblems and designs of its two sides. */
  version: Version;
  face: CardFace;
  /** The words on the front (only passed while they may be shown). */
  text: string | null;
  /** For a matched or taken card, the other half of its pair. */
  partner: string | null;
  typed: boolean;
  /** The second card of a non-pair, and its partner: both wear the miss. */
  missed: boolean;
  /** Lifting off towards the shelf (the matched phase after the settle). */
  flying: boolean;
  row: number;
  column: number;
  index: number;
  tone: number;
  focusable: boolean;
  onFlip: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onFocus: () => void;
}

const kindWord = (card: CardSpec, version: Version) => `${version.sides[card.kind].label.toLowerCase()} card`;

function cardName(card: CardSpec, version: Version, face: CardFace, text: string | null, partner: string | null,
  typed: boolean, row: number, column: number): string {
  if ((face === "matched" || face === "taken") && text && partner) return `${spoken(text)}, matched with ${spoken(partner)}`;
  if (face === "up" && text) return `${spoken(text)}, ${kindWord(card, version)}, face up`;
  return `Row ${row}, column ${column}, face down${typed ? `, ${kindWord(card, version)}` : ""}`;
}

export const Card = forwardRef<HTMLButtonElement, CardProps>(function Card(props, ref) {
  const { card, version, face, text, partner, typed, missed, flying, row, column, index, tone, focusable, onFlip, onKeyDown, onFocus } = props;
  const side = version.sides[card.kind];
  const shown = face === "up" || face === "matched";
  const style = { "--pair": toneColor(tone), "--i": index } as CSSProperties;
  const classes = [`mm-card is-${card.kind} art-${side.art}`, shown ? "is-up" : "", face === "matched" ? "is-matched" : "", face === "taken" ? "is-taken" : "",
    face === "closing" ? "is-closing" : "", typed ? "is-typed" : "", missed ? "is-miss" : "", flying ? "is-flying" : ""].filter(Boolean).join(" ");
  return <span className="mm-slot" style={style}>
    <button ref={ref} type="button" className={classes} data-face={face}
      aria-label={cardName(card, version, face === "closing" ? "down" : face, text, partner, typed, row, column)}
      aria-disabled={face === "matched" || face === "taken" || face === "up" ? true : undefined}
      tabIndex={focusable ? 0 : -1} onClick={onFlip} onKeyDown={onKeyDown} onFocus={onFocus}>
      {face !== "taken" && <span className="mm-card__inner" aria-hidden="true">
        <span className="mm-card__face mm-card__back"><CardBack side={typed ? side : null} /></span>
        <span className="mm-card__face mm-card__front">
          {text !== null && face !== "down" && <>
            <span className="mm-card__pip is-top"><Emblem name={side.emblem} /></span>
            <span className="mm-card__kind">{side.label}</span>
            <span className="mm-card__text">{text}</span>
            {face === "matched" ? <span className="mm-card__stamp">✓</span> : <span className="mm-card__pip is-bottom"><Emblem name={side.emblem} /></span>}
          </>}
        </span>
      </span>}
    </button>
  </span>;
});
