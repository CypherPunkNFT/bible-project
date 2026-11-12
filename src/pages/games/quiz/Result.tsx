// /games/quiz: the ending (the audit's item 4). The score counts up from nought to the total, a rank title the score
// earns sits above the homepage quiz's own verdict line and verse, the twelve marks in gold and red sit under them as
// the row that is shared, and Share, Try again and the way back are right there. A full twelve makes the marks hop
// in turn; a new best on this device earns a ribbon and one burst, only when the ending was reached on this page.
import { Verse } from "@/components/Verse";
import { chapterOf } from "@/pages/home/quiz-state";
import { plural } from "@/lib/site-format";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Confetti, HopWave, NewBestRibbon, ProgressTrail, RankLine, ResultPanel, ScoreCountUp, ShareButton, StreakFlame } from "../kit";
import { RANKS, TOTAL, shareTextFor } from "./game";
import type { QuizRound } from "./state";

export interface ResultProps { quiz: QuizRound; onBoard: () => void }

export function Result({ quiz, onBoard }: ResultProps) {
  const { verdict, right, fresh, bestBefore } = quiz;
  const newBest = fresh && right > bestBefore && right > 0;
  const perfect = right === TOTAL;
  return <ResultPanel className="qz-result"
    trail={<HopWave when={fresh && perfect} className="qz-result-trail"><ProgressTrail marks={quiz.marks} label={plural(right, "{n} right of twelve, in question order", "{n} right of twelve, in question order")} size="1.1rem" /></HopWave>}
    actions={<>
      <button type="button" className="qz-play" onClick={quiz.restart}><RotateCcw size={16} aria-hidden="true" />Try again</button>
      <button type="button" className="qz-secondary" onClick={onBoard}>See the board</button>
      <Link className="qz-secondary" to={`/read/bsb/${verdict.read}`}>{`Read ${chapterOf(verdict.ref)}`}<ArrowUpRight size={14} aria-hidden="true" /></Link>
      <Link className="qz-secondary" to="/games">All games</Link>
    </>}
    reading={<ShareButton text={shareTextFor(quiz.picked)} game="quiz" className="qz-share" />}>
    <p className="qz-meta"><span>All twelve answered</span></p>
    <div className="qz-result-score">
      <ScoreCountUp value={right} of={TOTAL} ms={fresh ? 1100 : 0} label={plural(right, "{n} of 12 right", "{n} of 12 right")} />
      <Confetti when={fresh && (perfect || newBest)} count={28} reach={150} />
    </div>
    <RankLine score={right} best={TOTAL} ranks={RANKS} className="qz-rank" />
    <NewBestRibbon when={newBest} />
    {quiz.bestStreak >= 2 && <p className="qz-result-streak"><span>Best run</span><StreakFlame count={quiz.bestStreak} label={plural(quiz.bestStreak, "{n} in a row", "{n} in a row")} /></p>}
    <h2 className="qz-verdict-title">{verdict.title}</h2>
    <blockquote className="qz-verdict-verse">“<Verse id={verdict.verse} unquoted />”<cite>{verdict.ref}</cite></blockquote>
  </ResultPanel>;
}
