import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Compass, Landmark, Map, Route as RouteIcon } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { PlacesArtwork } from "./PlacesArtwork";
import { CITY_COLLECTIONS } from "./city-collections";
import { JourneyExperience } from "./JourneyExperience";
import { JourneysHero } from "./JourneysHero";
import { AtlasLayerStack } from "./AtlasLayerStack";
import { Emblem, Seal } from "./journey-emblems";
import { PERSON_TONE, hasEmblem } from "./journey-emblems-data";
import "./journeys-pilgrim.css";
import { CitySelection } from "./CitySelection";
import { CityDirectory } from "./CityDirectory";
import { HISTORY_COLLECTIONS, type HistoryId } from "./history-collections";
import { HistoryExperience } from "./HistoryExperience";
import { usePlacesPageSlide } from "./usePlacesPageSlide";
import { AtlasFindLink } from "./AtlasFindLink";
import { TransitionTicker } from "@/components/ticker/TransitionTicker";
import "./places-collection.css";

import { ATLAS_BASE as BASE, atlasDestination } from "./routes";
const DESTINATIONS = [
  { id: "atlas", title: "Atlas", eyebrow: "Find a place", icon: Map, color: "poetry", description: "Explore the biblical world. Find a city, a mountain, or a sea, and read the passages that name it.", detail: "Places · Regions · Scripture", action: "Explore the atlas" },
  { id: "journeys", title: "Journeys", eyebrow: "Follow a life", icon: RouteIcon, color: "accent", description: "Follow people through the places that shaped their stories. See the encounters, companions, and turning points along the way.", detail: "Paul · Abraham · Moses · More", action: "Choose a journey" },
  { id: "cities", title: "Ancient Cities", eyebrow: "Enter their world", icon: Landmark, color: "history", description: "Get to know a city behind the text. Explore its setting, its people, and the moments that make it part of the story.", detail: "Jerusalem · Corinth · Beyond", action: "Choose a city" },
  { id: "gospels", title: "Gospel Events", eyebrow: "Walk through the accounts", icon: BookOpen, color: "gospels", description: "Follow the life of Jesus across the land. Explore events in their setting and see how the four Gospels tell them.", detail: "Four accounts · Places & encounters", action: "Explore the Gospels" },
] as const;
export type PlacesDestination = typeof DESTINATIONS[number]["id"] | HistoryId;
type PreviewId = "journeys" | "cities" | "gospels";
type Choice = { id: string; title: string; subtitle: string; place: string };
type Lens = { id: string; label: string; title: string; description: string };
type Experience = { kicker: string; title: string; description: string; choose: string; options: Choice[]; lenses: Lens[]; next: string };
const EXPERIENCES: Record<PreviewId, Experience> = {
  journeys: {
    kicker: "Explore by person", title: "Follow a life. See the story unfold.", description: "Choose a person, then a way of looking. One journey can open onto people, teaching, letters, and the world around them.", choose: "Whose journey will you follow?",
    options: [
      { id: "paul", title: "Paul", subtitle: "Damascus to Rome", place: "Damascus" },
      { id: "abraham", title: "Abraham", subtitle: "Called to go", place: "Haran" },
      { id: "moses", title: "Moses", subtitle: "Egypt & the wilderness", place: "Egypt" },
      { id: "ruth", title: "Ruth", subtitle: "Moab to Bethlehem", place: "Bethlehem" },
      { id: "david", title: "David", subtitle: "Wilderness & kingdom", place: "Hebron" },
      { id: "peter", title: "Peter", subtitle: "Galilee & beyond", place: "Capernaum" },
    ],
    lenses: [
      { id: "story", label: "Story", title: "Follow the turning points.", description: "Move from one scene to the next, with the place, the passage, and its significance together." },
      { id: "people", label: "People", title: "Meet the people along the way.", description: "See who arrives, who travels together, and how relationships develop across the journey." },
      { id: "teaching", label: "Teaching", title: "Hear the message in its setting.", description: "Connect teaching with the audience, encounter, and place in which Scripture presents it." },
      { id: "letters", label: "Letters", title: "Connect places and correspondence.", description: "Explore relevant letters and their recipients alongside the journey, with proposed dates and locations identified." },
      { id: "setting", label: "Setting", title: "Understand the world of the journey.", description: "Explore terrain, travel, and historical context beside the biblical account." },
    ], next: "The guided route, scene-by-scene navigation, and passages come next.",
  },
  cities: {
    kicker: "Explore by city", title: "Enter a city. Understand its story.", description: "Look beyond the dot on the map. Discover the setting, people, and passages that give a place its meaning.", choose: "Which city will you explore?",
    options: CITY_COLLECTIONS[0].cities,
    lenses: [
      { id: "setting", label: "City & setting", title: "Get your bearings.", description: "Explore a city's surroundings and landmarks, with historical periods and proposed reconstructions clearly identified." },
      { id: "people", label: "People", title: "See who belongs to this story.", description: "Connect the city with people who lived, taught, worshiped, and encountered one another there." },
      { id: "events", label: "Events", title: "One place. Many moments.", description: "Explore events associated with the city and follow their passages into the reader." },
      { id: "passages", label: "Passages", title: "Read the city through Scripture.", description: "Bring its biblical appearances together, with their surrounding chapters close at hand." },
      { id: "then-now", label: "Then & now", title: "Connect the ancient and present landscape.", description: "Compare historical evidence, proposed locations, and the surviving site." },
    ], next: "The city guide, historical layers, and landmark exploration come next.",
  },
  gospels: {
    kicker: "Explore by event", title: "Four accounts. A world of encounters.", description: "Choose a part of Jesus’ life, then an account to follow. Keep the place, the passage, and the Gospel’s own perspective together.", choose: "Where in the story will you begin?",
    options: [
      { id: "beginnings", title: "Beginnings", subtitle: "Birth & early life", place: "Bethlehem" },
      { id: "galilee", title: "Galilee", subtitle: "Calling, teaching & signs", place: "Capernaum" },
      { id: "on-the-road", title: "On the road", subtitle: "Journeys & encounters", place: "Jericho" },
      { id: "jerusalem", title: "Jerusalem", subtitle: "Teaching in the city", place: "Jerusalem" },
      { id: "passion", title: "Passion week", subtitle: "The way to the cross", place: "Jerusalem" },
      { id: "resurrection", title: "Resurrection", subtitle: "Appearances & commission", place: "Jerusalem" },
    ],
    lenses: [
      { id: "together", label: "All four", title: "Bring the accounts into conversation.", description: "See which Gospels tell an event, compare their passages, and keep differences in sequence visible." },
      ...["Matthew", "Mark", "Luke", "John"].map((name) => ({ id: name.toLowerCase(), label: name, title: `Follow ${name}’s account.`, description: `Explore the events in ${name}’s narrative order, with connections to the other accounts available at each stop.` })),
    ], next: "The mapped events, account comparisons, and scene navigation come next.",
  },
};

