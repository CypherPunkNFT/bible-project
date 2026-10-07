import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { CSSProperties } from "react";
import { CITY_COLLECTIONS, type CityChoice } from "./city-collections";
import { CityDetailPanel } from "./CityDetailPanel";
import { FindCityCard } from "./CityDirectory";
import { CityMapExperience } from "./CityMapExperience";
import { RevealSelection } from "./RevealSelection";
import "./city-detail.css";

/** Collections open into one card: its cities (or the open city) on top, the collection's map as the bottom half. */
export function CitySelection({ collection, choice, expanded, cityOpen, visit, onCollection, onCity, onCloseCity, onBack }: {
  collection: typeof CITY_COLLECTIONS[number]; choice: CityChoice; expanded: boolean; cityOpen: boolean; visit: number;
  onCollection: (entry: typeof CITY_COLLECTIONS[number]) => void; onCity: (id: string) => void; onCloseCity: () => void; onBack: () => void;
}) {
  return <section className="places-city-selector" {...(expanded ? { "aria-label": collection.title } : { "aria-labelledby": "city-collections-title" })}>
    {!expanded && <div className="places-section-heading"><h2 id="city-collections-title">Choose a collection</h2><span>Explore the ancient world</span></div>}
    <RevealSelection expanded={expanded} selectionKey={collection.id} onBack={onBack} grid={
      <div className="places-city-collection-grid" role="group" aria-label="City collections">
        {CITY_COLLECTIONS.map((entry) => <button key={entry.id} type="button" data-selection-key={entry.id} className="places-compact-card" style={{ "--places-color": `var(--${entry.color})` } as CSSProperties} onClick={() => onCollection(entry)} aria-label={entry.title}>
          <entry.icon size={34} strokeWidth={1.35} aria-hidden /><span><strong>{entry.title}</strong><small>{entry.subtitle}</small></span><ArrowUpRight size={15} aria-hidden />
        </button>)}<FindCityCard />
      </div>
    }>
      <article className="places-city-card is-expanded" style={{ "--places-color": `var(--${collection.color})` } as CSSProperties}>
        <div className="places-city-card-interior">
          <div className="places-city-card-navigation"><button className="places-collections-back" onClick={onBack}><ArrowLeft size={16} aria-hidden />All collections</button><span aria-hidden>/</span><span>{collection.title}</span>{cityOpen && <><span aria-hidden>/</span><span>{choice.title}</span></>}</div>
          <div className="places-city-card-heading"><collection.icon size={36} strokeWidth={1.35} aria-hidden /><div><h3>{collection.title}</h3><p>{collection.subtitle}</p></div></div>
          <p className="places-city-card-description">{collection.description}</p>
          <RevealSelection expanded={cityOpen} selectionKey={choice.id} onBack={onCloseCity} grid={
            <div className="places-choices places-city-choices" role="group" aria-label="Which city will you explore?">{collection.cities.map((city) => <button key={city.id} type="button" data-selection-key={city.id} aria-pressed={city.id === choice.id} onClick={() => onCity(city.id)}><span><strong>{city.title}</strong><small>{city.subtitle}</small></span>{city.id === choice.id ? <Check size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}</button>)}</div>
          }><CityDetailPanel city={choice} onBack={onCloseCity} /></RevealSelection>
        </div>
        <CityMapExperience choice={choice} visit={visit} />
      </article>
    </RevealSelection>
  </section>;
}
