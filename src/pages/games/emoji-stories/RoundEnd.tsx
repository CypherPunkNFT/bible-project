// Round end (design §11.4, redesigned from the visual audit): a result card with the score counting up out of 30, a
// rank line in the game's voice, the ten squares, "New best" when it is one, a Share line of the squares, Play again
// on the first screen, and a fold-out per puzzle below that opens its reveal. The count, the hop and the burst play
// once, when the round ends on this page, and not again after a reload (a finished round is kept in session storage).
import { useState } from "react";
import { plural } from "@/lib/site-format";
import { Confetti, NewBestRibbon, ProgressTrail, RankLine, ResultPanel, ScoreCountUp, ShareButton } from "../kit";
import { ROUND_LENGTH, roundScore } from "./deal";
import { Reveal } from "./Reveal";
import { RANKS } from "./rules";
import { practiceMarks, practiceShareText } from "./share";
import type { Round } from "./storage";
import type { Story } from "./types";

const BEST = ROUND_LENGTH * 3;

export function RoundEnd({ round, byId, best, fresh, onAgain, onHome }: {
  round: Round;
  byId: ReadonlyMap<string, Story>;
  /** The best for these settings before this round was recorded. */
  best: number;
  /** False when the finished round was restored from a reload: the score is known, so nothing counts, hops or bursts again. */
  fresh: boolean;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const score = roundScore(round);
  const marks = practiceMarks(round.puzzles, round.puzzles.length, true);
  const newBest = score > best;
  return (
    <ResultPanel className={`es-end${fresh ? " is-fresh" : ""}`}
      trail={<ProgressTrail marks={marks} label={plural(marks.filter((mark) => mark !== "wrong").length, "{n} of 10 right", "{n} of 10 right")} size="1.15rem"
        className={fresh && score >= 27 ? "kit-hop" : ""} />}
      actions={<>
        <button type="button" className="es-primary" onClick={onAgain}>Play again</button>
        <button type="button" className="es-secondary" onClick={onHome}>Back to the start</button>
      </>}
      reading={<>
        <ShareButton text={practiceShareText(round.puzzles, score)} game="Emoji stories" preview={false} className="es-share" />
        <ul className="es-end-list">
          {round.puzzles.map((puzzle) => {
            const story = byId.get(puzzle.id)!;
            const right = puzzle.pick === puzzle.id;
            return (
              <li key={puzzle.id}>
                <button type="button" aria-expanded={open === puzzle.id} onClick={() => setOpen(open === puzzle.id ? null : puzzle.id)}>
                  <span className="es-end-emoji" aria-hidden="true" translate="no">{story.emoji.map(([char]) => char).join("")}</span>
                  <span>{story.title}</span>
                  <span className={right ? "es-mark-right" : "es-mark-wrong"}>{right ? "✓ Right" : "✗ Missed"}</span>
                </button>
                {open === puzzle.id && <Reveal story={story} verdict="shown" showVerdict={false} focus={false} />}
              </li>
            );
          })}
        </ul>
      </>}>
      <h2 id="es-end-title" className="es-sr">{`You scored ${score} out of ${BEST}`}</h2>
      <div className="es-end-score">
        <ScoreCountUp value={score} of={BEST} ms={fresh ? 900 : 0} label={plural(score, "{n} point", "{n} points")} />
        <Confetti when={fresh && score === BEST} />
      </div>
      <RankLine score={score} best={BEST} ranks={RANKS} />
      <NewBestRibbon when={fresh && newBest && score > 0} />
      <p className="es-muted es-end-best">{`Your best with these settings: ${Math.max(best, score)}`}</p>
    </ResultPanel>
  );
}
