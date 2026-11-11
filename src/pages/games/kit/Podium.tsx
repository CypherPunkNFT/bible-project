// The podium (the audits' item 9; Jeopardy's and the live quiz's audits ask that the two share one): three steps that
// rise third, second, first, with the names on each and the game's celebration on the winner. A shared place puts two
// names on one step; the places come from placeTeams, the same rule as Hot seat's leaderboard.
import type { ReactNode } from "react";
import { formatNumber, ordinal } from "@/lib/site-format";
import { podiumSteps } from "./teams";
import type { Team } from "./TeamChips";

export interface PodiumProps {
  teams: readonly Team[];
  /** Placed on the first step, e.g. the kit's Celebration. */
  winnerExtra?: ReactNode;
  /** The spoken label, e.g. "Podium". */
  label: string;
  className?: string;
}

export function Podium({ teams, winnerExtra, label, className = "" }: PodiumProps) {
  const steps = podiumSteps(teams);
  return <ol className={`kit-podium${className ? ` ${className}` : ""}`} aria-label={label}>
    {steps.map((rows, i) => <li key={i} className={`kit-podium__step${rows.length ? "" : " is-empty"}`} data-place={i + 1}>
      {rows.length > 0 && <>
        <span className="kit-podium__names">{rows.map((row) => <span key={row.id} className="kit-podium__name">{row.name}</span>)}</span>
        <span className="kit-podium__score">{formatNumber(rows[0].score)}</span>
      </>}
      <span className="kit-podium__block">{ordinal(i + 1)}{i === 0 && rows.length > 0 ? winnerExtra : null}</span>
    </li>)}
  </ol>;
}
