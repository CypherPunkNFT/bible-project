import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { DraftArtwork } from "@/pages/study/hub/DraftArt";
import { STUDY_BRANCHES } from "@/pages/study/hub/collections";
import { draftBySlug, draftsForArea, type DraftStudy } from "./draft-studies";
import { parseDraft, readingBooks, type DraftDoc, type DraftSection } from "./draft-parse";
import { DraftBlocks } from "./DraftBlocks";
import { inline } from "./draft-inline";
import numbers from "./draft-numbers.json";
import "@/components/study/study-trail.css";
import "./drafts.css";

const TEXTS = import.meta.glob<string>("/content/studies/*/*/content.md", { query: "?raw", import: "default" });
const VALUES = numbers as Record<string, Record<string, string>>;
/** Drafts trying the next layout (larger contents list, text to the right margin) before it becomes the standard
 *  for every draft; owner, 2026-11-05: "just for A New Creation" first. */
const TRIAL_LAYOUT = new Set(["a-new-creation"]);
const pad = (n: number | string) => String(n).padStart(2, "0");
const areaTitle = (areaId: string) => STUDY_BRANCHES.theology.areas.find(area => area.id === areaId)?.title ?? "Scripture & Theology";

/** /study/drafts_mockup/:slug — one written Scripture & Theology draft as a basic study page: the standard study
 *  heading with the draft drawing, a contents list, its numbered readings, its reader questions and its close.
 *  One plain layout for every draft (owner, 2026-11-05); each study's own design comes when its page is built. */
export default function DraftReaderPage() {
  const { slug } = useParams();
  const draft = draftBySlug(slug);
  const [text, setText] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    setText(null); setFailure(null);
    if (!draft) return;
    const load = TEXTS[`/content/studies/${draft.category}/${draft.slug}/content.md`];
    if (!load) { setFailure(`No content.md found for draft ${draft.number} in content/studies/${draft.category}/${draft.slug}/`); return; }
    load().then(setText, (error: unknown) => setFailure(`Could not load draft ${draft.number}: ${String(error)}`));
  }, [draft]);
  const doc = useMemo(() => (draft && text !== null ? parseDraft(text, draft.title, VALUES[draft.slug]) : null), [draft, text]);
  useEffect(() => { if (doc) document.title = `${doc.title} · Draft · Bible Guide`; }, [doc]);
  if (!draft) return <div className="ds-page study-frame"><StudyBackLink fallback={{ path: "/study/theology_mockup", label: "Scripture & Theology" }} /><p className="ds-missing">There is no draft study called “{slug}”.</p></div>;
  if (!doc) return <div className="ds-page study-frame"><Heading draft={draft} /><p className="ds-missing">{failure ?? "Loading the draft…"}</p></div>;
  return <div className={`ds-page study-frame${TRIAL_LAYOUT.has(draft.slug) ? " ds-trial" : ""}`}>
    <Heading draft={draft} doc={doc} />
    <div className="ds-layout">
      <Contents doc={doc} className="ds-contents-side" />
      <article className="ds-article">
        <details className="ds-contents-fold"><summary>In this study</summary><Contents doc={doc} /></details>
        {(doc.intro.length > 0 || doc.selection) && <section className="ds-intro" id="introduction" aria-label="Introduction">
          <DraftBlocks blocks={doc.intro} />
          {doc.selection && <aside className="ds-note ds-note-about"><span>What this study covers</span><p>{inline(doc.selection)}</p></aside>}
        </section>}
        <Sections doc={doc} />
        <Foot draft={draft} />
      </article>
    </div>
  </div>;
}

function Heading({ draft, doc }: { draft: DraftStudy; doc?: DraftDoc }) {
  const subject = areaTitle(draft.areaId);
  const words = doc ? (doc.concepts.length ? doc.concepts : readingBooks(doc)) : [];
  const readings = doc?.sections.filter(section => section.kind === "reading").length ?? 0;
  const questions = doc?.sections.filter(section => section.kind === "question").length ?? 0;
  return <header className="ds-head">
    <div className="ds-head-text">
      <nav className="study-trail" aria-label="Study navigation">
        <StudyBackLink fallback={{ path: `/study/theology_mockup?area=${draft.areaId}`, label: "Scripture & Theology" }} />
        <Link to={`/study/theology_mockup?area=${draft.areaId}`}>{subject}</Link>
        <span aria-hidden="true">/</span><span>Draft {pad(draft.number)}</span>
      </nav>
      <p>{words.length ? words.join(" · ") : subject}</p>
      <h1>{doc?.title ?? draft.title}{doc?.motto && <em>{doc.motto.replace(/\s*\/\s*/g, " ")}</em>}</h1>
      <p className="ds-lead">{doc?.lead ? inline(doc.lead) : draft.purpose}</p>
      {doc && <ul className="ds-facts">
        <li>{readings} readings</li>
        {questions > 0 && <li>{questions} questions</li>}
        <li>Draft · page to come</li>
        {draft.mockupUrl && <li><a href={draft.mockupUrl}>See its design mock-up</a></li>}
      </ul>}
    </div>
    <div className="ds-head-art"><DraftArtwork caption={`${subject} · Draft ${pad(draft.number)}`} /></div>
  </header>;
}

