// MOCK-UP (home_mockup, home_mockup2): "How well do you know the Bible?", twelve questions. They open as a board of tiles,
// one per question with its drawing; choosing one opens it as a card on a deck, whose picture turns over to the verse
// once answered, with the twelve steps along its top (gold for right, red for missed). "All twelve" returns to the board.
// Beneath, the way on to the test page and the full list of questions. The owner's choice from /quiz_mockup
// (2026-10-22): version 4's board, then version 2's card. Parts: QuizVersions.tsx, QuizParts.tsx; styles:
// quiz-versions.css, with the drawings' strokes and motion in home-quiz.css.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Tally } from "./QuizParts";
import { CardDeck, Tiles } from "./QuizVersions";
import { useQuiz } from "./quiz-state";
import "./home-quiz.css";
import "./quiz-versions.css";

export function HomeQuiz() {
  const quiz = useQuiz();
  const [board, setBoard] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  // Switching views keeps the top of the quiz in sight when the reader had scrolled past it.
  const show = (onBoard: boolean) => {
    setBoard(onBoard);
    if (box.current && box.current.getBoundingClientRect().top < 0) box.current.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return <section className="qv qv-cardset qv-home hq home-wrap" aria-labelledby="hq-title">
    <header className="qv-cardset-head">
      <div><p className="home-eyebrow">Twelve questions · start anywhere</p><h2 id="hq-title">How well do you know <em>the Bible?</em></h2></div>
      <Tally quiz={quiz} />
    </header>
    <div className="qv-board" ref={box}>
      {board ? <Tiles quiz={quiz} onOpen={(i) => { quiz.open(i); show(false); }} /> : <CardDeck quiz={quiz} onBoard={() => show(true)} />}
    </div>
    <aside className="qv-more" aria-label="More questions">
      <div>
        <p className="home-eyebrow">Ready for more?</p>
        <h3>Take the full test.</h3>
        <p>Thousands more questions from Sunday schools, catechisms and Bible quizzes. Choose the books and topics, then answer them one at a time.</p>
      </div>
      <div className="qv-more-links">
        <Link className="qv-next" to="/study/questions/test">Take the test<ArrowRight size={15} aria-hidden /></Link>
        <Link to="/study/questions">See all the questions<ArrowUpRight size={15} aria-hidden /></Link>
      </div>
    </aside>
  </section>;
}
