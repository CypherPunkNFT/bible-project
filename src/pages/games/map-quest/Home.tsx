// The game home (design §9, screen 1): the Daily Five card (play, resume or done), practice with a level and an era,
// the Disputed sites mode, the player's numbers, and the credits.
import { useState } from "react";
import { formatDate, formatNumber } from "@/lib/site-format";
import { DAILY } from "./data";
import { Countdown, ShareButton, Squares } from "./parts";
import { ERAS, LEVELS, ROUND_LENGTH, type Era, type Level } from "./pools";
import { currentStreak, dailyTotal, isFinished, type Stats } from "./storage";
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
  return <div className="mq-home">
    <p className="mq-how">You are given a Bible place. Drop a pin where you think it stood: the closer the pin, the more points, up to 1,000 a place.</p>
    <div className="mq-cards">
      <section className="mq-card" aria-labelledby="mq-daily">
        <h2 id="mq-daily">Daily Five</h2>
        <DailyCard stats={stats} now={now} todayN={todayN} onDaily={onDaily} />
      </section>
      <section className="mq-card" aria-labelledby="mq-practice">
        <h2 id="mq-practice">Practice</h2>
        <p>Five places at a time, as often as you like.</p>
        <fieldset className="mq-levels">
          <legend>Level</legend>
          {LEVELS.map((value) => <label key={value} className="mq-choice">
            <input type="radio" name="mq-level" value={value} checked={level === value} onChange={() => setLevel(value)} />
            <span><strong>{LEVEL_TEXT[value].label}</strong><small>{LEVEL_TEXT[value].description}</small></span>
          </label>)}
        </fieldset>
        <label className="mq-era">
          <span>Era</span>
          <select value={era} onChange={(event) => setEra(event.target.value as Era)}>
            {ERAS.map((value) => <option key={value} value={value}>{ERA_TEXT[value].label}</option>)}
          </select>
        </label>
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
      <div><dt>Streak</dt><dd>{formatNumber(currentStreak(stats, todayN))}</dd></div>
      <div><dt>Best streak</dt><dd>{formatNumber(stats.bestStreak)}</dd></div>
      <div><dt>Best score</dt><dd>{formatNumber(stats.best)}</dd></div>
    </dl>
  </div>;
}

function DailyCard({ stats, now, todayN, onDaily }: { stats: Stats; now: Date; todayN: number; onDaily: () => void }) {
  if (todayN < 1) {
    const starts = formatDate(DAILY.dateOf(1), { day: "numeric", month: "long", year: "numeric" });
    return <p>{`The first Daily Five is on ${starts}.`}</p>;
  }
  const today = stats.today?.n === todayN ? stats.today : null;
  if (today && isFinished(today)) {
    const points = today.picks.map((pick) => pick.points);
    return <>
      <p className="mq-done">{`Puzzle #${todayN} done: ${formatNumber(dailyTotal(today))} of ${formatNumber(ROUND_LENGTH * 1000)} points.`}</p>
      <Squares points={points} />
      <ShareButton n={todayN} points={points} />
      <Countdown now={now} />
    </>;
  }
  const done = today?.picks.length ?? 0;
  return <>
    <p>{`Puzzle #${todayN}: the same five places for everyone today, from famous to hard. One try a day.`}</p>
    <button type="button" className="mq-button mq-primary" onClick={onDaily}>
      {done > 0 ? `Resume (${done} of ${ROUND_LENGTH})` : "Play today's puzzle"}
    </button>
  </>;
}
