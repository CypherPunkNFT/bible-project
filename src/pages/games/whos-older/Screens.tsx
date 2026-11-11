// Who's older?: the start screen, the run-over screen and the can't-load screen (design §8.1, §8.4).
import { Copy, RotateCcw, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { plural } from "@/lib/site-format";
import { DIFFICULTIES, DIFFICULTY_LABELS, missedRounds, pairOf, type Difficulty, type Mode, type Pool, type Run } from "./game";
import { explain } from "./explain";
import { Reveal } from "./Reveal";
import { shareResult, shareText } from "./share";
import type { Best } from "./storage";

interface StartProps {
  best: Best;
  saving: boolean;
  resume: Run | null;
  resumeScore: number;
  onPlay: (mode: Mode, difficulty: Difficulty) => void;
  onResume: () => void;
}

export function StartScreen({ best, saving, resume, resumeScore, onPlay, onResume }: StartProps) {
  const [relaxedOpen, setRelaxedOpen] = useState(false);
  const bestNote = (n: number, what: string) => (saving ? `Best ${what}: ${n}` : "Best scores are not saved on this device");
  return <div className="wo-start">
    <h1>Who's older?</h1>
    <p className="wo-lede">Two Bible people. Tap the one who lived first.</p>
    {resume && <button type="button" className="wo-primary wo-continue" onClick={onResume}>
      {resume.mode === "streak" ? `Continue (streak ${resumeScore})` : `Continue (score ${resumeScore})`}
    </button>}
    <div className="wo-modes">
      <div className="wo-mode">
        <button type="button" className={resume ? "wo-secondary" : "wo-primary"} onClick={() => onPlay("streak", "mixed")}>Streak</button>
        <p>One miss ends the run. It gets harder as you go.</p>
        <p className="wo-best">{bestNote(best.streak, "streak")}</p>
      </div>
      <div className="wo-mode">
        <button type="button" className="wo-secondary" aria-expanded={relaxedOpen} onClick={() => setRelaxedOpen((open) => !open)}>Relaxed</button>
        <p>Three hearts, and you choose how hard. Good for families.</p>
        <p className="wo-best">{bestNote(best.relaxed, "score")}</p>
        {relaxedOpen && <fieldset className="wo-chips">
          <legend>How hard</legend>
          {DIFFICULTIES.map((d) => <button key={d} type="button" onClick={() => onPlay("relaxed", d)}>{DIFFICULTY_LABELS[d]}</button>)}
        </fieldset>}
      </div>
    </div>
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
  const [shared, setShared] = useState<"" | "copied" | "manual">("");
  const score = run.rounds.filter((r) => r.pick !== null && r.pick === pairOf(pool, r)?.first.id).length;
  const text = shareText(run.mode, score);
  useEffect(() => { heading.current?.focus(); }, []);
  const share = async () => {
    const outcome = await shareResult(text);
    if (outcome === "copied" || outcome === "manual") setShared(outcome);
  };
  return <div className="wo-over">
    <h1 ref={heading} tabIndex={-1}>{run.mode === "streak" ? `Streak of ${score}` : `${score} right`}</h1>
    {newBest && score > 0 && <p className="wo-new-best">New best!</p>}
    <p className="wo-over-best">{run.mode === "streak" ? `Your best streak: ${best.streak}` : `Your best in Relaxed: ${best.relaxed}`}</p>
    <div className="wo-start-foot">
      <button type="button" className="wo-primary" onClick={onAgain}><RotateCcw size={15} aria-hidden="true" />Play again</button>
      <button type="button" className="wo-secondary" onClick={share}><Share2 size={15} aria-hidden="true" />Share</button>
      <button type="button" className="wo-secondary" onClick={onStart}>Back to start</button>
    </div>
    {shared === "copied" && <p className="wo-note" role="status"><Copy size={13} aria-hidden="true" /> Copied — paste it anywhere.</p>}
    {shared === "manual" && <label className="wo-copy">Copy your result:
      <textarea readOnly value={text} rows={2} onFocus={(e) => e.currentTarget.select()} />
    </label>}
    <Missed pool={pool} run={run} />
  </div>;
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
          <details>
            <summary>
              <X size={15} aria-label="Wrong" />
              <span><strong>{pair.first.label}</strong> before <strong>{pair.second.label}</strong></span>
              <span className="wo-missed-reason">{explain(pair).text}</span>
            </summary>
            <Reveal data={pool.data} pair={pair} pick={round.pick} />
          </details>
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