const tint = (color: string) => ({ "--places-color": `var(--${color})` }) as CSSProperties;
// Each big Atlas card and its small tile on a sub-page share one transition name, so the card folds into the tile.
const morph = (id: string, color: string) => ({ ...tint(color), "--places-morph": `places-card-${id}` }) as CSSProperties;

export function AtlasCollection({ atlas }: { atlas: ReactNode }) {
  const slide = usePlacesPageSlide();
  return <div onClickCapture={slide}><Routes>
    <Route index element={<CollectionHome />} />
    <Route path="map" element={<DestinationShell id="atlas">{atlas}</DestinationShell>} />
    <Route path="cities/motion" element={<LegacyCityMotion />} />
    <Route path="cities/find" element={<DestinationShell id="cities"><CityDirectory /></DestinationShell>} />
    {HISTORY_COLLECTIONS.map(({ id }) => <Route key={id} path={id} element={<DestinationShell id={id}><HistoryExperience key={id} id={id} /></DestinationShell>} />)}
    {(["journeys", "cities", "gospels"] as const).map((id) => <Route key={id} path={id} element={<DestinationShell id={id}><ExperiencePreview id={id} /></DestinationShell>} />)}
    <Route path="*" element={<Navigate to={BASE} replace />} />
  </Routes><TransitionTicker /></div>;
}

