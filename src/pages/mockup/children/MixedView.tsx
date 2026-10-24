// Direction E, the mix (owner, 2026-10-24: "the options up top, the big one below, and then underneath is the path"):
// the parts of the Bible as A's row of drawings, then C's big lesson card for the chosen lesson, then the chosen part's
// lessons on A's path. Choosing a part puts its next lesson in the card; choosing a lesson on the path puts that one in.
// The parts row sits directly on the card, with no gap (owner, 2026-10-24: "connect them"); beside Start, an outline
// button opens every question with its answer in the course below. Start the quiz goes down to the path and zooms into
// the lesson's circle, and so does choosing a circle: the quiz then fills the screen (LessonStage.tsx; owner, 2026-10-24).
import { ArrowDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { QuizScene } from "../QuizScenes";
import { nextLesson, passageLabel, toneStyle, type Lesson } from "./data";
import { LessonStage } from "./LessonStage";
import { Path, PartRow, Top, type ViewProps } from "./PathView";
import type { Progress } from "./progress";

/** The first lesson of a part not yet done, or its first. */
const firstToDo = (lessons: Lesson[], progress: Progress) => lessons.find((l) => !progress[l.id]) ?? lessons[0];

type Props = ViewProps & { bookNames: Record<string, string>; onGuide: (lesson: Lesson) => void; onFinish: (lesson: Lesson, right: number, total: number) => void };

/** Scrolls `el` to the middle of the screen unless it is already well in view; resolves when the scroll has ended. */
function bringIntoView(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.top > 90 && r.bottom < window.innerHeight - 90) return Promise.resolve();
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return new Promise<void>((done) => {
    const timer = window.setTimeout(done, 1000);
    window.addEventListener("scrollend", () => { window.clearTimeout(timer); done(); }, { once: true });
  });
}

export function MixedView({ lessons, groups, progress, bookNames, onGuide, onFinish }: Props) {
  const next = nextLesson(lessons, progress);
  const [chosenId, setChosenId] = useState(next.id);
  const chosen = lessons.find((l) => l.id === chosenId) ?? next;
  const group = groups.find((g) => g.part.id === chosen.part.id) ?? groups[0];
  const after = group.lessons.slice(group.lessons.indexOf(chosen) + 1, group.lessons.indexOf(chosen) + 4);
  const pathSection = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState<Lesson | null>(null);
  const circleOf = useCallback((id: string) => pathSection.current?.querySelector<HTMLElement>(`[data-lesson="${id}"] .ck-node`) ?? null, []);
  const closeStage = useCallback(() => setPlaying(null), []);
  const sectionOf = useCallback(() => pathSection.current, []);
  const play = async (lesson: Lesson) => {
    if (playing) return;
    setChosenId(lesson.id);
    const circle = circleOf(lesson.id);
    if (circle) await bringIntoView(circle);
    setPlaying(lesson);
  };
  const choosePart = (id: string) => {
    const g = groups.find((x) => x.part.id === id);
    if (g) setChosenId(firstToDo(g.lessons, progress).id);
  };
  return <div className="ck-wrap">
    <Top beside lead="Choose a part of the Bible, then a lesson. Read the passage together and ask the questions one at a time." />
    <div className="ck-mix-join">
    <PartRow groups={groups} progress={progress} partId={group.part.id} onChoose={choosePart} />
    <section className="ck-sunday" style={toneStyle(chosen.part.tone)} aria-labelledby="ck-mix-title" aria-live="polite">
      <div className="ck-sunday-art"><QuizScene scene={chosen.part.scene} /></div>
      <div>
        <p className="ck-eyebrow">{chosen.id === next.id ? "Up next · " : ""}{chosen.part.title} · Lesson {chosen.n}</p>
        <h2 id="ck-mix-title">{chosen.title}</h2>
        <p>{chosen.passage ? <>Read <b>{passageLabel(chosen.passage, bookNames)}</b> together, then </> : "Learn together, then "}answer {chosen.questions.length} questions.
          {progress[chosen.id] && ` Last time: ${progress[chosen.id].right} of ${progress[chosen.id].total} right.`}</p>
        <button type="button" className="ck-go" onClick={() => void play(chosen)}>{progress[chosen.id] ? "Start the quiz again" : "Start the quiz"}<ArrowDown size={18} aria-hidden /></button>
        <button type="button" className="ck-go ck-go-outline" onClick={() => onGuide(chosen)}>See all the questions</button>
        {after.length > 0 && <p className="ck-after">After that: {after.map((l, i) => <span key={l.id}>{i > 0 && " · "}<button type="button" onClick={() => setChosenId(l.id)}>{l.title}</button></span>)}</p>}
      </div>
    </section>
    </div>
    <section ref={pathSection} className="ck-path-part ck-mix-path" style={toneStyle(group.part.tone)} aria-labelledby="ck-mix-path-title">
      <h2 id="ck-mix-path-title">All {group.lessons.length} lessons in {group.part.title}</h2>
      <p>{group.part.line}. Choose one to start its quiz.</p>
      <Path lessons={group.lessons} progress={progress} next={next} openId={chosen.id} onOpen={(l) => void play(l)} icons />
    </section>
    {playing && <LessonStage lesson={playing} next={lessons[lessons.indexOf(playing) + 1] ?? null} bookNames={bookNames}
      sectionOf={sectionOf} circleOf={circleOf} onFinish={onFinish} onClosed={closeStage}
      onOpen={(l) => { setPlaying(l); setChosenId(l.id); }} />}
  </div>;
}
