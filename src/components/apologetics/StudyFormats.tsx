import { ArrowLeft, ArrowRight, ArrowUpRight, SearchCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApCitations } from "@/components/ApologeticsParts";
import { Cited, Glossary, Questions, Refs, Timeline } from "@/components/apologetics/StudyFormatParts";
import { sourceById } from "@/data/apologetics-library";
import { cited, essayPartUrl, pad } from "@/lib/apologetics-formats";
import type { ApStudy } from "@/data/apologetics-types";
import { formatNumber } from "@/lib/site-format";
import "@/pages/apologetics-formats.css";

/** The reading page of each declared article format (plan APOLOGETICS-FIELDS step 6; the mock-ups in
 * design/apologetics-fields/formats/). StudyPage keeps its frame (heading, companion, reflection, related studies) and
 * draws this body in place of today's article. Lines and spacing rather than boxes, no glow (design/README.md). */

const BODY: Record<string, (study: ApStudy, part: number) => ReactNode> = {
  essay: (study, part) => <Essay study={study} part={part} />, objections: (study) => <ObjectionList study={study} />,
  "debate-guide": (study) => <Views study={study} />, timeline: (study) => <Timeline study={study} />, figure: (study) => <Figure study={study} />,
  reading: (study) => <Reading study={study} />, glossary: (study) => <Glossary study={study} />, faq: (study) => <Questions study={study} />,
  "case-study": (study) => <CaseStudy study={study} />,
};

/** The lede, the format's body, then every shared block the article carries, so no published text is left off the page.
 * An essay shows the lede on its first part and its closing blocks on its last; a figure and a case study draw their
 * `sections` as their own body. */
export function FormatArticle({ study, part }: { study: ApStudy; part: number }) {
  const essay = study.format === "essay", first = !essay || part === 1, last = !essay || part === (study.parts?.length ?? 1);
  const ownSections = study.format === "figure" || study.format === "case-study";
  return <div className={"fx-main fx-is-" + study.format}>
    {first && <section id="answer" className="fx-sec fx-lede"><Cited block={cited(study.answer, study.support.answer)} /></section>}
    {BODY[study.format ?? ""]?.(study, part)}
    {!ownSections && study.sections.map((section, i) => <section key={i} className="fx-sec" id={"s-" + i}><h2>{section.title}</h2><Cited block={cited(section.body, study.support.sections[i] ?? [])} /></section>)}
    {last && <Closing study={study} />}
  </div>;
}

/** The shared closing blocks: conclusion, where the evidence stops (limit; a case study draws its own), and the prompt,
 * which closes a Scripture & Theology essay as "read the passage again". */
function Closing({ study }: { study: ApStudy }) {
  const reread = study.format === "essay" && study.spine === "scripture-theology";
  return <>
    {study.conclusion && <section className="fx-sec" id="conclusion"><Cited block={cited(study.conclusion, study.support.conclusion)} /></section>}
    {study.limit && study.format !== "case-study" && <section className="fx-sec fx-close" id="limit"><p className="ap-eyebrow">Where the evidence stops</p><Cited block={cited(study.limit, study.support.limit)} /></section>}
    {study.prompt && <section className="fx-sec fx-close" id="conversation"><p className="ap-eyebrow">{reread ? "Read the passage again" : "Carry it into a conversation"}</p><blockquote>{study.prompt}</blockquote><ApCitations citations={study.support.prompt} label="Editorial application" /></section>}
  </>;
}

function Essay({ study, part }: { study: ApStudy; part: number }) {
  const parts = study.parts ?? [], current = parts[part - 1];
  if (!current) return null;
  return <>
    <nav className="fx-parts" aria-label="Parts of this essay">{parts.map((item, i) => <Link key={item.id} to={essayPartUrl(study.id, i + 1)} aria-current={i + 1 === part ? "step" : undefined} title={item.title}><b>{i + 1}</b><span>{item.title}</span></Link>)}</nav>
    <section className="fx-sec" id={"part-" + part}><p className="ap-eyebrow">{`Part ${formatNumber(part)} of ${formatNumber(parts.length)}`}</p><h2>{current.title}</h2>
      {current.blocks.map((block, i) => <Cited key={block.id ?? i} block={block} />)}
      {current.passages.length > 0 && <div className="fx-part-passages"><p className="ap-eyebrow">Read with this part</p><Refs refs={current.passages} /></div>}</section>
    <nav className="fx-pagers" aria-label="Previous and next part">
      {part > 1 ? <Link className="fx-pager" to={essayPartUrl(study.id, part - 1)}><ArrowLeft size={15} /><span><small>{`Part ${formatNumber(part - 1)}`}</small>{parts[part - 2].title}</span></Link> : <span />}
      {part < parts.length && <Link className="fx-pager next" to={essayPartUrl(study.id, part + 1)}><span><small>{`Next part · ${formatNumber(part + 1)} of ${formatNumber(parts.length)}`}</small>{parts[part].title}</span><ArrowRight size={15} /></Link>}
    </nav></>;
}

