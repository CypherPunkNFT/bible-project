// The podium (the audits' item 9; Jeopardy's and the live quiz's audits ask that the two share one): three steps that
// rise third, second, first, with the names on each and the game's celebration on the winner. A shared place puts two
// names on one step; the places come from placeTeams, the same rule as Hot seat's leaderboard.
import type { CSSProperties, ReactNode } from "react";
import { formatNumber, ordinal } from "@/lib/site-format";
import { useCountUp } from "./count-up";
import { podiumSteps } from "./teams";
import type { Team } from "./TeamChips";

export interface PodiumProps {
  teams: readonly Team[];
  /** Placed on the first step, e.g. the kit's Celebration. */
  winnerExtra?: ReactNode;
  /** The spoken label, e.g. "Podium". */
  label: string;
  /** Each step's score counts up from zero over this many ms (Jeopardy's results); 0, the default, shows it at once. */
  countMs?: number;
  className?: string;
}

/** A step's score: the real value for readers from the first render, the counting digits as decoration. */
function StepScore({ value, countMs }: { value: number; countMs: number }) {
  const shown = useCountUp(value, countMs);
  if (countMs <= 0) return <span className="kit-podium__score">{formatNumber(value)}</span>;
  return <span className="kit-podium__score" data-value={value}><span className="sr-only">{formatNumber(value)}</span><span aria-hidden="true">{formatNumber(shown)}</span></span>;
}

export function Podium({ teams, winnerExtra, label, countMs = 0, className = "" }: PodiumProps) {
  const steps = podiumSteps(teams);
  return <ol className={`kit-podium${className ? ` ${className}` : ""}`} aria-label={label}>
    {steps.map((rows, i) => <li key={i} className={`kit-podium__step${rows.length ? "" : " is-empty"}`} data-place={i + 1}
      style={rows[0]?.tone ? ({ "--_team": rows[0].tone, "--kit-first": rows[0].tone } as CSSProperties) : undefined}>
      {rows.length > 0 && <>
        <span className="kit-podium__names">{rows.map((row) => <span key={row.id} className="kit-podium__name">{row.name}</span>)}</span>
        <StepScore value={rows[0].score} countMs={countMs} />
      </>}
      <span className="kit-podium__block">{ordinal(i + 1)}{i === 0 && rows.length > 0 ? winnerExtra : null}</span>
    </li>)}
  </ol>;
}
