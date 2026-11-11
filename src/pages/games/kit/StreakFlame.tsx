// The streak counter (the audits' item 7, seven games): a small flame that lights from two in a row and pulses when
// the streak grows. The count is written in the site's language; the label is a counted phrase from plural().
import { formatNumber } from "@/lib/site-format";
import { useGrew } from "./grew";

export interface StreakFlameProps {
  count: number;
  /** From how many in a row the flame lights (default 2). */
  litFrom?: number;
  /** The spoken label, from plural(count, "{n} in a row", …). */
  label: string;
  className?: string;
}

export function StreakFlame({ count, litFrom = 2, label, className = "" }: StreakFlameProps) {
  const pulse = useGrew(count);
  const lit = count >= litFrom;
  return <span className={`kit-streak${lit ? " is-lit" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={label} data-count={count}>
    <span key={pulse} className="kit-streak__flame" aria-hidden="true">🔥</span>
    <span aria-hidden="true">{formatNumber(count)}</span>
  </span>;
}