/** The page's parts in order; the reader questions are one entry. */
function parts(doc: DraftDoc) {
  const list: { id: string; number?: string; title: string }[] = [];
  if (doc.intro.length > 0 || doc.selection) list.push({ id: "introduction", title: "Introduction" });
  for (const section of doc.sections) {
    if (section.kind === "question") { if (!list.some(part => part.id === "questions")) list.push({ id: "questions", title: "Questions a careful reader brings" }); continue; }
    list.push({ id: section.id, number: section.number, title: section.title });
  }
  return list;
}

function Contents({ doc, className = "" }: { doc: DraftDoc; className?: string }) {
  return <nav className={`ds-contents ${className}`} aria-label="In this study">
    <p className="ds-contents-title">In this study</p>
    <ol>{parts(doc).map(part => <li key={part.id}><a href={`#${part.id}`}><span>{part.number ?? "·"}</span>{part.title}</a></li>)}</ol>
  </nav>;
}

function Readings({ readings }: { readings?: string[] }) {
  if (!readings?.length) return null;
  return <ul className="ds-readings" aria-label="Readings"><li className="ds-readings-label">Read</li>{readings.map(reading => <li key={reading}>{reading}</li>)}</ul>;
}

function Section({ section }: { section: DraftSection }) {
  return <section className={`ds-section ds-section-${section.kind}`} id={section.id} aria-labelledby={`${section.id}-title`}>
    <header className="ds-section-head">
      {section.number ? <span className="ds-num" aria-hidden="true">{section.number}</span> : <span className="ds-num ds-num-mark" aria-hidden="true">{section.kind === "close" ? "∎" : "·"}</span>}
      <div>
        {(section.tag || section.kind === "close") && <p className="ds-section-eyebrow">{section.tag ?? "To close"}</p>}
        <h2 id={`${section.id}-title`}>{inline(section.title)}</h2>
        {section.ask && <p className="ds-ask">{inline(section.ask)}</p>}
      </div>
    </header>
    {section.hook && <p className="ds-hook">{inline(section.hook)}</p>}
    <Readings readings={section.readings} />
    <div className="ds-body"><DraftBlocks blocks={section.blocks} /></div>
  </section>;
}

function Questions({ doc }: { doc: DraftDoc }) {
  const questions = doc.sections.filter(section => section.kind === "question");
  return <section className="ds-section ds-questions" id="questions" aria-labelledby="questions-title">
    <header className="ds-section-head"><span className="ds-num ds-num-mark" aria-hidden="true">?</span><div><h2 id="questions-title">Questions a careful reader brings</h2>{doc.questionsLead && <p className="ds-ask">{inline(doc.questionsLead)}</p>}</div></header>
    <div className="ds-question-list">{questions.map(question => <details key={question.id} id={question.id} className="ds-question">
      <summary>{inline(question.title)}</summary>
      <Readings readings={question.readings} />
      <div className="ds-body"><DraftBlocks blocks={question.blocks} /></div>
    </details>)}</div>
  </section>;
}

function Sections({ doc }: { doc: DraftDoc }) {
  const firstQuestion = doc.sections.findIndex(section => section.kind === "question");
  return <>{doc.sections.map((section, i) => {
    if (section.kind !== "question") return <Section key={section.id} section={section} />;
    return i === firstQuestion ? <Questions key="questions" doc={doc} /> : null;
  })}</>;
}

function Foot({ draft }: { draft: DraftStudy }) {
  const siblings = draftsForArea(draft.areaId), at = siblings.findIndex(item => item.slug === draft.slug);
  const previous = siblings[at - 1], next = siblings[at + 1];
  return <footer className="ds-foot">
    <p>This study is written. Its page is still to be designed{draft.mockupUrl ? "; a design mock-up has been built" : ""}.</p>
    <nav className="ds-foot-nav" aria-label={`More ${areaTitle(draft.areaId)} drafts`}>
      {previous ? <Link to={`/study/drafts_mockup/${previous.slug}`}><ArrowLeft size={16} aria-hidden="true" /><span><small>Draft {pad(previous.number)}</small>{previous.title}</span></Link> : <span />}
      {next ? <Link className="ds-foot-next" to={`/study/drafts_mockup/${next.slug}`}><span><small>Draft {pad(next.number)}</small>{next.title}</span><ArrowRight size={16} aria-hidden="true" /></Link> : <span />}
    </nav>
  </footer>;
}
