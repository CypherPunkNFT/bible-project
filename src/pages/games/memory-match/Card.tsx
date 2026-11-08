// Memory card match: one card (design sections 11 and 12). A real button; the back says "Who" or "Story" on Easy and
// Medium and nothing on Hard. The front's words are in the page only while the card is face up, matched or turning
// back, so a face-down card can't be read by a screen reader, found by text search or selected by accident.
import type { CSSProperties, KeyboardEvent } from "react";
import { forwardRef } from "react";
import type { Card as CardSpec } from "./deal";
import { spoken } from "./game";

export type CardFace = "down" | "up" | "matched" | "closing";

/** The site's seven book colours, one per pair in turn; colour decorates, the ✓ and words carry the meaning. */
const TONES = ["history", "poetry", "prophets", "gospels", "acts", "epistles", "revelation"] as const;

interface CardProps {
  card: CardSpec;
  face: CardFace;
  /** The words on the front (only passed while they may be shown). */
  text: string | null;
  /** For a matched card, the other half of its pair. */
  partner: string | null;
  typed: boolean;
  row: number;
  column: number;
  tone: number;
  focusable: boolean;
  onFlip: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onFocus: () => void;
}

const kindWord = (card: CardSpec) => (card.kind === "who" ? "who card" : "story card");

function cardName(card: CardSpec, face: CardFace, text: string | null, partner: string | null, typed: boolean,
  row: number, column: number): string {
  if (face === "matched" && text && partner) return `${spoken(text)}, matched with ${spoken(partner)}`;
  if (face === "up" && text) return `${spoken(text)}, ${kindWord(card)}, face up`;
  return `Row ${row}, column ${column}, face down${typed ? `, ${kindWord(card)}` : ""}`;
}

export const Card = forwardRef<HTMLButtonElement, CardProps>(function Card(props, ref) {
  const { card, face, text, partner, typed, row, column, tone, focusable, onFlip, onKeyDown, onFocus } = props;
  const shown = face !== "down" && face !== "closing";
  const style = { "--pair": `var(--${TONES[tone % TONES.length]})` } as CSSProperties;
  const back = typed ? (card.kind === "who" ? "Who" : "Story") : "";
  return <button ref={ref} type="button" style={style}
    className={`mm-card is-${card.kind}${shown ? " is-up" : ""}${face === "matched" ? " is-matched" : ""}${typed ? " is-typed" : ""}`}
    aria-label={cardName(card, face === "closing" ? "down" : face, text, partner, typed, row, column)}
    aria-disabled={face === "matched" || face === "up" ? true : undefined}
    tabIndex={focusable ? 0 : -1} onClick={onFlip} onKeyDown={onKeyDown} onFocus={onFocus}>
    <span className="mm-card__inner" aria-hidden="true">
      <span className="mm-card__face mm-card__back">{back && <span className="mm-card__type">{back}</span>}</span>
      <span className="mm-card__face mm-card__front">
        {text !== null && face !== "down" && <>
          <span className="mm-card__kind">{card.kind === "who" ? "Who" : "Story"}</span>
          <span className="mm-card__text">{text}</span>
          {face === "matched" && <span className="mm-card__match">✓ Matched</span>}
        </>}
      </span>
    </span>
  </button>;
});
