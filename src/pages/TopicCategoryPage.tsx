import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { RevealSelection } from "@/pages/places/RevealSelection";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { TopicsShell } from "@/pages/topics/TopicsShell";
import { familyWords } from "@/pages/topics/topics-shared";
import { groupIcon, sectionOf } from "@/lib/topic-style";
import { pointsAndPassages, topicCount, topicUrl, type TopicCategory, type TopicIndex, type TopicSubcategory } from "@/lib/topics";
import { formatNumber } from "@/lib/utils";

const passagesOf = (sub: TopicSubcategory, index: TopicIndex) => sub.topics.reduce((n, id) => n + (index.topics[id]?.refs ?? 0), 0);

/** Past this many topics a group lists them A to Z, with a filter and a letter bar. */
const LARGE_GROUP = 48;
const sortKey = (title: string) => title.replace(/^The /, "").toLowerCase();

/** One group opened: its topics as small cards (most-cited first, or A to Z with a filter for large groups), and the way on. */
function GroupDetail({ family, group, index, onChoose }: { family: TopicCategory; group: TopicSubcategory; index: TopicIndex; onChoose: (id?: string) => void }) {
  const Icon = groupIcon(group.id);
  const large = group.topics.length > LARGE_GROUP;
  const [filter, setFilter] = useState("");
  const [letter, setLetter] = useState("");
  const ordered = useMemo(() => large
    ? [...group.topics].sort((a, b) => sortKey(index.topics[a]?.title ?? a).localeCompare(sortKey(index.topics[b]?.title ?? b)))
    : [...group.topics].sort((a, b) => (index.topics[b]?.refs ?? 0) - (index.topics[a]?.refs ?? 0)), [group, index, large]);
  const letters = useMemo(() => [...new Set(ordered.map((id) => sortKey(index.topics[id]?.title ?? id).charAt(0).toUpperCase()))], [ordered, index]);
  const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = ordered.filter((id) => {
    const title = index.topics[id]?.title ?? "";
    return (!letter || sortKey(title).charAt(0).toUpperCase() === letter) && words.every((word) => title.toLowerCase().includes(word));
  });
  return (
    <article className="topics-group-detail">
      <div className="topics-detail-nav"><button type="button" className="topics-back places-collections-back" onClick={() => onChoose()}><ArrowLeft size={16} aria-hidden />All groups</button><span aria-hidden>/</span><span>{group.title}</span></div>
      <div className="topics-detail-heading">
        <Icon size={36} strokeWidth={1.35} aria-hidden />
        <div><h3>{group.title}</h3><p>{group.description}</p></div>
        <span className="topics-detail-count">{group.topics.length} topics · {formatNumber(passagesOf(group, index))} passages</span>
      </div>
      {large && (
        <div className="topics-group-tools">
          <label className="topics-group-filter"><Search size={15} aria-hidden /><span className="sr-only">Filter {group.title}</span><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Filter ${group.topics.length} topics…`} /></label>
          <div className="topics-letters" role="group" aria-label="First letter">
            <button type="button" aria-pressed={!letter} onClick={() => setLetter("")}>All</button>
            {letters.map((l) => <button key={l} type="button" aria-pressed={letter === l} onClick={() => setLetter(letter === l ? "" : l)}>{l}</button>)}
          </div>
        </div>
      )}
      {large && !shown.length && <p className="topics-group-empty">No topic in {group.title} matches “{filter}”.</p>}
      <ul className="topics-topic-grid" aria-label={`Topics in ${group.title}`}>
        {shown.map((id) => {
          const topic = index.topics[id];
          return topic && <li key={id}><Link to={topicUrl(id)}><span><strong>{topic.title}</strong><small>{pointsAndPassages(topic.points, topic.refs)}</small></span><ArrowRight size={14} aria-hidden /></Link></li>;
        })}
      </ul>
      {family.subcategories.length > 1 && (
        <nav className="topics-detail-next" aria-label="Other groups">
          <span>More in {family.title}</span>
          {family.subcategories.filter((sub) => sub.id !== group.id).map((sub) => { const SubIcon = groupIcon(sub.id); return <button type="button" key={sub.id} onClick={() => onChoose(sub.id)}><SubIcon size={14} aria-hidden />{sub.title}</button>; })}
        </nav>
      )}
    </article>
  );
}

/** A topic family, in the Atlas collection's style: its groups as cards that roll open into their topics. */
export function TopicFamilyPage({ index }: { index: TopicIndex }) {
  const { category: id = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const { hash } = useLocation();
  const family = index.categories.find((c) => c.id === id);
  // Older links point at a group with #group; ?group= is the current form.
  const requested = search.get("group") ?? (hash ? decodeURIComponent(hash.slice(1)) : null);
  const active = family?.subcategories.find((sub) => sub.id === requested);
  const [last, setLast] = useState<TopicSubcategory | undefined>(active);
  if (active && active !== last) setLast(active);

  if (!family) {
    return <TopicsShell index={index} current="" back={<Link to="/topics"><ArrowLeft size={15} aria-hidden />All topics</Link>}>
      <div className="py-16"><h1 className="font-serif text-3xl">No such topic family.</h1><Link to="/topics" className="mt-4 inline-block underline">All topics</Link></div>
    </TopicsShell>;
  }
  const selected = active ?? (last && family.subcategories.includes(last) ? last : family.subcategories[0]);
  const choose = (group?: string) => {
    const next = new URLSearchParams(search);
    if (group) next.set("group", group); else next.delete("group");
    setSearch(next);
  };

  return (
    <TopicsShell index={index} current={family.id} back={<Link to="/topics"><ArrowLeft size={15} aria-hidden />All topics</Link>}>
      <header className="topics-family-intro">
        <div>
          <p className="topics-kicker">{sectionOf(family.id)?.title ?? "Topics"} · {topicCount(family)} topics</p>
          <h1>{family.title}</h1>
          <p>{family.description} {family.subcategories.length} groups; open one to see its topics.</p>
        </div>
        <TopicsArtwork kind={family.id} words={familyWords(family, index)} />
      </header>
      <section key={family.id} aria-labelledby="topics-groups-title">
        <div className="topics-section-heading"><h2 id="topics-groups-title">{active ? selected.title : "Choose a group"}</h2><span>{active ? family.title : "Every group opens onto its topics"}</span></div>
        <RevealSelection expanded={!!active} selectionKey={selected.id} onBack={() => choose()} grid={
          <div className="topics-group-grid" role="group" aria-label={`Groups in ${family.title}`}>
            {family.subcategories.map((sub) => {
              const Icon = groupIcon(sub.id);
              return <button key={sub.id} type="button" data-selection-key={sub.id} className="topics-compact-card" onClick={() => choose(sub.id)} aria-label={sub.title}>
                <Icon size={34} strokeWidth={1.35} aria-hidden /><span><strong>{sub.title}</strong><small>{sub.topics.length} topics · {sub.description}</small></span><ArrowUpRight size={15} aria-hidden />
              </button>;
            })}
          </div>
        }>
          <GroupDetail key={selected.id} family={family} group={selected} index={index} onChoose={choose} />
        </RevealSelection>
      </section>
    </TopicsShell>
  );
}
