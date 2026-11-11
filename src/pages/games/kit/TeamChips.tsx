// Teams side by side (the audits' item 9, seven games): a colour chip per team or player with its score and a bar that
// grows against the leader, the chip whose turn it is lifted, plus the winner line and the hand-over card. Names stand
// in their own elements under fixed labels ("Winner", "You're up"), never inside a sentence, for the translation check.
import type { CSSProperties, ReactNode } from "react";
import { formatNumber } from "@/lib/site-format";
import { scoreShares, teamTone, type Scored } from "./teams";

export interface Team extends Scored {
  name: ReactNode;
  /** The team's own colour, when a game assigns colours itself (the podium's step wears it); else teamTone(index). */
  tone?: string;
}

export interface TeamChipsProps {
  teams: readonly Team[];
  /** The team whose turn it is. */
  upId?: string | null;
  /** The colours worn in turn; default the site's seven book colours. */
  tones?: readonly string[];
  /** The list's spoken label, e.g. "Teams" or "Players". */
  label: string;
  className?: string;
}

export function TeamChips({ teams, upId = null, tones, label, className = "" }: TeamChipsProps) {
  const shares = scoreShares(teams);
  const top = Math.max(0, ...teams.map((team) => team.score));
  return <ul className={`kit-chips${className ? ` ${className}` : ""}`} aria-label={label}>
    {teams.map((team, i) => {
      const leading = top > 0 && team.score === top;
      const style = { "--_team": teamTone(i, tones), "--kit-share": shares[i] } as CSSProperties;
      return <li key={team.id} className={`kit-chip${leading ? " is-leading" : ""}${team.id === upId ? " is-up" : ""}`} style={style}
        data-leading={leading ? "true" : undefined} aria-current={team.id === upId ? "true" : undefined}>
        <span className="kit-chip__dot" aria-hidden="true" />
        <span className="kit-chip__name">{team.name}</span>
        <span className="kit-chip__score">{formatNumber(team.score)}</span>
        <span className="kit-chip__bar" aria-hidden="true" />
      </li>;
    })}
  </ul>;
}

export interface WinnerLineProps {
  /** The winner's name (or names, joined by the game with formatList), in its own element. */
  name: ReactNode;
  /** The label above it; default "Winner". */
  label?: ReactNode;
  /** A celebration placed on the name (the kit's Celebration). */
  children?: ReactNode;
  className?: string;
}

export function WinnerLine({ name, label, children, className = "" }: WinnerLineProps) {
  return <div className={`kit-winner${className ? ` ${className}` : ""}`}>
    {label === undefined ? <span className="kit-winner__label">Winner</span> : <span className="kit-winner__label">{label}</span>}
    <strong className="kit-winner__name">{name}{children}</strong>
  </div>;
}

export interface HandOverProps {
  name: ReactNode;
  /** The label above the name; default "You're up". */
  label?: ReactNode;
  /** The team's colour (teamTone(index)). */
  tone?: string;
  /** Anything under the name: the group, the reader, the Start button. */
  children?: ReactNode;
  className?: string;
}

/** The hand-over card between turns: a label, the name very large, and whatever the game puts under it. */
export function HandOver({ name, label = "You're up", tone, children, className = "" }: HandOverProps) {
  const style = tone ? ({ "--_team": tone } as CSSProperties) : undefined;
  return <div className={`kit-handover${className ? ` ${className}` : ""}`} style={style}>
    <span className="kit-handover__label">{label}</span>
    <strong className="kit-handover__name">{name}</strong>
    {children}
  </div>;
}
