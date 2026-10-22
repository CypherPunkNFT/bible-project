// /resources/fellowships: the Fellowships page in the Help for life style (owner, 2026-10-21: "no map, very little content
// except a list; Help for life is the inspiration"; approved 2026-10-22). The title with its words and numbers and the
// Acts 2:42 drawing beside it; the national fellowships from fellowships.json as a directory, chosen by who it is for and
// by kind; then where they meet, city by city, on the same maps as Help for life; and how the list is made. The page's
// colour is the site's gold (owner, 2026-10-22: the Resources station's colour stays there).
import { useEffect, useMemo, type CSSProperties } from "react";
import { useResource, type FellowshipsData } from "@/data/resources";
import { FellowshipDirectory } from "./fellowships/Directory";
import { Gatherings } from "./fellowships/Gatherings";
import { TableArt } from "./fellowships/TableArt";
import { hasCityFiles, listOf } from "./life/format";
import { RESOURCE_SECTIONS, sectionBySlug } from "./sections";
import "./life/life.css";
import "./fellowships/fellowships.css";

export default function FellowshipsPage({ data }: { data: FellowshipsData }) {
  const info = sectionBySlug("fellowships");
  useEffect(() => { document.title = `${info.title} · Resources · Bible Project`; return () => { document.title = "Bible Project"; }; }, [info.title]);
  const places = useResource("fellowship-cities");
  const cities = useMemo(() => (typeof places === "object" ? places.cities.filter((c) => c.places.length > 0 && hasCityFiles(c.id)) : []), [places]);
  const all = data.groups.flatMap((g) => g.entries);
  // How many places the city maps pin for each fellowship, for the "On the map" button on its row.
  const mapped = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cities) for (const p of c.places) counts.set(p.fellowship, (counts.get(p.fellowship) ?? 0) + 1);
    return counts;
  }, [cities]);
  const pinned = cities.reduce((n, c) => n + c.places.length, 0);
  const stats: [string, string | number][] = [["Fellowships", all.length], ["Group finders", all.filter((f) => f.locator).length],
    ...(cities.length ? [["Places mapped", pinned], ["Cities", cities.length]] as [string, number][] : []), ["Checked", typeof places === "object" ? places.checked : data.checked]];
  return <div className="lf-page fw-page mx-auto max-w-7xl px-4 sm:px-6" style={{ "--door": "var(--accent)" } as CSSProperties}>
    <header className="lf-hero">
      <div>
        <p className="lf-kick">Resources · {String(RESOURCE_SECTIONS.indexOf(info) + 1).padStart(2, "0")}</p>
        <h1>{info.title} <em>around the Word, together</em></h1>
        <p className="lf-lead">National fellowships that gather believers to pray and to study the word together, across the country and online. Each says who it is for, how it meets and what it costs, and has its own group finder{cities.length ? `. In ${listOf(cities.map((c) => c.name.split(",")[0]))}, a map shows the groups and churches those finders list, street by street` : ""}.</p>
        <dl className="lf-stats">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("en-US") : value}</dd></div>)}</dl>
      </div>
      <TableArt />
    </header>
    <FellowshipDirectory data={data} mapped={mapped} mapCities={cities.length} />
    {typeof places === "object" && <Gatherings data={data} cities={places} />}
    <p className="fw-how"><strong>How this list is made.</strong> Every fact is copied from the fellowship’s own pages, and each entry links to the page it was checked on. A place is on a map only when the fellowship’s own finder (or the host’s own page) lists it; its street address is placed by the US Census Bureau’s geocoder. A church is on a map only when its denomination, its network or its own website shows that it holds to the gospel with men as its pastors and elders, and nothing found affirms same-sex relationships, names a liberal denomination or teaches the prosperity gospel; a church where this could not be shown is left off. Listing a fellowship is not an endorsement of every group that meets under its name.</p>
  </div>;
}
