// A card that turns over in place (the audits' item 2). Two faces back to back: the front shows until the half-turn,
// the back from it, so the back's colour appears exactly at the halfway point without any timing in code (the fault
// Bible Wordle's audit found was a colour set before the turn). The back's words are put in the page only once the
// card is turned, so a face-down answer cannot be read by a screen reader or found with a text search.
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type FlipTone = "right" | "wrong" | "part" | null;

export interface FlipCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Face down (false) or turned to its back (true). Controlled by the game: the state changes at once. */
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  /** Which way it turns: around the vertical axis (a playing card) or the horizontal one (a Wordle tile). */
  axis?: "x" | "y";
  /** The back's tint. */
  tone?: FlipTone;
  /** Its place in the row, for the deal-in stagger and for a wave of turns. */
  index?: number;
}

export function FlipCard(props: FlipCardProps) {
  const { flipped, front, back, axis = "y", tone = null, index = 0, className = "", style, ...rest } = props;
  const vars = { ...style, "--kit-i": index } as CSSProperties;
  return <div className={`kit-flip kit-flip--${axis}${flipped ? " is-flipped" : ""}${className ? ` ${className}` : ""}`} style={vars}
    data-flipped={flipped ? "true" : "false"} {...rest}>
    <div className="kit-flip__inner">
      <div className="kit-flip__face kit-flip__front" aria-hidden={flipped || undefined}>{front}</div>
      <div className={`kit-flip__face kit-flip__back${tone ? ` is-${tone}` : ""}`} aria-hidden={!flipped || undefined}>{flipped ? back : null}</div>
    </div>
  </div>;
}
