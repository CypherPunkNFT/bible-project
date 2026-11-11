// Share with a preview of what will be copied (the audits' item 6; Two truths and Emoji stories had no "Copied" line).
// The share sheet, else the clipboard, else a box to select and copy; the status line is always in the page so a
// screen reader hears "Copied", and it clears after a moment (and at once when the text changes) so it never lingers
// into the next game, the fault Jeopardy's audit found.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { shareText, type ShareOutcome } from "./share";

export interface ShareButtonProps {
  /** The text that will be shared: the game's own format, unchanged. */
  text: string;
  /** Show the text above the button (default true). */
  preview?: boolean;
  /** The button's words; default "Share". */
  children?: ReactNode;
  /** For the console, which game is sharing. */
  game?: string;
  /** How long "Copied" stays, in ms. */
  statusMs?: number;
  onShared?: (outcome: ShareOutcome) => void;
  className?: string;
}

export function ShareButton({ text, preview = true, children = "Share", game, statusMs = 2500, onShared, className = "" }: ShareButtonProps) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => { setOutcome(null); clearTimer(); }, [text]);
  useEffect(() => clearTimer, []);
  const share = () => {
    // Called straight from the tap: phones only open the share sheet inside one.
    void shareText(text, game).then((result) => {
      setOutcome(result);
      onShared?.(result);
      clearTimer();
      if (result === "copied" || result === "shared") timer.current = setTimeout(() => setOutcome(null), statusMs);
    });
  };
  return <div className={`kit-share${className ? ` ${className}` : ""}`}>
    {preview && <pre className="kit-share__preview">{text}</pre>}
    <button type="button" className="kit-share__button" onClick={share}>{children}</button>
    <p className="kit-share__status" role="status">{outcome === "copied" ? "Copied" : outcome === "manual" ? "Copy this" : ""}</p>
    {outcome === "manual" && <textarea className="kit-share__copy" readOnly value={text} aria-label="Text to copy" onFocus={(event) => event.currentTarget.select()} />}
  </div>;
}
