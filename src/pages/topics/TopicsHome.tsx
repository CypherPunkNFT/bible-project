import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BookOpenText, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categoryStyle, FAMILY_EYEBROW, groupIcon, TOPIC_SECTIONS } from "@/lib/topic-style";
import { categoryUrl, matchTopics, placeOf, topicUrl, type TopicCategory, type TopicIndex } from "@/lib/topics";
import { formatNumber } from "@/lib/utils";
import { MeaningPrompt } from "@/components/search/MeaningPrompt";
import { TopicsArtwork } from "./TopicsArtwork";
import { useEqualCardHeights } from "./useEqualCardHeights";
import { morph, orderedFamilies, tint } from "./topics-shared";

const POPULAR = ["love-of-god", "prayer", "faith", "grace", "afflictions", "christ-the-shepherd", "heaven", "holy-spirit-the-is-god"];

function FamilyCard({ family, number }: { family: TopicCategory; number: number }) {
  const { Icon } = categoryStyle(family.id);
  const topics = family.subcategories.reduce((n, sub) => n + sub.topics.length, 0);
  return (
    <Link to={categoryUrl(family.id)} className="topics-family-card" data-topics-morph style={morph(family.id)} aria-labelledby={`topics-card-${family.id}`}>
      <div className="topics-card-top"><Icon size={18} strokeWidth={1.5} aria-hidden /><span>{FAMILY_EYEBROW[family.id] ?? "Topics"}</span><ArrowUpRight size={19} aria-hidden /></div>
      <TopicsArtwork kind={family.id} />
      <div className="topics-card-copy"><span className="topics-card-number">{String(number).padStart(2, "0")}</span><h3 id={`topics-card-${family.id}`}>{family.title}</h3><p>{family.description}</p></div>
      <div className="topics-card-foot"><span>{family.subcategories.slice(0, 3).map((sub) => sub.title).join(" · ")}{family.subcategories.length > 3 ? " · More" : ""}</span><strong>{topics} topics in {family.subcategories.length} groups<ArrowRight size={15} aria-hidden /></strong></div>
    </Link>
  );
}

type Row = { id: string; title: string; description: string; families: TopicCategory[] };

function SectionRow({ row, number, start }: { row: Row; number: number; start: number }) {
  return (
    <section aria-labelledby={`topics-row-${row.id}`}>
      <div className="topics-row-heading"><h2 id={`topics-row-${row.id}`}><span>{String(number).padStart(2, "0")}</span>{row.title}</h2><p>{row.description}</p></div>
      <nav aria-label={row.title} className="topics-families">{row.families.map((family, i) => <FamilyCard key={family.id} family={family} number={start + i} />)}</nav>
    </section>
  );
}

function sectionRows(categories: TopicCategory[]): Row[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const placed = new Set(TOPIC_SECTIONS.flatMap((s) => s.categories));
  return [
    ...TOPIC_SECTIONS.map((s) => ({ ...s, families: s.categories.flatMap((id) => byId.get(id) ?? []) })),
    { id: "more", title: "More topics", description: "Families not yet placed in a section.", families: categories.filter((c) => !placed.has(c.id)) },
  ].filter((row) => row.families.length > 0);
}

/** The topic sections and their families as illustrated cards: the body of the Topics home, and shown on the Search page too. */
export function TopicSectionRows({ index }: { index: TopicIndex }) {
  const box = useRef<HTMLDivElement>(null);
  useEqualCardHeights(box);
  const rows = sectionRows(index.categories);
  const order = orderedFamilies(index).map((c) => c.id);
  const startOf = (row: Row) => order.indexOf(row.families[0].id) + 1;
  const wide = rows.filter((row) => row.families.length > 2), pairs = rows.filter((row) => row.families.length <= 2);
  return (
    <div className="topics-rows" ref={box}>
      {wide.map((row) => <SectionRow key={row.id} row={row} number={rows.indexOf(row) + 1} start={startOf(row)} />)}
      {pairs.length > 0 && <div className="topics-pair-row">{pairs.map((row) => <SectionRow key={row.id} row={row} number={rows.indexOf(row) + 1} start={startOf(row)} />)}</div>}
    </div>
  );
}

/** Topics home, in the Atlas collection's style: the twelve families as illustrated cards in four sections. */
export function TopicsHome({ index }: { index: TopicIndex }) {
  const [query, setQuery] = useState("");
  const found = useMemo(() => (query.trim() ? matchTopics(index, query, 60) : []), [index, query]);
  const { categories, topics } = index;
  const groups = categories.reduce((n, c) => n + c.subcategories.length, 0);
  const popular = POPULAR.filter((id) => topics[id]);


  return (
    <div className="topics-collection mx-auto max-w-7xl px-4 sm:px-6">
      <div className="topics-topline"><Link to="/study"><ArrowLeft size={15} aria-hidden />Back to Study</Link><span>Topics</span></div>
      <div className="topics-page-slide">
        <header className="topics-intro">
          <div className="topics-intro-copy">
            <p className="topics-kicker">Scripture, subject by subject</p>
            <h1>Every subject.<br /><em>Every verse.</em></h1>
            <p>{formatNumber(Object.keys(topics).length)} topics in {categories.length} families and {groups} groups, each with the passages that speak to it.</p>
            <label className="topics-finder"><Search size={18} aria-hidden /><span className="sr-only">Find a topic</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a topic: grace, prayer, the Sabbath, lions…" /></label>
            <MeaningPrompt query={query} className="mt-3 max-w-[34rem]" />
            {!query && popular.length > 0 && <p className="topics-popular"><span>Popular</span>{popular.map((id) => <Link key={id} to={topicUrl(id)}>{topics[id].title}</Link>)}</p>}
          </div>
          <div className="topics-intro-emblem" aria-hidden><BookOpenText strokeWidth={.65} /><span>SUBJECT · PASSAGE · VERSE</span></div>
        </header>

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
          <TopicSectionRows index={index} />
        )}

        <div className="topics-note"><span><BookOpen size={16} aria-hidden />Topics, points and references: R. A. Torrey, The New Topical Textbook (1897), public domain. Families and groups by the Bible Project.</span><Link to="/search">Search everything <ArrowUpRight size={14} aria-hidden /></Link></div>
      </div>
    </div>
  );
}
