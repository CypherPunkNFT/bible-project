// Homepage (live; first tried on home_mockup, home_mockup2): "How well do you know the Bible?", twelve questions. They open as a board of tiles,
// one per question with its drawing; choosing one opens it as a card on a deck, whose picture turns over to the verse
// once answered, with the twelve steps along its top (gold for right, red for missed). "All twelve" returns to the board.
// Beneath, two doors: a full test (the questions page, where the test now lives) and the learning materials (owner, 2026-10-23). The owner's choice from /quiz_mockup
// (2026-10-22): version 4's board, then version 2's card. Parts: QuizVersions.tsx, QuizParts.tsx; styles:
// quiz-versions.css, with the drawings' strokes and motion in home-quiz.css.
import { ArrowRight, ArrowUpRight, GraduationCap, PenLine } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Tally } from "./QuizParts";
import { CardDeck, Tiles } from "./QuizVersions";
import { useQuiz } from "./quiz-state";
import "../home-quiz.css";
import "./quiz-versions.css";

export function HomeQuiz({ number }: { number?: string }) {
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
      <div><p className="home-eyebrow">{number && <span className="home-number">{number}</span>}Twelve questions · start anywhere</p><h2 id="hq-title">How well do you know <em>the Bible?</em></h2></div>
      <Tally quiz={quiz} />
    </header>
    <div className="qv-board" ref={box}>
      {board ? <Tiles quiz={quiz} onOpen={(i) => { quiz.open(i); show(false); }} /> : <CardDeck quiz={quiz} onBoard={() => show(true)} />}
    </div>
    <QuizDoors />
  </section>;
}

/** The way on beneath the board: two rounded boxes the shape of the tiles, the test in solid gold and the learning
 *  materials in gold outline. The owner's choice from /quiz_more_mockup (2026-10-22), which shows it beside the other three versions. */
export function QuizDoors() {
  return <aside className="qv-doors" aria-label="More questions">
    <Link className="qv-door qv-door-solid" to="/study/questions"><PenLine size={26} strokeWidth={1.4} aria-hidden /><span><span className="qv-door-eyebrow">Ready for more?</span><strong>Take a full test</strong><span>Thousands more questions from Sunday schools, catechisms and Bible quizzes. Choose the books and topics, then answer one at a time.</span></span><ArrowRight className="qv-door-arrow" size={20} aria-hidden /></Link>
    <Link className="qv-door" to="/resources/learning"><GraduationCap size={26} strokeWidth={1.4} aria-hidden /><span><span className="qv-door-eyebrow">Keep learning</span><strong>More learning resources</strong><span>Workbooks, lessons and activity pages for every reader, from little ones to leaders.</span></span><ArrowUpRight className="qv-door-arrow" size={20} aria-hidden /></Link>
  </aside>;
}
