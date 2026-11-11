// /games/wordle: Bible Wordle (BibleProject/APPROVED-IDEAS.md entry 12; design: docs/features/bible-wordle/design.md).
// One five-letter Bible word a day for everyone, six tries, a verse with the answer and a score to share. Every screen
// is state inside this one page (the hub gives a game one address). The answers, the schedule and the allowed guesses
// are built ahead of time (scripts/build-wordle.ts) and loaded only here; the hand-kept curation file never is.
import { useEffect, useState } from "react";
import type { Answers } from "./daily";
import type { WordleSchedule } from "./daily-rules";
import { Play, type WordleData } from "./Play";
import "../games.css";
import "./wordle.css";

const loadData = (): Promise<WordleData> => Promise.all([
  import("@/data/wordle/answers.json"),
  import("@/data/wordle/daily.json"),
  import("@/data/wordle/guesses.json"),
]).then(([answers, schedule, guesses]) => ({
  answers: answers.default as unknown as Answers,
  schedule: schedule.default as unknown as WordleSchedule,
  guesses: guesses.default as { words: string },
}));

export default function WordleGame() {
  useEffect(() => { document.title = "Bible Wordle · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<WordleData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadData().then((loaded) => { if (live) setData(loaded); }).catch((error: unknown) => {
      console.warn("Bible Wordle: the puzzle data could not be loaded:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="bw-page mx-auto max-w-xl px-4 sm:px-6">
    {failed
      ? <div className="bw-failed" role="alert">
          <h1>Bible Wordle</h1>
          <p>The puzzle could not be loaded.</p>
          <button type="button" className="bw-button bw-primary" onClick={() => setAttempt((count) => count + 1)}>Try again</button>
        </div>
      : data ? <Play data={data} /> : <p className="bw-loading">Loading today's puzzle…</p>}
  </div>;
}
