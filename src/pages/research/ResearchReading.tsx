import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PassageText, RefLink } from "@/components/study/StudyParts";
import NotFoundPage from "@/pages/NotFoundPage";
import { researchUrl, type ResearchBundle } from "./model";
import { BlockCitations, CitationInspector, ReadingContents, RelatedLinks, ResearchHero, WitnessComparison } from "./ResearchParts";

export function ResearchCasePage({ data }: { data: ResearchBundle }) {
  const { id } = useParams();
  const page = data.cases.find(p => p.id === id);
  if (!page) return <NotFoundPage />;
  const source = data.sources.find(s => s.id === page.evidenceId)!;
  return <div className={"rs-reading rs-" + page.kind}>
    <ResearchHero eyebrow={page.eyebrow} title={page.title} lead={page.lead} kind={page.kind} meta={`${page.minutes} minute reading · Source-led case`} />
    <div className="rs-answer"><p className="rs-eyebrow">{page.question}</p><p>{page.answer}</p><Link to={researchUrl("evidence/" + page.evidenceId)}>Examine the evidence record <ArrowRight size={17} aria-hidden /></Link></div>
    <div className="rs-reading-grid"><ReadingContents sections={page.sections} /><article>
      {page.kind === "historical" ? <div className="rs-featured-quote"><p className="rs-eyebrow">The inscription’s own image</p><blockquote>“{source.citation.quote}”</blockquote><p>{source.title} · iii 27b–30</p><CitationInspector source={source} /></div> : <WitnessComparison />}
      {page.sections.map(section => <section className="rs-reading-section" id={section.id} key={section.id}><h2>{section.title}</h2><p>{section.text}</p><BlockCitations citations={section.citations} data={data} /></section>)}
      <section className="rs-conclusion"><p className="rs-eyebrow">A proportionate conclusion</p><p>{page.conclusion}</p><ul>{page.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></section>
      <RelatedLinks links={page.related} />
    </article></div>
  </div>;
}

export function ResearchLessonPage({ data }: { data: ResearchBundle }) {
  const { id } = useParams();
  const lesson = data.lessons.find(p => p.id === id);
  const [reflection, setReflection] = useState("");
  if (!lesson) return <NotFoundPage />;
  return <div className="rs-reading rs-study"><ResearchHero eyebrow={lesson.eyebrow} title={lesson.title} lead={lesson.lead} kind="study" meta={`${lesson.minutes} minute study · ${lesson.passage.reference}`} />
    <div className="rs-reading-grid"><ReadingContents sections={lesson.sections} /><article>
      <section className="rs-passage"><div><p className="rs-eyebrow">Begin with Scripture</p><h2>{lesson.passage.reference}</h2><span>King James Version</span></div><PassageText span={lesson.passage.span} /><RefLink span={lesson.passage.span} label="Read the full chapter" /></section>
      <p className="rs-aim"><strong>Our aim</strong>{lesson.aim}</p>
      {lesson.sections.map(section => <section className="rs-reading-section" id={section.id} key={section.id}><p className="rs-eyebrow">{section.id === "context" ? "Historical context" : section.id === "apply" ? "Application" : "Scripture & interpretation"}</p><h2>{section.title}</h2><p>{section.text}</p><BlockCitations citations={section.citations} data={data} /></section>)}
      <section className="rs-reflection"><p className="rs-eyebrow">Pause & respond</p><h2>Make room for reflection.</h2><ol>{lesson.questions.map(q => <li key={q}>{q}</li>)}</ol><label htmlFor="research-reflection">Your reflection for this visit</label><textarea id="research-reflection" value={reflection} onChange={e => setReflection(e.target.value)} rows={4} placeholder="What stands out in the passage?" /><p className="rs-credit">This space is not saved. Copy anything you want to keep before leaving.</p></section>
      <section className="rs-conclusion"><p className="rs-eyebrow">Carry this with you</p><p>{lesson.conclusion}</p></section>
      <RelatedLinks links={lesson.related} />
    </article></div>
  </div>;
}
