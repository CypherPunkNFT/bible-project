// MOCK-UP (home_mockup, home_mockup2): "Close to home", the section above the blessing (owner, 2026-10-23: "the map about
// where to find churches and help"). One city map holding both sets of places the site has researched: the help places
// of /resources/life (life.json) and the churches and groups of /resources/fellowships (fellowship-cities.json), each
// pinned in its own kind's colour, with the map's kind chips to show some kinds only. The heading says the two apart
// (owner, 2026-10-23: finding a church and finding help are not the same thing), each as a row in the hairline
// standard of "Every word, traced to its source" leading to its own page. The map and its zoom: NearbyStage.tsx.
// resourcesTab (owner, 2026-10-23, trying on home_mockup2): three openings with a paragraph on what the section is about
// and one way to Resources, switched by a floating pill: nearby/NearbyIntro.tsx.
import { ArrowRight, Church, LifeBuoy, type LucideIcon } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useResource, type City, type FellowshipCities, type FellowshipsData, type LifeData } from "@/data/resources";
import { hasCityFiles, kindOf, plural } from "@/pages/resources/life/format";
import { shortName, toCity } from "@/pages/resources/fellowships/format";
import { NearbyStage, type Place } from "./NearbyStage";
import { NearbyIntro } from "./nearby/NearbyIntro";
import "@/pages/resources/life/life.css";
import "@/pages/resources/fellowships/fellowships.css";
import "./home-nearby.css";

/** Every city with a map, its help places and its churches and groups together; the local phone lines come from life.json. */
function mergeCities(life: LifeData, fellowships: FellowshipsData, gatherings: FellowshipCities) {
  const byId = new Map(fellowships.groups.flatMap((g) => g.entries.map((f) => [f.id, { f, kind: g.id }] as const)));
  const lookup = (id: string) => byId.get(id) ?? { f: undefined, kind: "" };
  const cities = new Map<string, City>();
  let help = 0, churches = 0;
  for (const c of life.cities) if (c.verified === true && c.entries.length > 0 && hasCityFiles(c.id)) { cities.set(c.id, c); help += c.entries.length; }
  for (const c of gatherings.cities) {
    if (!c.places.length || !hasCityFiles(c.id)) continue;
    churches += c.places.length;
    const shaped = toCity(c, lookup), had = cities.get(c.id);
    cities.set(c.id, had ? { ...had, entries: [...had.entries, ...shaped.entries] } : shaped);
  }
  const fellowshipOf = new Map(gatherings.cities.flatMap((c) => c.places.map((p) => [p.id, shortName(lookup(p.fellowship).f?.name ?? "") + (p.sbc ? " · Southern Baptist" : "")] as const)));
  const figures = { cities: cities.size, places: help + churches, churches, help };
  return { cities: [...cities.values()] as Place[], fellowshipOf, figures };
}

const WAYS: { to: string; Icon: LucideIcon; title: string; text: string; open: string }[] = [
  { to: "/resources/fellowships", Icon: Church, title: "A church to belong to", open: "Fellowships & churches",
    text: "A church is a family for every week of the year: a place to worship, pray and study the word together, and to be known." },
  { to: "/resources/life", Icon: LifeBuoy, title: "Help for the hardest days", open: "Help for life",
    text: "Help is for a crisis, whoever you are: a pregnancy, an empty cupboard, a loss, an addiction. Places that help, each checked on its own page." },
];

export function HomeNearby({ resourcesTab = false, number, trial = false }: { resourcesTab?: boolean; number?: string; trial?: boolean }) {
  const life = useResource("life"), fellowships = useResource("fellowships"), gatherings = useResource("fellowship-cities");
  const merged = useMemo(() => (typeof life === "object" && typeof fellowships === "object" && typeof gatherings === "object" ? mergeCities(life, fellowships, gatherings) : null), [life, fellowships, gatherings]);
  const words = useMemo(() => ({
    kick: `${merged?.cities.length ?? 0} cities on the map`,
    lead: (places: number, lines: number) => `${plural(places, "place")}${lines ? ` and ${plural(lines, "phone line")}` : ""}: churches and Bible studies, and help for hard times, each checked on its own page.`,
    title: (place: string) => `Near you in ${place}`,
    count: (places: number, lines: number) => `${plural(places, "place")} on the map${lines > 0 ? ` · ${plural(lines, "phone line")} below` : ""}`,
    tag: (e: City["entries"][number]) => merged?.fellowshipOf.get(e.id) || kindOf(e.category).short,
  }), [merged]);
  const checked = typeof gatherings === "object" ? gatherings.checked : typeof life === "object" ? life.checked : "";

  return <section className={`hn lf-page fw-page home-wrap${resourcesTab ? " hn-one" : ""}`} aria-labelledby="hn-title" style={{ "--door": "var(--accent)" } as CSSProperties}>
    {resourcesTab ? (merged ? <NearbyIntro figures={merged.figures} number={number} trial={trial} /> : null) : <header className="hn-head">
      <div>
        <p className="home-eyebrow">Close to home</p>
        <h2 id="hn-title">Find your way, <em>close to home.</em></h2>
        <p>Two different things, on one map. Choose a city to see its churches and its places of help, street by street.</p>
      </div>
      <ul className="hn-ways">{WAYS.map(({ to, Icon, title, text, open }, i) => <li key={to}>
        <Link to={to}>
          <span className="hn-way-top"><Icon size={22} strokeWidth={1.5} aria-hidden /><span>{String(i + 1).padStart(2, "0")}</span></span>
          <span className="hn-way-copy"><strong>{title}</strong><span>{text}</span><span className="hn-way-open">{open}<ArrowRight size={14} aria-hidden /></span></span>
        </Link></li>)}</ul>
    </header>}
    {merged?.cities.length ? <NearbyStage cities={merged.cities} words={words} checked={checked} />
      : <p className="lf-wait">{[life, fellowships, gatherings].includes("missing") ? "The map's places are missing." : "Loading the map…"}</p>}
  </section>;
}
