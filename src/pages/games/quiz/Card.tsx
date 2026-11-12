// /games/quiz: one question as a card (the audit's items 1, 2, 3 and 5). The picture on the left turns over to the
// verse once answered (the kit's flip card, its back edged gold for right and red-brown for missed); the four answers
// are the kit's answer cards, dealt in one after another with their letter large in a corner, lifting on hover and
// focus, pressing on tap; a right pick swells with a moment's gold and a "+1" floats to the score, a wrong pick shakes
// while the right answer pulses gold. Along the top: the twelve-mark trail, the streak flame and the labelled score.
// The verdict and Next rise together in the kit's band, pinned to the bottom of a phone screen, so Next is always on
// the first screen. The card grows from the tile's own place on the board when `origin` is given.
import { Verse } from "@/components/Verse";
import { chapterOf, LETTERS, pad } from "@/pages/home/quiz-state";
import { QuizScene } from "@/pages/QuizScenes";
import { formatNumber, plural } from "@/lib/site-format";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AnswerCard, FeedbackBand, FlipCard, ProgressTrail, StreakFlame, useGrew } from "../kit";
import type { Origin } from "./Board";
import { TOTAL } from "./game";
import type { QuizRound } from "./state";

export interface CardProps { quiz: QuizRound; origin: Origin | null; onClose: () => void }

const plainAnswer = (text: string) => text.replace(/[“”.]/g, "");

/** The trail, the streak and the score, with the "+1" that floats up when an answer lands right. */
function Top({ quiz, onClose }: Pick<CardProps, "quiz" | "onClose">) {
  const bump = useGrew(quiz.right);
  return <header className="qz-card-top">
    <span className="qz-count">{`${pad(quiz.current + 1)} / ${TOTAL}`}</span>
    <ProgressTrail marks={quiz.marks} label={plural(quiz.answered, "{n} of 12 answered", "{n} of 12 answered")} className="qz-trail" />
    <StreakFlame count={quiz.streak} label={plural(quiz.streak, "{n} in a row", "{n} in a row")} className="qz-streak" />
    <p className="qz-score" aria-live="polite">
      <strong key={bump} className={bump ? "qz-score-n is-bumped" : "qz-score-n"}>{formatNumber(quiz.right)}</strong><span>right</span>
      {quiz.choice !== null && quiz.landed.right && <span key={quiz.landed.n} className="qz-plus" aria-hidden="true">+1</span>}
    </p>
    <button type="button" className="qz-close" aria-label="Close, back to all twelve questions" onClick={onClose}><X size={18} strokeWidth={1.7} aria-hidden="true" /></button>
  </header>;
}

function Answers({ quiz }: Pick<CardProps, "quiz">) {
  const { question, choice } = quiz;
  if (!question) return null;
  return <div className="qz-answers" role="group" aria-label="The four answers">{question.options.map((option, j) => {
    const state = quiz.optionState(j);
    return <AnswerCard key={option} index={j} state={state} className={`qz-answer${state === "right" && choice === j ? " is-landed" : ""}`}
      disabled={choice !== null} onClick={() => quiz.choose(j)} rightMark="" wrongMark="">
      <span className="qz-letter" aria-hidden="true">{LETTERS[j]}</span>
      <span className="qz-option">{option}</span>
    </AnswerCard>;
  })}</div>;
}

function Band({ quiz }: Pick<CardProps, "quiz">) {
  const { question, choice } = quiz;
  if (!question) return null;
  const answered = choice !== null;
  const right = answered && choice === question.answer;
  const verdict = answered && (right
    ? <span className="qz-verdict">Right.</span>
    : <span className="qz-verdict"><span>Not quite:</span> <strong>{plainAnswer(question.options[question.answer])}</strong></span>);
  return <FeedbackBand open={answered} tone={right ? "right" : "wrong"} verdict={verdict} className="qz-band"
    action={<button type="button" className="qz-next" onClick={quiz.next}>{quiz.finished ? "See how you did" : "Next question"}<ArrowRight size={15} aria-hidden="true" /></button>}>
    <p className="qz-why">{question.why}</p>
    <Link className="qz-read" to={`/read/bsb/${question.read}`}>{`Read ${chapterOf(question.ref)}`}<ArrowUpRight size={14} aria-hidden="true" /></Link>
  </FeedbackBand>;
}

export function Card({ quiz, origin, onClose }: CardProps) {
  const { question, choice } = quiz;
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const current = quiz.current;
  // On a phone every question opens with the card at the top of the screen (the head above it is not needed while
  // playing); on a desktop only when the board was scrolled past the card's top. Run before the grow below is measured.
  const scrolledBy = useRef(0);
  useLayoutEffect(() => {
    scrolledBy.current = 0;
    const element = card.current;
    if (!element || typeof element.getBoundingClientRect !== "function" || typeof element.scrollIntoView !== "function") return;
    const top = element.getBoundingClientRect().top;
    const narrow = window.innerWidth < 640;
    if (!narrow && top >= 0) return;
    const before = window.scrollY;
    // scrollIntoView honours the card's scroll-margin-top (quiz.css), which clears the site's sticky header.
    element.scrollIntoView({ block: "start", behavior: "auto" });
    scrolledBy.current = window.scrollY - before;
  }, [current]);
  // The card grows from the tile's place: measured once on mount, written as variables the keyframe reads.
  useLayoutEffect(() => {
    const element = card.current;
    if (!element || !origin || typeof element.getBoundingClientRect !== "function") return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    element.style.setProperty("--qz-from-x", `${origin.x - rect.left}px`);
    element.style.setProperty("--qz-from-y", `${origin.y - scrolledBy.current - rect.top}px`);
    element.style.setProperty("--qz-from-sx", String(origin.width / rect.width));
    element.style.setProperty("--qz-from-sy", String(origin.height / rect.height));
    element.classList.add("is-growing");
  }, [origin]);
  // Focus moves onto the question when it opens (the audit's accessibility note), without scrolling the page.
  useEffect(() => { if (choice === null) title.current?.focus({ preventScroll: true }); }, [current, choice]);
  if (!question) return null;
  const turned = choice !== null;
  const right = turned && choice === question.answer;
  return <article ref={card} className="qz-card" key={quiz.current}>
    <Top quiz={quiz} onClose={onClose} />
    <div className="qz-card-body">
      <FlipCard className="qz-picture" flipped={turned} tone={turned ? (right ? "right" : "wrong") : null}
        front={<span className="qz-face"><span className="qz-num" aria-hidden="true">{pad(quiz.current + 1)}</span><QuizScene scene={question.scene} /></span>}
        back={<blockquote className="qz-verse">“<Verse id={question.verse} unquoted />”<cite>{question.ref}</cite></blockquote>} />
      <div className="qz-main" style={{ "--qz-i": 0 } as CSSProperties}>
        <p className="qz-meta"><span>{`Question ${pad(quiz.current + 1)} of ${TOTAL}`}</span><span>{question.part}</span></p>
        <h2 ref={title} tabIndex={-1} className="qz-ask">{question.ask}</h2>
        <Answers quiz={quiz} />
        <Band quiz={quiz} />
      </div>
    </div>
  </article>;
}
