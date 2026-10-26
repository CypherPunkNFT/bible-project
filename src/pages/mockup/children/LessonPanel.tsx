// One children's lesson, for a parent or teacher at the screen with the child (owner, 2026-10-23): read the passage
// first, then one big question at a time. A question with choices shows them as four large buttons and tapping one
// tells right or not; a question without them has "Show answer", then the grown-up marks "We got it" or "Not yet".
// Every answer can open its verse. At the end, how many they knew, kept in this browser (progress.ts). The panel
// slides in beside the page and closes the same way. With `stage` (E, owner 2026-10-24) it is the whole screen instead,
// opened out of the lesson's circle (LessonStage.tsx): the questions straight away, Next, and Back to the lessons.
import { ArrowRight, BookOpen, Check, RotateCcw, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { rightChoice } from "@/lib/data";
import { PartArt } from "./part-art";
import { verseOf } from "../questions/test/engine";
import { passageLabel, readerUrl, type Lesson } from "./data";
import { LessonArt } from "./lesson-art";

interface Props { lesson: Lesson; bookNames: Record<string, string>; next: Lesson | null; onClose: () => void; onOpen: (lesson: Lesson) => void; onFinish: (right: number, total: number) => void; stage?: boolean }

export function LessonPanel({ lesson, bookNames, next, onClose, onOpen, onFinish, stage }: Props) {
  const first = stage ? 0 : -1;
  const [index, setIndex] = useState(first);
  const [marks, setMarks] = useState<(boolean | undefined)[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => { setIndex(first); setMarks([]); setPicked(null); setShown(false); }, [lesson.id, first]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  const total = lesson.questions.length;
  const right = marks.filter(Boolean).length;
  const mark = (value: boolean) => setMarks((m) => { const out = [...m]; out[index] = value; return out; });
  const go = (to: number) => {
    setPicked(null); setShown(false); setIndex(to);
    if (to === total) onFinish(marks.filter(Boolean).length, total);
  };
  return <aside className={stage ? "ck-panel ck-panel-stage" : "ck-panel"} style={{ "--tone": `var(--${lesson.part.tone})` } as CSSProperties} aria-label={`Lesson ${lesson.n}: ${lesson.title}`}>
    <header className="ck-panel-top">
      <span className="ck-eyebrow">{lesson.part.title} · Lesson {lesson.n}</span>
      {stage ? <button type="button" className="ck-stage-back" onClick={onClose}>Back to the lessons<X size={18} strokeWidth={1.7} aria-hidden /></button>
        : <button type="button" className="ck-close" onClick={onClose} aria-label="Close the lesson"><X size={20} strokeWidth={1.6} /></button>}
    </header>
    {stage && <div className="ck-stage-head">
      <div className="ck-stage-title"><h1>{lesson.title}</h1><StageIcon lesson={lesson} /></div>
      {lesson.passage && <p>Read <Link to={readerUrl(lesson.passage.book, lesson.passage.from)}>{passageLabel(lesson.passage, bookNames)}</Link> together first.</p>}
    </div>}
    {index < 0 && <Start lesson={lesson} bookNames={bookNames} onBegin={() => go(0)} />}
    {index >= 0 && index < total && <>
      <ol className="ck-dots" aria-label={`Question ${index + 1} of ${total}`}>{lesson.questions.map((_, i) =>
        <li key={i} data-state={marks[i] === true ? "right" : marks[i] === false ? "missed" : i === index ? "now" : undefined} />)}</ol>
      <Question key={index} lesson={lesson} index={index} picked={picked} shown={shown}
        onPick={(choice) => { setPicked(choice); mark(choice === rightChoice(lesson.questions[index])); }}
        onShow={() => setShown(true)} onMark={mark} marked={marks[index]} />
      <footer className="ck-panel-foot">
        <span>{right} right so far</span>
        <button type="button" className="ck-go" disabled={marks[index] === undefined} onClick={() => go(index + 1)}>
          {index + 1 < total ? "Next question" : "See how we did"}<ArrowRight size={18} strokeWidth={1.7} aria-hidden /></button>
      </footer>
    </>}
    {index === total && <div className="ck-done">
      <p className="ck-done-score"><b>{right}</b> of {total}</p>
      <p className="ck-done-line">{right === total ? "Every one. Well done!" : right >= total / 2 ? "Well done. Read the passage again and try once more." : "A good start. Read the passage together, then try again."}</p>
      <div className="ck-done-go">
        <button type="button" className="ck-ghost" onClick={() => { setMarks([]); go(0); }}><RotateCcw size={16} aria-hidden />Do it again</button>
        {next && <button type="button" className="ck-go" onClick={() => onOpen(next)}>Next lesson: {next.title}<ArrowRight size={18} aria-hidden /></button>}
      </div>
    </div>}
  </aside>;
}

/** The lesson's drawing beside its title on the whole-screen quiz, where the drawing flying out of the circle lands. */
function StageIcon({ lesson }: { lesson: Lesson }) {
  return <LessonArt lesson={lesson} className="ck-stage-icon" />;
}

function Start({ lesson, bookNames, onBegin }: { lesson: Lesson; bookNames: Record<string, string>; onBegin: () => void }) {
  return <div className="ck-start">
    <div className="ck-start-art"><PartArt part={lesson.part} /></div>
    <h2>{lesson.title}</h2>
    {lesson.passage ? <p>First, read <Link to={readerUrl(lesson.passage.book, lesson.passage.from)}>{passageLabel(lesson.passage, bookNames)}</Link> together. Then answer {lesson.questions.length} questions, one at a time.</p>
      : <p>{lesson.questions.length} questions and answers to learn together, one at a time.</p>}
    <button type="button" className="ck-go" onClick={onBegin}>Start the questions<ArrowRight size={18} aria-hidden /></button>
  </div>;
}

interface QuestionProps { lesson: Lesson; index: number; picked: string | null; shown: boolean; marked: boolean | undefined; onPick: (choice: string) => void; onShow: () => void; onMark: (right: boolean) => void }

function Question({ lesson, index, picked, shown, marked, onPick, onShow, onMark }: QuestionProps) {
  const q = lesson.questions[index];
  const answer = rightChoice(q);
  const ref = verseOf(q);
  const open = picked !== null || shown;
  return <div className="ck-q">
    <h2 className="ck-q-text">{q.question}</h2>
    {q.options?.length ? <div className="ck-choices">{q.options.map((option, i) => {
      const state = picked === null ? undefined : option === answer ? "right" : option === picked ? "wrong" : "off";
      return <button key={option} type="button" disabled={picked !== null} data-state={state} onClick={() => onPick(option)}>
        <b>{"ABCD"[i]}</b>{option}{state === "right" && <Check size={20} strokeWidth={2} aria-hidden />}</button>;
    })}</div>
      : !shown && <button type="button" className="ck-ghost ck-show" onClick={onShow}>Show answer</button>}
    {open && <div className="ck-answer">
      <p><span>Answer</span>{q.answer}</p>
      {ref && <Link className="ck-verse" to={readerUrl(ref.book, ref.chapter, ref.verse)}><BookOpen size={16} strokeWidth={1.6} aria-hidden />Read the verse</Link>}
      {!q.options?.length && <div className="ck-mark">
        <button type="button" aria-pressed={marked === true} onClick={() => onMark(true)}>We got it</button>
        <button type="button" aria-pressed={marked === false} onClick={() => onMark(false)}>Not yet</button>
      </div>}
    </div>}
  </div>;
}
