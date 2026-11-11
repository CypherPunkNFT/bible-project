// The answer card (the audits' item 1, ten games): deals in with a short stagger, lifts on hover and on keyboard focus
// (the site has no focus outline), presses down on tap, then settles into right (tint and tick), wrong (tint, dashed
// edge, a short shake) or faded, the other cards' state. The state is the class; the motion only decorates it, and the
// card's height never changes when a mark arrives. A button unless `interactive` is false (a question card, a scene).
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

export type AnswerState = "idle" | "selected" | "right" | "wrong" | "faded";

export interface AnswerCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  state?: AnswerState;
  /** Its place in the row, for the deal-in stagger (0, 1, 2 …). */
  index?: number;
  /** False draws a plain card with no button behaviour (a question, a scene). */
  interactive?: boolean;
  /** The marks shown when settled; the words of the verdict belong in the game's feedback band. */
  rightMark?: ReactNode;
  wrongMark?: ReactNode;
  children: ReactNode;
}

const STATE_CLASS: Record<AnswerState, string> = { idle: "", selected: " is-selected", right: " is-right", wrong: " is-wrong", faded: " is-faded" };

export const AnswerCard = forwardRef<HTMLButtonElement, AnswerCardProps>(function AnswerCard(props, ref) {
  const { state = "idle", index = 0, interactive = true, rightMark = "✓", wrongMark = "✗", children, className = "", style, ...rest } = props;
  const classes = `kit-card${interactive ? "" : " kit-card--still"}${STATE_CLASS[state]}${className ? ` ${className}` : ""}`;
  const vars = { ...style, "--kit-i": index } as CSSProperties;
  const mark = state === "right" ? rightMark : state === "wrong" ? wrongMark : null;
  const body = <>
    <span className="kit-card__body">{children}</span>
    {mark !== null && <span className="kit-card__mark" aria-hidden="true">{mark}</span>}
  </>;
  if (!interactive) return <div className={classes} style={vars} data-state={state}>{body}</div>;
  return <button ref={ref} type="button" className={classes} style={vars} data-state={state}
    aria-pressed={state === "selected" ? true : undefined} {...rest}>{body}</button>;
});
