// Timeline sort's start page, laid out like the other games' (owner, 2026-11-13: "just like all the other pages, like
// charades or Wordle"): the game's drawing beside the title; what to play as picture cards like Memory card match's,
// Today's timeline first and then the parts of the story for Practice; How hard and the gold button on one line; the
// streak or best under it. The fold "How we order events" and the message when the data cannot load stay.
import { Play, RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { StreakFlame } from "../kit";
import { Tile, type TileIconKey } from "../memory-match/TileIcons";
import { LEVEL_KEYS, LEVELS, type EraChoice, type Level } from "./deal";
import { ERAS, type Era } from "./order";
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

/** Each part of the story's card: its drawing (memory-match/TileIcons.tsx) and a short line under the name. */
const ERA_TILES: Record<Era, { icon: TileIconKey; subtitle: string }> = {
  beginnings: { icon: "sunrise", subtitle: "Creation to Babel" },
  patriarchs: { icon: "tent", subtitle: "Abraham to Joseph" },
  exodus: { icon: "tablets", subtitle: "Moses and Joshua" },
  kingdom: { icon: "crown", subtitle: "The judges to Solomon" },
  divided: { icon: "scroll", subtitle: "Two kingdoms, then Babylon" },
  return: { icon: "wall", subtitle: "Ezra and Nehemiah" },
  jesus: { icon: "fish", subtitle: "The four Gospels" },
  church: { icon: "quill", subtitle: "Acts and the letters" },
};

type Choice = "daily" | EraChoice;

export function StartScreen({ dailyNumber, dailyDone, streak, saved, saving, resume, onDaily, onPractice, onResume }: StartProps) {
  const [level, setLevel] = useState<Level>(saved.practice.level);
  // Today's timeline first, unless there is none or the last round played was Practice.
  const [choice, setChoice] = useState<Choice>(dailyNumber === null || saved.round?.mode === "practice" ? saved.practice.era : "daily");
  const daily = choice === "daily" && dailyNumber !== null;
  // Three a row on a phone (Today's card spans the row, so the nine parts make three rows), five from 560px.
  const rows = { "--mm-cols-s": 3, "--mm-cols-m": 5, "--mm-cols-l": 5 } as CSSProperties;
  return <div className="tl-start">
    <div className="tl-start-head">
      <GameArtImage art={GAME_ART.timeline} className="tl-art" />
      <div>
        <h1>Timeline sort</h1>
        <p className="tl-lede">Put Bible events in the order they happened, earliest at the top.</p>
      </div>
    </div>
    {resume && <button type="button" className="tl-primary tl-continue" onClick={onResume}>
      <Play size={15} aria-hidden="true" />{resume.mode === "daily" ? "Continue your daily timeline" : "Continue your practice round"}
    </button>}
    <fieldset className="mm-tiles tl-tiles" style={rows}>
      <legend>What to play</legend>
      {dailyNumber !== null && <span className="tl-today">
        <Tile icon="calendar" name="Today's timeline" said pressed={choice === "daily"} onClick={() => setChoice("daily")}
          subtitle={dailyDone ? "Done today" : `#${formatNumber(dailyNumber)} · the same for everyone`} />
      </span>}
      <Tile icon="book" name="All of the Bible" subtitle="Creation to the church" pressed={choice === "all"} onClick={() => setChoice("all")} />
      {ERAS.map((era) => <Tile key={era.key} icon={ERA_TILES[era.key].icon} name={era.title} subtitle={ERA_TILES[era.key].subtitle}
        pressed={choice === era.key} onClick={() => setChoice(era.key)} />)}
    </fieldset>
    <div className="tl-line">
      {!daily && <fieldset className="tl-chips">
        <legend>How hard</legend>
        {LEVEL_KEYS.map((key) => <button key={key} type="button" aria-pressed={level === key} onClick={() => setLevel(key)}>
          {`${LEVELS[key].title} · ${plural(LEVELS[key].cards, "{n} card", "{n} cards")}`}
        </button>)}
      </fieldset>}
      {daily
        ? <button type="button" className="tl-primary tl-play" onClick={onDaily}>
          {dailyDone ? "Done — see your result" : `Play #${formatNumber(dailyNumber)}`}
        </button>
        : <button type="button" className="tl-primary tl-play" onClick={() => onPractice(level, choice === "daily" ? saved.practice.era : choice)}>
          Start practice
        </button>}
    </div>
    {daily
      ? <p className="tl-best">
        <StreakFlame count={streak} label={plural(streak, "{n} day in a row", "{n} days in a row")} />
        <span>{`Best ${formatNumber(saved.daily.best)}`}</span>
        <span className="tl-best-note">Six events, the same for everyone today. Four tries, with ticks and links to help between them.</span>
      </p>
      : <p className="tl-best">
        <span>Best perfect streak at this level</span> <strong>{formatNumber(saved.practice.bestPerfect[level])}</strong>
        <span className="tl-best-note">One round at a time, scored by how many pairs of cards you put the right way round.</span>
      </p>}
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
