// Odd one out: the start screen, the round summary and the can't-load screen (design section 10).
import { Check, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CHOICES, CHOICE_LABELS, DIFFICULTIES, DIFFICULTY_LABELS, isAvailable, scoreRound, shownLabel,
  type Choice, type Difficulty, type SetsFile } from "./game";
import { Headline, Reveal } from "./Reveal";
import type { RoundState } from "./storage";

interface StartProps {
  data: SetsFile;
  choice: Choice;
  difficulty: Difficulty;
  best: number | undefined;
  onChoice: (choice: Choice) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onPlay: () => void;
}

export function StartScreen({ data, choice, difficulty, best, onChoice, onDifficulty, onPlay }: StartProps) {
  const playable = isAvailable(data, choice, difficulty);
  return <div className="oo-start">
    <h1>Odd one out</h1>
    <p className="oo-lede">Four names. One doesn't belong. Can you see why?</p>
    <fieldset className="oo-chips">
      <legend>What</legend>
      {CHOICES.map((c) => {
        const open = DIFFICULTIES.some((d) => isAvailable(data, c, d));
        return <button key={c} type="button" aria-pressed={c === choice} disabled={!open} onClick={() => onChoice(c)}>{CHOICE_LABELS[c]}</button>;
      })}
    </fieldset>
    <fieldset className="oo-chips">
      <legend>How hard</legend>
      {DIFFICULTIES.map((d) => {
        const open = isAvailable(data, choice, d);
        return <button key={d} type="button" aria-pressed={d === difficulty} disabled={!open} onClick={() => onDifficulty(d)}
          title={open ? undefined : "Not enough puzzles at this level yet"}>{DIFFICULTY_LABELS[d]}</button>;
      })}
    </fieldset>
    {!playable && <p className="oo-note">{`Not enough ${CHOICE_LABELS[choice].toLowerCase()} puzzles at this level yet: pick another level.`}</p>}
    <div className="oo-start-foot">
      <button type="button" className="oo-primary" disabled={!playable} onClick={onPlay}>Play</button>
      {best !== undefined && <span className="oo-best">{`Your best here: ${best} of 10`}</span>}
    </div>
  </div>;
}

interface SummaryProps { data: SetsFile; round: RoundState; best: number; onAgain: () => void; onChange: () => void }

export function SummaryScreen({ data, round, best, onAgain, onChange }: SummaryProps) {
  const byId = new Map(data.sets.map((set) => [set.id, set]));
  const sets = round.ids.map((id) => byId.get(id)!);
  const results = sets.map((set, n) => round.picks[n] === set.odd);
  const { score, bestStreak } = scoreRound(results);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="oo-summary">
    <h2 ref={heading} tabIndex={-1} id="oo-summary-heading">{`You scored ${score} of ${sets.length}`}</h2>
    <p className="oo-summary-stats">{`Best streak: ${bestStreak} · Your best for ${CHOICE_LABELS[round.choice]}, ${DIFFICULTY_LABELS[round.difficulty]}: ${best} of 10`}</p>
    <ol className="oo-summary-list">
      {sets.map((set, n) => <li key={set.id}>
        <details>
          <summary>
            {results[n] ? <Check size={16} aria-label="Right" /> : <X size={16} aria-label="Wrong" />}
            <span className="oo-summary-four">{round.orders[n].map((id) => shownLabel(data, set, id)).join(" · ")}</span>
            <Headline data={data} set={set} inline />
          </summary>
          <Reveal data={data} set={set} order={round.orders[n]} pick={round.picks[n]} />
        </details>
      </li>)}
    </ol>
    <div className="oo-start-foot">
      <button type="button" className="oo-primary" onClick={onAgain}><RotateCcw size={15} aria-hidden="true" />Play again</button>
      <button type="button" className="oo-secondary" onClick={onChange}>Change game</button>
    </div>
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="oo-start" role="alert">
    <h1>Odd one out</h1>
    <p className="oo-lede">The puzzles didn't load.</p>
    <button type="button" className="oo-primary" onClick={onRetry}>Try again</button>
  </div>;
}
