// The result panel (the audits' item 6, all sixteen games end on a heading, a sentence and a list today): a shell that
// lays out whatever a game composes from the kit's pieces (ScoreCountUp, RankLine, NewBestRibbon, ProgressTrail,
// StreakFlame, ShareButton) and its own buttons, so that on a phone the whole ending fits one screen and the reading
// sits below as fold-outs. The rank line and the ribbon live here too, being two lines of behaviour each.
import type { ReactNode } from "react";
import { rankFor, type Rank } from "./rank";

export interface ResultPanelProps {
  /** The score, rank, ribbon and streak. */
  children: ReactNode;
  /** The trail or the share grid under them. */
  trail?: ReactNode;
  /** Share, Play again, the hub link. */
  actions?: ReactNode;
  /** The reading below, folded. */
  reading?: ReactNode;
  className?: string;
}

export function ResultPanel({ children, trail, actions, reading, className = "" }: ResultPanelProps) {
  return <section className={`kit-result${className ? ` ${className}` : ""}`}>
    <div className="kit-result__head">{children}</div>
    {trail && <div className="kit-result__trail">{trail}</div>}
    {actions && <div className="kit-result__actions">{actions}</div>}
    {reading && <div className="kit-result__reading">{reading}</div>}
  </section>;
}

export interface RankLineProps {
  score: number;
  best: number;
  /** The game's own titles, by share of the best possible. */
  ranks: readonly Rank[];
  className?: string;
}

/** The rank or title the score earns, in the gold italic the hub uses; nothing when the table gives none. */
export function RankLine({ score, best, ranks, className = "" }: RankLineProps) {
  const rank = rankFor(score, best, ranks);
  if (!rank) return null;
  return <p className={`kit-rank${className ? ` ${className}` : ""}`} data-rank={rank.title}>{rank.title}</p>;
}

/** A small ribbon that pops in for a new best; `when` false draws nothing, so the game keeps its own record logic. */
export function NewBestRibbon({ when, children = "New best", className = "" }: { when: boolean; children?: ReactNode; className?: string }) {
  if (!when) return null;
  return <span className={`kit-ribbon${className ? ` ${className}` : ""}`}>{children}</span>;
}
