// Direction A, the path: the parts of the Bible as a row of drawings, and the chosen part's lessons on one winding line,
// lesson by lesson. A finished lesson is filled in its part's colour; the next one to do carries the page's one glow.
// Also the page's plain top. Direction A's own page: ARCHIVE/mockups/children-PathView-2026-10-25.tsx.
import { ArrowLeft, Check } from "lucide-react";
import { useMemo, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PartArt } from "./part-art";
import { toneStyle, type Lesson, type Part, type PartLessons } from "./data";
import { LessonArt } from "./lesson-art";
import type { Progress } from "./progress";
import { layRoad, useRoad, useTraveller } from "./road";

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

/** Where a part's road leads when it ends: the next part, and what choosing it does. */
export interface Onward { part: Part; onGo: () => void }

/** The lessons along one winding road, its own for each part (road.ts), with a wave that flows along it as the page
 * scrolls and lights each lesson it passes through. With `art` (E) each circle holds the lesson's line drawing and its number sits
 * just outside it. With `onward` the road ends in a hexagon in the next part's colour, holding its drawing (owner,
 * 2026-10-25: "a final circle or something else than a circle. Maybe a hexagon … for the next lesson"). */
export function Path({ lessons, progress, next, openId, onOpen, art, onward }: { lessons: Lesson[]; progress: Progress; next: Lesson; openId: string | null; onOpen: (lesson: Lesson) => void; art?: boolean; onward?: Onward }) {
  const stops = lessons.length + (onward ? 1 : 0);
  const shape = useRoad(stops, art), seed = lessons[0]?.id ?? "";
  const ending = onward ? 1.6 : 1;
  const road = useMemo(() => layRoad(stops, shape, seed, ending), [stops, shape, seed, ending]);
  const { points, d, height } = road;
  const box = useRef<HTMLDivElement>(null), wave = useRef<SVGPathElement>(null), halo = useRef<SVGPathElement>(null);
  const near = useTraveller(box, wave, halo, road);
  return <div ref={box} className={art ? "ck-path ck-path-art" : "ck-path"} style={{ aspectRatio: `1000 / ${height}` }}>
    {/* Before the lessons, so a circle hides the wave while it passes through. */}
    <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} /><path ref={halo} className="ck-wave-halo" /><path ref={wave} className="ck-wave" />
    </svg>
    <ol>{lessons.map((lesson, i) => {
      const done = progress[lesson.id];
      return <li key={lesson.id} style={{ left: `${points[i].x / 10}%`, top: `${(points[i].y / height) * 100}%`, "--i": i } as CSSProperties}>
        <button type="button" data-lesson={lesson.id} data-done={done ? "" : undefined} data-next={lesson.id === next.id ? "" : undefined} data-near={i === near ? "" : undefined} aria-pressed={lesson.id === openId}
          onClick={() => onOpen(lesson)} aria-label={`Lesson ${lesson.n}: ${lesson.title}${done ? `, ${done.right} of ${done.total} right` : ""}`}>
          {art ? <span className="ck-node-wrap"><span className="ck-node ck-node-icon"><LessonArt lesson={lesson} /></span><span className="ck-node-n" aria-hidden>{lesson.n}</span>{done && <Check className="ck-node-check" size={20} strokeWidth={2.6} aria-hidden />}</span>
            : <span className="ck-node">{done ? <Check size={20} strokeWidth={2.2} aria-hidden /> : lesson.n}</span>}
          <span className="ck-node-title">{lesson.title}</span>
        </button>
      </li>;
    })}
    {onward && <li className="ck-onward" style={{ ...toneStyle(onward.part.tone), left: `${points[lessons.length].x / 10}%`, top: `${(points[lessons.length].y / height) * 100}%`, "--i": lessons.length } as CSSProperties}>
      <button type="button" data-near={near === lessons.length ? "" : undefined} onClick={onward.onGo} aria-label={`Next part: ${onward.part.title}`}>
        <span className="ck-hex"><svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50 1 92.4 25.5 92.4 74.5 50 99 7.6 74.5 7.6 25.5" /></svg>
          <span className="ck-hex-art"><PartArt part={onward.part} /></span></span>
        <span className="ck-node-title"><small>Next part</small>{onward.part.title}</span>
      </button>
    </li>}</ol>
  </div>;
}
