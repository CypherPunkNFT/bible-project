// Direction E, the mix (owner, 2026-10-24: "the options up top, the big one below, and then underneath is the path"):
// the parts of the Bible as A's row of drawings, then C's big lesson card for the chosen lesson, then the chosen part's
// lessons on A's path. Choosing a part puts its next lesson in the card; choosing a lesson on the path puts that one in.
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { QuizScene } from "../QuizScenes";
import { nextLesson, passageLabel, toneStyle, type Lesson } from "./data";
import { Path, PartRow, Top, type ViewProps } from "./PathView";
import type { Progress } from "./progress";

/** The first lesson of a part not yet done, or its first. */
const firstToDo = (lessons: Lesson[], progress: Progress) => lessons.find((l) => !progress[l.id]) ?? lessons[0];

export function MixedView({ lessons, groups, progress, onOpen, bookNames }: ViewProps & { bookNames: Record<string, string> }) {
  const next = nextLesson(lessons, progress);
  const [chosenId, setChosenId] = useState(next.id);
  const chosen = lessons.find((l) => l.id === chosenId) ?? next;
  const group = groups.find((g) => g.part.id === chosen.part.id) ?? groups[0];
  const after = group.lessons.slice(group.lessons.indexOf(chosen) + 1, group.lessons.indexOf(chosen) + 4);
  const choosePart = (id: string) => {
    const g = groups.find((x) => x.part.id === id);
    if (g) setChosenId(firstToDo(g.lessons, progress).id);
  };
  return <div className="ck-wrap">
    <Top lead="Choose a part of the Bible, then a lesson: read the passage together, then ask the questions one at a time." />
    <PartRow groups={groups} progress={progress} partId={group.part.id} onChoose={choosePart} />
    <section className="ck-sunday" style={toneStyle(chosen.part.tone)} aria-labelledby="ck-mix-title" aria-live="polite">
      <div className="ck-sunday-art"><QuizScene scene={chosen.part.scene} /></div>
      <div>
        <p className="ck-eyebrow">{chosen.id === next.id ? "Up next · " : ""}{chosen.part.title} · Lesson {chosen.n}</p>
        <h2 id="ck-mix-title">{chosen.title}</h2>
        <p>{chosen.passage ? <>Read <b>{passageLabel(chosen.passage, bookNames)}</b> together, then </> : "Learn together, then "}answer {chosen.questions.length} questions.
          {progress[chosen.id] && ` Last time: ${progress[chosen.id].right} of ${progress[chosen.id].total} right.`}</p>
        <button type="button" className="ck-go" onClick={() => onOpen(chosen)}>{progress[chosen.id] ? "Do this lesson again" : "Start this lesson"}<ArrowRight size={18} aria-hidden /></button>
        {after.length > 0 && <p className="ck-after">After that: {after.map((l, i) => <span key={l.id}>{i > 0 && " · "}<button type="button" onClick={() => setChosenId(l.id)}>{l.title}</button></span>)}</p>}
      </div>
    </section>
    <section className="ck-path-part ck-mix-path" style={toneStyle(group.part.tone)} aria-labelledby="ck-mix-path-title">
      <h2 id="ck-mix-path-title">All {group.lessons.length} lessons in {group.part.title}</h2>
      <p>{group.part.line}. Choose one to see it above.</p>
      <Path lessons={group.lessons} progress={progress} next={next} openId={chosen.id} onOpen={(l) => setChosenId(l.id)} />
    </section>
  </div>;
}
