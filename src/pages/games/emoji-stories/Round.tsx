// A Practice round (design §8.2): ten puzzles, one answer each, 3 points with no hint, 2 with one, 1 with two or three.
// Redesigned from the visual audit: ten squares and a running score instead of a caption, the four answer cards stay
// on screen and settle in place, a band rises with the verdict, the points and Next, and the reading follows below.
import { useEffect, useRef } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { FeedbackBand, ProgressTrail, useGrew } from "../kit";
import { points, roundScore, ROUND_LENGTH } from "./deal";
import type { GameData } from "./data";
import { Choices, EmojiRow, Hints, TypeAnswer } from "./Puzzle";
import { Reveal } from "./Reveal";
import { VERDICT_TEXT } from "./rules";
import { practiceMarks, verdictOf, type Verdict } from "./share";
import type { AnswerMode, Round } from "./storage";

/** The hint button's label by hints already opened: the first two cost a point, the third is free. */
const HINT_LABELS = ["Hint (−1 point)", "Hint (−1 point)", "Hint (free)"];
const BAND_TONE: Record<Verdict, "right" | "wrong" | "part"> = { right: "right", close: "part", wrong: "wrong" };

/** The points still at stake, drawn as three coins that dim as hints are opened (decoration; the words are in the label). */
export function Coins({ worth }: { worth: number }) {
  return (
    <span className="es-coins" aria-hidden="true">
      {[1, 2, 3].map((coin) => <span key={coin} className={`es-coin${coin <= worth ? "" : " is-spent"}`} />)}
    </span>
  );
}

export function RoundPlay({ data, round, answer, onChange }: {
  data: GameData;
  round: Round;
  answer: AnswerMode;
  onChange: (round: Round) => void;
}) {
  const puzzle = round.puzzles[round.at];
  const story = data.byId.get(puzzle.id)!;
  // A puzzle already revealed when the page opened was restored from a reload: its reveal must not take focus.
  const restored = useRef(puzzle.revealed ? puzzle.id : null);
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
  const verdict: Verdict = puzzle.revealed ? (picked ? verdictOf(story, picked) : "wrong") : "wrong";
  const score = roundScore(round);
  const grew = useGrew(score);
  const earned = points(puzzle.pick === puzzle.id, puzzle.hints);
  const last = round.at + 1 >= round.puzzles.length;
  return (
    <section className="es-round" aria-labelledby="es-round-title">
      <h2 id="es-round-title" className="es-sr">{`${round.at + 1} of ${ROUND_LENGTH} · Score ${score}`}</h2>
      <div className="es-topline">
        <ProgressTrail marks={practiceMarks(round.puzzles, round.at, round.over)} label={`${round.at + 1} of ${ROUND_LENGTH}`} size=".85rem" className="es-trail" />
        <p className="es-score" aria-hidden="true"><span className="es-score-label">Score</span> <span key={grew} className="es-score-number">{formatNumber(score)}</span></p>
      </div>
      <EmojiRow key={puzzle.id} story={story} emoji={data.emoji} large words={puzzle.hints >= 2 || puzzle.revealed} />
      <Hints story={story} opened={puzzle.hints} />
      {answer === "choices" ? (
        <Choices ids={puzzle.choices} byId={data.byId} answer={story.id} pick={puzzle.pick} revealed={puzzle.revealed}
          onPick={(pick) => update({ pick, revealed: true })} />
      ) : !puzzle.revealed && (
        <TypeAnswer index={data.index} onGuess={(pick) => update({ pick, revealed: true })} />
      )}
      {!puzzle.revealed && puzzle.hints < 3 && (
        <p className="es-hint-row">
          <button type="button" className="es-secondary" onClick={() => update({ hints: puzzle.hints + 1 })}>{HINT_LABELS[puzzle.hints]}</button>
          <Coins worth={points(true, puzzle.hints)} />
        </p>
      )}
      <FeedbackBand open={puzzle.revealed} tone={BAND_TONE[verdict]} focusAction={false} className="es-band"
        verdict={<><span className="es-band-word">{VERDICT_TEXT[verdict]}</span> <span className="es-band-points">{plural(earned, "{n} point", "{n} points")}</span></>}
        action={<button type="button" className="es-primary" onClick={next}>{last ? "See your score" : "Next puzzle"}</button>} />
      {puzzle.revealed && (
        <Reveal story={story} verdict={verdict} picked={picked} words={false} showVerdict={false} focus={restored.current !== puzzle.id} />
      )}
    </section>
  );
}
