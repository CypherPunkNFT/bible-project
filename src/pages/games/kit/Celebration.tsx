// A restrained celebration (the audits' item 10, ten games): a hop wave across a row of cards or squares, and one
// short burst of gold-and-cream confetti at one focal point, once, as the design rules allow. Confetti is drawn when
// `when` turns true and taken down after the burst; under reduced motion no pieces are drawn at all (the hop is CSS
// and shrinks to nothing on its own). Put <Confetti> inside an element with position: relative; it flies from its centre.
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { confettiPieces } from "./confetti";
import { motionMs } from "./env";

export interface HopWaveProps extends HTMLAttributes<HTMLDivElement> {
  /** True starts the wave; children get their stagger from --kit-i, set here in order. */
  when: boolean;
  children: ReactNode;
  className?: string;
}

/** Wraps a row; when `when` is true every child hops in turn (Wordle's winning row). Children are keyed by position.
 * Any other attribute (a role, a label) goes on the row itself, so the wrapper can be the row. */
export function HopWave({ when, children, className = "", ...rest }: HopWaveProps) {
  return <div className={`${when ? "kit-hop" : ""}${className ? ` ${className}` : ""}`.trim() || undefined} data-hop={when ? "true" : "false"} {...rest}>{children}</div>;
}

export interface ConfettiProps {
  when: boolean;
  /** How many pieces (default 24, at most 60). */
  count?: number;
  /** How far they fly, in pixels. */
  reach?: number;
  /** The burst's length in ms; the pieces are removed after it. */
  ms?: number;
  className?: string;
}

/** Renders the burst's pieces when `when` becomes true, then clears them. Decorative only: hidden from readers. */
export function Confetti({ when, count = 24, reach = 120, ms = 1100, className = "" }: ConfettiProps) {
  const [burst, setBurst] = useState(0);
  const wasOn = useRef(false);
  useEffect(() => {
    const starting = when && !wasOn.current;
    wasOn.current = when;
    if (!starting || motionMs(ms) === 0) return;
    setBurst((n) => n + 1);
    const timer = setTimeout(() => setBurst(0), ms);
    return () => clearTimeout(timer);
  }, [when, ms]);
  if (!burst) return null;
  return <span className={`kit-confetti${className ? ` ${className}` : ""}`} aria-hidden="true" data-burst={burst}>
    {confettiPieces(count, burst, reach).map((piece, i) =>
      <span key={i} className={`kit-confetti__piece${piece.tone === "cream" ? " is-cream" : ""}`}
        style={{ "--kit-dx": `${piece.dx}px`, "--kit-dy": `${piece.dy}px`, "--kit-turn": `${piece.turn}deg`, "--kit-delay": piece.delay } as CSSProperties} />)}
  </span>;
}