function ObjectionList({ study }: { study: ApStudy }) {
  return <ol className="fx-objections">{(study.objections ?? []).map((item, i) => <li key={item.id} id={"o-" + item.id}><span className="fx-n">{pad(i + 1)}</span><div>
    <p className="ap-eyebrow">The objection</p><p className="fx-claim">{item.objection}</p><p className="fx-held">{`Made by ${item.heldBy.join(", ")}`}</p>
    <p className="ap-eyebrow fx-reply-label">A reply</p><Cited block={item.reply} /></div></li>)}</ol>;
}
/** A declared short answer's further objection pairs, after today's objection and reply. */
export function MoreObjections({ study }: { study: ApStudy }) {
  if (!study.objections?.length) return null;
  return <section id="more-objections" className="fx-more"><p className="ap-eyebrow">More objections, answered</p><ObjectionList study={study} /></section>;
}

function Views({ study }: { study: ApStudy }) {
  return <>
    {study.common && <section className="fx-sec" id="common"><p className="ap-eyebrow">What all affirm</p><h2>Common ground first.</h2><Cited block={study.common} /></section>}
    <div className="fx-views">{(study.views ?? []).map((view, i) => <section key={view.id} className="fx-view" id={"v-" + view.id}><p className="ap-eyebrow">{`View ${formatNumber(i + 1)}`}</p><h2>{view.label}</h2>
      <dl><dt>Held by</dt><dd>{view.heldBy.join(", ")}</dd><dt>Texts it leans on</dt><dd><Refs refs={view.texts} /></dd>
        <dt>The case</dt><dd><Cited block={view.case} /></dd><dt>The reply</dt><dd><Cited block={view.reply} /></dd></dl></section>)}</div></>;
}

/** A work's link opens only an https address (the build checks it too). */
const safeUrl = (url?: string) => url?.startsWith("https://") ? url : undefined;
function Figure({ study }: { study: ApStudy }) {
  const figure = study.figure;
  return <>
    {figure && <div className="fx-figure-card"><h2>{figure.name}</h2><dl className="fx-stats"><div><dt>Dates</dt><dd>{figure.dates}</dd></div><div><dt>Tradition</dt><dd>{figure.tradition}</dd></div><div><dt>Roles</dt><dd>{figure.roles.join(", ")}</dd></div></dl><ApCitations citations={figure.citations} /></div>}
    {study.sections.map((section, i) => <section key={i} className="fx-sec" id={"s-" + i}><p className="ap-eyebrow">{pad(i + 1)}</p><h2>{section.title}</h2><Cited block={cited(section.body, study.support.sections[i] ?? [])} /></section>)}
    {study.works?.length ? <section className="fx-sec" id="works"><p className="ap-eyebrow">Works to read</p><h2>In their own words.</h2><ul className="fx-works">{study.works.map((work) => <li key={work.title}>
      {safeUrl(work.url) ? <a href={safeUrl(work.url)} target="_blank" rel="noopener noreferrer">{work.title}<ArrowUpRight size={12} /></a> : <strong>{work.title}</strong>}<span>{work.date}</span>{work.note && <p>{work.note}</p>}</li>)}</ul></section> : null}</>;
}

/** Each extract is the named public-domain edition's own English: never translated, laid out left to right in every
 * language (lang, dir and translate="no"), with its locator, edition and translator under it. */
function Reading({ study }: { study: ApStudy }) {
  return <>{(study.extracts ?? []).map((extract, i) => { const source = sourceById(extract.source); return <section key={extract.id} className="fx-sec fx-reading" id={"x-" + extract.id}>
    <figure className="fx-extract"><p className="ap-eyebrow">{`${formatNumber(i + 1)} · ${source?.title ?? extract.source}`}</p>
      <blockquote lang="en" dir="ltr" translate="no">{extract.text}</blockquote>
      <figcaption>{[extract.locator, extract.edition, extract.translator].filter(Boolean).join(" · ")}</figcaption></figure>
    <aside className="fx-guide" aria-label="Guided note"><p className="ap-eyebrow">Reading it slowly</p><Cited block={extract.note} /></aside></section>; })}</>;
}

function CaseStudy({ study }: { study: ApStudy }) {
  return <><ol className="fx-steps">{study.sections.map((section, i) => <li key={i} id={"s-" + i}><p className="ap-eyebrow">{`Step ${formatNumber(i + 1)} of ${formatNumber(study.sections.length)}`}</p><h2>{section.title}</h2><Cited block={cited(section.body, study.support.sections[i] ?? [])} /></li>)}</ol>
    {study.limit && <div className="fx-note" id="limit"><SearchCheck size={16} /><div><p className="ap-eyebrow">What survives, and what am I inferring?</p><Cited block={cited(study.limit, study.support.limit)} /></div></div>}</>;
}
