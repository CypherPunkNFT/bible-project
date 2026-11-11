// The score counting up from zero (the audits' item 6). The real value is in the page from the first render, for
// screen readers; the counting digits are decoration and hidden from them. Numbers are written in the site's language.
import { formatNumber } from "@/lib/site-format";
import { useCountUp } from "./count-up";

export interface ScoreCountUpProps {
  value: number;
  /** The best possible, shown small after the score ("/ 10") when given. */
  of?: number;
  /** How long the count takes; 0 shows the value at once. */
  ms?: number;
  /** The spoken label, written by the game with plural(): "{n} points". */
  label: string;
  className?: string;
}

export function ScoreCountUp({ value, of, ms = 900, label, className = "" }: ScoreCountUpProps) {
  const shown = useCountUp(value, ms);
  return <div className={`kit-score${className ? ` ${className}` : ""}`} role="img" aria-label={label} data-value={value}>
    <span aria-hidden="true">{formatNumber(shown)}</span>
    {of !== undefined && <span className="kit-score__of" aria-hidden="true">/ {formatNumber(of)}</span>}
  </div>;
}
