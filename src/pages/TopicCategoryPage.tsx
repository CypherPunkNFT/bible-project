import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { RevealSelection } from "@/pages/places/RevealSelection";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { TopicsShell } from "@/pages/topics/TopicsShell";
import { groupIcon, sectionOf } from "@/lib/topic-style";
import { topicCount, topicUrl, type TopicCategory, type TopicIndex, type TopicSubcategory } from "@/lib/topics";
import { formatNumber } from "@/lib/utils";

const passagesOf = (sub: TopicSubcategory, index: TopicIndex) => sub.topics.reduce((n, id) => n + (index.topics[id]?.refs ?? 0), 0);

/** One group opened: its topics as small cards, most-cited first, and the way on to the other groups. */
function GroupDetail({ family, group, index, onChoose }: { family: TopicCategory; group: TopicSubcategory; index: TopicIndex; onChoose: (id?: string) => void }) {
  const Icon = groupIcon(group.id);
  const ordered = [...group.topics].sort((a, b) => (index.topics[b]?.refs ?? 0) - (index.topics[a]?.refs ?? 0));
  return (
    <article className="topics-group-detail">
      <div className="topics-detail-nav"><button type="button" className="topics-back places-collections-back" onClick={() => onChoose()}><ArrowLeft size={16} aria-hidden />All groups</button><span aria-hidden>/</span><span>{group.title}</span></div>
      <div className="topics-detail-heading">
        <Icon size={36} strokeWidth={1.35} aria-hidden />
        <div><h3>{group.title}</h3><p>{group.description}</p></div>
        <span className="topics-detail-count">{group.topics.length} topics · {formatNumber(passagesOf(group, index))} passages</span>
      </div>
      <ul className="topics-topic-grid" aria-label={`Topics in ${group.title}`}>
        {ordered.map((id) => {
          const topic = index.topics[id];
          return topic && <li key={id}><Link to={topicUrl(id)}><span><strong>{topic.title}</strong><small>{topic.points} points · {formatNumber(topic.refs)} passages</small></span><ArrowRight size={14} aria-hidden /></Link></li>;
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
        <TopicsArtwork kind={family.id} />
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
          <GroupDetail family={family} group={selected} index={index} onChoose={choose} />
        </RevealSelection>
      </section>
    </TopicsShell>
  );
}
