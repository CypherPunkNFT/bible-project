// Directions B, C and D of the children's page (A, the path, is PathView.tsx). B, the cabinet: the big plain-type
// intro with four figures, then one quiet line-drawn tile per lesson, a testament at a time. C, this Sunday: the next
// lesson large at the top for a teacher, the whole course below as a table of contents by part. D, two shelves: Bible
// stories and What we believe, each opening a row of its lessons below, as the themed tests do on the questions page.
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { QuizScene } from "../QuizScenes";
import { nextLesson, passageLabel, toneStyle, type Lesson, type Part } from "./data";
import { Top, type ViewProps } from "./PathView";

const TABS = [
  { id: "OT", title: "Old Testament", parts: ["beginnings", "egypt", "kings", "prophets"] },
  { id: "NT", title: "New Testament", parts: ["jesus", "cross", "church"] },
  { id: "belief", title: "What we believe", parts: ["belief"] },
];

/** One lesson: its number large, its title and how many questions; the part's drawing sits on the part's own tile. */
function Tile({ lesson, done, open, onOpen }: { lesson: Lesson; done: boolean; open: boolean; onOpen: (l: Lesson) => void }) {
  return <li style={toneStyle(lesson.part.tone)}>
    <button type="button" aria-pressed={open} onClick={() => onOpen(lesson)}>
      <span className="ck-tile-n">{lesson.n}{done && <Check size={16} strokeWidth={2.2} aria-label="done" />}</span>
      <strong>{lesson.title}</strong>
      <small>{plural(lesson.questions.length, "question")}</small>
    </button>
  </li>;
}

/** The first tile of a part in the cabinet: its drawing, name and line. */
function PartTile({ part, count }: { part: Part; count: number }) {
  return <li className="ck-part-tile" style={toneStyle(part.tone)}>
    <span className="ck-tile-art"><QuizScene scene={part.scene} /></span>
    <strong>{part.title}</strong>
    <small>{part.line} · {plural(count, "lesson")}</small>
  </li>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function CabinetView({ lessons, groups, progress, openId, onOpen }: ViewProps) {
  const [tab, setTab] = useState(TABS[0].id);
  const shown = groups.filter((g) => TABS.find((t) => t.id === tab)!.parts.includes(g.part.id));
  const stories = lessons.filter((l) => l.part.track === "stories");
  const figures = [
    [stories.length, "lessons, Genesis to Acts"],
    [lessons.reduce((n, l) => n + l.questions.length, 0), "questions with answers"],
    [lessons.length - stories.length, "sets on what we believe"],
    [Object.keys(progress).length, "done so far"],
  ] as const;
  return <div className="ck-wrap">
    <header className="ck-cab-intro">
      <div>
        <p className="ck-eyebrow">Children's tests</p>
        <h1>Little ones, <em>big story</em></h1>
        <p className="ck-lead">The whole Bible in short lessons for a grown-up and a child together: read the passage, then the questions.</p>
      </div>
      <dl>{figures.map(([n, label]) => <div key={label}><dt>{n}</dt><dd>{label}</dd></div>)}</dl>
    </header>
    <div className="ck-tabs" role="tablist">{TABS.map((t) =>
      <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} onClick={() => setTab(t.id)}>{t.title}</button>)}</div>
    <ul className="ck-tiles">{shown.map(({ part, lessons: ls }) => [<PartTile key={part.id} part={part} count={ls.length} />,
      ...ls.map((l) => <Tile key={l.id} lesson={l} done={Boolean(progress[l.id])} open={l.id === openId} onOpen={onOpen} />)])}</ul>
  </div>;
}

export function SundayView({ lessons, groups, progress, onOpen, bookNames }: ViewProps & { bookNames: Record<string, string> }) {
  const next = nextLesson(lessons, progress);
  const after = lessons.slice(lessons.indexOf(next) + 1, lessons.indexOf(next) + 4);
  return <div className="ck-wrap">
    <Top lead="A lesson for this Sunday, ready to teach: the passage to read, then the questions. The whole course is below." />
    <section className="ck-sunday" style={toneStyle(next.part.tone)} aria-labelledby="ck-sunday-title">
      <div className="ck-sunday-art"><QuizScene scene={next.part.scene} /></div>
      <div>
        <p className="ck-eyebrow">This Sunday · {next.part.title} · Lesson {next.n}</p>
        <h2 id="ck-sunday-title">{next.title}</h2>
        <p>{next.passage ? <>Read <b>{passageLabel(next.passage, bookNames)}</b> together, then </> : "Learn together, then "}answer {next.questions.length} questions.</p>
        <button type="button" className="ck-go" onClick={() => onOpen(next)}>Start this lesson<ArrowRight size={18} aria-hidden /></button>
        {after.length > 0 && <p className="ck-after">After that: {after.map((l, i) => <span key={l.id}>{i > 0 && " · "}<button type="button" onClick={() => onOpen(l)}>{l.title}</button></span>)}</p>}
      </div>
    </section>
    <h2 className="ck-course-title">The whole course</h2>
    <div className="ck-course">{groups.map(({ part, lessons: ls }) => <section key={part.id} style={toneStyle(part.tone)}>
      <h3>{part.title}</h3>
      <ol>{ls.map((l) => <li key={l.id}><button type="button" onClick={() => onOpen(l)} data-next={l.id === next.id ? "" : undefined}>
        <span className="ck-course-n">{l.n}</span><span>{l.title}</span>{progress[l.id] ? <Check size={14} strokeWidth={2.2} aria-label="done" /> : <small>{l.questions.length}</small>}
      </button></li>)}</ol>
    </section>)}</div>
  </div>;
}

export function ShelvesView({ groups, progress, openId, onOpen }: ViewProps) {
  const stories = groups.filter((g) => g.part.track === "stories");
  const belief = groups.find((g) => g.part.track === "belief");
  const [partId, setPartId] = useState("");
  const open = stories.find((g) => g.part.id === partId);
  return <div className="ck-wrap">
    <Top />
    <section className="ck-shelf" aria-labelledby="ck-shelf-stories">
      <h2 id="ck-shelf-stories">Bible stories</h2>
      <ul className="ck-shelf-row">{stories.map(({ part, lessons }) =>
        <li key={part.id} style={toneStyle(part.tone)}><button type="button" aria-expanded={part.id === partId} onClick={() => setPartId(part.id === partId ? "" : part.id)}>
          <span className="ck-tile-art"><QuizScene scene={part.scene} /></span>
          <strong>{part.title}</strong><small>{part.line}</small>
          <span className="ck-shelf-meta">{lessons.filter((l) => progress[l.id]).length} of {lessons.length} lessons done</span>
        </button></li>)}</ul>
      {open && <ul className="ck-tiles ck-tiles-small" style={toneStyle(open.part.tone)}>{open.lessons.map((l) =>
        <Tile key={l.id} lesson={l} done={Boolean(progress[l.id])} open={l.id === openId} onOpen={onOpen} />)}</ul>}
    </section>
    {belief && <section className="ck-shelf" aria-labelledby="ck-shelf-belief">
      <h2 id="ck-shelf-belief">What we believe</h2>
      <p className="ck-shelf-lead">{belief.part.line}.</p>
      <ul className="ck-tiles ck-tiles-small">{belief.lessons.map((l) =>
        <Tile key={l.id} lesson={l} done={Boolean(progress[l.id])} open={l.id === openId} onOpen={onOpen} />)}</ul>
    </section>}
  </div>;
}
