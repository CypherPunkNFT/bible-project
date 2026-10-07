import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { RefLink } from "@/components/study/StudyParts";
import { studyById } from "@/data/apologetics-library";
import { studyUrl } from "@/lib/apologetics-links";
import { loadTopic } from "@/lib/data";
import { categoryStyle, groupIcon } from "@/lib/topic-style";
import { categoryUrl, placeOf, topicUrl, type TopicIndex, type TopicItem, type TopicPoint } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { TopicsShell } from "@/pages/topics/TopicsShell";

const OPEN_FIRST = 4;

/** Verse spans of one Torrey line, as reader links. */
function Refs({ item }: { item: TopicItem }) {
  if (!item.refs.length) return null;
  return <span className="text-sm">{item.refs.map((span, i) => <Fragment key={i}>{i > 0 && "; "}<RefLink span={span} /></Fragment>)}</span>;
}

const passagesIn = (point: TopicPoint) => point.refs.length + (point.items ?? []).reduce((n, item) => n + item.refs.length, 0);

/** One of Torrey's points, folded to a single line until opened. */
function Point({ point, open, onToggle, titles }: { point: TopicPoint; open: boolean; onToggle: () => void; titles: Record<string, string> }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-2">
        <span className="font-semibold">{point.text || "Passages"}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{passagesIn(point)} {passagesIn(point) === 1 ? "passage" : "passages"}<ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} style={{ color: "var(--topics-color)" }} /></span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <Refs item={point} />
          {point.see.length > 0 && <p className="mt-1 text-sm text-muted">See also {point.see.map((s, j) => <Fragment key={s}>{j > 0 && ", "}<Link to={topicUrl(s)} className="underline">{titles[s] ?? s}</Link></Fragment>)}</p>}
          {point.items && <ul className="mt-2 grid gap-1.5 border-l-2 pl-4" style={{ borderColor: "var(--topics-color)" }}>{point.items.map((item, j) => <li key={j}><span className="text-ink">{item.text}</span>{item.refs.length > 0 && " — "}<Refs item={item} /></li>)}</ul>}
        </div>
      )}
    </li>
  );
}

