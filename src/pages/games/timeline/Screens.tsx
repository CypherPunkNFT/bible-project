// Timeline sort's screens around play (design §10.1, §10.5): the start screen with today's puzzle and Practice, the
// Daily result with its share and countdown, and the message when the data cannot load.
import { CalendarDays, Dumbbell, Play, RotateCcw, Share2 } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { useNow } from "../map-quest/use-now";
import { msUntilMidnight } from "./daily";
import { LEVEL_KEYS, LEVELS, type EraChoice, type Level } from "./deal";
import { ERAS } from "./order";
import { DAILY_TRIES, shareResult, shareText, type ShareOutcome } from "./share";
import { distribution, type DailyResult, type Round, type Saved } from "./storage";

interface StartProps {
  dailyNumber: number | null;
  dailyDone: boolean;
  streak: number;
  saved: Saved;
  saving: boolean;
  resume: Round | null;
  onDaily: () => void;
  onPractice: (level: Level, era: EraChoice) => void;
  onResume: () => void;
}

export function StartScreen({ dailyNumber, dailyDone, streak, saved, saving, resume, onDaily, onPractice, onResume }: StartProps) {
  const [level, setLevel] = useState<Level>(saved.practice.level);
  const [era, setEra] = useState<EraChoice>(saved.practice.era);
  return <div className="tl-start">
    <h1>Timeline sort</h1>
    <p className="tl-lede">Put Bible events in the order they happened, earliest at the top.</p>
    {resume && <button type="button" className="tl-primary tl-continue" onClick={onResume}>
      <Play size={15} aria-hidden="true" />Continue your {resume.mode === "daily" ? "daily timeline" : "practice round"}
    </button>}
    <div className="tl-modes">
      <section className="tl-mode" aria-labelledby="tl-daily-title">
        <h2 id="tl-daily-title"><CalendarDays size={18} aria-hidden="true" />Today's timeline</h2>
        <p>Six events, the same for everyone today. Four tries, with ticks and links to help between them.</p>
        {dailyNumber !== null && <button type="button" className="tl-primary" onClick={onDaily}>
          {dailyDone ? "Done — see your result" : `Play #${formatNumber(dailyNumber)}`}
        </button>}
        <p className="tl-best">Streak {formatNumber(streak)} · best {formatNumber(saved.daily.best)}</p>
      </section>
      <section className="tl-mode" aria-labelledby="tl-practice-title">
        <h2 id="tl-practice-title"><Dumbbell size={18} aria-hidden="true" />Practice</h2>
        <p>One round at a time, scored by how many pairs of cards you put the right way round.</p>
        <fieldset className="tl-chips">
          <legend>Level</legend>
          {LEVEL_KEYS.map((key) => <button key={key} type="button" aria-pressed={level === key} onClick={() => setLevel(key)}>
            {LEVELS[key].title} · {LEVELS[key].cards} cards</button>)}
        </fieldset>
        <label className="tl-era">Part of the story
          <select value={era} onChange={(event) => setEra(event.target.value as EraChoice)}>
            <option value="all">All of the Bible</option>
            {ERAS.map((option) => <option key={option.key} value={option.key}>{option.title}</option>)}
          </select>
        </label>
        <button type="button" className="tl-primary" onClick={() => onPractice(level, era)}>Start practice</button>
        <p className="tl-best">Best perfect streak at {LEVELS[level].title}: {formatNumber(saved.practice.bestPerfect[level])}</p>
      </section>
    </div>
    <details className="tl-how">
      <summary>How we order events</summary>
      <p>The game follows the order of events the Bible itself gives. Dates before about 1000 BC are reconstructions, and
        scholars' dating systems differ. So every event carries a window of years wide enough for all of those systems, and
        a set of cards is only dealt when its order is certain on every one of them, or a verse states it. Labels, dates
        and reasons are in English in every language of the site.</p>
    </details>
    {!saving && <p className="tl-note">This browser is not saving, so your streaks and rounds will not be kept.</p>}
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="tl-start">
    <h1>Timeline sort</h1>
    <p className="tl-lede" role="alert">The events could not be loaded. Check your connection and try again.</p>
    <button type="button" className="tl-primary" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Try again</button>
  </div>;
}

const clock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map((part) => String(part).padStart(2, "0")).join(":");
};

interface DoneProps { n: number; result: DailyResult; truth: readonly string[]; saved: Saved; streak: number; onPractice: () => void }

/** The end of a Daily (§10.5): result, share, streaks, the spread of tries and the countdown to tomorrow. */
export function DailyDone({ n, result, truth, saved, streak, onPractice }: DoneProps) {
  const now = useNow();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const text = shareText(n, result.tries, truth, result.solved);
  const { solvedIn, missed } = distribution(saved);
  const most = Math.max(1, ...solvedIn, missed);
  return <div className="tl-done">
    <p className="tl-done-result">{result.solved ? `Solved in ${result.tries.length}/${DAILY_TRIES}` : `Not this time: X/${DAILY_TRIES}`}</p>
    <div className="tl-done-actions">
      <button type="button" className="tl-primary" onClick={() => { void shareResult(text).then(setOutcome); }}><Share2 size={15} aria-hidden="true" />Share</button>
      <button type="button" className="tl-secondary" onClick={onPractice}>Practice now</button>
    </div>
    {outcome === "copied" && <p className="tl-note" role="status">Copied: paste it anywhere.</p>}
    {outcome === "manual" && <label className="tl-copy">Select and copy your result
      <textarea readOnly value={text} rows={text.split("\n").length} onFocus={(event) => event.currentTarget.select()} /></label>}
    <dl className="tl-stats">
      <div><dt>Streak</dt><dd>{formatNumber(streak)}</dd></div>
      <div><dt>Best streak</dt><dd>{formatNumber(saved.daily.best)}</dd></div>
      <div><dt>Next puzzle in</dt><dd>{clock(msUntilMidnight(now))}</dd></div>
    </dl>
    <ul className="tl-spread" aria-label="Your results so far">
      {[...solvedIn.map((count, i) => ({ key: String(i + 1), count })), { key: "X", count: missed }].map(({ key, count }) =>
        <li key={key}><span>{key}</span><span className="tl-spread-bar" style={{ width: `${Math.max(6, (count / most) * 100)}%` }}>{formatNumber(count)}</span></li>)}
    </ul>
  </div>;
}
