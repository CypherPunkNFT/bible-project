// Round end (design §11.4): the score out of 30, a line per puzzle that opens its reveal, Play again, and the best
// score for this filter.
import { useState } from "react";
import { ROUND_LENGTH, roundScore } from "./deal";
import { Reveal } from "./Reveal";
import type { Round } from "./storage";
import type { Story } from "./types";

export function RoundEnd({ round, byId, best, onAgain, onHome }: {
  round: Round;
  byId: ReadonlyMap<string, Story>;
  best: number;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const score = roundScore(round);
  return (
    <section className="es-end" aria-labelledby="es-end-title">
      <h2 id="es-end-title" className="es-heading">{`You scored ${score} out of ${ROUND_LENGTH * 3}`}</h2>
      <p className="es-muted">{`Your best with these settings: ${Math.max(best, score)}`}</p>
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
              {open === puzzle.id && <Reveal story={story} verdict="shown" />}
            </li>
          );
        })}
      </ul>
      <p className="es-actions">
        <button type="button" className="es-primary" onClick={onAgain}>Play again</button>
        <button type="button" className="es-secondary" onClick={onHome}>Back to the start</button>
      </p>
    </section>
  );
}
