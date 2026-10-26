// Direction A, the path: the parts of the Bible as a row of drawings, and the chosen part's lessons on one winding line,
// lesson by lesson. A finished lesson is filled in its part's colour; the next one to do carries the page's one glow.
// Also the plain top shared by directions A, C and D.
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PartArt } from "./part-art";
import { nextLesson, toneStyle, type Lesson, type PartLessons } from "./data";
import { LessonArt } from "./lesson-art";
import type { Progress } from "./progress";

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

const NARROW = "(max-width: 760px)";

/** The road's shape, in the path's units (a thousandth of its width): `swing` is how far it reaches either side of the
 * middle, `bend` how far down one sweep across goes, `flat` (0 to 1) how level the middle of a sweep runs and so how
 * round its turns are, `perSweep` how many lessons stand on each sweep, and `top` and `bottom` keep the first circle
 * and the last title inside. */
interface Road { swing: number; bend: number; flat: number; perSweep: number; top: number; bottom: number }

/** A road winding down the page like a board game's: nearly level across, then a wide round turn at each side, with
 * no row ends and no two lessons stacked (owner, 2026-10-25: "really smooth, long winding things … like the game of
 * life. Nice and easy. Turns"). With `art` (E) a sweep holds at most three and never more than a third of the part's
 * lessons, so the road always winds through at least two bends; two on a phone, where the circles fill more of the
 * width. */
function useRoad(count: number, art?: boolean): Road {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const change = () => setNarrow(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  if (art) return narrow ? { swing: 250, bend: 1150, flat: 0.3, perSweep: 2, top: 190, bottom: 340 }
    : { swing: 360, bend: 600, flat: 0.6, perSweep: Math.max(2, Math.min(3, Math.ceil(count / 3))), top: 90, bottom: 150 };
  return narrow ? { swing: 300, bend: 700, flat: 0.4, perSweep: 3, top: 120, bottom: 260 }
    : { swing: 400, bend: 340, flat: 0.6, perSweep: 6, top: 60, bottom: 110 };
}

/** The lessons evenly spaced along the road, the first on its top-left turn and every `perSweep`-th on a turn, and the
 * road itself as a line through them. The road is x = 500 − swing·cos θ, y = bend/π · (θ + flat/2 · sin 2θ): one
 * sweep across for each half turn of θ, steepest at the turns and most level in the middle. */
function layRoad(count: number, { swing, bend, flat, perSweep, top, bottom }: Road) {
  const at = (t: number) => ({ x: 500 - swing * Math.cos(t), y: top + (bend / Math.PI) * (t + (flat / 2) * Math.sin(2 * t)) });
  const STEP = 0.001;
  const length = (t: number) => { const a = at(t - STEP), b = at(t); return Math.hypot(b.x - a.x, b.y - a.y); };
  let sweep = 0;
  for (let t = STEP; t <= Math.PI; t += STEP) sweep += length(t);
  const spacing = sweep / perSweep;
  const points = [at(0)];
  let along = 0, t = 0;
  while (points.length < count) {
    t += STEP;
    along += length(t);
    if (along >= points.length * spacing - 0.5) points.push(at(t));
  }
  const road = [];
  for (let u = 0; u < t; u += 0.02) { const p = at(u); road.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
  const end = at(t);
  road.push(`${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
  return { points, d: `M${road.join("L")}`, height: end.y + bottom };
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

/** The lessons along one winding road (useRoad). With `art` (E) each circle holds
 * the lesson's line drawing and its number sits just outside it. */
export function Path({ lessons, progress, next, openId, onOpen, art }: { lessons: Lesson[]; progress: Progress; next: Lesson; openId: string | null; onOpen: (lesson: Lesson) => void; art?: boolean }) {
  const { points, d, height } = layRoad(lessons.length, useRoad(lessons.length, art));
  return <div className={art ? "ck-path ck-path-art" : "ck-path"} style={{ aspectRatio: `1000 / ${height}` }}>
    <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
    <ol>{lessons.map((lesson, i) => {
      const done = progress[lesson.id];
      return <li key={lesson.id} style={{ left: `${points[i].x / 10}%`, top: `${(points[i].y / height) * 100}%` }}>
        <button type="button" data-lesson={lesson.id} data-done={done ? "" : undefined} data-next={lesson.id === next.id ? "" : undefined} aria-pressed={lesson.id === openId}
          onClick={() => onOpen(lesson)} aria-label={`Lesson ${lesson.n}: ${lesson.title}${done ? `, ${done.right} of ${done.total} right` : ""}`}>
          {art ? <span className="ck-node-wrap"><span className="ck-node ck-node-icon"><LessonArt lesson={lesson} /></span><span className="ck-node-n" aria-hidden>{lesson.n}</span>{done && <Check className="ck-node-check" size={20} strokeWidth={2.6} aria-hidden />}</span>
            : <span className="ck-node">{done ? <Check size={20} strokeWidth={2.2} aria-hidden /> : lesson.n}</span>}
          <span className="ck-node-title">{lesson.title}</span>
        </button>
      </li>;
    })}</ol>
  </div>;
}
