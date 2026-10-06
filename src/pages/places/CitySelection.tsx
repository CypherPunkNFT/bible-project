import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CITY_COLLECTIONS, type CityChoice } from "./city-collections";
import { FindCityCard } from "./CityDirectory";
import { RevealSelection } from "./RevealSelection";

export function CitySelection({ collection, choice, expanded, onCollection, onCity, onBack }: {
  collection: typeof CITY_COLLECTIONS[number]; choice: CityChoice; expanded: boolean;
  onCollection: (entry: typeof CITY_COLLECTIONS[number]) => void; onCity: (id: string) => void; onBack: () => void;
}) {
  return <section className="places-city-selector" aria-labelledby="city-collections-title">
    <div className="places-section-heading"><h2 id="city-collections-title">{expanded ? "Choose a city" : "Choose a collection"}</h2><span>{expanded ? collection.title : "Explore the ancient world"}</span></div>
    <RevealSelection expanded={expanded} selectionKey={collection.id} onBack={onBack} grid={
      <div className="places-city-collection-grid" role="group" aria-label="City collections">
        {CITY_COLLECTIONS.map((entry) => <button key={entry.id} type="button" data-selection-key={entry.id} className="places-compact-card" style={{ "--places-color": `var(--${entry.color})` } as CSSProperties} onClick={() => onCollection(entry)} aria-label={entry.title}>
          <entry.icon size={34} strokeWidth={1.35} aria-hidden /><span><strong>{entry.title}</strong><small>{entry.subtitle}</small></span><ArrowUpRight size={15} aria-hidden />
        </button>)}<FindCityCard />
      </div>
    }>
      <article className="places-city-card is-expanded" style={{ "--places-color": `var(--${collection.color})` } as CSSProperties}>
        <div className="places-city-card-interior">
          <div className="places-city-card-navigation"><button className="places-collections-back" onClick={onBack}><ArrowLeft size={16} aria-hidden />All collections</button><span aria-hidden>/</span><span>{collection.title}</span></div>
          <div className="places-city-card-heading"><collection.icon size={36} strokeWidth={1.35} aria-hidden /><div><h3>{collection.title}</h3><p>{collection.subtitle}</p></div></div>
          <p className="places-city-card-description">{collection.description}</p>
          <div className="places-choices places-city-choices" role="group" aria-label="Which city will you explore?">{collection.cities.map((city) => <button key={city.id} aria-pressed={city.id === choice.id} onClick={() => onCity(city.id)}><span><strong>{city.title}</strong><small>{city.subtitle}</small></span>{city.id === choice.id ? <Check size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}</button>)}</div>
          <div className="places-city-card-footer"><span>Choose a city to explore the map below.</span><Link to={collection.passage.path}><BookOpen size={14} aria-hidden />{collection.passage.label}<ArrowUpRight size={13} aria-hidden /></Link></div>
        </div>
      </article>
    </RevealSelection>
  </section>;
}
