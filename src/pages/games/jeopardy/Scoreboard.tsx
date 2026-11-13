// Bible Jeopardy's scoreboard (design 9.3, 6.2): each team's number, name, colour and score along the bottom of the
// stage; the team to choose is raised. Clicking a name makes that team choose; clicking a score opens −100 / +100 and
// a box for an exact score. A negative score has a minus sign and the word "minus" for screen readers. A change of
// score counts to its new value while "+300" floats up and fades (the audit's item 2); the real number is in the
// button's label from the first render, so readers and tests never see the counting.
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { useCountUp } from "../kit";
import type { Team } from "./model";

export function Score({ value }: { value: number }) {
  if (value >= 0) return <>{formatNumber(value)}</>;
  return <><span aria-hidden>−{formatNumber(-value)}</span><span className="sr-only">{`minus ${formatNumber(-value)}`}</span></>;
}

/** The score as digits that count from the value they last showed to the new one; at once on first render unless
 * `from` names where the count starts (a Final row that lands with its score already changed). */
export function CountingScore({ value, ms = 650, from }: { value: number; ms?: number; from?: number }) {
  const [range, setRange] = useState({ from: from ?? value, to: value });
  useEffect(() => { setRange((old) => (old.to === value ? old : { from: old.to, to: value })); }, [value]);
  const shown = useCountUp(range.to, ms, range.from);
  const drawn = range.to === value ? shown : value;
  return <span aria-hidden className={drawn !== value ? "is-counting" : ""}>{drawn < 0 ? `−${formatNumber(-drawn)}` : formatNumber(drawn)}</span>;
}

/** The last change of score that should land on the strip: a counter keeps each new one distinct from the last. */
export interface Pulse { team: number; delta: number; n: number }

interface Props {
  teams: Team[];
  chooser: number;
  /** Whether the board is showing, so "to choose" and Make … choose apply. */
  choosing: boolean;
  pulse: Pulse | null;
  onChoose: (team: number) => void;
  onAdjust: (team: number, delta: number) => void;
  onSetScore: (team: number, score: number) => void;
  /** The team whose score panel is open (the stage's menu can open it too). */
  adjusting: number | null;
  setAdjusting: (team: number | null) => void;
}

function Adjust({ team, index, onAdjust, onSetScore, onClose }: { team: Team; index: number } & Pick<Props, "onAdjust" | "onSetScore"> & { onClose: () => void }) {
  const [exact, setExact] = useState(String(team.score));
  // The box follows the score however it changed (a mark or Undo while the panel is open), so Set never restores an
  // old number and wipes out points just won.
  useEffect(() => { setExact(String(team.score)); }, [team.score]);
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

const spoken = (score: number) => (score < 0 ? `minus ${formatNumber(-score)}` : formatNumber(score));

export function Scoreboard({ teams, chooser, choosing, pulse, onChoose, onAdjust, onSetScore, adjusting, setAdjusting }: Props) {
  return <ol className="jp-scoreboard" aria-label="Scores">
    {teams.map((team, index) => {
      const raised = choosing && index === chooser;
      const hit = pulse && pulse.team === index ? pulse : null;
      const tone = hit ? (hit.delta > 0 ? " is-up" : " is-down") : "";
      return <li key={index} className={`jp-tone-${index}${raised ? " is-choosing" : ""}`}>
        <button type="button" className="jp-team-name" title={team.name} disabled={!choosing || raised} onClick={() => onChoose(index)}
          aria-label={raised ? `${team.name}, to choose` : `Make ${team.name} choose`}>
          <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
          <span className="jp-team-label">{team.name}</span>
        </button>
        {raised && <span className="jp-to-choose">to choose</span>}
        {hit && <span key={`flash-${hit.n}`} className={`jp-flash${tone}`} aria-hidden />}
        <button type="button" className={`jp-team-score${tone}`} onClick={() => setAdjusting(adjusting === index ? null : index)}
          aria-label={`Score of ${team.name}: ${spoken(team.score)}. Adjust`}>
          <CountingScore value={team.score} />
        </button>
        {hit && <span key={`float-${hit.n}`} className={`jp-delta${tone}`} aria-hidden>
          {hit.delta > 0 ? `+${formatNumber(hit.delta)}` : `−${formatNumber(-hit.delta)}`}
        </span>}
        {adjusting === index && <Adjust team={team} index={index} onAdjust={onAdjust} onSetScore={onSetScore} onClose={() => setAdjusting(null)} />}
      </li>;
    })}
  </ol>;
}
