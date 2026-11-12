// /games/quiz: the round's state on the games page. The rules are the homepage quiz's (game.ts reads its questions and
// verdicts); this hook adds the order the questions were answered in (the streak), the round saved for this tab, the
// best kept on this device, and the two page-only flags the ending uses (reached on this page, so the count-up and the
// burst play once and never again on a reload; the best before this round, for the New best ribbon).
import { useMemo, useState } from "react";
import { QUESTIONS } from "@/pages/quiz-data";
import { TOTAL, VERDICT, answeredCount, bestStreakOf, marksFor, nextAfter, outcomeOf, rightCount, streakOf, verdictFor, type Picked } from "./game";
import { browserStore, freshRound, readBest, readRound, saveRound, writeBest, type SavedRound } from "./storage";

export type OptionState = "idle" | "right" | "wrong" | "faded";

export function useQuizRound() {
  const session = useMemo(() => browserStore("session"), []);
  const local = useMemo(() => browserStore("local"), []);
  const [round, setRoundState] = useState<SavedRound>(() => readRound(session) ?? freshRound());
  const [best, setBest] = useState(() => readBest(local));
  const [fresh, setFresh] = useState(false);
  const [bestBefore, setBestBefore] = useState(best);
  // The newest answer's outcome and a count of answers, for the "+1" that floats to the score.
  const [landed, setLanded] = useState<{ n: number; right: boolean }>({ n: 0, right: false });

  const { picked, order, current, board } = round;
  const answered = answeredCount(picked);
  const right = rightCount(picked);
  const finished = answered === TOTAL;
  const question = current === VERDICT ? null : QUESTIONS[current];
  const choice = current === VERDICT ? null : picked[current];

  const setRound = (value: SavedRound) => { saveRound(session, value); setRoundState(value); };

  const choose = (j: number) => {
    if (!question || choice !== null) return;
    const nextPicked: Picked = picked.map((value, i) => (i === current ? j : value));
    setRound({ ...round, picked: nextPicked, order: [...order, current] });
    setLanded((now) => ({ n: now.n + 1, right: j === question.answer }));
  };

  const reachVerdict = () => {
    setFresh(true);
    setBestBefore(best);
    if (right > best) { writeBest(local, right); setBest(right); }
    setRound({ ...round, current: VERDICT, board: false });
  };

  const next = () => {
    if (finished) reachVerdict();
    else setRound({ ...round, current: nextAfter(picked, current), board: false });
  };

  return {
    picked, order, current, board, answered, right, finished, question, choice, best, bestBefore, fresh, landed,
    verdict: verdictFor(right),
    streak: streakOf(picked, order),
    bestStreak: bestStreakOf(picked, order),
    marks: marksFor(picked, current),
    outcomeOf: (i: number) => outcomeOf(picked, i),
    optionState: (j: number): OptionState => (choice === null || !question ? "idle" : j === question.answer ? "right" : j === choice ? "wrong" : "faded"),
    choose, next,
    open: (i: number) => setRound({ ...round, current: i, board: false }),
    playAll: () => setRound({ ...round, current: finished ? VERDICT : nextAfter(picked, VERDICT), board: false }),
    // Leaving the ending for the board ends its one-time celebration: coming back shows the score plainly.
    toBoard: () => { if (current === VERDICT) setFresh(false); setRound({ ...round, board: true, current: current === VERDICT ? 0 : current }); },
    restart: () => { setFresh(false); setLanded({ n: 0, right: false }); saveRound(session, null); setRoundState(freshRound()); },
  };
}

export type QuizRound = ReturnType<typeof useQuizRound>;
