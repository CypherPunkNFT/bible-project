// What came first?: the start screen, the run-over screen and the can't-load screen (design §9.1, §9.4). The start
// shows the nine pills, the chosen kind's question, a sample of the game itself and one row of Streak and Relaxed with
// that pill's bests; the ending is a result card titled with the kind of round: the number counting up, a bar against
// your best, a ribbon and one burst for a new best, the missed rounds each with their reading open, and Share.
import { RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { AnswerCard, Confetti, NewBestRibbon, ResultPanel, ScoreCountUp, ShareButton, StreakFlame } from "../kit";
import { shortName } from "../whos-older/explain";
import { CATEGORIES, categoryInfo, type Choice } from "./categories";
import { DIFFICULTIES, DIFFICULTY_LABELS, answersOf, askedAll, isPairRound, missedRounds, pairOf, questionOf, score as scoreOf,
  type Difficulty, type Mode, type Run } from "./game";
import type { Pools } from "./pool";
import { Hourglass } from "./Hourglass";
import { ChoiceReading, Reading } from "./Reveal";
import { Medallion } from "./Round";
import { cardTag, reachedTitle, samplePair } from "./view";
import { shareText } from "./share";
import type { Best } from "./storage";

interface StartProps {
  pools: Pools;
  choice: Choice;
  onChoose: (choice: Choice) => void;
  best: Best;
  saving: boolean;
  resume: Run | null;
  resumeScore: number;
  onPlay: (mode: Mode, difficulty: Difficulty) => void;
  onResume: () => void;
}

/** The nine pills, all visible at once: a single-choice group of buttons, never a dropdown (design §9.1). */
export function CategoryPills({ choice, onChoose }: { choice: Choice; onChoose: (choice: Choice) => void }) {
  return <div className="wcf-pills" role="group" aria-label="What to play">
    {CATEGORIES.map((c) => <button key={c.key} type="button" className="wcf-pill" aria-pressed={c.key === choice}
      style={{ "--wcf-tone": `var(--${c.tone})` } as CSSProperties} onClick={() => onChoose(c.key)}>{c.label}</button>)}
  </div>;
}

/** The sample for the chosen pill: two real cards with the hourglass, or a Bible Firsts question with its answers. */
function Sample({ pools, choice }: { pools: Pools; choice: Choice }) {
  if (choice === "firsts" && pools.firsts) {
    const question = pools.firsts.byBand.easy[0] ?? pools.firsts.questions[0];
    return <div className="wcf-sample-q" aria-hidden="true">
      <p className="wcf-sample-ask">{question.question}</p>
      <div className="wcf-answers">
        {answersOf(question).slice(0, 4).map((text, i) => <AnswerCard key={text} interactive={false} index={i} className="wo-card wcf-answer wo-card--sample">
          <span className="wo-card-name">{text}</span>
        </AnswerCard>)}
      </div>
    </div>;
  }
  const pool = pools[choice === "mixed" || choice === "firsts" ? "lived" : choice];
  if (!pool) return null;
  const sample = samplePair(pool);
  return <div className="wo-sample" aria-hidden="true">
    {sample.map((item, i) => <AnswerCard key={item.id} interactive={false} index={i} className="wo-card wo-card--sample">
      <Medallion category={pool.key} item={item} />
      <span className="wo-card-name">{pool.key === "happened" ? item.label : shortName(item.label)}</span>
      {cardTag(pool.key, item) && <span className="wo-card-tag">{cardTag(pool.key, item)}</span>}
    </AnswerCard>)}
    <Hourglass className="wo-cards-glass" />
  </div>;
}

const HOW: Record<Choice, string> = {
  lived: "People are ordered by when they were born.",
  happened: "Events are ordered by when they took place; the miracles of Jesus and the plagues are never set against each other.",
  ruled: "Rulers are ordered by when they began to reign; where a king shared the throne with his father, every way of counting is covered.",
  built: "Buildings and things made are ordered by when they were built or made.",
  went: "Journeys: two stops of one traveller's one journey, in the order Scripture gives them; the first arrival counts.",
  died: "Deaths are only deaths Scripture records; Enoch and Elijah, who did not die, are never asked.",
  books: "Books follow the 66-book order of the Protestant Bible.",
  firsts: "Bible firsts are only the firsts Scripture states or plainly shows, each with its verse.",
  mixed: "Mixed deals a round from every kind in turn.",
};

export function StartScreen({ pools, choice, onChoose, best, saving, resume, resumeScore, onPlay, onResume }: StartProps) {
  const [relaxedOpen, setRelaxedOpen] = useState(false);
  const info = categoryInfo(choice);
  return <div className="wo-start">
    <h1>What came first?</h1>
    <p className="wo-lede">Two from the Bible. Tap the one that came first.</p>
    <CategoryPills choice={choice} onChoose={onChoose} />
    <p className="wcf-chosen" style={{ "--wcf-tone": `var(--${info.tone})` } as CSSProperties}>{info.heading}</p>
    <Sample pools={pools} choice={choice} />
    {resume && <button type="button" className="wo-primary wo-continue" onClick={onResume}>
      <span className="wcf-name">{categoryInfo(resume.choice).label}</span>
      <span>{resume.mode === "streak" ? `Continue (streak ${resumeScore})` : `Continue (score ${resumeScore})`}</span>
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
      <summary>How we decide what came first</summary>
      <p>The game follows the order the Bible gives. Dates in years are scholars' reconstructions, and their systems differ.
        Everything with a date has a window wide enough for all of those systems. A pair is only asked when the order is
        certain on every one of them, or a verse states it.</p>
      <p>{HOW[choice]}</p>
    </details>
  </div>;
}

interface OverProps { pools: Pools; run: Run; best: Best; newBest: boolean; onAgain: () => void; onStart: () => void }

export function RunOver({ pools, run, best, newBest, onAgain, onStart }: OverProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const score = scoreOf(pools, run);
  const text = shareText(run.choice, run.mode, score);
  const record = newBest && score > 0;
  const bestNow = run.mode === "streak" ? best.streak : best.relaxed;
  const top = Math.max(score, bestNow, 1);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const complete = askedAll(pools, run) && run.rounds.every((r) => r.pick !== null) && (run.mode === "relaxed" ? run.hearts > 0 : missedRounds(pools, run).length === 0);
  const title = complete ? plural(run.rounds.length, "You answered all {n}", "You answered all {n}") : run.mode === "streak" ? reachedTitle(score) : undefined;
  return <ResultPanel className="wo-over"
    trail={<ShareButton className="wo-share" text={text} game="What came first?" />}
    actions={<>
      <button type="button" className="wo-primary" onClick={onAgain}><RotateCcw size={15} aria-hidden="true" />Play again</button>
      <button type="button" className="wo-secondary" onClick={onStart}>Back to start</button>
    </>}
    reading={<Missed pools={pools} run={run} />}>
    <p className="wcf-over-kind">{categoryInfo(run.choice).heading}</p>
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

function Missed({ pools, run }: { pools: Pools; run: Run }) {
  const missed = missedRounds(pools, run);
  if (!missed.length) return null;
  return <section className="wo-missed">
    <h2>{plural(missed.length, "The one you missed", "The ones you missed")}</h2>
    <ol>
      {missed.map((round, i) => {
        if (!isPairRound(round)) {
          const question = questionOf(pools, round)!;
          return <li key={`${i}-${round.question}`}>
            <p className="wo-missed-head"><X size={15} aria-label="Wrong" /><span>{question.question}</span> <strong>{question.answer}</strong></p>
            <ChoiceReading books={pools.firsts!.books} question={question} />
          </li>;
        }
        const pair = pairOf(pools, round)!;
        return <li key={`${i}-${round.left}|${round.right}`}>
          <p className="wo-missed-head"><X size={15} aria-label="Wrong" /><strong>{pair.first.label}</strong> <span>before</span> <strong>{pair.second.label}</strong></p>
          <Reading pool={pools[round.category]!} pair={pair} />
        </li>;
      })}
    </ol>
  </section>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="wo-start" role="alert">
    <h1>What came first?</h1>
    <p className="wo-lede">The game didn't load.</p>
    <button type="button" className="wo-primary" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Try again</button>
  </div>;
}
