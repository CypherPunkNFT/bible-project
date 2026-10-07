import { ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { RefLink } from "@/components/study/StudyParts";
import { studyById } from "@/data/apologetics-library";
import { studyUrl } from "@/lib/apologetics-links";
import { loadTopic, loadTopicIndex } from "@/lib/data";
import { categoryStyle } from "@/lib/topic-style";
import { categoryUrl, placeOf, topicUrl, type TopicItem, type TopicPoint } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";

const OPEN_FIRST = 4;

/** Verse spans of one Torrey line, as reader links. */
function Refs({ item }: { item: TopicItem }) {
  if (!item.refs.length) return null;
  return <span className="text-sm">{item.refs.map((span, i) => <Fragment key={i}>{i > 0 && "; "}<RefLink span={span} /></Fragment>)}</span>;
}

const passagesIn = (point: TopicPoint) => point.refs.length + (point.items ?? []).reduce((n, item) => n + item.refs.length, 0);

/** One of Torrey's points, folded to a single line until opened. */
function Point({ point, open, onToggle, color, titles }: { point: TopicPoint; open: boolean; onToggle: () => void; color: string; titles: Record<string, string> }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-2">
        <span className="font-semibold">{point.text || "Passages"}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{passagesIn(point)} {passagesIn(point) === 1 ? "passage" : "passages"}<ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} style={{ color }} /></span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <Refs item={point} />
          {point.see.length > 0 && <p className="mt-1 text-sm text-muted">See also {point.see.map((s, j) => <Fragment key={s}>{j > 0 && ", "}<Link to={topicUrl(s)} className="underline">{titles[s] ?? s}</Link></Fragment>)}</p>}
          {point.items && <ul className="mt-2 grid gap-1.5 border-l-2 pl-4" style={{ borderColor: color }}>{point.items.map((item, j) => <li key={j}><span className="text-ink">{item.text}</span>{item.refs.length > 0 && " — "}<Refs item={item} /></li>)}</ul>}
        </div>
      )}
    </li>
  );
}

/** One topic: coloured header, key verses quoted in full, Torrey's points as an expandable list, related studies, neighbours. */
export default function TopicPage() {
  const { id = "" } = useParams();
  const index = useAsync(loadTopicIndex, "topic-index");
  const topic = useAsync(() => loadTopic(id), `topic-${id}`);
  const [opened, setOpened] = useState<Set<number> | "all">(new Set(Array.from({ length: OPEN_FIRST }, (_, i) => i)));

  if (index.status === "error" || topic.status === "error") return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-serif text-3xl">No such topic.</h1><Link to="/topics" className="mt-4 inline-block text-accent underline">All topics</Link></div>;
  if (index.status !== "ready" || topic.status !== "ready") return <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><Loading height={360} /></div>;
  const t = topic.value;
  const place = placeOf(index.value, t.id);
  const { Icon, color, box } = categoryStyle(place?.category.id ?? "");
  const neighbours = place ? place.subcategory.topics.filter((other) => other !== t.id) : [];
  const verseCount = t.points.reduce((n, p) => n + passagesIn(p), 0);
  const titles = Object.fromEntries(Object.entries(index.value.topics).map(([k, v]) => [k, v.title]));
  const isOpen = (i: number) => opened === "all" || opened.has(i);
  const toggle = (i: number) => setOpened((current) => { const next = new Set(current === "all" ? t.points.map((_, j) => j) : current); if (next.has(i)) next.delete(i); else next.add(i); return next; });

  return (
    <div className="pb-20">
      <header className="border-b border-line" style={{ background: `color-mix(in srgb, ${box} 30%, var(--page))` }}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
            <Link to="/topics" className="hover:text-ink">Topics</Link>
            {place && <><ChevronRight size={14} /><Link to={categoryUrl(place.category.id)} className="hover:text-ink">{place.category.title}</Link><ChevronRight size={14} /><Link to={categoryUrl(place.category.id, place.subcategory.id)} className="hover:text-ink">{place.subcategory.title}</Link></>}
          </nav>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}><Icon size={24} /></span>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
          </div>
          <p className="mt-3 text-sm text-muted">{t.points.length} points · {verseCount} passages · from R. A. Torrey’s <em>New Topical Textbook</em> (1897)</p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {t.keyVerses.length > 0 && (
          <section aria-labelledby="key-verses" className="mt-8">
            <h2 id="key-verses" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color }}>Key verses</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {t.keyVerses.map((verse, i) => (
                <li key={i} className="rounded-2xl border border-line bg-surface p-4" style={{ borderLeft: `4px solid ${color}` }}>
                  <p className="text-xs uppercase tracking-wide text-muted">{verse.point}</p>
                  <blockquote className="mt-1 font-serif text-lg leading-snug">“{verse.text}”</blockquote>
                  <p className="mt-2 text-sm"><RefLink span={verse.span} /> <span className="text-xs text-muted">· World English Bible</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="all-points" className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="all-points" className="font-serif text-2xl font-semibold">What Scripture says</h2>
            <button type="button" onClick={() => setOpened(opened === "all" ? new Set() : "all")} className="text-sm font-semibold" style={{ color }}>{opened === "all" ? "Fold all" : "Open all"}</button>
          </div>
          <ol className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            {t.points.map((point, i) => <Point key={i} point={point} open={isOpen(i)} onToggle={() => toggle(i)} color={color} titles={titles} />)}
          </ol>
        </section>

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
            <ul className="mt-3 flex flex-wrap gap-1.5">{neighbours.map((n) => <li key={n}><Link to={topicUrl(n)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-current">{index.value.topics[n]?.title}</Link></li>)}</ul>
            <Link to={categoryUrl(place.category.id)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>All of {place.category.title} <ArrowUpRight size={14} /></Link>
          </section>
        )}
      </div>
    </div>
  );
}
