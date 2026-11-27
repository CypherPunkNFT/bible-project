import { Bookmark } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { studyMinutes, topicById, type ApStudy } from "@/data/apologetics-library";
import type { ApNotebook } from "@/lib/apologetics-notebook";
import { apColor, studyUrl } from "@/lib/apologetics-links";
import { articleFormat, articleKind } from "@/lib/apologetics-article-kinds";
import type { SnippetPart } from "@/lib/apologetics-search";
import { formatNumber, plural } from "@/lib/site-format";

/** The field page's article card (Plans/APOLOGETICS-FIELDS-CARD.md): eyebrow (type · field) and the save button, then one
 * link around the title, the one-line summary and the meta line; the type's icon faded behind the top corner. The save
 * button stays outside the link. A study listed in another field through `alsoIn` keeps its home field's colour and name.
 * `snippet`: the matching sentence when the search found it outside the title and summary (as StudyCard). */
export function ArticleCard({ study, book, snippet, snippetLang }: { study: ApStudy; book: ApNotebook; snippet?: SnippetPart[] | null; snippetLang?: string }) {
  const topic = topicById(study.topic)!, format = articleFormat(study), kind = articleKind(format), Icon = kind.icon, id = useId();
  const saved = book.notebook.saved.includes(study.id), read = book.notebook.read.includes(study.id);
  return <article className="ap-article-card" style={apColor(topic.color)} data-kind={format} data-read={read || undefined}>
    <Icon className="ap-article-icon" aria-hidden="true" strokeWidth={1} />
    <div className="ap-article-top"><p className="ap-eyebrow" id={id + "-kind"}><Icon size={13} aria-hidden="true" />{`${kind.label} · ${topic.short}`}</p><button type="button" className="ap-article-save" aria-label={saved ? `Unsave: ${study.title}` : `Save: ${study.title}`} aria-pressed={saved} onClick={() => book.toggle("saved", study.id)}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button></div>
    <Link className="ap-article-link" to={studyUrl(study.id)} aria-labelledby={`${id}-title ${id}-kind ${id}-meta`} aria-describedby={id + "-summary"}>
      <h3 id={id + "-title"}>{study.title}</h3><p id={id + "-summary"}>{study.summary}</p>
      {snippet && <p className="ap-study-snippet" lang={snippetLang}>…{snippet.map((part, index) => part.hit ? <mark key={index}>{part.text}</mark> : part.text)}</p>}
      <span className="ap-article-meta" id={id + "-meta"}><span>{`${formatNumber(studyMinutes(study))} min`}</span><span>{plural(study.sources.length, "{n} source", "{n} sources")}</span>{read && <span className="is-read"><span aria-hidden="true">✓ </span>Read</span>}</span>
    </Link>
  </article>;
}
