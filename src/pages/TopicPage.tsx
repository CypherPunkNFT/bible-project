import { ArrowLeft, ArrowRight, ArrowUpRight, BookMarked, ChevronDown, ChevronRight, MapPin, Network } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { RefLink } from "@/components/study/StudyParts";
import { studyById } from "@/data/apologetics-library";
import { studyUrl } from "@/lib/apologetics-links";
import { loadPlaces, loadTopic } from "@/lib/data";
import { loadPeople } from "@/lib/study";
import { categoryStyle, groupIcon } from "@/lib/topic-style";
import { categoryUrl, placeOf, pointsAndPassages, topicUrl, type ArticleParagraph, type Topic, type TopicIndex, type TopicItem, type TopicPoint } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { TopicsShell } from "@/pages/topics/TopicsShell";
import { familyWords } from "@/pages/topics/topics-shared";

const OPEN_FIRST = 4;
const ARTICLE_SHOWN = 2;
const NEIGHBOURS_SHOWN = 20;

/** Verse spans of one line, as reader links. */
function Refs({ item }: { item: TopicItem }) {
  if (!item.refs.length) return null;
  return <span className="text-sm">{item.refs.map((span, i) => <Fragment key={i}>{i > 0 && "; "}<RefLink span={span} /></Fragment>)}</span>;
}

const passagesIn = (point: TopicPoint) => point.refs.length + (point.items ?? []).reduce((n, item) => n + item.refs.length, 0);

/** One point, folded to a single line until opened. */
function Point({ point, open, onToggle, titles }: { point: TopicPoint; open: boolean; onToggle: () => void; titles: Record<string, string> }) {
  const count = passagesIn(point);
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-2">
        <span className="font-semibold">{point.text || (count ? "Passages" : "See also")}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{count > 0 && `${count} ${count === 1 ? "passage" : "passages"}`}<ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} style={{ color: "var(--topics-color)" }} /></span>
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

