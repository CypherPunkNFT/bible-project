// One line drawing per children's lesson, shown inside its circle on the path and beside its title on the quiz (owner,
// 2026-10-25: "inside of them we put real line drawings, not icons"; they replace the icons of 2026-10-24). Bible
// lessons by their number in Hurlbut's course; the "What we believe" sets by their set number. Styles: children.css.
import { BELIEF } from "./art-belief";
import { NEW } from "./art-new";
import { OLD } from "./art-old";
import type { Lesson } from "./data";

export function LessonArt({ lesson, className }: { lesson: Lesson; className?: string }) {
  const art = lesson.part.track === "belief" ? BELIEF[lesson.n] : OLD[lesson.n] ?? NEW[lesson.n];
  return <svg className={className ? `ck-art ${className}` : "ck-art"} viewBox="14 14 172 172" aria-hidden="true">{art}</svg>;
}
