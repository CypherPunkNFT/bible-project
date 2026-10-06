import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { HISTORY_COLLECTIONS, type HistoryId } from "./history-collections";
import { PlacesArtwork } from "./PlacesArtwork";

export function HistoryExperience({ id }: { id: HistoryId }) {
  const data = HISTORY_COLLECTIONS.find((entry) => entry.id === id)!;
  const [search, setSearch] = useSearchParams();
  const selected = data.topics.find((entry) => entry.id === search.get("topic"));
  const previousTopic = useRef<string | undefined>(selected?.id);
  const back = useRef<HTMLButtonElement>(null);
  const cards = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (previousTopic.current === selected?.id) return;
    const origin = previousTopic.current;
    previousTopic.current = selected?.id;
    if (selected) back.current?.focus({ preventScroll: true });
    else cards.current?.querySelector<HTMLButtonElement>(`[data-history-topic="${origin}"]`)?.focus({ preventScroll: true });
  }, [selected]);
  const choose = (topic?: string) => {
    const next = new URLSearchParams(search);
    if (topic) next.set("topic", topic); else next.delete("topic");
    setSearch(next);
  };
  return <>
    <header className="places-destination-intro history-intro"><div><p className="places-kicker">Beyond the New Testament · {data.title}</p><h1>{data.heading}</h1><p>{data.intro}</p></div><PlacesArtwork kind={id} /></header>
    <section className="places-history-selection" aria-labelledby="history-selection-title" onKeyDown={(event) => { if (event.key === "Escape" && selected) { event.preventDefault(); choose(); } }}>
      <div className="places-section-heading"><h2 id="history-selection-title">{selected ? selected.title : data.choose}</h2><span>{selected ? data.title : "Choose a starting point. Explore in any order."}</span></div>
      {!selected ? <div ref={cards} className="history-topic-grid" role="group" aria-label={data.choose}>{data.topics.map((topic, index) => <button key={topic.id} data-history-topic={topic.id} className="history-topic-card" onClick={() => choose(topic.id)} aria-label={topic.title}>
        <span className="history-topic-top"><span>{String(index + 1).padStart(2, "0")}</span><ArrowUpRight size={18} aria-hidden /></span>
        <PlacesArtwork kind={id} /><h3>{topic.title}</h3><p>{topic.subtitle}</p><span className="history-topic-question">{topic.question}</span>
      </button>)}</div> : <article className="history-detail">
        <div className="places-city-card-navigation"><button ref={back} className="places-collections-back" onClick={() => choose()}><ArrowLeft size={16} aria-hidden />{id === "missions" ? "All regions" : "All topics"}</button><span aria-hidden>/</span><span>{selected.title}</span></div>
        <div className="history-detail-heading"><div><p className="places-kicker">{selected.subtitle}</p><h3>{selected.question}</h3></div><PlacesArtwork kind={id} /></div>
        <div className="history-detail-columns">
          <section><h4>Questions to explore</h4><ol className="history-threads">{selected.threads.map((thread, index) => <li key={thread}><span>{String(index + 1).padStart(2, "0")}</span>{thread}</li>)}</ol></section>
          <section><h4><MapPin size={15} aria-hidden />{id === "missions" ? "Regional starting points" : "Places in this story"}</h4><ul className="history-place-list">{selected.places.map((place) => <li key={place}>{place}</li>)}</ul></section>
        </div>
        <section className="history-sources"><h4><BookOpen size={16} aria-hidden />Reading room · {data.title}</h4><p>Start with these texts and accounts. Each source speaks from its own historical or church perspective.</p>{data.sources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={15} aria-hidden /></a>)}</section>
        <nav className="history-topic-next" aria-label="Continue exploring">{data.topics.filter((entry) => entry.id !== selected.id).map((entry) => <button key={entry.id} onClick={() => choose(entry.id)}>{entry.title}<ArrowRight size={14} aria-hidden /></button>)}</nav>
      </article>}
    </section>
  </>;
}
