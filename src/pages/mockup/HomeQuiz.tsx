// MOCK-UP (home_mockup2): "How well do you know the Bible?", twelve questions asked one at a time. Each has its own line
// drawing under a giant faded number; the answers float on lines; every answer opens its passage (KJV) with a link into
// the reader. Data: quiz-data.ts; drawings: QuizScenes.tsx; styles: home-quiz.css.
import { ArrowRight, ArrowUpRight, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { QUESTIONS, VERDICTS } from "./quiz-data";
import { QuizScene } from "./QuizScenes";
import "./home-quiz.css";

const LETTERS = ["A", "B", "C", "D"];
const chapterOf = (ref: string) => ref.replace(/:\d+$/, "");
const pad = (n: number) => String(n).padStart(2, "0");

type Picked = (number | null)[];

function Verdict({ right, restart }: { right: number; restart: () => void }) {
  const verdict = VERDICTS.find((item) => right >= item.least)!;
  return <div className="hq-stage" key="verdict">
    <div className="hq-scene"><span className="hq-numeral" aria-hidden="true">{right}</span><QuizScene scene="verdict" /></div>
    <div className="hq-body">
      <p className="hq-meta"><span>All twelve answered</span><span>{right} of {QUESTIONS.length} right</span></p>
      <h3 className="hq-verdict-title">{verdict.title}</h3>
      <blockquote>“{verdict.verse}”<cite>{verdict.ref}</cite></blockquote>
      <div className="hq-actions">
        <button type="button" className="hq-next" onClick={restart}><RotateCcw size={15} aria-hidden />Try again</button>
        <Link to={`/read/kjv/${verdict.read}`}>Read {chapterOf(verdict.ref)} <ArrowUpRight size={15} aria-hidden /></Link>
      </div>
    </div>
  </div>;
}

export function HomeQuiz() {
  const [picked, setPicked] = useState<Picked>(QUESTIONS.map(() => null));
  const [current, setCurrent] = useState(0);
  const answered = picked.filter((choice) => choice !== null).length;
  const right = picked.filter((choice, i) => choice === QUESTIONS[i].answer).length;
  const finished = answered === QUESTIONS.length;
  const restart = () => { setPicked(QUESTIONS.map(() => null)); setCurrent(0); };
  const later = picked.findIndex((value, i) => value === null && i > current);
  const next = later >= 0 ? later : picked.findIndex((value) => value === null);
  const question = QUESTIONS[current], choice = current >= 0 ? picked[current] : null;

  return <section className="hq home-wrap" aria-labelledby="hq-title">
    <header className="hq-head">
      <div><p className="home-eyebrow">A little test</p><h2 id="hq-title">How well do you know <em>the Bible?</em></h2></div>
      <div className="hq-tally" aria-live="polite">
        <p><strong>{right}</strong><span>right</span></p>
        <p><strong>{answered}</strong><span>of {QUESTIONS.length} answered</span></p>
        {answered > 0 && <button type="button" onClick={restart}><RotateCcw size={13} aria-hidden />Start again</button>}
      </div>
    </header>

    {current === -1 ? <Verdict right={right} restart={restart} /> : <div className="hq-stage" key={current}>
      <div className="hq-scene"><span className="hq-numeral" aria-hidden="true">{pad(current + 1)}</span><QuizScene scene={question.scene} /></div>
      <div className="hq-body">
        <p className="hq-meta"><span>Question {pad(current + 1)} of {QUESTIONS.length}</span><span>{question.part}</span></p>
        <h3>{question.ask}</h3>
        <div className="hq-options">{question.options.map((option, j) => {
          const state = choice === null ? undefined : j === question.answer ? "right" : j === choice ? "wrong" : "other";
          return <button type="button" key={option} disabled={choice !== null} data-state={state} onClick={() => setPicked((now) => now.map((value, i) => (i === current ? j : value)))}>
            <span className="hq-letter" aria-hidden="true">{state === "right" ? <Check size={14} /> : state === "wrong" ? <X size={14} /> : LETTERS[j]}</span><span>{option}</span></button>;
        })}</div>
        {choice !== null && <div className="hq-reveal">
          <p className="hq-result" data-right={choice === question.answer || undefined}>{choice === question.answer ? "Right." : `Not quite: ${question.options[question.answer].replace(/[“”.]/g, "")}.`} <span>{question.why}</span></p>
          <blockquote>“{question.verse}”<cite>{question.ref}</cite></blockquote>
          <div className="hq-actions">
            <button type="button" className="hq-next" onClick={() => setCurrent(finished ? -1 : next)}>{finished ? "See how you did" : "Next question"} <ArrowRight size={15} aria-hidden /></button>
            <Link to={`/read/kjv/${question.read}`}>Read {chapterOf(question.ref)} <ArrowUpRight size={15} aria-hidden /></Link>
          </div>
        </div>}
      </div>
    </div>}
  </section>;
}
