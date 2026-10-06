import { useMemo, useState } from "react";
import { StreetAtlasMap } from "@/components/atlas/StreetAtlasMap";
import { PlacePanel } from "@/components/atlas/PlacePanel";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { projectPlace, type MapPlace } from "@/components/atlas/projection";
import { loadPlaces } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { useCatalog } from "@/lib/catalog";
import { sectionOfNum, splitId } from "@/lib/refs";
import type { SectionId } from "@/lib/types";
import type { CityChoice } from "./city-collections";

export function CityMapExperience({ choice, visit }: { choice: CityChoice; visit: number }) {
  const raw = useAsync(loadPlaces, "places");
  const catalog = useCatalog();
  const wide = useMediaQuery("(min-width: 1024px)");
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [lastVisit, setLastVisit] = useState(visit);
  if (lastVisit !== visit) { setLastVisit(visit); setInspectedId(null); }
  const places = useMemo<MapPlace[]>(() => raw.status !== "ready" ? [] : raw.value.map((place) => {
    const [x, y] = projectPlace(place);
    const counts = new Map<SectionId, number>();
    place.verses.forEach((id) => { const section = sectionOfNum(catalog, splitId(id).num); counts.set(section, (counts.get(section) ?? 0) + 1); });
    const section = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "history";
    return { ...place, x, y, section };
  }), [raw, catalog]);
  const jerusalem = places.find((place) => place.name === "Jerusalem") ?? null;
  const inspected = places.find((place) => place.id === inspectedId);
  return <section id="city-map-experience" className="city-map-experience" tabIndex={-1} aria-labelledby="city-map-title" data-map-city="Jerusalem" data-selected-city={choice.id}>
    <header><div><p className="places-kicker">Your city</p><h2 id="city-map-title">{choice.title}</h2></div><span>Jerusalem map · shared demonstration view</span></header>
    {raw.status === "loading" && <div className="city-map-loading" role="status">Loading the map…</div>}
    {raw.status === "error" && <p role="alert">The map could not load. Refresh to try again.</p>}
    {jerusalem && <StreetAtlasMap places={places} selected={inspected ?? jerusalem} initialRegion="Jerusalem" focusKey={visit} onSelect={(place) => setInspectedId(place.id)} coveredFraction={wide && inspected ? .36 : 0} overlay={wide && inspected ? <div className="absolute bottom-3 right-4 top-3 w-[min(24rem,40%)]"><PlacePanel place={inspected} onClose={() => setInspectedId(null)} overlay /></div> : undefined} />}
    {!wide && inspected && <PlacePanel place={inspected} onClose={() => setInspectedId(null)} overlay={false} />}
  </section>;
}
