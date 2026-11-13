// Odd one out: the start screen, the round summary and the can't-load screen (design section 10). The start screen
// follows the Bible crossword's (owner, 2026-11-12: "make this the standard"): the hub's drawing beside the title, the
// four choices as cards with their own line drawing, the levels as pills, and Play under a hairline. The summary is a
// result card that counts up over the trail of ten with Play again and Share beside it; the ten rows stay below.
import { Check, RotateCcw, X } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { Confetti, HopWave, NewBestRibbon, ProgressTrail, RankLine, ResultPanel, ScoreCountUp, ShareButton,
  StreakFlame, trailMarks, trailText } from "../kit";
import { CHOICES, CHOICE_LABELS, DIFFICULTIES, DIFFICULTY_LABELS, RANKS, ROUND_LENGTH, isAvailable, levelsNote, scoreRound,
  shareLines, shownLabel, type Choice, type Difficulty, type SetsFile } from "./game";
import { GAME_ART, GameArtImage } from "../art";
import { ChoiceIcon } from "./ChoiceIcons";
import { OddExtrasContext } from "./extras";
import { Headline, Lines } from "./Reveal";
import type { RoundState } from "./storage";

interface StartProps {
  data: SetsFile;
  choice: Choice;
  difficulty: Difficulty;
  best: number | undefined;
  /** True when the player came back here by choice (Change game, Leave round): the title takes focus. */
  focusTitle?: boolean;
  onChoice: (choice: Choice) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onPlay: () => void;
}

export function StartScreen({ data, choice, difficulty, best, focusTitle = false, onChoice, onDifficulty, onPlay }: StartProps) {
  const playable = isAvailable(data, choice, difficulty);
  const note = levelsNote(data, choice);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusTitle) title.current?.focus({ preventScroll: true }); }, [focusTitle]);
  const extras = useContext(OddExtrasContext);
  return <div className="oo-start">
    <div className="oo-start-head">
      <GameArtImage art={GAME_ART.oddOneOut} className="oo-art" />
      <div>
        <h1 ref={title} tabIndex={-1}>Odd one out</h1>
        <p className="oo-lede">Four names. One doesn't belong. Can you see why?</p>
      </div>
    </div>
    {extras.startArt?.(data)}
    <fieldset className="oo-shelf">
      <legend>What</legend>
      {CHOICES.map((c) => {
        const open = DIFFICULTIES.some((d) => isAvailable(data, c, d));
        return <button key={c} type="button" className="oo-pick" aria-pressed={c === choice} disabled={!open} onClick={() => onChoice(c)}>
          <ChoiceIcon choice={c} /><span>{CHOICE_LABELS[c]}</span></button>;
      })}
    </fieldset>
    <fieldset className="oo-chips">
      <legend>How hard</legend>
      {DIFFICULTIES.map((d) => {
        const open = isAvailable(data, choice, d);
        return <button key={d} type="button" aria-pressed={d === difficulty} disabled={!open} onClick={() => onDifficulty(d)}
          aria-describedby={open ? undefined : "oo-levels-note"}>{DIFFICULTY_LABELS[d]}</button>;
      })}
    </fieldset>
    {note && <p className="oo-note" id="oo-levels-note">{note}</p>}
    <div className="oo-start-foot">
      <button type="button" className="oo-primary" disabled={!playable} onClick={onPlay}>Play</button>
      {best !== undefined && <span className="oo-best"><span>Your best here</span> <b>{`${formatNumber(best)} / ${formatNumber(ROUND_LENGTH)}`}</b></span>}
    </div>
  </div>;
}

/** How the round that just ended here came out; null for a summary a reload brought back (no celebration twice). */
export interface Ending { score: number; bestBefore: number | undefined }

interface SummaryProps { data: SetsFile; round: RoundState; best: number; ending: Ending | null; onAgain: () => void; onChange: () => void }

export function SummaryScreen({ data, round, best, ending, onAgain, onChange }: SummaryProps) {
  const byId = new Map(data.sets.map((set) => [set.id, set]));
  const sets = round.ids.map((id) => byId.get(id)!);
  const results = sets.map((set, n) => (round.picks[n] === set.odd ? "right" : "wrong") as "right" | "wrong");
  const { score, bestStreak } = scoreRound(results.map((r) => r === "right"));
  const marks = trailMarks(results, sets.length, true);
  const fresh = ending !== null;
  const newBest = fresh && score > 0 && score > (ending.bestBefore ?? -1);
  const perfect = score === sets.length;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <div className="oo-summary">
    <ResultPanel className="oo-result-panel"
      trail={<HopWave when={fresh && perfect} className="oo-summary-trail">
        <ProgressTrail marks={marks} size="1.1rem" label={plural(score, "{n} of 10 right", "{n} of 10 right")} />
      </HopWave>}
      actions={<>
        <button type="button" className="oo-primary" onClick={onAgain}><RotateCcw size={15} aria-hidden="true" />Play again</button>
        <button type="button" className="oo-secondary" onClick={onChange}>Change game</button>
        <ShareButton className="oo-share" preview={false} game="Odd one out"
          text={shareLines(round.choice, round.difficulty, score, trailText(marks))} />
      </>}
      reading={<ol className="oo-summary-list">
        {sets.map((set, n) => <li key={set.id}>
          <details>
            <summary>
              {results[n] === "right" ? <Check size={16} aria-label="Right" /> : <X size={16} aria-label="Wrong" />}
              <span className="oo-summary-four">{round.orders[n].map((id) => shownLabel(data, set, id)).join(" · ")}</span>
              <Headline data={data} set={set} inline />
            </summary>
            <Lines data={data} set={set} order={round.orders[n]} />
          </details>
        </li>)}
      </ol>}>
      <h2 ref={heading} tabIndex={-1} className="oo-summary-title">Your round</h2>
      <NewBestRibbon when={newBest} />
      <ScoreCountUp value={score} of={sets.length} ms={fresh ? 900 : 0} label={plural(score, "{n} right", "{n} right")} />
      <Confetti when={fresh && (newBest || perfect)} />
      <RankLine score={score} best={sets.length} ranks={RANKS} />
      <p className="oo-summary-stats">
        <span className="oo-stat"><span>Best streak</span> <StreakFlame count={bestStreak} litFrom={2} label={plural(bestStreak, "{n} in a row", "{n} in a row")} /></span>
        <span className="oo-stat"><span>Your best here</span> <b>{`${formatNumber(Math.max(best, score))} / ${formatNumber(sets.length)}`}</b></span>
      </p>
    </ResultPanel>
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="oo-start" role="alert">
    <h1>Odd one out</h1>
    <p className="oo-lede">The puzzles didn't load.</p>
    <button type="button" className="oo-primary" onClick={onRetry}>Try again</button>
  </div>;
}
