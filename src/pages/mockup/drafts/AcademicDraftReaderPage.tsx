import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { DraftArtwork } from "@/pages/study/hub/DraftArt";
import { STUDY_BRANCHES } from "@/pages/study/hub/collections";
import { academicDraftBySlug, academicDraftsForArea, humanise, type AcademicDraft } from "./academic-drafts";
import { ResearchFields, ResearchValue } from "./ResearchBlocks";
import { inline } from "./draft-inline";
import { CheckNotesProvider, Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import "@/components/study/study-trail.css";
import "./drafts.css";
import "./academic-drafts.css";

type Research = Record<string, unknown>;
const FILES = import.meta.glob<Research>("/content/academic-research/[0-9][0-9]-*.json", { import: "default" });
/** Shown in the heading, or record-keeping a reader has no use for. */
const HEADING_KEYS = new Set(["schemaVersion", "order", "title", "slug", "category", "categoryTitle", "updated", "status", "draftNote", "premise", "question", "verses", "checkNotes"]);
const SECTION_TITLES: Record<string, string> = {
  outcomes: "What this study sets out to show", boundaries: "What it covers, and what it leaves to others",
  links: "Studies it links rather than repeats", figures: "In figures", explanations: "Explanations weighed",
  explanationsNote: "On the explanations", claims: "Popular claims tested", confusedWords: "Words often confused",
  reach: "How far the study reaches", timeline: "Timeline", readingTrail: "Further reading", sources: "Sources",
  pictures: "Pictures: candidates, not downloaded", closing: "To close",
};
const pad = (n: number) => String(n).padStart(2, "0");
const areaTitle = (areaId: string) => STUDY_BRANCHES.academic.areas.find(area => area.id === areaId)?.title ?? "Academic";
const isRecord = (value: unknown): value is Research => typeof value === "object" && value !== null && !Array.isArray(value);
const sectionTitle = (key: string, value: unknown) => SECTION_TITLES[key] ?? (isRecord(value) && typeof value.head === "string" ? value.head : humanise(key));
const sectionsOf = (research: Research) => Object.keys(research).filter(key => !HEADING_KEYS.has(key));

/** Loads one research file; `cancelled` keeps a slow answer for an earlier draft from replacing the current one. */
function useResearch(draft: AcademicDraft | undefined) {
  const [research, setResearch] = useState<Research | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResearch(null); setFailure(null);
    if (!draft) return;
    const load = FILES[`/content/academic-research/${draft.file}`];
    if (!load) { setFailure(`No research file ${draft.file} in content/academic-research/ for "${draft.title}".`); return; }
    load().then(value => {
      if (cancelled) return;
      if (isRecord(value)) setResearch(value);
      else setFailure(`${draft.file} did not contain a research record (expected a JSON object, got ${Array.isArray(value) ? "a list" : typeof value}).`);
    }, (error: unknown) => { if (!cancelled) setFailure(`Could not load ${draft.file}: ${String(error)}`); });
    return () => { cancelled = true; };
  }, [draft]);
  return { research, failure };
}

/** /study/academic_drafts_mockup/:slug — one written Academic research draft as a plain reader: the standard study
 *  heading with the draft drawing, a contents list, and every section of its research file in the file's own order.
 *  One plain layout for every draft; each study's own design comes when its page is built. */
