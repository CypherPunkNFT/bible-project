// MOCK-UP (/children_mockup?course=versions, local preview only): the top of "The whole course, answers included"
// four ways, one to a row (owner, 2026-10-25: "needs to be nicer… do a four row mock-up page of this section"). Each
// row is the real section (ParentGuide.tsx) with another top; its button opens the real course under it. Version 3,
// the owner's pick, is the page's own top (CourseHead in ParentGuide.tsx). Styles:
// course-heads.css.
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useState, type ComponentType } from "react";
import { rightChoice } from "@/lib/data";
import { toneStyle, type Lesson, type PartLessons } from "./data";
import { CourseHead, ParentGuide, type CourseHeadProps } from "./ParentGuide";
import type { Progress } from "./progress";
import "./course-heads.css";

const LEAD = "Look over a lesson before you sit down together: the passage to read first, every question, the right answer and the other choices your child will see.";

const questionsIn = (lessons: Lesson[]) => lessons.reduce((n, l) => n + l.questions.length, 0);

/** The round-arrow button's words version: opens and closes the course. */
function OpenButton({ expanded, onExpand, courseId, solid }: Pick<CourseHeadProps, "expanded" | "onExpand" | "courseId"> & { solid?: boolean }) {
  return <button type="button" className={solid ? "ch-open ch-open-solid" : "ch-open"} aria-expanded={expanded} aria-controls={courseId} onClick={() => onExpand(!expanded)}>
    {expanded ? "Close the course" : "Open the whole course"}<ChevronDown size={18} strokeWidth={1.8} aria-hidden />
  </button>;
}

/** 1. Centred, under a gold mark on the line: three figures side by side, the button in words. */
function Centred({ lessons, groups, total, expanded, onExpand, titleId, courseId }: CourseHeadProps) {
  return <header className="ch ch-centred">
    <span className="ch-mark" aria-hidden><svg viewBox="0 0 24 24"><path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" /></svg></span>
    <p className="ck-eyebrow">For parents and teachers</p>
    <h2 id={titleId}>The whole course, <em>answers included</em></h2>
    <p className="ck-lead">{LEAD}</p>
    <dl className="ch-figures">
      <div><dt>Lessons</dt><dd>{lessons.length}</dd></div>
      <div><dt>Questions</dt><dd>{total.toLocaleString()}</dd></div>
      <div><dt>Parts of the Bible</dt><dd>{groups.length}</dd></div>
    </dl>
    <OpenButton expanded={expanded} onExpand={onExpand} courseId={courseId} />
  </header>;
}

/** 2. Two columns: the words and the button on the left, the eight parts as a ruled list on the right. */
function Contents({ lessons, groups, total, expanded, onExpand, onPick, titleId, courseId }: CourseHeadProps) {
  return <header className="ch ch-contents">
    <div className="ch-words">
      <p className="ck-eyebrow">For parents and teachers</p>
      <h2 id={titleId}>The whole course, <em>answers included</em></h2>
      <p className="ck-lead">{LEAD}</p>
      <OpenButton expanded={expanded} onExpand={onExpand} courseId={courseId} solid />
    </div>
    <div className="ch-list">
      <ol>{groups.map(({ part, lessons: ls }) => <li key={part.id} style={toneStyle(part.tone)}>
        <button type="button" onClick={() => onPick(ls[0])}><i aria-hidden />{part.title}
          <small>{ls.length} lessons · {questionsIn(ls)} questions</small><ArrowRight size={15} aria-hidden /></button>
      </li>)}</ol>
      <p className="ch-total"><b>{lessons.length}</b> lessons<span aria-hidden>·</span><b>{total.toLocaleString()}</b> questions</p>
    </div>
  </header>;
}

/** 4. A page from the course: the words on the left, the first lesson's sheet on the right as a preview. */
function Preview({ lessons, total, expanded, onExpand, onPick, titleId, courseId }: CourseHeadProps) {
  const first = lessons[0];
  return <header className="ch ch-preview">
    <div className="ch-words">
      <p className="ck-eyebrow">For parents and teachers</p>
      <h2 id={titleId}>The whole course, <em>answers included</em></h2>
      <p className="ck-lead">{LEAD}</p>
      <p className="ch-total"><b>{lessons.length}</b> lessons<span aria-hidden>·</span><b>{total.toLocaleString()}</b> questions</p>
      <OpenButton expanded={expanded} onExpand={onExpand} courseId={courseId} solid />
    </div>
    <button type="button" className="ch-sheet" style={toneStyle(first.part.tone)} onClick={() => onPick(first)} aria-label={`Open the course at lesson ${first.n}, ${first.title}`}>
      <span className="ch-sheet-back" aria-hidden />
      <span className="ch-sheet-page">
        <span className="ck-eyebrow">{first.part.title} · Lesson {first.n}</span>
        <strong>{first.title}</strong>
        {first.questions.slice(0, 3).map((q, i) => <span key={i} className="ch-sheet-q">
          <span className="ch-sheet-n">{i + 1}</span>
          <span><em>{q.question}</em><span className="ch-sheet-a"><Check size={14} strokeWidth={2.4} aria-hidden />{rightChoice(q)}</span></span>
        </span>)}
      </span>
    </button>
  </header>;
}

const VERSIONS: { name: string; note: string; Head: ComponentType<CourseHeadProps> }[] = [
  { name: "Centred, under a mark", note: "Plenty of room under the line, which carries a small gold star. The figures sit side by side, and the round arrow becomes a button that says what it does.", Head: Centred },
  { name: "Contents beside it", note: "The words and the button on the left; on the right, the eight parts as a ruled list in their colours, each opening the course at its first lesson.", Head: Contents },
  { name: "The course at a glance (your pick, now on the page)", note: "\"answers included\" on its own line; the figures above the button, the two sides centred on each other; then the eight parts as columns, each with its drawing. Choosing one opens the course there.", Head: CourseHead },
  { name: "A page from the course", note: "The words on the left; on the right, the first lesson's sheet as it looks inside, questions and answers, so a parent sees what they are opening.", Head: Preview },
];

interface PageProps { lessons: Lesson[]; groups: PartLessons[]; progress: Progress; bookNames: Record<string, string>; onOpen: (lesson: Lesson) => void }

/** One row: the real section with this version's top, opening and closing on its own. */
function Row({ Head, ...props }: PageProps & { Head: ComponentType<CourseHeadProps> }) {
  const [expanded, setExpanded] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);
  return <ParentGuide {...props} Head={Head} expanded={expanded} onExpand={setExpanded} chosenId={chosenId} onChoose={setChosenId} />;
}

export function CourseHeadsPage(props: PageProps) {
  return <div className="chm">
    <header className="ck-wrap chm-head">
      <p className="ck-eyebrow">The children's page · its last section</p>
      <h1>Four ways to show <em>the whole course</em></h1>
      <nav aria-label="The versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#course-version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Head }, i) => <div key={name} id={`course-version-${i + 1}`} className="chm-row">
      <div className="ck-wrap chm-label"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <Row {...props} Head={Head} />
    </div>)}
  </div>;
}