function LegacyCityMotion() {
  const [search] = useSearchParams();
  const next = new URLSearchParams(search); next.delete("design");
  return <Navigate to={`${BASE}/cities${next.size ? `?${next}` : ""}`} replace />;
}

function CollectionHome() {
  const { hash } = useLocation();
  const [search] = useSearchParams();
  // Keep saved links from the original SVG mockup opening their selected place.
  if (search.has("place") || search.has("find") || ["#places-map", "#top-places"].includes(hash)) return <Navigate to={`${BASE}/map${search.size ? `?${search}` : ""}${hash}`} replace />;
  return <div className="places-collection mx-auto max-w-7xl px-4 sm:px-6">
    <div className="places-topline"><Link to="/study"><ArrowLeft size={15} aria-hidden />Back to Study</Link><span>Atlas</span></div>
    <div className="places-page-slide">
    <header className="places-collection-intro">
      <div><p className="places-kicker">Scripture, place & Christian history</p><h1>Real places.<br /><em>An unfolding story.</em></h1><p>Find a place. Follow a life. Step into the world of the Bible.<br className="hidden sm:block" /> Then explore the communities and movements that followed.</p></div>
      <AtlasLayerStack />
    </header>
    <nav aria-label="Places and journeys collection" className="places-destinations">
      {DESTINATIONS.map((item, index) => <Link key={item.id} to={atlasDestination(item.id)} className="places-destination-card" data-places-morph style={morph(item.id, item.color)} aria-labelledby={`places-card-${item.id}`}>
        <div className="places-card-top"><item.icon size={18} strokeWidth={1.5} aria-hidden /><span>{item.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
        <PlacesArtwork kind={item.id} />
        <div className="places-card-copy"><span className="places-card-number">0{index + 1}</span><h2 id={`places-card-${item.id}`}>{item.title}</h2><p>{item.description}</p></div>
        <div className="places-card-foot"><span>{item.detail}</span><strong>{item.action}<ArrowRight size={15} aria-hidden /></strong></div>
      </Link>)}
    </nav>
    <div className="places-section-heading places-row-heading"><h2>Beyond the New Testament</h2><span>Communities, traditions & a worldwide church</span></div>
    <nav aria-label="Christian history collection" className="places-destinations">
      {HISTORY_COLLECTIONS.map((item, index) => <Link key={item.id} to={atlasDestination(item.id)} className="places-destination-card" data-places-morph style={morph(item.id, item.color)} aria-labelledby={`places-card-${item.id}`}>
        <div className="places-card-top"><item.icon size={18} strokeWidth={1.5} aria-hidden /><span>{item.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
        <PlacesArtwork kind={item.id} />
        <div className="places-card-copy"><span className="places-card-number">0{index + 5}</span><h2 id={`places-card-${item.id}`}>{item.title}</h2><p>{item.description}</p></div>
        <div className="places-card-foot"><span>{item.detail}</span><strong>{item.action}<ArrowRight size={15} aria-hidden /></strong></div>
      </Link>)}
    </nav>
    <div className="places-collection-note"><span><BookOpen size={16} aria-hidden />Every place opens a passage. Every journey invites a closer reading.</span><Link to={`${BASE}/map`}>Open the map <ArrowUpRight size={14} aria-hidden /></Link></div>
    </div>
  </div>;
}

function DestinationShell({ id, children }: { id: PlacesDestination; children: ReactNode }) {
  const item = [...DESTINATIONS, ...HISTORY_COLLECTIONS].find((entry) => entry.id === id)!;
  return <div className="places-collection places-destination mx-auto max-w-7xl px-4 sm:px-6" style={tint(item.color)}>
    <div className="places-topline"><Link to={BASE}><ArrowLeft size={15} aria-hidden />Back to Atlas</Link><Link to={`${BASE}/map`}>Open the map <ArrowUpRight size={13} aria-hidden /></Link></div>
    <nav className="places-collection-nav" aria-label="Explore the collection">
      {[...DESTINATIONS, ...HISTORY_COLLECTIONS].map((entry) => <NavLink key={entry.id} to={atlasDestination(entry.id)} data-places-morph style={morph(entry.id, entry.color)}><entry.icon className="places-tile-icon" strokeWidth={1.35} aria-hidden /><span>{entry.title}</span><ArrowUpRight size={14} aria-hidden /></NavLink>)}
    </nav>
    <div className="places-page-slide">{children}</div>
  </div>;
}

function ExperiencePreview({ id }: { id: PreviewId }) {
  const data = EXPERIENCES[id];
  const [visit, setVisit] = useState(0);
  const [search, setSearch] = useSearchParams();
  // Old city-only links still find their collection; an explicit collection always takes precedence.
  const collection = id === "cities" ? (CITY_COLLECTIONS.find((entry) => entry.id === search.get("collection"))
    ?? (!search.has("collection") ? CITY_COLLECTIONS.find((entry) => entry.cities.some((city) => city.id === search.get("focus"))) : undefined)
    ?? CITY_COLLECTIONS[0]) : undefined;
  const options = collection?.cities ?? data.options;
  const choice = options.find((option) => option.id === search.get("focus")) ?? options[0];
  const lenses = data.lenses.filter((option) => id !== "journeys" || option.id !== "letters" || ["paul", "peter"].includes(choice.id));
  const lens = lenses.find((option) => option.id === search.get("lens")) ?? lenses[0];
  const expanded = search.get("browse") !== "collections" && (search.has("collection") || search.has("focus"));
  const update = (key: string, value: string) => { const next = new URLSearchParams(search); next.set(key, value); if (collection && key === "focus") next.set("collection", collection.id); setSearch(next, { replace: true }); };
  const chooseCollection = (entry: typeof CITY_COLLECTIONS[number]) => {
    const next = new URLSearchParams(search);
    next.delete("browse");
    next.delete("view");
    next.set("collection", entry.id);
    next.set("focus", entry.cities.some((city) => city.id === choice.id) ? choice.id : entry.cities[0].id);
    setSearch(next);
  };
  // A chosen city opens inside its collection card (Back closes it) and the card's map flies there.
  const chooseCity = (value: string) => {
    const next = new URLSearchParams(search);
    next.set("focus", value);
    if (collection) next.set("collection", collection.id);
    next.set("view", "city");
    setSearch(next);
    setVisit((current) => current + 1);
  };
  const closeCity = () => { const next = new URLSearchParams(search); next.delete("view"); setSearch(next); };
  return <>
    <header className="places-destination-intro history-intro"><div><p className="places-kicker">{data.kicker}</p><h1>{data.title}</h1><p>{data.description}</p></div>{id === "journeys" ? <div className="pg-hero-art pg-scope"><JourneysHero /></div> : <PlacesArtwork kind={id} />}</header>
    {collection ? <CitySelection collection={collection} choice={choice} expanded={expanded} cityOpen={expanded && search.get("view") === "city"} visit={visit} onCollection={chooseCollection} onCity={chooseCity} onCloseCity={closeCity} onBack={() => { const next = new URLSearchParams(search); next.set("browse", "collections"); next.delete("view"); setSearch(next); }} /> : <section className="places-choose" aria-labelledby="places-choose-title">
      <div className="places-section-heading"><h2 id="places-choose-title">{data.choose}</h2><span>Choose your starting point</span></div>
      {id === "journeys" ? <div className="pg-people pg-scope" role="group" aria-label={data.choose}>{options.map((option, i) => <button type="button" key={option.id} className="pg-person" aria-pressed={choice.id === option.id} onClick={() => update("focus", option.id)} style={{ "--tone": `var(--${PERSON_TONE[option.id] ?? "accent"})` } as CSSProperties}>
        <Seal id={option.id} /><span className="pg-pnum" aria-hidden>{String(i + 1).padStart(2, "0")}</span><strong>{option.title}</strong><small>{option.subtitle}</small><span className="pg-pgo" aria-hidden><ArrowRight size={15} /></span>
      </button>)}</div>
      : <div className="places-choices" role="group" aria-label={data.choose}>{options.map((option, i) => <button type="button" key={option.id} aria-pressed={choice.id === option.id} onClick={() => update("focus", option.id)}><span className="places-choice-mark" aria-hidden>{String(i + 1).padStart(2, "0")}</span><span><strong>{option.title}</strong><small>{option.subtitle}</small></span></button>)}</div>}
    </section>}
    {id === "journeys" ? <JourneyWorkspace choice={choice} lenses={lenses} lens={lens} onLens={(value) => update("lens", value)} next={data.next} />
      : id !== "cities" && <ExperienceWorkspace id={id} choice={choice} lenses={lenses} lens={lens} onLens={(value) => update("lens", value)} />}
  </>;
}

/** Your journey (Pilgrim direction): the person's seal and lenses; Paul's Story and Letters lenses are the built journey. */
function JourneyWorkspace({ choice, lenses, lens, onLens, next }: { choice: Choice; lenses: Lens[]; lens: Lens; onLens: (id: string) => void; next: string }) {
  const built = choice.id === "paul" && (lens.id === "story" || lens.id === "letters") ? lens.id : null;
  return <section className="pg-journey pg-scope" aria-labelledby="places-workspace-title" style={{ "--tone": `var(--${PERSON_TONE[choice.id] ?? "accent"})` } as CSSProperties}>
    <header className="pg-jhead">
      {hasEmblem(choice.id) && <Seal key={choice.id} id={choice.id} size="lg" draw />}
      <div><p className="places-kicker">Your journey</p><h2 id="places-workspace-title">{choice.title}<span>{choice.subtitle}</span></h2></div>
      <div className="pg-lensbar"><span>Explore through</span><div className="pg-lenses" role="group" aria-label="Choose a lens">{lenses.map((option) => <button type="button" key={option.id} aria-pressed={lens.id === option.id} onClick={() => onLens(option.id)}>{option.label}</button>)}</div></div>
    </header>
    {built ? <JourneyExperience lens={built} />
      : <div className="pg-soon">
        <span className="pg-soon-art">{hasEmblem(choice.id) && <Emblem id={choice.id} size={120} stroke={1} />}</span>
        <div><p className="places-kicker">{lens.label} lens</p><h3>{lens.title}</h3><p>{lens.description}</p>
          <div className="places-next-build"><Compass size={18} aria-hidden /><p>{next}</p></div><AtlasFindLink place={choice.place} /></div>
      </div>}
  </section>;
}

function ExperienceWorkspace({ id, choice, lenses, lens, onLens, showPreviewNotes = true }: {
  id: PreviewId; choice: Choice; lenses: Lens[]; lens: Lens; onLens: (id: string) => void; showPreviewNotes?: boolean;
}) {
  const data = EXPERIENCES[id];
  return (
    <section className="places-workspace" aria-labelledby="places-workspace-title">
      <header><div><p className="places-kicker">{id === "journeys" ? "Your journey" : id === "cities" ? "Your city" : "Your starting point"}</p><h2 id="places-workspace-title">{choice.title}<span>{choice.subtitle}</span></h2></div>{showPreviewNotes && <span className="places-preview-label">Experience preview</span>}</header>
      <div className="places-lens-bar"><span>{id === "gospels" ? "Read through" : "Explore through"}</span><div role="group" aria-label="Choose a lens">{lenses.map((option) => <button type="button" key={option.id} aria-pressed={lens.id === option.id} onClick={() => onLens(option.id)}>{option.label}</button>)}</div></div>
      <div className="places-workspace-body">
        <div className="places-workspace-art" aria-hidden><PlacesArtwork kind={id} /><span>{choice.title} · {choice.subtitle}</span></div>
        <div className="places-lens-copy" aria-live="polite"><p className="places-kicker">{lens.label}{id !== "gospels" ? " lens" : " perspective"}</p><h3>{lens.title}</h3><p>{lens.description}</p>{showPreviewNotes && <div className="places-next-build"><Compass size={18} aria-hidden /><p>{data.next}</p></div>}<AtlasFindLink place={choice.place} /></div>
      </div>
    </section>
  );
}
