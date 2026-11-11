// Who's older?: the start screen, the run-over screen and the can't-load screen (design §8.1, §8.4). The start shows
// the game itself (a sample face-off with the hourglass) over one row of Streak and Relaxed; the ending is a result
// card: the number counting up, a bar against your best, a ribbon and one burst for a new best, the missed pairs each
// with their strip already open, and Share with a preview of the text.
import { RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { AnswerCard, Confetti, NewBestRibbon, ResultPanel, ScoreCountUp, ShareButton, StreakFlame } from "../kit";
import { DIFFICULTIES, DIFFICULTY_LABELS, missedRounds, pairOf, type Character, type Difficulty, type Mode, type Pool, type Run } from "./game";
import { shortName } from "./explain";
import { reachedTitle } from "./view";
import { Hourglass } from "./Hourglass";
import { Reading } from "./Reveal";
import { shareText } from "./share";
import type { Best } from "./storage";

interface StartProps {
  best: Best;
  saving: boolean;
  resume: Run | null;
  resumeScore: number;
  /** Two people for the sample face-off. */
  sample: [Character, Character];
  onPlay: (mode: Mode, difficulty: Difficulty) => void;
  onResume: () => void;
}

export function StartScreen({ best, saving, resume, resumeScore, sample, onPlay, onResume }: StartProps) {
  const [relaxedOpen, setRelaxedOpen] = useState(false);
  return <div className="wo-start">
    <h1>Who's older?</h1>
    <p className="wo-lede">Two Bible people. Tap the one who lived first.</p>
    <div className="wo-sample" aria-hidden="true">
      {sample.map((person, i) => <AnswerCard key={person.id} interactive={false} index={i} className="wo-card wo-card--sample">
        <span className="wo-medallion">{shortName(person.label).slice(0, 1)}</span>
        <span className="wo-card-name">{shortName(person.label)}</span>
        <span className="wo-card-tag">{person.tag}</span>
      </AnswerCard>)}
      <Hourglass className="wo-cards-glass" />
    </div>
    {resume && <button type="button" className="wo-primary wo-continue" onClick={onResume}>
      {resume.mode === "streak" ? `Continue (streak ${resumeScore})` : `Continue (score ${resumeScore})`}
    </button>}
    <div className="wo-modes">
      <div className="wo-mode">
        <button type="button" className={resume ? "wo-secondary" : "wo-primary"} onClick={() => onPlay("streak", "mixed")}>Streak</button>
        <p>One miss ends the run. It gets harder as you go.</p>
        {saving && <p className="wo-best"><span>Best streak</span>
          <StreakFlame count={best.streak} litFrom={1} label={plural(best.streak, "{n} in a row", "{n} in a row")} /></p>}
      </div>
      <div className="wo-mode">
        <button type="button" className="wo-secondary" aria-expanded={relaxedOpen} onClick={() => setRelaxedOpen((open) => !open)}>Relaxed</button>
        <p>Three hearts, and you choose how hard. Good for families.</p>
        {saving && <p className="wo-best"><span>Best score</span><span className="wo-best-n">{formatNumber(best.relaxed)}</span></p>}
        {relaxedOpen && <fieldset className="wo-chips">
          <legend>How hard</legend>
          {DIFFICULTIES.map((d) => <button key={d} type="button" onClick={() => onPlay("relaxed", d)}>{DIFFICULTY_LABELS[d]}</button>)}
        </fieldset>}
      </div>
    </div>
    {!saving && <p className="wo-note">Best scores are not saved on this device</p>}
    <details className="wo-how">
      <summary>How we date people</summary>
      <p>The game follows the order the Bible gives. Dates in years are scholars' reconstructions, and their systems differ.
        Every person has a window wide enough for all of those systems. A pair is only asked when the order is certain on
        every one of them, or a verse states it.</p>
    </details>
  </div>;
}

interface OverProps { pool: Pool; run: Run; best: Best; newBest: boolean; onAgain: () => void; onStart: () => void }

export function RunOver({ pool, run, best, newBest, onAgain, onStart }: OverProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const score = run.rounds.filter((r) => r.pick !== null && r.pick === pairOf(pool, r)?.first.id).length;
  const text = shareText(run.mode, score);
  const record = newBest && score > 0;
  const bestNow = run.mode === "streak" ? best.streak : best.relaxed;
  const top = Math.max(score, bestNow, 1);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const title = run.mode === "streak" ? reachedTitle(score) : undefined;
  return <ResultPanel className="wo-over"
    trail={<ShareButton className="wo-share" text={text} game="Who's older?" />}
    actions={<>
      <button type="button" className="wo-primary" onClick={onAgain}><RotateCcw size={15} aria-hidden="true" />Play again</button>
      <button type="button" className="wo-secondary" onClick={onStart}>Back to start</button>
    </>}
    reading={<Missed pool={pool} run={run} />}>
    <h1 ref={heading} tabIndex={-1} className="wo-over-kicker">{run.mode === "streak" ? "Your streak" : "Right answers"}</h1>
    <div className="wo-over-score">
      <Confetti when={record} count={32} reach={170} />
      <ScoreCountUp value={score} label={run.mode === "streak" ? plural(score, "{n} in a row", "{n} in a row") : plural(score, "{n} right", "{n} right")} />
    </div>
    <NewBestRibbon when={record}>New best!</NewBestRibbon>
    {title && <p className="wo-rank">{title}</p>}
    <div className="wo-bestbar" role="img" aria-label={plural(bestNow, "Your best: {n}", "Your best: {n}")}>
      <span className="wo-bestbar-row"><span>This run</span><i style={{ "--wo-share": score / top } as CSSProperties} /><b>{formatNumber(score)}</b></span>
      <span className="wo-bestbar-row is-best"><span>Your best</span><i style={{ "--wo-share": bestNow / top } as CSSProperties} /><b>{formatNumber(bestNow)}</b></span>
    </div>
  </ResultPanel>;
}

function Missed({ pool, run }: { pool: Pool; run: Run }) {
  const missed = missedRounds(pool, run);
  if (!missed.length) return null;
  return <section className="wo-missed">
    <h2>{plural(missed.length, "The one you missed", "The ones you missed")}</h2>
    <ol>
      {missed.map((round) => {
        const pair = pairOf(pool, round)!;
        return <li key={`${round.left}|${round.right}`}>
          <p className="wo-missed-head"><X size={15} aria-label="Wrong" /><strong>{pair.first.label}</strong> <span>before</span> <strong>{pair.second.label}</strong></p>
          <Reading data={pool.data} pair={pair} />
        </li>;
      })}
    </ol>
  </section>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="wo-start" role="alert">
    <h1>Who's older?</h1>
    <p className="wo-lede">The game didn't load.</p>
    <button type="button" className="wo-primary" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Try again</button>
  </div>;
}
