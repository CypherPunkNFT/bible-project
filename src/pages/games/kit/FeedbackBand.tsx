// The feedback band (the audits' item 3, ten games): the moment the player answers, a band slides up carrying the
// verdict and the Next button, pinned to the bottom of a phone screen so Next is never below the fold; the full
// reading folds in under it. The verdict is a live region kept in the page while the band is closed, so a screen
// reader hears it when it arrives. Focus moves to the band's first button when it opens (and only then), without
// scrolling, so Enter carries on (pass focusAction={false} when restoring a saved game, so a reload does not jump).
// The band is sticky, not fixed, so it stays inside the game's own flow and keeps the game's --kit-* variables.
//
// Words: the verdict is a slot. Write the fixed phrase and the answer as separate elements ("Not quite" in one, the
// answer in its own <strong>), never one sentence around a value, so the translation check passes.
import { useEffect, useRef, type ReactNode } from "react";

export interface FeedbackBandProps {
  open: boolean;
  /** The verdict's tint. */
  tone?: "right" | "wrong" | "part" | null;
  /** The verdict words (fixed phrases and names in their own elements). */
  verdict?: ReactNode;
  /** The Next (or Save turn, or Play again) button. */
  action?: ReactNode;
  /** The reading that folds in under the verdict: verses, reasons, people. */
  children?: ReactNode;
  /** Pinned to the bottom of the screen on phones (the default), always, or never. */
  pinned?: "narrow" | "always" | "never";
  /** Move focus to the first button in the band when it opens (default true). */
  focusAction?: boolean;
  className?: string;
}

export function FeedbackBand(props: FeedbackBandProps) {
  const { open, tone = null, verdict, action, children, pinned = "narrow", focusAction = true, className = "" } = props;
  const band = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false); // a band mounted already open counts as opening: games draw it fresh after each answer
  useEffect(() => {
    const opening = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opening || !focusAction) return;
    const button = band.current?.querySelector<HTMLElement>(".kit-band__action button, .kit-band__action a");
    button?.focus({ preventScroll: true });
  }, [open, focusAction]);
  const classes = `kit-band kit-band--${pinned}${tone ? ` is-${tone}` : ""}${className ? ` ${className}` : ""}`;
  return <div ref={band} className={open ? classes : undefined} hidden={!open} data-open={open ? "true" : "false"}>
    <div className="kit-band__row">
      <div className="kit-band__verdict" role="status">{open ? verdict : null}</div>
      {open && action && <div className="kit-band__action">{action}</div>}
    </div>
    {open && children && <div className="kit-band__details">{children}</div>}
  </div>;
}
