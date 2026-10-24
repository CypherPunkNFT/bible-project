// Direction A, the path: the parts of the Bible as a row of drawings, and the chosen part's lessons on one winding line,
// lesson by lesson. A finished lesson is filled in its part's colour; the next one to do carries the page's one glow.
// Also the plain top shared by directions A, C and D.
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QuizScene } from "../QuizScenes";
import { nextLesson, toneStyle, type Lesson, type PartLessons } from "./data";
import type { Progress } from "./progress";

export interface ViewProps { lessons: Lesson[]; groups: PartLessons[]; progress: Progress; openId: string | null; onOpen: (lesson: Lesson) => void }


export function Top({ lead }: { lead?: string }) {
  return <header className="ck-top">
    <Link className="ck-back" to="/study/questions"><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
    <p className="ck-eyebrow">Children's tests</p>
    <h1>Bible lessons <em>for children</em></h1>
    <p className="ck-lead">{lead ?? "Eighty-eight lessons through the whole Bible, from the garden to Paul in Rome, and the first questions of what we believe. Read the passage together, then ask the questions one at a time."}</p>
  </header>;
}

const NARROW = "(max-width: 760px)";

/** Six lessons to a row, three on a phone, where each row is taller for the narrower width (the path's units are
 * a thousandth of its width). */
function usePerRow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const change = () => setNarrow(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return narrow ? { perRow: 3, row: 440, inset: 150 } : { perRow: 6, row: 170, inset: 80 };
}

export function PathView({ lessons, groups, progress, openId, onOpen }: ViewProps) {
  const next = nextLesson(lessons, progress);
  const [partId, setPartId] = useState(next.part.id);
  const group = groups.find((g) => g.part.id === partId) ?? groups[0];
  return <div className="ck-wrap">
    <Top />
    <ul className="ck-parts" aria-label="Parts of the Bible">{groups.map(({ part, lessons: ls }) => {
      const done = ls.filter((l) => progress[l.id]).length;
      return <li key={part.id} style={toneStyle(part.tone)}>
        <button type="button" aria-pressed={part.id === group.part.id} onClick={() => setPartId(part.id)}>
          <span className="ck-part-art"><QuizScene scene={part.scene} /></span>
          <strong>{part.title}</strong>
          <small>{done ? `${done} of ${ls.length} done` : `${ls.length} lessons`}</small>
        </button>
      </li>;
    })}</ul>
    <section className="ck-path-part" style={toneStyle(group.part.tone)} aria-labelledby="ck-path-title">
      <h2 id="ck-path-title">{group.part.title}</h2>
      <p>{group.part.line}</p>
      <Path lessons={group.lessons} progress={progress} next={next} openId={openId} onOpen={onOpen} />
    </section>
  </div>;
}

/** The lessons snaking left to right, then right to left, joined by one curving line. */
function Path({ lessons, progress, next, openId, onOpen }: { lessons: Lesson[]; progress: Progress; next: Lesson; openId: string | null; onOpen: (lesson: Lesson) => void }) {
  const { perRow, row: rowHeight, inset } = usePerRow();
  const rows = Math.ceil(lessons.length / perRow);
  const height = rows * rowHeight;
  const points = lessons.map((_, i) => {
    const row = Math.floor(i / perRow), col = i % perRow;
    const x = inset + (row % 2 ? perRow - 1 - col : col) * ((1000 - 2 * inset) / (perRow - 1));
    return { x, y: rowHeight / 2 + row * rowHeight + (col % 2 ? 22 : -22) };
  });
  const d = points.map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`;
    const a = points[i - 1];
    const turn = Math.floor(i / perRow) !== Math.floor((i - 1) / perRow);
    const out = a.x > 500 ? 70 : -70;
    return turn ? `C${a.x + out} ${a.y} ${p.x + out} ${p.y} ${p.x} ${p.y}` : `C${(a.x + p.x) / 2} ${a.y} ${(a.x + p.x) / 2} ${p.y} ${p.x} ${p.y}`;
  }).join(" ");
  return <div className="ck-path" style={{ aspectRatio: `1000 / ${height}` }}>
    <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
    <ol>{lessons.map((lesson, i) => {
      const done = progress[lesson.id];
      return <li key={lesson.id} style={{ left: `${points[i].x / 10}%`, top: `${(points[i].y / height) * 100}%` }}>
        <button type="button" data-done={done ? "" : undefined} data-next={lesson.id === next.id ? "" : undefined} aria-pressed={lesson.id === openId}
          onClick={() => onOpen(lesson)} aria-label={`Lesson ${lesson.n}: ${lesson.title}${done ? `, ${done.right} of ${done.total} right` : ""}`}>
          <span className="ck-node">{done ? <Check size={20} strokeWidth={2.2} aria-hidden /> : lesson.n}</span>
          <span className="ck-node-title">{lesson.title}</span>
        </button>
      </li>;
    })}</ol>
  </div>;
}
