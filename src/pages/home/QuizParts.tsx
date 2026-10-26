// Homepage (live; first tried on quiz_mockup): the pieces the four versions of the quiz share: the score, the answers, what shows once one is
// picked, the closing verdict and the twelve steps. Each version styles them under its own class (quiz-versions.css).
import { ArrowRight, ArrowUpRight, Check, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { QUESTIONS } from "../quiz-data";
import { LETTERS, chapterOf, type Quiz } from "./quiz-state";

export function Tally({ quiz }: { quiz: Quiz }) {
  return <div className="qv-tally" aria-live="polite">
    <p><strong>{quiz.right}</strong><span>right</span></p>
    <p><strong>{quiz.answered}</strong><span>of {QUESTIONS.length} answered</span></p>
    <button type="button" onClick={quiz.restart} data-hidden={quiz.answered === 0 || undefined}><RotateCcw size={13} aria-hidden />Start again</button>
  </div>;
}

export function Options({ quiz }: { quiz: Quiz }) {
  if (!quiz.question) return null;
  return <div className="qv-options">{quiz.question.options.map((option, j) => {
    const state = quiz.optionState(j);
    return <button type="button" key={option} disabled={quiz.choice !== null} data-state={state} onClick={() => quiz.choose(j)}>
      <span className="qv-letter" aria-hidden="true">{state === "right" ? <Check size={14} /> : state === "wrong" ? <X size={14} /> : LETTERS[j]}</span>
      <span>{option}</span>
    </button>;
  })}</div>;
}

function Actions({ quiz, read, label }: { quiz: Quiz; read: string; label: string }) {
  return <div className="qv-actions">
    {quiz.question
      ? <button type="button" className="qv-next" onClick={quiz.next}>{quiz.finished ? "See how you did" : "Next question"}<ArrowRight size={15} aria-hidden /></button>
      : <button type="button" className="qv-next" onClick={quiz.restart}><RotateCcw size={15} aria-hidden />Try again</button>}
    <Link to={`/read/kjv/${read}`}>Read {label}<ArrowUpRight size={15} aria-hidden /></Link>
  </div>;
}

/** The result, the passage and the way on. Its space is held before an answer is picked, so nothing moves. */
export function Reveal({ quiz, verse = true }: { quiz: Quiz; verse?: boolean }) {
  const { question, choice } = quiz;
  if (!question) return null;
  if (choice === null) return <div className="qv-reveal"><p className="qv-hint">Pick an answer to see the passage it comes from.</p></div>;
  const right = choice === question.answer;
  return <div className="qv-reveal" data-shown aria-live="polite">
    <p className="qv-result" data-right={right || undefined}>{right ? "Right." : `Not quite: ${question.options[question.answer].replace(/[“”.]/g, "")}.`} <span>{question.why}</span></p>
    {verse && <blockquote>“{question.verse}”<cite>{question.ref}</cite></blockquote>}
    <Actions quiz={quiz} read={question.read} label={chapterOf(question.ref)} />
  </div>;
}

export function Verdict({ quiz }: { quiz: Quiz }) {
  const { verdict } = quiz;
  return <div className="qv-verdict">
    <p className="qv-meta"><span>All twelve answered</span><span>{quiz.right} of {QUESTIONS.length} right</span></p>
    <h3>{verdict.title}</h3>
    <blockquote>“{verdict.verse}”<cite>{verdict.ref}</cite></blockquote>
    <Actions quiz={quiz} read={verdict.read} label={chapterOf(verdict.ref)} />
  </div>;
}

/** Twelve marks, one per question: the open one, then gold for right and red for wrong. Any can be clicked. */
export function Steps({ quiz }: { quiz: Quiz }) {
  return <ol className="qv-steps" aria-label="The twelve questions">{QUESTIONS.map((question, i) =>
    <li key={question.ask}><button type="button" data-state={i === quiz.current ? "current" : quiz.stateOf(i)} aria-label={`Question ${i + 1}`} onClick={() => quiz.open(i)} /></li>)}
  </ol>;
}
