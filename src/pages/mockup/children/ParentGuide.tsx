// The course for parents and teachers, at the foot of every version of the children's page (owner, 2026-10-24: "we
// need a way to review all the questions before. Parents need to be able to go through the curriculum… at the bottom
// of the pages. Make it nice"). Every lesson in course order down the side, by part; the chosen one beside it as a
// sheet: what to read first, then each question with its answer, the other choices and its verse. On a phone the
// list becomes one drop-down. "Start with your child" opens the lesson panel as the rest of the page does. Collapsed
// until "Open the whole course", a part at the top, or a lesson's "See all the questions" opens it (owner, 2026-10-24).
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { rightChoice } from "@/lib/data";
import { QuizScene } from "../QuizScenes";
import { verseOf } from "../questions/test/engine";
import { nextLesson, passageLabel, readerUrl, toneStyle, type Lesson, type PartLessons } from "./data";
import type { Progress } from "./progress";
import "./parent-guide.css";

interface Props {
  lessons: Lesson[]; groups: PartLessons[]; progress: Progress; bookNames: Record<string, string>; onOpen: (lesson: Lesson) => void;
  expanded: boolean; onExpand: (expanded: boolean) => void; chosenId: string | null; onChoose: (id: string) => void;
}

/** The top, "the course at a glance" (owner picked it from four, 2026-10-25): the title with the figures above the
 *  button beside it, then the eight parts as columns with their drawings, each opening the course at its first lesson. */
function CourseHead({ lessons, groups, total, expanded, onExpand, onPick }: {
  lessons: Lesson[]; groups: PartLessons[]; total: number; expanded: boolean; onExpand: (expanded: boolean) => void; onPick: (lesson: Lesson) => void;
}) {
  return <header className="pg-head">
    <div className="pg-head-top">
      <div className="pg-head-words">
        <p className="ck-eyebrow">For parents and teachers</p>
        <h2 id="pg-title">The whole course,<br /><em>answers included</em></h2>
        <p className="ck-lead">Look over a lesson before you sit down together: the passage to read first, every question,
          the right answer and the other choices your child will see.</p>
      </div>
      <div className="pg-head-side">
        <p className="pg-count"><b>{lessons.length}</b> lessons<span aria-hidden>·</span><b>{total.toLocaleString()}</b> questions</p>
        <button type="button" className="pg-open" aria-expanded={expanded} aria-controls="pg-course" onClick={() => onExpand(!expanded)}>
          {expanded ? "Close the course" : "Open the whole course"}<ChevronDown size={18} strokeWidth={1.8} aria-hidden /></button>
      </div>
    </div>
    <ol className="pg-parts">{groups.map(({ part, lessons: ls }) => <li key={part.id} style={toneStyle(part.tone)}>
      <button type="button" onClick={() => onPick(ls[0])}>
        <span className="pg-part-art"><QuizScene scene={part.scene} /></span>
        <strong>{part.title}</strong><small>{ls.length} lessons</small>
      </button>
    </li>)}</ol>
  </header>;
}

