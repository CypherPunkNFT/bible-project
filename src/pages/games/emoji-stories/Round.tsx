// A Practice round (design §8.2): ten puzzles, one answer each, 3 points with no hint, 2 with one, 1 with two or three.
import { useEffect } from "react";
import { points, roundScore, ROUND_LENGTH } from "./deal";
import type { GameData } from "./data";
import { Choices, EmojiRow, Hints, TypeAnswer } from "./Puzzle";
import { Reveal } from "./Reveal";
import { verdictOf } from "./share";
import type { AnswerMode, Round } from "./storage";

/** The hint button's label by hints already opened: the first two cost a point, the third is free. */
const HINT_LABELS = ["Hint (−1 point)", "Hint (−1 point)", "Hint (free)"];

export function RoundPlay({ data, round, answer, onChange }: {
  data: GameData;
  round: Round;
  answer: AnswerMode;
  onChange: (round: Round) => void;
}) {
  const puzzle = round.puzzles[round.at];
  const story = data.byId.get(puzzle.id)!;
  const update = (changes: Partial<typeof puzzle>) =>
    onChange({ ...round, puzzles: round.puzzles.map((item, index) => (index === round.at ? { ...item, ...changes } : item)) });
  const next = () => onChange(round.at + 1 < round.puzzles.length ? { ...round, at: round.at + 1 } : { ...round, over: true });
  useEffect(() => {
    if (!puzzle.revealed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || !(event.target instanceof HTMLElement) || event.target.closest("a, button, input")) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const picked = puzzle.pick ? data.byId.get(puzzle.pick) ?? null : null;
  return (
    <section className="es-round" aria-labelledby="es-round-title">
      <h2 id="es-round-title" className="es-progress">{`${round.at + 1} of ${ROUND_LENGTH} · Score ${roundScore(round)}`}</h2>
      <EmojiRow story={story} emoji={data.emoji} large />
      <Hints story={story} opened={puzzle.hints} />
      {puzzle.revealed ? (
        <Reveal story={story} verdict={picked ? verdictOf(story, picked) : "wrong"} picked={picked}>
          <p className="es-points">{`${points(puzzle.pick === puzzle.id, puzzle.hints)} points`}</p>
          <button type="button" className="es-primary" onClick={next}>{round.at + 1 < round.puzzles.length ? "Next puzzle" : "See your score"}</button>
        </Reveal>
      ) : (
        <>
          {answer === "choices" ? (
            <Choices ids={puzzle.choices} byId={data.byId} onPick={(pick) => update({ pick, revealed: true })} />
          ) : (
            <TypeAnswer index={data.index} onGuess={(pick) => update({ pick, revealed: true })} />
          )}
          {puzzle.hints < 3 && (
            <button type="button" className="es-secondary" onClick={() => update({ hints: puzzle.hints + 1 })}>
              {HINT_LABELS[puzzle.hints]}
            </button>
          )}
        </>
      )}
    </section>
  );
}
