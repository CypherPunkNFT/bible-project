import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { loadPlaces } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";

import { ATLAS_BASE as BASE } from "./routes";
export function FindCityCard() {
  return <Link to={`${BASE}/cities/find`} className="places-compact-card places-find-city" aria-label="Find Your City">
    <Search size={34} strokeWidth={1.35} aria-hidden /><span><strong>Find Your City</strong><small>Search the places behind the stories</small></span><ArrowUpRight size={15} aria-hidden />
  </Link>;
}

export function CityDirectory() {
  const data = useAsync(loadPlaces, "places");
  const [search, setSearch] = useSearchParams();
  const query = search.get("q") ?? "";
  const page = Math.max(0, Number.parseInt(search.get("page") ?? "0", 10) || 0);
  const cities = data.status === "ready" ? data.value.filter((place) => place.type === "settlement" && place.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const last = Math.max(0, Math.ceil(cities.length / 24) - 1);
  const current = Math.min(page, last);
  const changePage = (value: number) => { const next = new URLSearchParams(search); next.set("page", String(value)); setSearch(next); };
  return <>
    <header className="places-destination-intro"><p className="places-kicker">The city directory</p><h1>Find your city.</h1><p>Choose a city or settlement by name. Open its location and the passages that name it in the atlas.</p></header>
    <Link className="places-collections-back" to={`${BASE}/cities`}><ArrowLeft size={16} aria-hidden />All city collections</Link>
    <section className="places-city-directory" aria-label="City directory">
      <label className="places-directory-search"><Search size={18} aria-hidden /><span className="sr-only">Search cities</span><input type="search" value={query} placeholder="Jerusalem, Corinth, Nineveh…" onChange={(event) => { const next = new URLSearchParams(search); next.set("q", event.target.value); next.delete("page"); setSearch(next, { replace: true }); }} /></label>
      {data.status === "loading" && <p role="status">Loading cities…</p>}
      {data.status === "error" && <p role="alert">The directory could not load. Refresh to try again.</p>}
      {data.status === "ready" && <>
        <p className="places-city-overlap" role="status">{cities.length} matching cities and settlements · OpenBible.info</p>
        <div className="places-directory-results">{cities.slice(current * 24, current * 24 + 24).map((place) => <Link key={place.id} to={`${BASE}/map?place=${place.id}`}><strong>{place.name}</strong><span>{place.verses.length} passages · {place.lat.toFixed(1)}°, {place.lon.toFixed(1)}°</span><ArrowUpRight size={15} aria-hidden /></Link>)}</div>
        {!cities.length && <p>No cities match “{query}”. Try a shorter name or another spelling.</p>}
        {cities.length > 24 && <nav className="places-directory-pages" aria-label="Directory pages"><button disabled={current === 0} onClick={() => changePage(current - 1)}><ArrowLeft size={15} aria-hidden />Previous</button><span>Page {current + 1} of {last + 1}</span><button disabled={current === last} onClick={() => changePage(current + 1)}>Next<ArrowRight size={15} aria-hidden /></button></nav>}
      </>}
    </section>
  </>;
}
