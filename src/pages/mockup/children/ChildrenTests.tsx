// The children's tests page (owner, 2026-10-23: a parent or teacher at the screen with the child): the parts of the
// Bible, the chosen lesson's big card and its part's lessons on a winding road (MixedView.tsx), then the whole course
// with every answer for the parents (ParentGuide.tsx). The lessons come from the bank as it is: Hurlbut's 88 lessons
// and A Catechism for Young Children. The real page at /study/questions/children since 2026-10-26 (owner: "make it a
// real page now"); with `mockup`, the copy at /children_mockup adds the zoom's ticker and, at ?course=versions, the four
// tops for the parents' course, one to a row, in place of the page.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { buildLessons, byPart, nextLesson, type Lesson } from "./data";
import { CourseHeadsPage } from "./CourseHeads";
import { ParentGuide } from "./ParentGuide";
import { MixedView } from "./MixedView";
import { useProgress } from "./progress";
import { ZoomTicker } from "./ZoomTicker";
import "../home-quiz.css";
import "../test-options.css";
import "./children.css";

export function ChildrenTests({ mockup }: { mockup?: boolean }) {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  if (failed) return <p className="ck-status" role="alert">The lessons could not be loaded: {failed}</p>;
  if (!bank) return <p className="ck-status">Loading the lessons…</p>;
  return <ChildrenBody bank={bank} mockup={mockup} />;
}

function ChildrenBody({ bank, mockup }: { bank: QuestionBank; mockup?: boolean }) {
  const lessons = useMemo(() => buildLessons(bank), [bank]);
  const groups = useMemo(() => byPart(lessons), [lessons]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const { progress, save } = useProgress();
  const [search] = useSearchParams();
  const versions = mockup && search.get("course") === "versions";
  // The course for parents below: collapsed until opened; "See all the questions" opens it at that lesson.
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideId, setGuideId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    if (reveal) document.getElementById("pg-course")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reveal]);
  const showGuide = (lesson: Lesson) => { setGuideId(lesson.id); setGuideOpen(true); setReveal((n) => n + 1); };
  // The lesson in the card above, so the course's top shows its part chosen and opens at it. Start with your child in
  // the course puts its lesson in that card and goes up to it; there is no panel beside the page (owner, 2026-10-25:
  // "It should just go to the top of that lesson. No more side pages").
  const [currentId, setCurrentId] = useState(() => nextLesson(lessons, progress).id);
  const current = lessons.find((l) => l.id === currentId) ?? lessons[0];
  const [lift, setLift] = useState(0);
  useEffect(() => {
    if (lift) document.getElementById("ck-lesson-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lift]);
  const start = (lesson: Lesson) => { setCurrentId(lesson.id); setLift((n) => n + 1); };
  return <div className="ck">
    {versions ? <CourseHeadsPage lessons={lessons} groups={groups} progress={progress} bookNames={bookNames} /> : <>
      <MixedView lessons={lessons} groups={groups} progress={progress} bookNames={bookNames} chosen={current} onChoose={setCurrentId}
        onGuide={showGuide} onFinish={(lesson, right, total) => save(lesson.id, right, total)} />
      <ParentGuide lessons={lessons} groups={groups} progress={progress} bookNames={bookNames} onStart={start}
        expanded={guideOpen} onExpand={setGuideOpen} chosenId={guideId} onChoose={setGuideId} current={current} />
    </>}
    {mockup && !versions && <ZoomTicker />}
  </div>;
}
