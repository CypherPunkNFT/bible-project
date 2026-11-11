// The game home (design §9, screen 1; the audit's item 6): the Daily Five card with the hub's map engraving, the
// puzzle number and the five slots; practice with its level and era as rows of pills; the Disputed sites mode; the
// player's numbers with the streak's flame; and the credits.
import { useState } from "react";
import { formatDate, formatNumber } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { ProgressTrail, ShareButton, StreakFlame, trailMarks } from "../kit";
import { BAND_CSS, BAND_MARK } from "./bands";
import { DAILY } from "./data";
import { Countdown } from "./parts";
import { ERAS, LEVELS, ROUND_LENGTH, type Era, type Level } from "./pools";
import { bandFor } from "./scoring";
import { shareText } from "./share";
import { currentStreak, dailyTotal, isFinished, type Stats, type TodayRecord } from "./storage";
import { ERA_TEXT, LEVEL_TEXT } from "./text";

interface Props {
  stats: Stats;
  now: Date;
  onDaily: () => void;
  onPractice: (level: Level, era: Era) => void;
  onDisputed: () => void;
}

export function Home({ stats, now, onDaily, onPractice, onDisputed }: Props) {
  const [level, setLevel] = useState<Level>("beginner");
  const [era, setEra] = useState<Era>("all");
  const todayN = DAILY.numberOn(now);
  const streak = currentStreak(stats, todayN);
  return <div className="mq-home">
    <p className="mq-how">You are given a Bible place. Drop a pin where you think it stood: the closer the pin, the more points, up to 1,000 a place.</p>
    <div className="mq-cards">
      <section className="mq-card mq-card--daily" aria-labelledby="mq-daily">
        <h2 id="mq-daily">Daily Five</h2>
        <DailyCard stats={stats} now={now} todayN={todayN} onDaily={onDaily} />
      </section>
      <section className="mq-card" aria-labelledby="mq-practice">
        <h2 id="mq-practice">Practice</h2>
        <p>Five places at a time, as often as you like.</p>
        <fieldset className="mq-pills">
          <legend>Level</legend>
          {LEVELS.map((value) => <label key={value} className={`mq-pill${level === value ? " is-on" : ""}`}>
            <input type="radio" name="mq-level" value={value} checked={level === value} onChange={() => setLevel(value)} />
            <span>{LEVEL_TEXT[value].label}</span>
          </label>)}
        </fieldset>
        <p className="mq-pill-note">{LEVEL_TEXT[level].description}</p>
        <fieldset className="mq-pills">
          <legend>Era</legend>
          {ERAS.map((value) => <label key={value} className={`mq-pill${era === value ? " is-on" : ""}`}>
            <input type="radio" name="mq-era" value={value} checked={era === value} onChange={() => setEra(value)} />
            <span>{ERA_TEXT[value].label}</span>
          </label>)}
        </fieldset>
        <button type="button" className="mq-button mq-primary" onClick={() => onPractice(level, era)}>Start practice</button>
      </section>
      <section className="mq-card" aria-labelledby="mq-disputed">
        <h2 id="mq-disputed">Disputed sites</h2>
        <p>Places whose location scholars still debate, such as Mount Sinai and Sodom. Every proposed site counts: you score against the nearest one.</p>
        <button type="button" className="mq-button" onClick={onDisputed}>Play disputed sites</button>
      </section>
    </div>
    <dl className="mq-stats" aria-label="Your Daily Five record">
      <div><dt>Played</dt><dd>{formatNumber(stats.played)}</dd></div>
      <div><dt>Streak</dt><dd><StreakFlame count={streak} litFrom={2} label={formatNumber(streak)} /></dd></div>
      <div><dt>Best streak</dt><dd>{formatNumber(stats.bestStreak)}</dd></div>
      <div><dt>Best score</dt><dd>{formatNumber(stats.best)}</dd></div>
    </dl>
  </div>;
}

/** The five slots on the Daily card: today's picks so far in their colours, the next one ringed. */
function DailySlots({ today, done }: { today: TodayRecord | null; done: boolean }) {
  const picks = today?.picks ?? [];
  const marks = trailMarks(picks.map((pick) => BAND_MARK[bandFor(pick.points)]), ROUND_LENGTH, done);
  const tones = picks.map((pick) => BAND_CSS[bandFor(pick.points)]);
  return <ProgressTrail className="mq-slots mq-slots--home" marks={marks} tones={tones} size="1.1rem" label={`${picks.length} of ${ROUND_LENGTH}`} />;
}

function DailyCard({ stats, now, todayN, onDaily }: { stats: Stats; now: Date; todayN: number; onDaily: () => void }) {
  if (todayN < 1) {
    const starts = formatDate(DAILY.dateOf(1), { day: "numeric", month: "long", year: "numeric" });
    return <p>{`The first Daily Five is on ${starts}.`}</p>;
  }
  const today = stats.today?.n === todayN ? stats.today : null;
  const finished = !!today && isFinished(today);
  const done = today?.picks.length ?? 0;
  return <>
    <div className="mq-daily-art" aria-hidden="true">
      <GameArtImage art={GAME_ART.mapQuest} className="mq-art" />
      <span className="mq-daily-n">{`Puzzle #${todayN}`}</span>
    </div>
    <DailySlots today={today} done={finished} />
    {finished
      ? <>
          <p className="mq-done">{`Puzzle #${todayN} done: ${formatNumber(dailyTotal(today))} of ${formatNumber(ROUND_LENGTH * 1000)} points.`}</p>
          <ShareButton className="mq-share" text={shareText(todayN, today.picks.map((pick) => pick.points))} game="Map quest" preview={false} />
          <Countdown now={now} />
        </>
      : <>
          <p>{`Puzzle #${todayN}: the same five places for everyone today, from famous to hard. One try a day.`}</p>
          <button type="button" className="mq-button mq-primary" onClick={onDaily}>
            {done > 0 ? `Resume (${done} of ${ROUND_LENGTH})` : "Play today's puzzle"}
          </button>
        </>}
  </>;
}
