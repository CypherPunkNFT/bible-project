// Pieces the leader's screens and the phones share: an answer's colour, shape and letter, the draining time bar, and
// a whole-number countdown. Kept free of the question bank so the phones' page stays small.
import type { ReactNode } from "react";

/** Colour-blind safe: every option has a shape and a letter as well as its colour. */
const SHAPES = ["▲", "◆", "●", "■"];
const LETTERS = ["A", "B", "C", "D"];

export function Mark({ index }: { index: number }) {
  return <span className="lq-mark"><span aria-hidden="true">{SHAPES[index]}</span>{LETTERS[index]}</span>;
}

export type OptionState = "plain" | "right" | "wrong";

export function OptionTile({ index, text, state = "plain", children }: { index: number; text: string; state?: OptionState; children?: ReactNode }) {
  return <div className="lq-option" data-i={index} data-state={state}>
    <Mark index={index} /><span dir="auto">{text}</span>{children}
  </div>;
}

/** A bar that drains as `left` runs down from `total`. */
export function Drain({ left, total }: { left: number | null; total: number }) {
  const share = left === null || total <= 0 ? 0 : Math.max(0, Math.min(1, left / total));
  return <div className="lq-drain" role="presentation"><span style={{ width: `${share * 100}%` }} /></div>;
}
