// Pieces the leader's screens and the phones share: an answer's colour, shape and letter, the tile with its vote bar,
// a player's symbol badge, the draining time bar, and the fixed layer the phone plays in. Kept free of the question
// bank so the phones' page stays small.
import { Anchor, Bird, Fish, Flame, Flower2, Lamp, Leaf, Moon, Mountain, Shell, Star, Sun } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { identityOf, type PlayerSymbol } from "./identity";

/** Colour-blind safe: every option has a shape and a letter as well as its colour. */
const SHAPES = ["▲", "◆", "●", "■"];
const LETTERS = ["A", "B", "C", "D"];

export function Mark({ index }: { index: number }) {
  return <span className="lq-mark"><span aria-hidden="true">{SHAPES[index]}</span>{LETTERS[index]}</span>;
}

export type OptionState = "plain" | "right" | "wrong";

/** An answer tile on the projector; from the reveal on, a bar grows up behind the words to the share of votes it took. */
export function OptionTile({ index, text, state = "plain", share, children }: { index: number; text: string; state?: OptionState; share?: number; children?: ReactNode }) {
  const style = share === undefined ? undefined : ({ "--lq-share": share } as CSSProperties);
  return <div className="lq-option" data-i={index} data-state={state} style={style}>
    {share !== undefined && <span className="lq-vote" aria-hidden="true" />}
    <Mark index={index} /><span className="lq-option-text" dir="auto">{text}</span>{children}
  </div>;
}

/** A bar that drains as `left` runs down from `total`. */
export function Drain({ left, total }: { left: number | null; total: number }) {
  const share = left === null || total <= 0 ? 0 : Math.max(0, Math.min(1, left / total));
  return <div className="lq-drain" role="presentation"><span style={{ width: `${share * 100}%` }} /></div>;
}

const ICONS: Record<PlayerSymbol, typeof Fish> = {
  fish: Fish, dove: Bird, lamp: Lamp, star: Star, sun: Sun, moon: Moon, leaf: Leaf, anchor: Anchor, flame: Flame, shell: Shell, mountain: Mountain, flower: Flower2,
};

/** A player's symbol in their colour, decorative beside the name (audit item 5). */
export function Badge({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const { symbol, tone } = identityOf(name);
  const Icon = ICONS[symbol];
  return <span className={`lq-badge${className ? ` ${className}` : ""}`} style={{ "--lq-tone": tone } as CSSProperties} data-symbol={symbol} aria-hidden="true">
    <Icon size={size} strokeWidth={1.8} />
  </span>;
}

/** The phone's game screens live in a fixed layer over the whole page, above the site's header and its floating
 * button, so a player cannot tap away mid-game and the answer buttons get the whole screen (the audit's first phone
 * problem; Hot seat and Charades play the same way). `tone` floods the layer: a chosen colour, green, red. */
export function GameLayer({ tone, children, label }: { tone?: string; children: ReactNode; label: string }) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, []);
  const style = tone ? ({ "--lq-flood": tone } as CSSProperties) : undefined;
  return <div ref={layer} className="lq-layer" data-flood={tone ? "true" : undefined} style={style} role="region" aria-label={label}>
    <div className="lq-layer-inner">{children}</div>
  </div>;
}
