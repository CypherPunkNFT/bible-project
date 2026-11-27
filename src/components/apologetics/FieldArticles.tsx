import { FileText } from "lucide-react";
import type { CSSProperties } from "react";
import { STUDIES, studyById, studyMinutes, type ApStudy } from "@/data/apologetics-library";
import type { ApTopic } from "@/data/apologetics-types";
import type { ApNotebook } from "@/lib/apologetics-notebook";
import { FORMAT_ORDER, articleFormat, articleKind, inField } from "@/lib/apologetics-article-kinds";
import type { StudyHit } from "@/lib/apologetics-search";
import { formatNumber } from "@/lib/site-format";
import { ArticleCard } from "./ArticleCard";
import "@/pages/apologetics-articles.css";

/** A field page laid out for many articles (plan APOLOGETICS-FIELDS job 5.2; mock-up design/apologetics-fields/field/):
 * the field's figures under its heading, the format filter with live counts, "Start here" (the topic's `start`), and the
 * articles grouped by format. Drafts never reach STUDIES (the compiler publishes only published documents), so every
 * count here is of published articles. */

/** The formats a field holds, in the page's order (formats the table does not know yet go last). */
export function fieldFormats(topicId: string): string[] {
  const present = new Set(STUDIES.filter((study) => inField(study, topicId)).map(articleFormat));
  return [...FORMAT_ORDER.filter((format) => present.has(format)), ...[...present].filter((format) => !(FORMAT_ORDER as readonly string[]).includes(format)).sort()];
}

/** The field's figures, shown in its heading: articles, formats, reading time and the field's question. */
export function FieldStats({ topic }: { topic: ApTopic }) {
  const studies = STUDIES.filter((study) => inField(study, topic.id)), minutes = studies.reduce((sum, study) => sum + studyMinutes(study), 0);
  return <dl className="ap-field-stats">
    <div><dt>Articles</dt><dd>{formatNumber(studies.length)}</dd></div>
    <div><dt>Formats</dt><dd>{formatNumber(fieldFormats(topic.id).length)}</dd></div>
    <div><dt>Reading time</dt><dd>{minutes < 120 ? `${formatNumber(minutes)} min` : `${formatNumber(minutes / 60, { maximumFractionDigits: 1 })} h`}</dd></div>
    <div><dt>The question</dt><dd className="ap-field-question">{`“${topic.question}”`}</dd></div>
  </dl>;
}

/** Show one format: "All" and each format the field holds, with how many of the matching articles it has. The pressed
 * button is never disabled, so a search that empties it can always be undone. */
export function FormatFilter({ topic, hits, format, onFormat }: { topic: ApTopic; hits: StudyHit[]; format: string; onFormat: (format: string) => void }) {
  const counts = new Map<string, number>();
  for (const hit of hits) counts.set(articleFormat(hit.study), (counts.get(articleFormat(hit.study)) ?? 0) + 1);
  const options = [{ id: "all", heading: "All", icon: FileText, count: hits.length }, ...fieldFormats(topic.id).map((id) => ({ id, ...articleKind(id), count: counts.get(id) ?? 0 }))];
  return <div className="ap-format-filter" role="group" aria-label="Show one format">{options.map(({ id, heading, icon: Icon, count }) => <button key={id} type="button" aria-pressed={format === id} disabled={!count && format !== id} onClick={() => onFormat(format === id ? "all" : id)}><Icon size={14} aria-hidden="true" /><span>{heading}</span> <b>{formatNumber(count)}</b></button>)}</div>;
}

/** "Start here", while nothing is searched or filtered, then the matching articles in their format groups. */
export function FieldArticles({ topic, hits, format, searching, book }: { topic: ApTopic; hits: StudyHit[]; format: string; searching: boolean; book: ApNotebook }) {
  const start = (topic.start ?? []).map(studyById).filter((study): study is ApStudy => !!study);
  const groups = fieldFormats(topic.id).filter((id) => format === "all" || format === id).map((id) => ({ id, kind: articleKind(id), hits: hits.filter((hit) => articleFormat(hit.study) === id) })).filter((group) => group.hits.length);
  return <>
    {!searching && format === "all" && start.length > 0 && <section className="ap-field-start" aria-labelledby="ap-field-start"><p className="ap-eyebrow">Start here</p><h2 id="ap-field-start">Three to read <em>first.</em></h2><ol className="ap-study-grid">{start.map((study, index) => <li key={study.id}><span className="ap-field-number" aria-hidden="true">{`0${index + 1}`}</span><ArticleCard study={study} book={book} /></li>)}</ol></section>}
    <div className="ap-field-groups">{groups.map(({ id, kind, hits: inGroup }) => { const Icon = kind.icon; return <section key={id} className="ap-field-group" data-format={id} style={{ "--span3": Math.min(inGroup.length, 3), "--span2": Math.min(inGroup.length, 2) } as CSSProperties} aria-labelledby={"ap-group-" + id}>
      <div className="ap-field-group-head"><Icon size={20} aria-hidden="true" /><div><h2 id={"ap-group-" + id}>{kind.heading} <small>{formatNumber(inGroup.length)}</small></h2>{kind.line && <p>{kind.line}</p>}</div></div>
      <div className="ap-study-grid">{inGroup.map((hit) => <ArticleCard key={hit.study.id} study={hit.study} book={book} snippet={hit.snippet} snippetLang={hit.snippetLang} />)}</div>
    </section>; })}</div>
  </>;
}
