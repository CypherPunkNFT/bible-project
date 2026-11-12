// /games/quiz: the homepage's twelve-question quiz rebuilt as a game for the games page (the visual audit,
// docs/visual-audits/quiz.md, and REDESIGN-BRIEF section 4 item 6). The questions, verdicts, scoring and drawings are
// the homepage's, read from src/pages/quiz-data.ts and src/pages/QuizScenes.tsx; nothing in src/pages/home/ is touched,
// so the homepage looks exactly as it did. Three screens: the board of twelve tiles with Play all twelve (Board.tsx),
// one question as a card that grows from its tile (Card.tsx), and the ending (Result.tsx). Keys A to D or 1 to 4
// answer an open question. The round is kept for this tab and the best score on this device (storage.ts).
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../kit";
import { Board, type Origin } from "./Board";
import { Card } from "./Card";
import { Result } from "./Result";
import { VERDICT } from "./game";
import { useQuizRound } from "./state";
import "@/components/home/home-hub.css";
import "@/pages/home-quiz.css";
import "../games.css";
import "./quiz.css";

const KEYS: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };

/** Keys A to D or 1 to 4 pick an answer while a question is open and unanswered, never from a field or the dialog. */
function useAnswerKeys(enabled: boolean, choose: (j: number) => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      const j = KEYS[event.key.toLowerCase()];
      if (j === undefined) return;
      event.preventDefault();
      choose(j);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, choose]);
}

export default function QuizGame() {
  const quiz = useQuizRound();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [asking, setAsking] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => { document.title = "Bible Quiz · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const screen = quiz.board ? "board" : quiz.current === VERDICT ? "result" : "card";
  // The ending and the board open at the top (never on first mount, so a saved game's return is left alone); a
  // question card places itself (Card.tsx): at the top of a phone screen, or where the board was on a desktop.
  const previous = useRef(screen);
  useEffect(() => {
    if (previous.current === screen) return;
    previous.current = screen;
    if (screen !== "card") window.scrollTo?.({ top: 0, behavior: "auto" });
  }, [screen]);
  useAnswerKeys(!quiz.board && quiz.question !== null && quiz.choice === null, quiz.choose);
  const open = (i: number, from: Origin | null) => { setOrigin(from); quiz.open(i); };
  const restart = () => { setAsking(false); quiz.restart(); top.current?.focus({ preventScroll: true }); };

  return <div className="qz-page gm-quiz">
    <div className="home-wrap">
      <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
      <header className="qz-head" ref={top} tabIndex={-1}>
        <div><p className="home-eyebrow">Twelve questions</p><h1>How well do you know <em>the Bible?</em></h1></div>
        {/* Its place is held while hidden, so a phone's card does not move down when the first answer lands. */}
        {quiz.current !== VERDICT && <button type="button" className="qz-restart" data-hidden={quiz.answered === 0 || undefined} tabIndex={quiz.answered === 0 ? -1 : undefined}
          aria-hidden={quiz.answered === 0 || undefined} onClick={() => setAsking(true)}><RotateCcw size={14} aria-hidden="true" />Start again</button>}
      </header>
      <div className="qz-stage" data-screen={screen}>
        {quiz.board && <Board quiz={quiz} onOpen={open} onPlayAll={() => { setOrigin(null); quiz.playAll(); }} />}
        {!quiz.board && quiz.question && <Card quiz={quiz} origin={origin} onClose={quiz.toBoard} />}
        {!quiz.board && quiz.current === VERDICT && <Result quiz={quiz} onBoard={quiz.toBoard} />}
      </div>
      <p className="qz-more"><Link to="/study/questions">Ready for more? Take a full test</Link></p>
    </div>
    <ConfirmDialog open={asking} title="Start again?" confirmLabel="Start again" danger onConfirm={restart} onCancel={() => setAsking(false)}>
      <p className="qz-dialog-note">Your answers so far will not be kept.</p>
    </ConfirmDialog>
  </div>;
}