/** One topic, inside the Topics collection frame: key verses quoted in full, Torrey's points as an expandable list, related studies, neighbours. */
export function TopicPage({ index }: { index: TopicIndex }) {
  const { id = "" } = useParams();
  const topic = useAsync(() => loadTopic(id), `topic-${id}`);
  const [opened, setOpened] = useState<Set<number> | "all">(new Set(Array.from({ length: OPEN_FIRST }, (_, i) => i)));
  const place = placeOf(index, id);
  const back = place
    ? <Link to={categoryUrl(place.category.id, place.subcategory.id)}><ArrowLeft size={15} aria-hidden />{place.subcategory.title}</Link>
    : <Link to="/topics"><ArrowLeft size={15} aria-hidden />All topics</Link>;

  if (topic.status === "error") return <TopicsShell index={index} current="" back={back}><div className="py-16"><h1 className="font-serif text-3xl">No such topic.</h1><Link to="/topics" className="mt-4 inline-block underline">All topics</Link></div></TopicsShell>;
  if (topic.status !== "ready") return <TopicsShell index={index} current={place?.category.id ?? ""} back={back}><div className="py-10"><Loading height={360} /></div></TopicsShell>;
  const t = topic.value;
  const { Icon } = categoryStyle(place?.category.id ?? "");
  const GroupIcon = groupIcon(place?.subcategory.id ?? "");
  const neighbours = place ? place.subcategory.topics.filter((other) => other !== t.id) : [];
  const verseCount = t.points.reduce((n, p) => n + passagesIn(p), 0);
  const titles = Object.fromEntries(Object.entries(index.topics).map(([k, v]) => [k, v.title]));
  const isOpen = (i: number) => opened === "all" || opened.has(i);
  const toggle = (i: number) => setOpened((current) => { const next = new Set(current === "all" ? t.points.map((_, j) => j) : current); if (next.has(i)) next.delete(i); else next.add(i); return next; });

  return (
    <TopicsShell index={index} current={place?.category.id ?? ""} back={back}>
      <header className="topics-family-intro">
        <div>
          <nav aria-label="Breadcrumb" className="topics-kicker flex flex-wrap items-center gap-1">
            <Link to="/topics">Topics</Link>
            {place && <><ChevronRight size={12} aria-hidden /><Link to={categoryUrl(place.category.id)}>{place.category.title}</Link><ChevronRight size={12} aria-hidden /><Link to={categoryUrl(place.category.id, place.subcategory.id)}>{place.subcategory.title}</Link></>}
          </nav>
          <h1 className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: "var(--topics-color)" }}><Icon size={24} aria-hidden /></span>{t.title}</h1>
          <p>{t.points.length} points · {formatNumber(verseCount)} passages · from R. A. Torrey’s <em>New Topical Textbook</em> (1897)</p>
        </div>
        {place && <TopicsArtwork kind={place.category.id} />}
      </header>

      {t.keyVerses.length > 0 && (
        <section aria-labelledby="key-verses">
          <div className="topics-section-heading"><h2 id="key-verses">Key verses</h2><span>Chosen by meaning from Torrey’s references · World English Bible</span></div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.keyVerses.map((verse, i) => (
              <li key={i} className="topics-group-detail">
                <p className="topics-kicker">{verse.point}</p>
                <blockquote className="mt-2 font-serif text-xl leading-snug">“{verse.text}”</blockquote>
                <p className="mt-3 text-sm"><RefLink span={verse.span} /></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-points" className="mt-10">
        <div className="topics-section-heading">
          <h2 id="all-points">What Scripture says</h2>
          <button type="button" onClick={() => setOpened(opened === "all" ? new Set() : "all")} className="text-sm font-semibold" style={{ color: "var(--topics-color)" }}>{opened === "all" ? "Fold all" : "Open all"}</button>
        </div>
        <ol className="overflow-hidden rounded-[.8rem] border border-line bg-surface" style={{ borderTop: "2px solid var(--topics-color)" }}>
          {t.points.map((point, i) => <Point key={i} point={point} open={isOpen(i)} onToggle={() => toggle(i)} titles={titles} />)}
        </ol>
      </section>

      {t.relatedStudies.length > 0 && (
        <section aria-labelledby="topic-studies" className="mt-10">
          <div className="topics-section-heading"><h2 id="topic-studies">Studies on this</h2><span>From the apologetics library</span></div>
          <ul className="topics-group-grid">
            {t.relatedStudies.map((sid) => { const study = studyById(sid); return study && <li key={sid}><Link to={studyUrl(sid)} className="topics-compact-card"><span><strong>{study.title}</strong><small>{study.summary}</small></span><ArrowUpRight size={15} aria-hidden /></Link></li>; })}
          </ul>
        </section>
      )}

      {place && neighbours.length > 0 && (
        <section aria-labelledby="topic-neighbours" className="mt-10">
          <div className="topics-section-heading"><h2 id="topic-neighbours" className="flex items-center gap-2"><GroupIcon size={18} aria-hidden style={{ color: "var(--topics-color)" }} />More in {place.subcategory.title}</h2><Link to={categoryUrl(place.category.id)} className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--topics-color)" }}>All of {place.category.title} <ArrowUpRight size={13} aria-hidden /></Link></div>
          <ul className="topics-topic-grid !mt-0">
            {neighbours.map((n) => { const other = index.topics[n]; return other && <li key={n}><Link to={topicUrl(n)}><span><strong>{other.title}</strong><small>{other.points} points · {formatNumber(other.refs)} passages</small></span><ArrowRight size={14} aria-hidden /></Link></li>; })}
          </ul>
        </section>
      )}
    </TopicsShell>
  );
}