export function ParentGuide({ lessons, groups, progress, bookNames, onOpen, expanded, onExpand, chosenId, onChoose }: Props) {
  const chosen = lessons.find((l) => l.id === chosenId) ?? nextLesson(lessons, progress);
  const sheet = useRef<HTMLDivElement>(null);
  const at = lessons.indexOf(chosen);
  const total = lessons.reduce((n, l) => n + l.questions.length, 0);
  const choose = (lesson: Lesson) => {
    onChoose(lesson.id);
    // On a phone the sheet sits under the list: bring its top into view.
    if (sheet.current && sheet.current.getBoundingClientRect().top < 0) sheet.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pick = (lesson: Lesson) => { onChoose(lesson.id); onExpand(true); };
  return <section className="ck-wrap pg" aria-labelledby="pg-title">
    <CourseHead lessons={lessons} groups={groups} total={total} expanded={expanded} onExpand={onExpand} onPick={pick} />
    {expanded && <div className="pg-grid" id="pg-course">
      <nav className="pg-rail" aria-label="Every lesson">
        {groups.map(({ part, lessons: ls }) => <div key={part.id} className="pg-part" style={toneStyle(part.tone)}>
          <p className="pg-part-name"><i aria-hidden />{part.title}<small>{ls.length}</small></p>
          <ol>{ls.map((l) => <li key={l.id}>
            <button type="button" aria-current={l.id === chosen.id ? "true" : undefined} onClick={() => choose(l)}>
              <span className="pg-n">{l.n}</span><span className="pg-title">{l.title}</span>
              {progress[l.id] && <Check size={14} strokeWidth={2.2} aria-label="done" />}
            </button>
          </li>)}</ol>
        </div>)}
      </nav>
      <label className="pg-select">
        <span>Lesson</span>
        <select value={chosen.id} onChange={(e) => choose(lessons.find((l) => l.id === e.target.value) ?? chosen)}>
          {groups.map(({ part, lessons: ls }) => <optgroup key={part.id} label={part.title}>
            {ls.map((l) => <option key={l.id} value={l.id}>{l.n}. {l.title}</option>)}
          </optgroup>)}
        </select>
      </label>
      <div className="pg-sheet" ref={sheet} style={toneStyle(chosen.part.tone)} aria-live="polite">
        <Sheet lesson={chosen} bookNames={bookNames} progress={progress} onOpen={onOpen} />
        <footer className="pg-steps">
          {at > 0 ? <button type="button" onClick={() => choose(lessons[at - 1])}><ArrowLeft size={16} aria-hidden /><span><small>Before</small>{lessons[at - 1].title}</span></button> : <span />}
          {at < lessons.length - 1 && <button type="button" className="pg-next" onClick={() => choose(lessons[at + 1])}><span><small>Next</small>{lessons[at + 1].title}</span><ArrowRight size={16} aria-hidden /></button>}
        </footer>
      </div>
    </div>}
  </section>;
}

function Sheet({ lesson, bookNames, progress, onOpen }: { lesson: Lesson; bookNames: Record<string, string>; progress: Progress; onOpen: (lesson: Lesson) => void }) {
  const done = progress[lesson.id];
  return <article>
    <header className="pg-sheet-head">
      <p className="ck-eyebrow">{lesson.part.title} · Lesson {lesson.n}</p>
      <h3>{lesson.title}</h3>
      <p className="pg-read">
        <span>{lesson.passage
          ? <>Read <Link to={readerUrl(lesson.passage.book, lesson.passage.from)}>{passageLabel(lesson.passage, bookNames)}</Link> together first, then {lesson.questions.length} questions.</>
          : <>{lesson.questions.length} questions and answers to learn together.</>}</span>
        {done && <span className="pg-done"><Check size={14} strokeWidth={2.2} aria-hidden />Done: {done.right} of {done.total} right</span>}
      </p>
      <button type="button" className="ck-go" onClick={() => onOpen(lesson)}>Start with your child<ArrowRight size={18} aria-hidden /></button>
    </header>
    <ol className="pg-questions">{lesson.questions.map((q, i) => {
      const answer = rightChoice(q);
      const others = (q.options ?? []).filter((o) => o !== answer);
      const ref = verseOf(q);
      return <li key={i}>
        <span className="pg-qn" aria-hidden>{i + 1}</span>
        <div>
          <p className="pg-q">{q.question}</p>
          <p className="pg-a"><Check size={16} strokeWidth={2.4} aria-hidden /><span className="pg-label">Answer</span>{answer}</p>
          {others.length > 0 && <p className="pg-others"><span className="pg-label">Other choices</span>{others.join(" · ")}</p>}
          {ref && <Link className="pg-verse" to={readerUrl(ref.book, ref.chapter, ref.verse)}><BookOpen size={14} strokeWidth={1.6} aria-hidden />
            {bookNames[ref.book] ?? ref.book} {ref.chapter}{ref.verse ? `:${ref.verse}` : ""}</Link>}
        </div>
      </li>;
    })}</ol>
  </article>;
}
