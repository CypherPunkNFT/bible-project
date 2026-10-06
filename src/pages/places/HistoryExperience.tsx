import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, MapPin } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HISTORY_COLLECTIONS, type HistoryId } from "./history-collections";
import { PlacesArtwork } from "./PlacesArtwork";
import { RevealSelection } from "./RevealSelection";

export function HistoryExperience({ id }: { id: HistoryId }) {
  const data = HISTORY_COLLECTIONS.find((entry) => entry.id === id)!;
  const [search, setSearch] = useSearchParams();
  const active = data.topics.find((entry) => entry.id === search.get("topic"));
  const [lastTopic, setLastTopic] = useState(active ?? data.topics[0]);
  if (active && active.id !== lastTopic.id) setLastTopic(active);
  const selected = active ?? lastTopic;
  const choose = (topic?: string) => {
    const next = new URLSearchParams(search);
    if (topic) next.set("topic", topic); else next.delete("topic");
    setSearch(next);
  };
  return <>
    <header className="places-destination-intro history-intro"><div><p className="places-kicker">Beyond the New Testament · {data.title}</p><h1>{data.heading}</h1><p>{data.intro}</p></div><PlacesArtwork kind={id} /></header>
    <section className="places-history-selection" aria-labelledby="history-selection-title">
      <div className="places-section-heading"><h2 id="history-selection-title">{active ? selected.title : data.choose}</h2><span>{active ? data.title : "Choose a starting point. Explore in any order."}</span></div>
      <RevealSelection expanded={!!active} selectionKey={selected.id} onBack={() => choose()} grid={<div className="places-city-collection-grid history-topic-grid" role="group" aria-label={data.choose}>{data.topics.map((topic) => <button key={topic.id} data-selection-key={topic.id} className="places-compact-card" onClick={() => choose(topic.id)} aria-label={topic.title}>
        <data.icon size={34} strokeWidth={1.35} aria-hidden /><span><strong>{topic.title}</strong><small>{topic.subtitle}</small></span><ArrowUpRight size={15} aria-hidden />
      </button>)}</div>}><article className="history-detail">
        <div className="places-city-card-navigation"><button className="places-collections-back" onClick={() => choose()}><ArrowLeft size={16} aria-hidden />{id === "missions" ? "All regions" : "All topics"}</button><span aria-hidden>/</span><span>{selected.title}</span></div>
        <div className="history-detail-heading"><div><p className="places-kicker">{selected.subtitle}</p><h3>{selected.question}</h3></div><PlacesArtwork kind={id} /></div>
        <div className="history-detail-columns">
          <section><h4>Questions to explore</h4><ol className="history-threads">{selected.threads.map((thread, index) => <li key={thread}><span>{String(index + 1).padStart(2, "0")}</span>{thread}</li>)}</ol></section>
          <section><h4><MapPin size={15} aria-hidden />{id === "missions" ? "Regional starting points" : "Places in this story"}</h4><ul className="history-place-list">{selected.places.map((place) => <li key={place}>{place}</li>)}</ul></section>
        </div>
        <section className="history-sources"><h4><BookOpen size={16} aria-hidden />Reading room · {data.title}</h4><p>Start with these texts and accounts. Each source speaks from its own historical or church perspective.</p>{data.sources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={15} aria-hidden /></a>)}</section>
        <nav className="history-topic-next" aria-label="Continue exploring">{data.topics.filter((entry) => entry.id !== selected.id).map((entry) => <button key={entry.id} onClick={() => choose(entry.id)}>{entry.title}<ArrowRight size={14} aria-hidden /></button>)}</nav>
      </article></RevealSelection>
    </section>
  </>;
}
