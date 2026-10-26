// Direction A, the path: the parts of the Bible as a row of drawings, and the chosen part's lessons on one winding line,
// lesson by lesson. A finished lesson is filled in its part's colour; the next one to do carries the page's one glow.
// Also the plain top shared by directions A, C and D.
import { ArrowLeft, Check } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PartArt } from "./part-art";
import { nextLesson, toneStyle, type Lesson, type PartLessons } from "./data";
import { LessonArt } from "./lesson-art";
import type { Progress } from "./progress";
import { layRoad, useRoad, useTraveller } from "./road";

export interface ViewProps { lessons: Lesson[]; groups: PartLessons[]; progress: Progress; openId: string | null; onOpen: (lesson: Lesson) => void }


/** The page's top; `beside` sets the lead to the right of the title instead of under it (E). */
export function Top({ lead, beside }: { lead?: string; beside?: boolean }) {
  return <header className={beside ? "ck-top ck-top-beside" : "ck-top"}>
    <Link className="ck-back" to="/study/questions"><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
    <p className="ck-eyebrow">Children's tests</p>
    <h1>Bible questions <em>for children</em></h1>
    <p className="ck-lead">{lead ?? "Eighty-eight lessons through the whole Bible, from the garden to Paul in Rome, and the first questions of what we believe. Read the passage together, then ask the questions one at a time."}</p>
  </header>;
}

/** The parts of the Bible as a row of drawings, the chosen one pressed. */
export function PartRow({ groups, progress, partId, onChoose }: { groups: PartLessons[]; progress: Progress; partId: string; onChoose: (id: string) => void }) {
  return <ul className="ck-parts" aria-label="Parts of the Bible">{groups.map(({ part, lessons: ls }) => {
    const done = ls.filter((l) => progress[l.id]).length;
    return <li key={part.id} style={toneStyle(part.tone)}>
      <button type="button" aria-pressed={part.id === partId} onClick={() => onChoose(part.id)}>
        <span className="ck-part-art"><PartArt part={part} /></span>
        <strong>{part.title}</strong>
        <small>{done ? `${done} of ${ls.length} done` : `${ls.length} lessons`}</small>
      </button>
    </li>;
  })}</ul>;
}

export function PathView({ lessons, groups, progress, openId, onOpen }: ViewProps) {
  const next = nextLesson(lessons, progress);
  const [partId, setPartId] = useState(next.part.id);
  const group = groups.find((g) => g.part.id === partId) ?? groups[0];
  return <div className="ck-wrap">
    <Top />
    <PartRow groups={groups} progress={progress} partId={group.part.id} onChoose={setPartId} />
    <section className="ck-path-part" style={toneStyle(group.part.tone)} aria-labelledby="ck-path-title">
      <h2 id="ck-path-title">{group.part.title}</h2>
      <p>{group.part.line}</p>
      <Path lessons={group.lessons} progress={progress} next={next} openId={openId} onOpen={onOpen} />
    </section>
  </div>;
}

/** The lessons along one winding road, its own for each part (road.ts), with a dot that travels it as the page scrolls
 * and lights each lesson it rests in. With `art` (E) each circle holds the lesson's line drawing and its number sits
 * just outside it. */
export function Path({ lessons, progress, next, openId, onOpen, art }: { lessons: Lesson[]; progress: Progress; next: Lesson; openId: string | null; onOpen: (lesson: Lesson) => void; art?: boolean }) {
  const shape = useRoad(lessons.length, art), seed = lessons[0]?.id ?? "";
  const road = useMemo(() => layRoad(lessons.length, shape, seed), [lessons.length, shape, seed]);
  const { points, d, height } = road;
  const box = useRef<HTMLDivElement>(null), dot = useRef<HTMLSpanElement>(null);
  const near = useTraveller(box, dot, road);
  return <div ref={box} className={art ? "ck-path ck-path-art" : "ck-path"} style={{ aspectRatio: `1000 / ${height}` }}>
    <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
    {/* Before the lessons, so a circle hides the dot while it rests inside. */}
    <span ref={dot} className="ck-dot" aria-hidden />
    <ol>{lessons.map((lesson, i) => {
      const done = progress[lesson.id];
      return <li key={lesson.id} style={{ left: `${points[i].x / 10}%`, top: `${(points[i].y / height) * 100}%` }}>
        <button type="button" data-lesson={lesson.id} data-done={done ? "" : undefined} data-next={lesson.id === next.id ? "" : undefined} data-near={i === near ? "" : undefined} aria-pressed={lesson.id === openId}
          onClick={() => onOpen(lesson)} aria-label={`Lesson ${lesson.n}: ${lesson.title}${done ? `, ${done.right} of ${done.total} right` : ""}`}>
          {art ? <span className="ck-node-wrap"><span className="ck-node ck-node-icon"><LessonArt lesson={lesson} /></span><span className="ck-node-n" aria-hidden>{lesson.n}</span>{done && <Check className="ck-node-check" size={20} strokeWidth={2.6} aria-hidden />}</span>
            : <span className="ck-node">{done ? <Check size={20} strokeWidth={2.2} aria-hidden /> : lesson.n}</span>}
          <span className="ck-node-title">{lesson.title}</span>
        </button>
      </li>;
    })}</ol>
  </div>;
}