export default function AcademicDraftReaderPage() {
  const { slug } = useParams();
  const draft = academicDraftBySlug(slug);
  const { research, failure } = useResearch(draft);
  useEffect(() => { if (draft) document.title = `${draft.title} · Research draft · Bible Guide`; }, [draft]);
  if (!draft) return <div className="ds-page study-frame"><StudyBackLink fallback={{ path: "/study/academic_mockup", label: "Academic" }} /><p className="ds-missing">There is no Academic draft called “{slug}”.</p></div>;
  if (!research) return <div className="ds-page study-frame"><Heading draft={draft} /><p className="ds-missing">{failure ?? "Loading the research…"}</p></div>;
  const keys = sectionsOf(research);
  return <CheckNotesProvider notes={research.checkNotes}><div className="ds-page study-frame ar-page">
    <Heading draft={draft} research={research} />
    <div className="ds-layout">
      <nav className="ds-contents ds-contents-side" aria-label="In this study">
        <p className="ds-contents-title">In this study</p>
        <ol>{keys.map((key, i) => <li key={key}><a href={`#${key}`}><span>{pad(i + 1)}</span>{inline(plainText(sectionTitle(key, research[key])))}</a></li>)}</ol>
      </nav>
      <article className="ds-article">
        {typeof research.draftNote === "string" && <aside className="ds-note ds-note-about"><span>Draft note</span><p><Checked text={research.draftNote} render={inline} /></p></aside>}
        {keys.map((key, i) => <section key={key} className="ds-section ar-section" id={key} aria-labelledby={`${key}-title`}>
          <header className="ds-section-head"><span className="ds-num" aria-hidden="true">{pad(i + 1)}</span><div><h2 id={`${key}-title`}><Checked text={sectionTitle(key, research[key])} render={inline} /></h2></div></header>
          <div className="ds-body">{isRecord(research[key]) ? <ResearchFields record={research[key] as Research} skip={["head"]} /> : <ResearchValue value={research[key]} field={key} />}</div>
        </section>)}
        <Verses research={research} />
        <Foot draft={draft} />
      </article>
    </div>
  </div></CheckNotesProvider>;
}

function Heading({ draft, research }: { draft: AcademicDraft; research?: Research }) {
  const subject = areaTitle(draft.areaId);
  const text = (key: string) => (research && typeof research[key] === "string" ? research[key] as string : undefined);
  return <header className="ds-head">
    <div className="ds-head-text">
      <nav className="study-trail" aria-label="Study navigation">
        <StudyBackLink fallback={{ path: `/study/academic_mockup?area=${draft.areaId}`, label: "Academic" }} />
        <Link to={`/study/academic_mockup?area=${draft.areaId}`}>{subject}</Link>
        <span aria-hidden="true">/</span><span>Research draft {pad(draft.order)}</span>
      </nav>
      <p>{text("categoryTitle") ?? subject}</p>
      <h1>{draft.title}</h1>
      <p className="ds-lead"><Checked text={text("premise") ?? draft.premise ?? ""} render={inline} /></p>
      {text("question") && <p className="ar-question"><span>The question</span><Checked text={text("question")!} render={inline} /></p>}
      <ul className="ds-facts">
        {research && <li>{sectionsOf(research).length} sections</li>}
        {text("updated") && <li>Updated {text("updated")}</li>}
        <li>Draft · page to come</li>
      </ul>
    </div>
    <div className="ds-head-art"><DraftArtwork caption={`${subject} · Research draft`} /></div>
  </header>;
}

/** The Bible verses the file quotes, as one line of references. */
function Verses({ research }: { research: Research }) {
  const verses = Array.isArray(research.verses) ? research.verses.filter(isRecord).map(verse => verse.label).filter((label): label is string => typeof label === "string") : [];
  if (verses.length === 0) return null;
  return <section className="ds-section ar-section" id="verses" aria-labelledby="verses-title">
    <header className="ds-section-head"><span className="ds-num ds-num-mark" aria-hidden="true">·</span><div><h2 id="verses-title">Verses quoted ({verses.length})</h2></div></header>
    <p className="ar-inline-list">{verses.map((label, i) => <span key={i}>{label}</span>)}</p>
  </section>;
}

function Foot({ draft }: { draft: AcademicDraft }) {
  const siblings = academicDraftsForArea(draft.areaId), at = siblings.findIndex(item => item.slug === draft.slug);
  const previous = siblings[at - 1], next = siblings[at + 1];
  return <footer className="ds-foot">
    <p>This study's research is written, with a design note for its page. The page itself is still to be built.</p>
    <nav className="ds-foot-nav" aria-label={`More ${areaTitle(draft.areaId)} drafts`}>
      {previous ? <Link to={`/study/academic_drafts_mockup/${previous.slug}`}><span><small>Research draft {pad(previous.order)}</small>{previous.title}</span></Link> : <span />}
      {next ? <Link className="ds-foot-next" to={`/study/academic_drafts_mockup/${next.slug}`}><span><small>Research draft {pad(next.order)}</small>{next.title}</span></Link> : <span />}
    </nav>
  </footer>;
}
