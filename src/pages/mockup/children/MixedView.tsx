// Direction E, the mix (owner, 2026-10-24: "the options up top, the big one below, and then underneath is the path"):
// the parts of the Bible as A's row of drawings, then C's big lesson card for the chosen lesson, then the chosen part's
// lessons on A's path. Choosing a part puts its next lesson in the card; choosing a lesson on the path puts that one in.
// The parts row sits directly on the card, with no gap (owner, 2026-10-24: "connect them"); beside Start, an outline
// button opens every question with its answer in the course below. Start the quiz only goes down to the path and lights
// the lesson's circle for two seconds, as a hover would; it opens nothing (owner, 2026-10-24). Choosing a circle zooms
// into it and the quiz then fills the screen (LessonStage.tsx; owner, 2026-10-24).
// The path's section is a screen tall, so the course below stays out of sight; a small See all questions at its foot
// goes down to it.
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

/** Scrolls the path's section to the top of the screen (under the site's bar) unless it is there already; resolves
 *  when the scroll has ended. */
function bringToTop(el: HTMLElement) {
  if (Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop || "0")) < 4) return Promise.resolve();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const scene = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<Lesson | null>(null);
  const circleOf = useCallback((id: string) => pathSection.current?.querySelector<HTMLElement>(`[data-lesson="${id}"] .ck-node`) ?? null, []);
  const closeStage = useCallback(() => setPlaying(null), []);
  const sceneOf = useCallback(() => scene.current, []);
  const play = async (lesson: Lesson) => {
    if (playing) return;
    setChosenId(lesson.id);
    if (pathSection.current) await bringToTop(pathSection.current);
    setPlaying(lesson);
  };
  const showOnPath = async (lesson: Lesson) => {
    if (pathSection.current) await bringToTop(pathSection.current);
    const circle = circleOf(lesson.id);
    if (!circle) return;
    circle.removeAttribute("data-flash");
    void circle.offsetWidth; // restarts the light if pressed again while it is on
    circle.setAttribute("data-flash", "");
    circle.addEventListener("animationend", () => circle.removeAttribute("data-flash"), { once: true });
  };
  const choosePart = (id: string) => {
    const g = groups.find((x) => x.part.id === id);
    if (g) setChosenId(firstToDo(g.lessons, progress).id);
  };
  // The quiz sits outside the zoomed page, so the zoom does not carry it.
  return <><div className="ck-wrap" ref={scene}>
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
        <button type="button" className="ck-go" onClick={() => void showOnPath(chosen)}>{progress[chosen.id] ? "Start the quiz again" : "Start the quiz"}<ArrowDown size={18} aria-hidden /></button>
        <button type="button" className="ck-go ck-go-outline" onClick={() => onGuide(chosen)}>See all the questions</button>
        {after.length > 0 && <p className="ck-after">After that: {after.map((l, i) => <span key={l.id}>{i > 0 && " · "}<button type="button" onClick={() => setChosenId(l.id)}>{l.title}</button></span>)}</p>}
      </div>
    </section>
    </div>
    <section ref={pathSection} className="ck-path-part ck-mix-path" style={toneStyle(group.part.tone)} aria-labelledby="ck-mix-path-title">
      <h2 id="ck-mix-path-title">All {group.lessons.length} lessons in {group.part.title}</h2>
      <p>{group.part.line}. Choose one to start its quiz.</p>
      <div className="ck-mix-path-body">
        <Path lessons={group.lessons} progress={progress} next={next} openId={chosen.id} onOpen={(l) => void play(l)} art />
      </div>
      <button type="button" className="ck-mix-all" onClick={() => onGuide(chosen)}>See all questions<ArrowDown size={14} aria-hidden /></button>
    </section>
  </div>
    {playing && <LessonStage lesson={playing} next={lessons[lessons.indexOf(playing) + 1] ?? null} bookNames={bookNames}
      sceneOf={sceneOf} circleOf={circleOf} onFinish={onFinish} onClosed={closeStage}
      onOpen={(l) => { setPlaying(l); setChosenId(l.id); }} />}
  </>;
}
