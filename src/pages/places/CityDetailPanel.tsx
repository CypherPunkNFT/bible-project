import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { OutsideScroll } from "@/components/OutsideScroll";
import { useCatalog } from "@/lib/catalog";
import { loadPlaces } from "@/lib/data";
import { bookByNum, splitId } from "@/lib/refs";
import { useAsync } from "@/lib/useAsync";
import type { CityChoice } from "./city-collections";
import { CITY_DETAILS } from "./city-details";
import { resolveCityPlace } from "./city-places";

/** The open city: its church and setting where written, and every verse that names it, by book. */
export function CityDetailPanel({ city, onBack }: { city: CityChoice; onBack: () => void }) {
  const catalog = useCatalog();
  const raw = useAsync(loadPlaces, "places");
  const place = raw.status === "ready" ? resolveCityPlace(raw.value, city) : null;
  const detail = CITY_DETAILS[city.id];
  const byBook = new Map<number, number[]>();
  for (const id of [...(place?.verses ?? [])].sort((a, b) => a - b)) byBook.set(splitId(id).num, [...(byBook.get(splitId(id).num) ?? []), id]);

  return <div className="city-detail">
    <button type="button" className="places-collections-back" onClick={onBack}><ArrowLeft size={16} aria-hidden />All cities</button>
    <div className="city-detail-heading"><h3>{city.title}</h3><p>{city.subtitle}</p></div>
    <div className="city-detail-columns">
      <div className="city-detail-story">
        {detail ? <>
          <section><h4>{detail.churchTitle}</h4><p>{detail.church}</p><Link to={detail.passage.path}><BookOpen size={14} aria-hidden />Read {detail.passage.label}<ArrowUpRight size={13} aria-hidden /></Link></section>
          <section><h4>The city</h4><p>{detail.city}</p></section>
        </> : <section><h4>The city</h4><p>{city.subtitle}. {place ? `${city.title} is named in ${place.verses.length} ${place.verses.length === 1 ? "verse" : "verses"}; each reference opens the passage.` : ""}</p></section>}
      </div>
      <section className="city-detail-verses" aria-label={`Where ${city.title} is named`}>
        <h4>Where it is named{place ? ` · ${place.verses.length} ${place.verses.length === 1 ? "verse" : "verses"}` : ""}</h4>
        {raw.status === "loading" && <p className="city-detail-muted" role="status">Loading…</p>}
        {raw.status === "ready" && !place && <p className="city-detail-muted">This city is not in the atlas data yet.</p>}
        {place && <OutsideScroll label={`Passages naming ${city.title}`} className="city-detail-scroll"><ul>{[...byBook.entries()].map(([num, ids]) => {
          const book = bookByNum(catalog, num);
          return <li key={num}><strong>{book?.name ?? `Book ${num}`}</strong> {ids.map((id, index) => {
            const { chapter, verse } = splitId(id);
            return <span key={id}>{index > 0 && ", "}{book ? <Link to={`/read/kjv/${book.code}/${chapter}?v=${verse}`}>{chapter}:{verse}</Link> : `${chapter}:${verse}`}</span>;
          })}</li>;
        })}</ul></OutsideScroll>}
      </section>
    </div>
  </div>;
}
