// Small pieces shared by the game's screens: the countdown to the next puzzle, the share button and the
// coloured squares.
import { Share2 } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { msUntilMidnight } from "./daily";
import { BAND_EMOJI, bandFor } from "./scoring";
import { shareResult, shareText } from "./share";

export function Countdown({ now }: { now: Date }) {
  const left = Math.max(0, Math.floor(msUntilMidnight(now) / 60_000));
  const hours = formatNumber(Math.floor(left / 60));
  const minutes = formatNumber(left % 60);
  return <p className="mq-countdown">{`Next puzzle in ${hours} h ${minutes} min`}</p>;
}

export function Squares({ points }: { points: readonly number[] }) {
  return <span className="mq-squares" aria-hidden="true">{points.map((p) => BAND_EMOJI[bandFor(p)]).join("")}</span>;
}

/** Share, copy, or show the text to copy when neither works. */
export function ShareButton({ n, points }: { n: number; points: readonly number[] }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const text = shareText(n, points);
  const share = async () => {
    const outcome = await shareResult(text);
    setState(outcome === "copied" ? "copied" : outcome === "manual" ? "manual" : "idle");
  };
  return <div className="mq-share">
    <button type="button" className="mq-button mq-primary" onClick={() => { void share(); }}><Share2 size={16} aria-hidden="true" /><span>Share</span></button>
    <span role="status" className="mq-toast">{state === "copied" ? "Copied to the clipboard." : ""}</span>
    {state === "manual" && <label className="mq-copy">
      <span>Copying is blocked in this browser. Select the text and copy it.</span>
      <textarea readOnly value={text} rows={3} onFocus={(event) => event.currentTarget.select()} />
    </label>}
  </div>;
}
