// MOCK-UP: the children's tests page, at /children_mockup on this computer's preview only (owner, 2026-10-23: a parent
// or teacher at the screen with the child). It is direction E, the mix (the path's parts, This Sunday's big lesson and
// the path itself), the one the owner kept on 2026-10-25 ("take away the mockup options"); the other four directions and
// the pill that swapped them are gone (the cabinet, This Sunday and two shelves: ARCHIVE/mockups/children-Views-2026-10-25.tsx).
// The lessons come from the bank as it is: Hurlbut's 88 lessons and A Catechism for Young Children. Parts: children/.
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { buildLessons, byPart, type Lesson } from "./children/data";
import { LessonPanel } from "./children/LessonPanel";
import { ParentGuide } from "./children/ParentGuide";
import { MixedView } from "./children/MixedView";
import { useProgress } from "./children/progress";
import { ZoomTicker } from "./children/ZoomTicker";
import "./home-quiz.css";
import "./test-options.css";
import "./children/children.css";

export default function ChildrenMockupPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  if (failed) return <p className="ck-status" role="alert">The lessons could not be loaded: {failed}</p>;
  if (!bank) return <p className="ck-status">Loading the lessons…</p>;
  return <ChildrenBody bank={bank} />;
}

function ChildrenBody({ bank }: { bank: QuestionBank }) {
  const lessons = useMemo(() => buildLessons(bank), [bank]);
  const groups = useMemo(() => byPart(lessons), [lessons]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const { progress, save } = useProgress();
  const [open, setOpen] = useState<Lesson | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const props = { lessons, groups, progress, openId: open?.id ?? null, onOpen: setOpen };
  // The course for parents below: collapsed until opened; "See all the questions" opens it at that lesson.
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideId, setGuideId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    if (reveal) document.getElementById("pg-course")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reveal]);
  const showGuide = (lesson: Lesson) => { setGuideId(lesson.id); setGuideOpen(true); setReveal((n) => n + 1); };
  const next = open ? lessons[lessons.indexOf(open) + 1] ?? null : null;
  return <div className="ck" data-open={open ? "" : undefined}>
    <MixedView {...props} bookNames={bookNames} onGuide={showGuide} onFinish={(lesson, right, total) => save(lesson.id, right, total)} />
    <ParentGuide lessons={lessons} groups={groups} progress={progress} bookNames={bookNames} onOpen={setOpen}
      expanded={guideOpen} onExpand={setGuideOpen} chosenId={guideId} onChoose={setGuideId} />
    {open && <LessonPanel lesson={open} bookNames={bookNames} next={next} onClose={close} onOpen={setOpen}
      onFinish={(right, total) => save(open.id, right, total)} />}
    <ZoomTicker />
  </div>;
}
