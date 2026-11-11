// The end of a game (design §9, screen 4; the audit's item 5): the total counting up with a rank, a still map with
// every pin, true site and line, the five slots hopping when the round was clean, the best round and the best ever,
// then the list of places. The Daily Five adds Share, the streak and the countdown; practice offers another round.
import { useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { Confetti, NewBestRibbon, ProgressTrail, RankLine, ResultPanel, ScoreCountUp, ShareButton, StreakFlame, trailMarks } from "../kit";
import { BAND_CSS, BAND_MARK } from "./bands";
import type { Game, Question, Result } from "./game";
import { Countdown } from "./parts";
import { distanceText, pointsText, shapeOf } from "./words";
import { ERA_VIEWS } from "./pools";
import { QuestMap } from "./QuestMap";
import { BAND_EMOJI, MAX_POINTS, bandFor } from "./scoring";
import { shareText } from "./share";
import { currentStreak, type Stats } from "./storage";
import { RANKS } from "./text";

interface Props { game: Game; results: Result[]; stats: Stats; now: Date; onAgain: () => void; onHome: () => void }

export function Summary({ game, results, stats, now, onAgain, onHome }: Props) {
  const [mapFailed, setMapFailed] = useState(false);
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const most = game.questions.length * MAX_POINTS;
  const points = results.map((result) => result.points);
  const n = game.n ?? 0;
  const clean = results.length > 0 && results.every((result) => bandFor(result.points) === "bullseye");
  const best = results.reduce<Result | null>((top, result) => (!top || result.points > top.points ? result : top), null);
  const newBest = game.mode === "daily" && stats.played > 1 && total >= stats.best && total > 0;
  const marks = trailMarks(results.map((result) => BAND_MARK[bandFor(result.points)]), game.questions.length, true);
  const tones = results.map((result) => BAND_CSS[bandFor(result.points)]);
  return <section className="mq-summary" aria-labelledby="mq-summary-title">
    <ResultPanel className="mq-result"
      trail={<>
        <ProgressTrail className={`mq-slots mq-slots--end${clean ? " is-clean" : ""}`} marks={marks} tones={tones} size="1.4rem" label={plural(results.length, "{n} place played", "{n} places played")} />
        {!mapFailed && <div className="mq-summary-map">
          <QuestMap view={ERA_VIEWS[game.era]} viewKey="summary" beginner={false} pin={null} onPin={() => undefined} reveal={null}
            summary={results.map(shapeOf)} onFail={() => setMapFailed(true)} label="Map of your five pins and the true places" />
        </div>}
      </>}
      actions={game.mode === "daily"
        ? <>
            <ShareButton className="mq-share" text={shareText(n, points)} game="Map quest" />
            <button type="button" className="mq-button" onClick={onHome}>Back to the game home</button>
          </>
        : <>
            <button type="button" className="mq-button mq-primary" onClick={onAgain}>Play again</button>
            <button type="button" className="mq-button" onClick={onHome}>Change settings</button>
          </>}
      reading={<ol className="mq-rows">
        {results.map((result) => <SummaryRow key={result.question.id} question={result.question} result={result} />)}
      </ol>}>
      <h2 id="mq-summary-title" className="mq-summary-title">
        <ScoreCountUp value={total} of={most} label={`${formatNumber(total)} of ${formatNumber(most)} points`} />
        <Confetti when={clean} count={30} reach={160} />
      </h2>
      <RankLine score={total} best={most} ranks={RANKS} />
      <NewBestRibbon when={newBest} />
      <dl className="mq-bests">
        {best && <div><dt>Best round</dt><dd><span className="mq-best-name">{best.question.name}</span><span>{pointsText(best.points)}</span></dd></div>}
        {game.mode === "daily" && <div><dt>Best ever</dt><dd>{pointsText(Math.max(stats.best, total))}</dd></div>}
        {game.mode === "daily" && <div><dt>Streak</dt><dd><StreakFlame count={currentStreak(stats, n)} litFrom={2} label={plural(currentStreak(stats, n), "Streak: {n} day", "Streak: {n} days")} /></dd></div>}
      </dl>
      {game.mode === "daily" && <Countdown now={now} />}
    </ResultPanel>
  </section>;
}

function SummaryRow({ question, result }: { question: Question; result: Result }) {
  const band = bandFor(result.points);
  return <li>
    <span aria-hidden="true">{BAND_EMOJI[band]}</span>
    <strong>{question.name}</strong>
    <span>{distanceText(result.km)}</span>
    <span>{pointsText(result.points)}</span>
  </li>;
}
