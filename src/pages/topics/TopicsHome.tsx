import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BookOpenText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categoryStyle, FAMILY_EYEBROW, groupIcon, TOPIC_SECTIONS } from "@/lib/topic-style";
import { categoryUrl, matchTopics, placeOf, topicUrl, type TopicCategory, type TopicIndex } from "@/lib/topics";
import { formatNumber } from "@/lib/utils";
import { TopicsArtwork } from "./TopicsArtwork";
import { familyWords, morph, orderedFamilies, tint } from "./topics-shared";

const POPULAR = ["love-of-god", "prayer", "faith", "grace", "afflictions", "christ-the-shepherd", "heaven", "holy-spirit-the-is-god"];

function FamilyCard({ family, number, index }: { family: TopicCategory; number: number; index: TopicIndex }) {
  const { Icon } = categoryStyle(family.id);
  const topics = family.subcategories.reduce((n, sub) => n + sub.topics.length, 0);
  return (
    <Link to={categoryUrl(family.id)} className="topics-family-card" data-topics-morph style={morph(family.id)} aria-labelledby={`topics-card-${family.id}`}>
      <div className="topics-card-top"><Icon size={18} strokeWidth={1.5} aria-hidden /><span>{FAMILY_EYEBROW[family.id] ?? "Topics"}</span><ArrowUpRight size={19} aria-hidden /></div>
      <TopicsArtwork kind={family.id} words={familyWords(family, index, 4)} />
      <div className="topics-card-copy"><span className="topics-card-number">{String(number).padStart(2, "0")}</span><h3 id={`topics-card-${family.id}`}>{family.title}</h3><p>{family.description}</p></div>
      <div className="topics-card-foot"><span>{family.subcategories.slice(0, 3).map((sub) => sub.title).join(" · ")}{family.subcategories.length > 3 ? " · More" : ""}</span><strong>{topics} topics in {family.subcategories.length} groups<ArrowRight size={15} aria-hidden /></strong></div>
    </Link>
  );
}

type Row = { id: string; title: string; description: string; families: TopicCategory[] };

function SectionRow({ row, number, start, index }: { row: Row; number: number; start: number; index: TopicIndex }) {
  return (
    <section id={`section-${row.id}`} className="topics-section" aria-labelledby={`topics-row-${row.id}`}>
      <div className="topics-row-heading"><h2 id={`topics-row-${row.id}`}><span>{String(number).padStart(2, "0")}</span>{row.title}</h2><p>{row.description}</p></div>
      <nav aria-label={row.title} className="topics-families">{row.families.map((family, i) => <FamilyCard key={family.id} family={family} number={start + i} index={index} />)}</nav>
    </section>
  );
}

/** Topics home, in the Atlas collection's style: the families as illustrated cards, section by section. */
export function TopicsHome({ index }: { index: TopicIndex }) {
  const [query, setQuery] = useState("");
  const found = useMemo(() => (query.trim() ? matchTopics(index, query, 60) : []), [index, query]);
  const { categories, topics } = index;
  const groups = categories.reduce((n, c) => n + c.subcategories.length, 0);
  const popular = POPULAR.filter((id) => topics[id]);

  const byId = new Map(categories.map((c) => [c.id, c]));
  const placed = new Set(TOPIC_SECTIONS.flatMap((s) => s.categories));
  const rows: Row[] = [
    ...TOPIC_SECTIONS.map((s) => ({ ...s, families: s.categories.flatMap((id) => byId.get(id) ?? []) })),
    { id: "more", title: "More topics", description: "Families not yet placed in a section.", families: categories.filter((c) => !placed.has(c.id)) },
  ].filter((row) => row.families.length > 0);
  const order = orderedFamilies(index).map((c) => c.id);
  const startOf = (row: Row) => order.indexOf(row.families[0].id) + 1;

  return (
    <div className="topics-collection mx-auto max-w-7xl px-4 sm:px-6">
      <div className="topics-topline"><Link to="/study"><ArrowLeft size={15} aria-hidden />Back to Study</Link><span>Topics</span></div>
      <div className="topics-page-slide">
        <header className="topics-intro">
          <div className="topics-intro-copy">
            <p className="topics-kicker">Scripture, subject by subject</p>
            <h1>Every subject.<br /><em>Every verse.</em></h1>
            <p>{formatNumber(Object.keys(topics).length)} topics in {categories.length} families and {groups} groups, each with the passages that speak to it: doctrines and duties, every person and place, and the things of daily life.</p>
            <label className="topics-finder"><Search size={18} aria-hidden /><span className="sr-only">Find a topic</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a topic: grace, prayer, the Sabbath, lions…" /></label>
            {!query && popular.length > 0 && <p className="topics-popular"><span>Popular</span>{popular.map((id) => <Link key={id} to={topicUrl(id)}>{topics[id].title}</Link>)}</p>}
          </div>
          <div className="topics-intro-emblem" aria-hidden><BookOpenText strokeWidth={.65} /><span>SUBJECT · PASSAGE · VERSE</span></div>
        </header>
        <dl className="topics-figures">
          <div><dt>Topics</dt><dd>{formatNumber(Object.keys(topics).length)}</dd></div>
          <div><dt>Passages cited</dt><dd>{formatNumber(Object.values(topics).reduce((n, t) => n + t.refs, 0))}</dd></div>
          <div><dt>Families</dt><dd>{categories.length}</dd></div>
          <div><dt>Groups</dt><dd>{groups}</dd></div>
        </dl>
        {!query.trim() && <nav className="topics-jump" aria-label="Topic sections">{rows.map((row, i) => <a key={row.id} href={`#section-${row.id}`}><span>{String(i + 1).padStart(2, "0")}</span>{row.title}</a>)}</nav>}

        {query.trim() ? (
          <section aria-live="polite" aria-label="Matching topics">
            <div className="topics-row-heading"><h2>{found.length ? `${found.length} topics` : `No topic is named “${query}”`}</h2>{!found.length && <p><Link to={`/search?q=${encodeURIComponent(query)}`} className="underline">Try the full search</Link></p>}</div>
            <ul className="topics-found">
              {found.map((id) => {
                const place = placeOf(index, id);
                const Icon = groupIcon(place?.subcategory.id ?? "");
                return <li key={id} style={tint(place?.category.id ?? "")}><Link to={topicUrl(id)} className="topics-compact-card"><Icon size={28} strokeWidth={1.35} aria-hidden /><span><strong>{topics[id].title}</strong><small>{place ? `${place.category.title} › ${place.subcategory.title}` : ""} · {formatNumber(topics[id].refs)} passages</small></span><ArrowUpRight size={15} aria-hidden /></Link></li>;
              })}
            </ul>
          </section>
        ) : (
          <div className="topics-rows">
            {rows.map((row, i) => <SectionRow key={row.id} row={row} number={i + 1} start={startOf(row)} index={index} />)}
          </div>
        )}

        <div className="topics-note"><span><BookOpen size={16} aria-hidden />Topics, points and references: R. A. Torrey, The New Topical Textbook (1897), and Orville J. Nave, Nave's Topical Bible (1896/1903); articles: M. G. Easton, Illustrated Bible Dictionary (1897); all public domain. Families and groups by the Bible Project.</span><Link to="/search">Search everything <ArrowUpRight size={14} aria-hidden /></Link></div>
      </div>
    </div>
  );
}
