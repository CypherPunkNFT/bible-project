// Direction E, the mix (owner, 2026-10-24), condensed into one panel the same day: the parts of the Bible along its
// top, the chosen lesson large below them, and the chosen part's lessons running down its right side. Two buttons the
// shape of the home page's doors, in the part's colour: start the lesson (filled), or see all its questions with their
// answers in the course below (outline). Choosing a part shows its first lesson not yet done.
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { QuizScene } from "../QuizScenes";
import { nextLesson, passageLabel, toneStyle, type Lesson } from "./data";
import { Top, type ViewProps } from "./PathView";
import type { Progress } from "./progress";

/** The first lesson of a part not yet done, or its first. */
const firstToDo = (lessons: Lesson[], progress: Progress) => lessons.find((l) => !progress[l.id]) ?? lessons[0];

type Props = ViewProps & { bookNames: Record<string, string>; onGuide: (lesson: Lesson) => void };

export function MixedView({ lessons, groups, progress, onOpen, bookNames, onGuide }: Props) {
  const next = nextLesson(lessons, progress);
  const [chosenId, setChosenId] = useState(next.id);
  const chosen = lessons.find((l) => l.id === chosenId) ?? next;
  const group = groups.find((g) => g.part.id === chosen.part.id) ?? groups[0];
  const done = progress[chosen.id];
  const choosePart = (id: string) => {
    const g = groups.find((x) => x.part.id === id);
    if (g) setChosenId(firstToDo(g.lessons, progress).id);
  };
  return <div className="ck-wrap">
    <Top lead="Choose a part of the Bible, then a lesson: read the passage together, then ask the questions one at a time." />
    <section className="ck-mix" style={toneStyle(chosen.part.tone)} aria-labelledby="ck-mix-title">
      <ul className="ck-mix-parts" aria-label="Parts of the Bible">{groups.map(({ part, lessons: ls }) => {
        const partDone = ls.filter((l) => progress[l.id]).length;
        return <li key={part.id} style={toneStyle(part.tone)}>
          <button type="button" aria-pressed={part.id === group.part.id} onClick={() => choosePart(part.id)}>
            <span className="ck-mix-part-art"><QuizScene scene={part.scene} /></span>
            <strong>{part.title}</strong>
            <small>{partDone ? `${partDone} of ${ls.length} done` : `${ls.length} lessons`}</small>
          </button>
        </li>;
      })}</ul>
      <div className="ck-mix-body">
        <div className="ck-mix-lesson" aria-live="polite">
          <div className="ck-mix-art"><QuizScene scene={chosen.part.scene} /></div>
          <div>
            <p className="ck-eyebrow">{chosen.id === next.id ? "Up next · " : ""}{chosen.part.title} · Lesson {chosen.n}</p>
            <h2 id="ck-mix-title">{chosen.title}</h2>
            <p>{chosen.passage ? <>Read <b>{passageLabel(chosen.passage, bookNames)}</b> together, then </> : "Learn together, then "}answer {chosen.questions.length} questions.
              {done && ` Last time: ${done.right} of ${done.total} right.`}</p>
          </div>
          <div className="ck-doors">
            <button type="button" className="ck-door ck-door-solid" onClick={() => onOpen(chosen)}>
              <span><small>With your child</small><strong>{done ? "Do this lesson again" : "Start this lesson"}</strong></span><ArrowRight size={18} aria-hidden />
            </button>
            <button type="button" className="ck-door" onClick={() => onGuide(chosen)}>
              <span><small>Answers included</small><strong>See all the questions</strong></span><ArrowDown size={18} aria-hidden />
            </button>
          </div>
        </div>
        <div className="ck-mix-list">
          <p className="ck-mix-count">{group.lessons.length} lessons</p>
          <ol>{group.lessons.map((l) => <li key={l.id}>
            <button type="button" aria-pressed={l.id === chosen.id} data-done={progress[l.id] ? "" : undefined} data-next={l.id === next.id ? "" : undefined}
              onClick={() => setChosenId(l.id)}>
              <span className="ck-mix-node">{progress[l.id] ? <Check size={15} strokeWidth={2.4} aria-label="done" /> : l.n}</span>
              <span>{l.title}</span>
            </button>
          </li>)}</ol>
        </div>
      </div>
    </section>
  </div>;
}
