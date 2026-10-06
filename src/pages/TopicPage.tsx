import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { RefLink } from "@/components/study/StudyParts";
import { studyById } from "@/data/apologetics-library";
import { studyUrl } from "@/lib/apologetics-links";
import { loadTopic, loadTopicIndex } from "@/lib/data";
import { categoryUrl, placeOf, topicUrl, type TopicItem } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";

/** Verse spans of one Torrey line, as reader links. */
function Refs({ item }: { item: TopicItem }) {
  if (!item.refs.length) return null;
  return <span className="text-sm">{item.refs.map((span, i) => <Fragment key={i}>{i > 0 && "; "}<RefLink span={span} /></Fragment>)}</span>;
}

/** One topic: Torrey's points with their verses, the studies that treat it, and its neighbours in the same subcategory. */
export default function TopicPage() {
  const { id = "" } = useParams();
  const index = useAsync(loadTopicIndex, "topic-index");
  const topic = useAsync(() => loadTopic(id), `topic-${id}`);

  if (index.status === "error" || topic.status === "error") return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-serif text-3xl">No such topic.</h1><Link to="/topics" className="mt-4 inline-block text-accent underline">All topics</Link></div>;
  if (index.status !== "ready" || topic.status !== "ready") return <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><Loading height={360} /></div>;
  const t = topic.value;
  const place = placeOf(index.value, t.id);
  const neighbours = place ? place.subcategory.topics.filter((other) => other !== t.id) : [];
  const verseCount = t.points.reduce((n, p) => n + p.refs.length + (p.items ?? []).reduce((m, i) => m + i.refs.length, 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <header className="pb-6 pt-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link to="/topics" className="hover:text-ink">Topics</Link>
          {place && <><ChevronRight size={14} /><Link to={categoryUrl(place.category.id)} className="hover:text-ink">{place.category.title}</Link><ChevronRight size={14} /><Link to={categoryUrl(place.category.id, place.subcategory.id)} className="hover:text-ink">{place.subcategory.title}</Link></>}
        </nav>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.points.length} points · {verseCount} passages · from R. A. Torrey’s <em>New Topical Textbook</em> (1897)</p>
      </header>

      <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {t.points.map((point, i) => (
          <li key={i} className="p-4">
            <p><span className="font-semibold">{point.text || "Passages"}</span>{point.refs.length > 0 && " — "}<Refs item={point} /></p>
            {point.see.length > 0 && <p className="mt-1 text-sm text-muted">See also {point.see.map((s, j) => <Fragment key={s}>{j > 0 && ", "}<Link to={topicUrl(s)} className="text-accent underline">{index.value.topics[s]?.title ?? s}</Link></Fragment>)}</p>}
            {point.items && <ul className="mt-2 grid gap-1 border-l-2 border-line pl-4">{point.items.map((item, j) => <li key={j}><span className="text-ink">{item.text}</span>{item.refs.length > 0 && " — "}<Refs item={item} /></li>)}</ul>}
          </li>
        ))}
      </ol>

      {t.relatedStudies.length > 0 && (
        <section aria-labelledby="topic-studies" className="mt-12">
          <h2 id="topic-studies" className="font-serif text-2xl font-semibold">Studies on this</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {t.relatedStudies.map((sid) => { const study = studyById(sid); return study && <li key={sid}><Link to={studyUrl(sid)} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-accent"><span className="font-serif text-lg font-semibold">{study.title}</span><span className="mt-1 block text-sm text-muted">{study.summary}</span></Link></li>; })}
          </ul>
        </section>
      )}

      {place && neighbours.length > 0 && (
        <section aria-labelledby="topic-neighbours" className="mt-12">
          <h2 id="topic-neighbours" className="font-serif text-2xl font-semibold">More in {place.subcategory.title}</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">{neighbours.map((n) => <li key={n}><Link to={topicUrl(n)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent">{index.value.topics[n]?.title}</Link></li>)}</ul>
          <Link to={categoryUrl(place.category.id)} className="mt-4 inline-flex items-center gap-1 text-sm text-accent">All of {place.category.title} <ArrowUpRight size={14} /></Link>
        </section>
      )}
    </div>
  );
}
