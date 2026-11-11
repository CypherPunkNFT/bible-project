// A timer the room can read (the audits' item 8, five games): a thick bar or a ring that drains, turning amber then
// red and pulsing for the last seconds, with the number beside it, and a stamp that lands over the top when time is up
// instead of pushing the question down. The game keeps the clock and passes the seconds left; the kit only draws them,
// so nothing drifts and nothing waits for an animation. `quiet` is the crossword's minutes-long count: no colours, no
// pulse.
import type { CSSProperties, ReactNode } from "react";
import { formatNumber } from "@/lib/site-format";
import { timeShare, timerTone } from "./timer";

export interface TimerBarProps {
  secondsLeft: number;
  total: number;
  shape?: "bar" | "ring";
  /** The last seconds that turn red (default 5). */
  warnAt?: number;
  quiet?: boolean;
  /** The spoken label, from plural(secondsLeft, "{n} second left", "{n} seconds left"). */
  label: string;
  /** Shown over the bar when time is up, e.g. "Time!"; nothing when left out. */
  stamp?: ReactNode;
  className?: string;
}

const RING_RADIUS = 20;
const RING_ROUND = 2 * Math.PI * RING_RADIUS;

export function TimerBar({ secondsLeft, total, shape = "bar", warnAt = 5, quiet = false, label, stamp, className = "" }: TimerBarProps) {
  const left = timeShare(secondsLeft, total);
  const tone = quiet ? (secondsLeft <= 0 ? "over" : "calm") : timerTone(secondsLeft, warnAt);
  const classes = `kit-timer kit-timer--${shape}${quiet ? " kit-timer--quiet" : ""} is-${tone}${className ? ` ${className}` : ""}`;
  const style = { "--kit-left": left } as CSSProperties;
  return <div className={classes} role="timer" aria-label={label} style={style} data-tone={tone}>
    {shape === "bar"
      ? <div className="kit-timer__track" aria-hidden="true"><div className="kit-timer__fill" /></div>
      : <svg className="kit-timer__ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="is-track" cx="24" cy="24" r={RING_RADIUS} />
        <circle className="is-left" cx="24" cy="24" r={RING_RADIUS} strokeDasharray={RING_ROUND} strokeDashoffset={RING_ROUND * (1 - left)} />
      </svg>}
    <span className="kit-timer__number" aria-hidden="true">{formatNumber(Math.max(0, Math.ceil(secondsLeft)))}</span>
    {tone === "over" && stamp && <span className="kit-timer__stamp" role="status">{stamp}</span>}
  </div>;
}
