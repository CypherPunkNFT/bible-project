// MOCK-UP (quiz_mockup): four versions of the homepage's question section, each a working quiz over the same twelve
// questions and drawings (quiz-data.ts, QuizScenes.tsx). 1 Spotlight: one question centred, drawing above. 2 The card:
// a card on a deck; answering turns its picture over to the verse. 3 The dark stage: a dark band, story-style steps.
// 4 The twelve: every question on a board, open any. Shared parts: QuizParts.tsx; styles: quiz-versions.css.
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { QUESTIONS } from "./quiz-data";
import { Options, Reveal, Steps, Tally, Verdict } from "./QuizParts";
import { QuizScene } from "./QuizScenes";
import { VERDICT, pad, useQuiz, type Quiz } from "./quiz-state";

const TOTAL = QUESTIONS.length;

function Meta({ quiz }: { quiz: Quiz }) {
  return <p className="qv-meta"><span>Question {pad(quiz.current + 1)} of {TOTAL}</span><span>{quiz.question?.part}</span></p>;
}

function Title() {
  return <h2>How well do you know <em>the Bible?</em></h2>;
}

export function QuizSpotlight() {
  const quiz = useQuiz();
  const { question } = quiz;
  return <section className="qv qv-spot home-wrap" aria-label="Version 1, Spotlight">
    <header className="qv-spot-head"><p className="home-eyebrow">A little test</p><Title /></header>
    <div className="qv-spot-stage" key={quiz.current}>
      <div className="qv-spot-art"><QuizScene scene={question?.scene ?? "verdict"} /></div>
      {question ? <><Meta quiz={quiz} /><h3>{question.ask}</h3><Options quiz={quiz} /><Reveal quiz={quiz} /></> : <Verdict quiz={quiz} />}
    </div>
    <div className="qv-spot-foot"><Steps quiz={quiz} /><Tally quiz={quiz} /></div>
  </section>;
}

export function QuizCard() {
  const quiz = useQuiz();
  const { question } = quiz;
  const turned = Boolean(question && quiz.choice !== null);
  const under = Math.min(2, TOTAL - quiz.answered - (turned ? 0 : 1));
  return <section className="qv qv-cardset home-wrap" aria-label="Version 2, The card">
    <header className="qv-cardset-head"><div><p className="home-eyebrow">A little test</p><Title /></div><Tally quiz={quiz} /></header>
    <div className="qv-deck" style={{ "--under": Math.max(0, under) } as CSSProperties}>
      <span className="qv-deck-sheet" aria-hidden="true" /><span className="qv-deck-sheet" aria-hidden="true" />
      <article className="qv-card">
        <div className="qv-card-top"><Steps quiz={quiz} /><span>{question ? `${pad(quiz.current + 1)} / ${TOTAL}` : "All done"}</span></div>
        <div className="qv-card-body" key={quiz.current}>
          <div className="qv-flip" data-turned={turned || undefined}>
            <div className="qv-flip-face qv-flip-front"><span className="qv-card-num" aria-hidden="true">{question ? pad(quiz.current + 1) : quiz.right}</span><QuizScene scene={question?.scene ?? "verdict"} /></div>
            <div className="qv-flip-face qv-flip-back">{question && <blockquote>“{question.verse}”<cite>{question.ref}</cite></blockquote>}</div>
          </div>
          <div className="qv-card-main">{question ? <><Meta quiz={quiz} /><h3>{question.ask}</h3><Options quiz={quiz} /><Reveal quiz={quiz} verse={false} /></> : <Verdict quiz={quiz} />}</div>
        </div>
      </article>
    </div>
  </section>;
}

export function QuizStage() {
  const quiz = useQuiz();
  const { question } = quiz;
  return <section className="qv qv-darkset home-wrap" aria-label="Version 3, The dark stage">
    <div className="qv-dark">
      <div className="qv-dark-top"><Steps quiz={quiz} /><Tally quiz={quiz} /></div>
      <div className="qv-dark-grid" key={quiz.current}>
        <div className="qv-dark-text">
          <p className="qv-dark-title">How well do you know <em>the Bible?</em></p>
          {question ? <><Meta quiz={quiz} /><h3>{question.ask}</h3><Options quiz={quiz} /><Reveal quiz={quiz} /></> : <Verdict quiz={quiz} />}
        </div>
        <div className="qv-dark-art"><span className="qv-dark-num" aria-hidden="true">{question ? pad(quiz.current + 1) : quiz.right}</span><QuizScene scene={question?.scene ?? "verdict"} /></div>
      </div>
    </div>
  </section>;
}

export function QuizBoard() {
  const quiz = useQuiz();
  const [board, setBoard] = useState(true);
  const { question, current } = quiz;
  const openQuestion = (i: number) => { quiz.open(i); setBoard(false); };
  const step = (by: number) => quiz.open((current + by + TOTAL) % TOTAL);
  return <section className="qv qv-boardset home-wrap" aria-label="Version 4, The twelve">
    <header className="qv-boardset-head">
      <div><p className="home-eyebrow">A little test</p><h2>Twelve questions. <em>Start anywhere.</em></h2></div>
      <Tally quiz={quiz} />
    </header>
    <div className="qv-board">
      {board ? <ol className="qv-tiles">{QUESTIONS.map((item, i) => <li key={item.ask}>
        <button type="button" className="qv-tile" data-state={quiz.stateOf(i)} onClick={() => openQuestion(i)}>
          <span className="qv-tile-top"><span>{pad(i + 1)}</span><span>{quiz.stateOf(i) ? (quiz.stateOf(i) === "right" ? "Right" : "Missed") : item.part}</span></span>
          <span className="qv-tile-art"><QuizScene scene={item.scene} /></span>
          <span className="qv-tile-ask">{item.ask}</span>
        </button>
      </li>)}</ol> : <div className="qv-board-open" key={current}>
        <div className="qv-board-bar">
          <button type="button" onClick={() => setBoard(true)}><LayoutGrid size={14} aria-hidden />All twelve</button>
          {current !== VERDICT && <span className="qv-board-nav">
            <button type="button" aria-label="Previous question" onClick={() => step(-1)}><ArrowLeft size={15} /></button>
            <span>{pad(current + 1)} / {TOTAL}</span>
            <button type="button" aria-label="Following question" onClick={() => step(1)}><ArrowRight size={15} /></button>
          </span>}
        </div>
        <div className="qv-board-grid">
          <div className="qv-board-art"><QuizScene scene={question?.scene ?? "verdict"} /></div>
          <div>{question ? <><Meta quiz={quiz} /><h3>{question.ask}</h3><Options quiz={quiz} /><Reveal quiz={quiz} /></> : <Verdict quiz={quiz} />}</div>
        </div>
      </div>}
    </div>
  </section>;
}