/** One book's points as an expandable list; the first few open. */
function PointList({ points, titles, label }: { points: TopicPoint[]; titles: Record<string, string>; label: string }) {
  const [opened, setOpened] = useState<Set<number> | "all">(new Set(Array.from({ length: OPEN_FIRST }, (_, i) => i)));
  const isOpen = (i: number) => opened === "all" || opened.has(i);
  const toggle = (i: number) => setOpened((current) => { const next = new Set(current === "all" ? points.map((_, j) => j) : current); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  return (
    <div className="topics-point-book">
      <div className="topics-point-book-head"><span>{label}</span><button type="button" onClick={() => setOpened(opened === "all" ? new Set() : "all")} style={{ color: "var(--topics-color)" }}>{opened === "all" ? "Fold all" : "Open all"}</button></div>
      <ol className="overflow-hidden rounded-[.8rem] border border-line bg-surface" style={{ borderTop: "2px solid var(--topics-color)" }}>
        {points.map((point, i) => <Point key={i} point={point} open={isOpen(i)} onToggle={() => toggle(i)} titles={titles} />)}
      </ol>
    </div>
  );
}

/** Easton's article: text with its verse references as reader links; long articles fold after the first paragraphs. */
function Article({ paragraphs }: { paragraphs: ArticleParagraph[] }) {
  const [all, setAll] = useState(paragraphs.length <= ARTICLE_SHOWN + 1);
  return (
    <div className="topics-article">
      {(all ? paragraphs : paragraphs.slice(0, ARTICLE_SHOWN)).map((paragraph, i) => (
        <p key={i}>{paragraph.map((part, j) => typeof part === "string" ? <Fragment key={j}>{part}</Fragment> : <RefLink key={j} span={[part[0], part[1]]} label={part[2]} />)}</p>
      ))}
      {!all && <button type="button" onClick={() => setAll(true)} style={{ color: "var(--topics-color)" }}>Read the whole article ({paragraphs.length} paragraphs) <ChevronDown size={14} aria-hidden /></button>}
    </div>
  );
}

/** The same name elsewhere on the site: people with their family trees, and places on the atlas. */
function Elsewhere({ title }: { title: string }) {
  const people = useAsync(loadPeople, "study-people");
  const places = useAsync(loadPlaces, "places");
  const name = title.toLowerCase();
  const persons = people.status === "ready" ? people.value.filter((p) => p.n.toLowerCase() === name).sort((a, b) => b.c - a.c) : [];
  const spots = places.status === "ready" ? places.value.filter((p) => p.name.toLowerCase() === name) : [];
  if (!persons.length && !spots.length) return null;
  return (
    <section aria-labelledby="topic-elsewhere" className="mt-10">
      <div className="topics-section-heading"><h2 id="topic-elsewhere">Elsewhere in the Bible Project</h2><span>The same name in People and the Atlas</span></div>
      <ul className="topics-group-grid">
        {persons.slice(0, 8).map((p) => <li key={p.id}><Link to={`/study/people/${p.id}`} className="topics-compact-card"><Network size={26} strokeWidth={1.35} aria-hidden /><span><strong>{p.n}</strong><small>{p.b} · family and passages</small></span><ArrowUpRight size={15} aria-hidden /></Link></li>)}
        {spots.slice(0, 4).map((p) => <li key={p.id}><Link to={`/study/atlas/map?place=${p.id}`} className="topics-compact-card"><MapPin size={26} strokeWidth={1.35} aria-hidden /><span><strong>{p.name}</strong><small>{p.type} · on the atlas map</small></span><ArrowUpRight size={15} aria-hidden /></Link></li>)}
      </ul>
    </section>
  );
}

function sourcesLine(t: Topic): string {
  const books = [t.points.length ? "R. A. Torrey’s New Topical Textbook (1897)" : "", t.nave?.length ? "Nave’s Topical Bible (1896)" : "", t.dictionary ? "Easton’s Bible Dictionary (1897)" : ""].filter(Boolean);
  return books.length > 1 ? `${books.slice(0, -1).join(", ")} and ${books.at(-1)}` : books[0] ?? "";
}

/** One topic, inside the Topics collection frame: the dictionary article, key verses quoted in full, Torrey's and Nave's
 * points as expandable lists, the same name in People and the Atlas, related studies, neighbours. */
export function TopicPage({ index }: { index: TopicIndex }) {
  const { id = "" } = useParams();
  const alias = index.aliases?.[id];
  const summary = index.topics[id];
  const topic = useAsync(() => summary ? loadTopic(id, summary.f) : Promise.reject(new Error(`No topic "${id}".`)), `topic-${id}`);
  const place = placeOf(index, id);
  if (alias && !summary) return <Navigate replace to={topicUrl(alias)} />;
  const back = place
    ? <Link to={categoryUrl(place.category.id, place.subcategory.id)}><ArrowLeft size={15} aria-hidden />{place.subcategory.title}</Link>
    : <Link to="/topics"><ArrowLeft size={15} aria-hidden />All topics</Link>;

  if (topic.status === "error") return <TopicsShell index={index} current="" back={back}><div className="py-16"><h1 className="font-serif text-3xl">No such topic.</h1><Link to="/topics" className="mt-4 inline-block underline">All topics</Link></div></TopicsShell>;
  if (topic.status !== "ready") return <TopicsShell index={index} current={place?.category.id ?? ""} back={back}><div className="py-10"><Loading height={360} /></div></TopicsShell>;
  const t = topic.value;
  const nave = t.nave ?? [];
  const { Icon } = categoryStyle(place?.category.id ?? "");
  const GroupIcon = groupIcon(place?.subcategory.id ?? "");
  const neighbours = place ? place.subcategory.topics.filter((other) => other !== t.id).sort((a, b) => (index.topics[b]?.refs ?? 0) - (index.topics[a]?.refs ?? 0)) : [];
  const verseCount = [...t.points, ...nave].reduce((n, p) => n + passagesIn(p), 0);
  const titles = Object.fromEntries(Object.entries(index.topics).map(([k, v]) => [k, v.title]));

  return (
    <TopicsShell index={index} current={place?.category.id ?? ""} back={back}>
      <header className="topics-family-intro">
        <div>
          <nav aria-label="Breadcrumb" className="topics-kicker flex flex-wrap items-center gap-1">
            <Link to="/topics">Topics</Link>
            {place && <><ChevronRight size={12} aria-hidden /><Link to={categoryUrl(place.category.id)}>{place.category.title}</Link><ChevronRight size={12} aria-hidden /><Link to={categoryUrl(place.category.id, place.subcategory.id)}>{place.subcategory.title}</Link></>}
          </nav>
          <h1 className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: "var(--topics-color)" }}><Icon size={24} aria-hidden /></span>{t.title}</h1>
          <p>{pointsAndPassages(t.points.length + nave.length, verseCount)} · from {sourcesLine(t)}</p>
        </div>
        {place && <TopicsArtwork kind={place.category.id} words={familyWords(place.category, index)} />}
      </header>

      {t.dictionary && (
        <section aria-labelledby="topic-article" className="mb-10">
          <div className="topics-section-heading"><h2 id="topic-article" className="flex items-center gap-2"><BookMarked size={18} aria-hidden style={{ color: "var(--topics-color)" }} />In brief</h2><span>Easton’s Bible Dictionary (1897)</span></div>
          <Article paragraphs={t.dictionary} />
        </section>
      )}

      {t.keyVerses.length > 0 && (
        <section aria-labelledby="key-verses">
          <div className="topics-section-heading"><h2 id="key-verses">Key verses</h2><span>Chosen by meaning from the topic’s references · World English Bible</span></div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.keyVerses.map((verse, i) => (
              <li key={i} className="topics-group-detail">
                <p className="topics-kicker">{verse.point}</p>
                <blockquote className="mt-2 font-serif text-xl leading-snug">“{verse.text.replace(/^[“"‘']+/, "").replace(/[”"’']+(\s…)?$/, "$1")}”</blockquote>
                <p className="mt-3 text-sm"><RefLink span={verse.span} /></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-points" className="mt-10">
        <div className="topics-section-heading"><h2 id="all-points">What Scripture says</h2><span>{t.points.length && nave.length ? "Two topical Bibles, side by side" : "Point by point, with every passage"}</span></div>
        <div className="topics-point-books">
          {t.points.length > 0 && <PointList points={t.points} titles={titles} label="Torrey’s New Topical Textbook" />}
          {nave.length > 0 && <PointList points={nave} titles={titles} label="Nave’s Topical Bible" />}
        </div>
      </section>

      <Elsewhere title={t.title} />

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
          <div className="topics-section-heading"><h2 id="topic-neighbours" className="flex items-center gap-2"><GroupIcon size={18} aria-hidden style={{ color: "var(--topics-color)" }} />More in {place.subcategory.title}</h2><Link to={categoryUrl(place.category.id, place.subcategory.id)} className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--topics-color)" }}>{neighbours.length > NEIGHBOURS_SHOWN ? `All ${neighbours.length + 1} in ${place.subcategory.title}` : `All of ${place.category.title}`} <ArrowUpRight size={13} aria-hidden /></Link></div>
          <ul className="topics-topic-grid !mt-0">
            {neighbours.slice(0, NEIGHBOURS_SHOWN).map((n) => { const other = index.topics[n]; return other && <li key={n}><Link to={topicUrl(n)}><span><strong>{other.title}</strong><small>{pointsAndPassages(other.points, other.refs)}</small></span><ArrowRight size={14} aria-hidden /></Link></li>; })}
          </ul>
        </section>
      )}
    </TopicsShell>
  );
}
