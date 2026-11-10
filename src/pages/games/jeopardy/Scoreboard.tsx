// Bible Jeopardy's scoreboard (design 9.3, 6.2): each team's number, name, colour and score along the bottom of the
// stage; the team to choose is raised. Clicking a name makes that team choose; clicking a score opens −100 / +100 and
// a box for an exact score. A negative score has a minus sign and the word "minus" for screen readers.
import { useState } from "react";
import { formatNumber } from "@/lib/site-format";
import type { Team } from "./model";

export function Score({ value }: { value: number }) {
  if (value >= 0) return <>{formatNumber(value)}</>;
  return <><span aria-hidden>−{formatNumber(-value)}</span><span className="sr-only">{`minus ${formatNumber(-value)}`}</span></>;
}

interface Props {
  teams: Team[];
  chooser: number;
  /** Whether the board is showing, so "to choose" and Make … choose apply. */
  choosing: boolean;
  last: { team: number; delta: number } | null;
  onChoose: (team: number) => void;
  onAdjust: (team: number, delta: number) => void;
  onSetScore: (team: number, score: number) => void;
  /** The team whose score panel is open (the stage's menu can open it too). */
  adjusting: number | null;
  setAdjusting: (team: number | null) => void;
}

function Adjust({ team, index, onAdjust, onSetScore, onClose }: { team: Team; index: number } & Pick<Props, "onAdjust" | "onSetScore"> & { onClose: () => void }) {
  const [exact, setExact] = useState(String(team.score));
  const parsed = Number(exact);
  const valid = exact.trim() !== "" && Number.isInteger(parsed) && Math.abs(parsed) <= 1_000_000;
  // The exact box follows the −100 / +100 buttons, so a later Set never undoes them.
  const step = (delta: number) => { onAdjust(index, delta); setExact(String(team.score + delta)); };
  return <div className="jp-adjust" role="group" aria-label={`Adjust the score of ${team.name}`}>
    <button type="button" onClick={() => step(-100)}>−100</button>
    <button type="button" onClick={() => step(100)}>+100</button>
    <form onSubmit={(event) => { event.preventDefault(); if (valid) { onSetScore(index, parsed); onClose(); } }}>
      <input type="number" step={50} value={exact} aria-label={`Exact score for ${team.name}`} onChange={(event) => setExact(event.target.value)} />
      <button type="submit" disabled={!valid}>Set</button>
    </form>
    <button type="button" className="jp-quiet" onClick={onClose}>Done</button>
  </div>;
}

export function Scoreboard({ teams, chooser, choosing, last, onChoose, onAdjust, onSetScore, adjusting, setAdjusting }: Props) {
  return <ol className="jp-scoreboard" aria-label="Scores">
    {teams.map((team, index) => {
      const raised = choosing && index === chooser;
      return <li key={index} className={`jp-tone-${index}${raised ? " is-choosing" : ""}`}>
        <button type="button" className="jp-team-name" title={team.name} disabled={!choosing || raised} onClick={() => onChoose(index)}
          aria-label={raised ? `${team.name}, to choose` : `Make ${team.name} choose`}>
          <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
          <span className="jp-team-label">{team.name}</span>
        </button>
        {raised && <span className="jp-to-choose">to choose</span>}
        <button type="button" className="jp-team-score" onClick={() => setAdjusting(adjusting === index ? null : index)} aria-label={`Score of ${team.name}: ${team.score < 0 ? `minus ${formatNumber(-team.score)}` : formatNumber(team.score)}. Adjust`}>
          <Score value={team.score} />
        </button>
        {last && last.team === index && last.delta !== 0 && <span className={`jp-delta ${last.delta > 0 ? "is-up" : "is-down"}`} aria-hidden>
          {last.delta > 0 ? `+${formatNumber(last.delta)}` : `−${formatNumber(-last.delta)}`}
        </span>}
        {adjusting === index && <Adjust team={team} index={index} onAdjust={onAdjust} onSetScore={onSetScore} onClose={() => setAdjusting(null)} />}
      </li>;
    })}
  </ol>;
}
