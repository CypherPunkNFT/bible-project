// Timeline sort's screens around play (design §10.1; redesigned from docs/visual-audits/timeline.md, item 5): a lobby,
// not a settings page. Today's puzzle is a small fanned stack of six face-down cards with its number and the streak
// flame; the Practice levels are three card stacks of four, five and seven cards to tap; the part of the Bible is a row
// of era chips along a thin line. The fold "How we order events" and the message when the data cannot load stay.
import { Play, RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { StreakFlame } from "../kit";
import { LEVEL_KEYS, LEVELS, type EraChoice, type Level } from "./deal";
import { ERAS } from "./order";
import type { Round, Saved } from "./storage";

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

const FAN = 6;

/** A fanned stack of face-down cards, the top one carrying the puzzle's number. Decoration: the button beside it speaks. */
function Fan({ number, done }: { number: number | null; done: boolean }) {
  return <span className={`tl-fan${done ? " is-done" : ""}`} aria-hidden="true">
    {Array.from({ length: FAN }, (_, i) => <span key={i} className="tl-fan-card" style={{ "--kit-i": i } as CSSProperties}>
      {i === FAN - 1 && number !== null && <span className="tl-fan-number">{`#${formatNumber(number)}`}</span>}
    </span>)}
  </span>;
}

export function StartScreen({ dailyNumber, dailyDone, streak, saved, saving, resume, onDaily, onPractice, onResume }: StartProps) {
  const [level, setLevel] = useState<Level>(saved.practice.level);
  const [era, setEra] = useState<EraChoice>(saved.practice.era);
  return <div className="tl-start">
    <h1>Timeline sort</h1>
    <p className="tl-lede">Put Bible events in the order they happened, earliest at the top.</p>
    {resume && <button type="button" className="tl-primary tl-continue" onClick={onResume}>
      <Play size={15} aria-hidden="true" />{resume.mode === "daily" ? "Continue your daily timeline" : "Continue your practice round"}
    </button>}
    <div className="tl-lobby">
      <section className="tl-mode tl-mode--daily" aria-labelledby="tl-daily-title">
        <Fan number={dailyNumber} done={dailyDone} />
        <div className="tl-mode-body">
          <h2 id="tl-daily-title">Today's timeline</h2>
          <p>Six events, the same for everyone today. Four tries, with ticks and links to help between them.</p>
          {dailyNumber !== null && <button type="button" className="tl-primary" onClick={onDaily}>
            {dailyDone ? "Done — see your result" : `Play #${formatNumber(dailyNumber)}`}
          </button>}
          <p className="tl-best">
            <StreakFlame count={streak} label={plural(streak, "{n} day in a row", "{n} days in a row")} />
            <span>{`Best ${formatNumber(saved.daily.best)}`}</span>
          </p>
        </div>
      </section>
      <section className="tl-mode tl-mode--practice" aria-labelledby="tl-practice-title">
        <h2 id="tl-practice-title">Practice</h2>
        <p>One round at a time, scored by how many pairs of cards you put the right way round.</p>
        <div className="tl-stacks" role="group" aria-label="Level">
          {LEVEL_KEYS.map((key) => <button key={key} type="button" className="tl-stack" aria-pressed={level === key} onClick={() => setLevel(key)}>
            <span className="tl-stack-cards" aria-hidden="true">
              {Array.from({ length: LEVELS[key].cards }, (_, i) => <span key={i} style={{ "--kit-i": i } as CSSProperties} />)}
            </span>
            <span className="tl-stack-name">{LEVELS[key].title}</span>
            <span className="tl-stack-count">{plural(LEVELS[key].cards, "{n} card", "{n} cards")}</span>
          </button>)}
        </div>
        <div className="tl-eras" role="group" aria-label="Part of the story">
          <button type="button" className="tl-era" aria-pressed={era === "all"} onClick={() => setEra("all")}>All of the Bible</button>
          {ERAS.map((option) => <button key={option.key} type="button" className="tl-era" aria-pressed={era === option.key} onClick={() => setEra(option.key)}>{option.title}</button>)}
        </div>
        <button type="button" className="tl-primary" onClick={() => onPractice(level, era)}>Start practice</button>
        <p className="tl-best"><span>Best perfect streak at this level</span> <strong>{formatNumber(saved.practice.bestPerfect[level])}</strong></p>
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
