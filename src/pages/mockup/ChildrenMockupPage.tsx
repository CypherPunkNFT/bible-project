// MOCK-UP: the children's tests page in four directions, at /children_mockup on this computer's preview only (owner,
// 2026-10-23: a parent or teacher at the screen with the child). E the mix the owner chose on 2026-10-24 (A's parts,
// C's big lesson, A's path), then A the path, B the cabinet, C this Sunday, D two shelves; a pill at the bottom swaps
// them, kept in the address (?v=b). Every direction opens the same lesson panel.
// The lessons come from the bank as it is: Hurlbut's 88 lessons and A Catechism for Young Children. Parts: children/.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { buildLessons, byPart, type Lesson } from "./children/data";
import { LessonPanel } from "./children/LessonPanel";
import { ParentGuide } from "./children/ParentGuide";
import { MixedView } from "./children/MixedView";
import { PathView } from "./children/PathView";
import { useProgress } from "./children/progress";
import { CabinetView, ShelvesView, SundayView } from "./children/Views";
import { ZoomTicker } from "./children/ZoomTicker";
import "./home-quiz.css";
import "./test-options.css";
import "./children/children.css";

const VERSIONS = [
  { id: "e", name: "The mix" },
  { id: "a", name: "The path" },
  { id: "b", name: "The cabinet" },
  { id: "c", name: "This Sunday" },
  { id: "d", name: "Two shelves" },
];

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
  const [params, setParams] = useSearchParams();
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "e";
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
    {version === "e" && <MixedView {...props} bookNames={bookNames} onGuide={showGuide} onFinish={(lesson, right, total) => save(lesson.id, right, total)} />}
    {version === "a" && <PathView {...props} />}
    {version === "b" && <CabinetView {...props} />}
    {version === "c" && <SundayView {...props} bookNames={bookNames} />}
    {version === "d" && <ShelvesView {...props} />}
    <ParentGuide lessons={lessons} groups={groups} progress={progress} bookNames={bookNames} onOpen={setOpen}
      expanded={guideOpen} onExpand={setGuideOpen} chosenId={guideId} onChoose={setGuideId} />
    {open && <LessonPanel lesson={open} bookNames={bookNames} next={next} onClose={close} onOpen={setOpen}
      onFinish={(right, total) => save(open.id, right, total)} />}
    {version === "e" && <ZoomTicker />}
    <nav className="to-pill" aria-label="Mock-up: five versions of the children's page">
      <span className="to-pill-label">Mock-up</span>
      {VERSIONS.map((v) => <button key={v.id} type="button" aria-pressed={v.id === version} onClick={() => setParams({ v: v.id }, { replace: true, preventScrollReset: true })}>
        <b>{v.id.toUpperCase()}</b><span>{v.name}</span>
      </button>)}
    </nav>
  </div>;
}
