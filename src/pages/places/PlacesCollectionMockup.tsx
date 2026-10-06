import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Compass, Landmark, Map, Route as RouteIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { PlacesArtwork } from "./PlacesArtwork";
import { CITY_COLLECTIONS } from "./city-collections";
import { CityMotionLab } from "./CityMotionLab";
import { CityDirectory, FindCityCard } from "./CityDirectory";
import { HISTORY_COLLECTIONS, type HistoryId } from "./history-collections";
import { HistoryExperience } from "./HistoryExperience";
import "./places-collection.css";

const BASE = "/study/places/mockup";
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

export function PlacesCollectionMockup({ atlas }: { atlas: ReactNode }) {
  return <Routes>
    <Route index element={<CollectionHome />} />
    <Route path="atlas" element={<DestinationShell id="atlas">{atlas}</DestinationShell>} />
    <Route path="cities/motion" element={<DestinationShell id="cities"><CityMotionLab renderCity={(choice) => <CityWorkspace choice={choice} />} /></DestinationShell>} />
    <Route path="cities/find" element={<DestinationShell id="cities"><CityDirectory /></DestinationShell>} />
    {HISTORY_COLLECTIONS.map(({ id }) => <Route key={id} path={id} element={<DestinationShell id={id}><HistoryExperience key={id} id={id} /></DestinationShell>} />)}
    {(["journeys", "cities", "gospels"] as const).map((id) => <Route key={id} path={id} element={<DestinationShell id={id}><ExperiencePreview id={id} /></DestinationShell>} />)}
    <Route path="*" element={<Navigate to={BASE} replace />} />
  </Routes>;
}

function CollectionHome() {
  const [search] = useSearchParams();
  // Keep saved links from the original SVG mockup opening their selected place.
  if (search.has("place")) return <Navigate to={`${BASE}/atlas?${search}`} replace />;
  return <div className="places-collection mx-auto max-w-7xl px-4 sm:px-6">
    <div className="places-topline"><Link to="/study"><ArrowLeft size={15} aria-hidden />Back to Study</Link><span>Places & journeys</span></div>
    <header className="places-collection-intro">
      <div><p className="places-kicker">Scripture, place & Christian history</p><h1>Real places.<br /><em>An unfolding story.</em></h1><p>Find a place. Follow a life. Step into the world of the Bible.<br className="hidden sm:block" /> Then explore the communities and movements that followed.</p></div>
      <div className="places-intro-compass" aria-hidden><Compass strokeWidth={.65} /><span>PLACE · PEOPLE · STORY</span></div>
    </header>
    <div className="places-section-heading places-row-heading"><h2>Explore the biblical world</h2><span>Places, people & the Gospel accounts</span></div>
    <nav aria-label="Places and journeys collection" className="places-destinations">
      {DESTINATIONS.map((item, index) => <Link key={item.id} to={`${BASE}/${item.id}`} className="places-destination-card" style={tint(item.color)} aria-labelledby={`places-card-${item.id}`}>
        <div className="places-card-top"><item.icon size={18} strokeWidth={1.5} aria-hidden /><span>{item.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
        <PlacesArtwork kind={item.id} />
        <div className="places-card-copy"><span className="places-card-number">0{index + 1}</span><h2 id={`places-card-${item.id}`}>{item.title}</h2><p>{item.description}</p></div>
        <div className="places-card-foot"><span>{item.detail}</span><strong>{item.action}<ArrowRight size={15} aria-hidden /></strong></div>
      </Link>)}
    </nav>
    <div className="places-section-heading places-row-heading"><h2>Beyond the New Testament</h2><span>Communities, traditions & a worldwide church</span></div>
    <nav aria-label="Christian history collection" className="places-destinations">
      {HISTORY_COLLECTIONS.map((item, index) => <Link key={item.id} to={`${BASE}/${item.id}`} className="places-destination-card" style={tint(item.color)} aria-labelledby={`places-card-${item.id}`}>
        <div className="places-card-top"><item.icon size={18} strokeWidth={1.5} aria-hidden /><span>{item.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
        <PlacesArtwork kind={item.id} />
        <div className="places-card-copy"><span className="places-card-number">0{index + 5}</span><h2 id={`places-card-${item.id}`}>{item.title}</h2><p>{item.description}</p></div>
        <div className="places-card-foot"><span>{item.detail}</span><strong>{item.action}<ArrowRight size={15} aria-hidden /></strong></div>
      </Link>)}
    </nav>
    <div className="places-collection-note"><span><BookOpen size={16} aria-hidden />Every place opens a passage. Every journey invites a closer reading.</span><Link to="/study/places">Open the current atlas <ArrowUpRight size={14} aria-hidden /></Link></div>
  </div>;
}

function DestinationShell({ id, children }: { id: PlacesDestination; children: ReactNode }) {
  const item = [...DESTINATIONS, ...HISTORY_COLLECTIONS].find((entry) => entry.id === id)!;
  return <div className="places-collection places-destination mx-auto max-w-7xl px-4 sm:px-6" style={tint(item.color)}>
    <div className="places-topline"><Link to={BASE}><ArrowLeft size={15} aria-hidden />Places & journeys</Link><Link to="/study/places">Open the current atlas <ArrowUpRight size={13} aria-hidden /></Link></div>
    <nav className="places-collection-nav" aria-label="Explore the collection">
      {[...DESTINATIONS, ...HISTORY_COLLECTIONS].map((entry) => <NavLink key={entry.id} to={`${BASE}/${entry.id}`} style={tint(entry.color)}><PlacesArtwork kind={entry.id} /><span>{entry.title}</span><ArrowUpRight size={14} aria-hidden /></NavLink>)}
    </nav>
    {children}
  </div>;
}

function ExperiencePreview({ id }: { id: PreviewId }) {
  const data = EXPERIENCES[id];
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
    next.set("collection", entry.id);
    next.set("focus", entry.cities.some((city) => city.id === choice.id) ? choice.id : entry.cities[0].id);
    setSearch(next);
  };
  return <>
    <header className="places-destination-intro"><p className="places-kicker">{data.kicker}</p><h1>{data.title}</h1><p>{data.description}</p></header>
    {collection && <p className="motion-lab-note" style={{ marginBlock: "0 1rem" }}><Link to={`${BASE}/cities/motion`}>Compare four animation designs<ArrowRight size={14} aria-hidden /></Link></p>}
    {collection ? <CityCollectionPicker collection={collection} choice={choice} expanded={expanded} onCollection={chooseCollection} onCity={(value) => update("focus", value)} onBack={() => { const next = new URLSearchParams(search); next.set("browse", "collections"); setSearch(next); }} /> : <section className="places-choose" aria-labelledby="places-choose-title">
      <div className="places-section-heading"><h2 id="places-choose-title">{data.choose}</h2><span>Choose your starting point</span></div>
      <div className="places-choices" role="group" aria-label={data.choose}>{options.map((option, i) => <button type="button" key={option.id} aria-pressed={choice.id === option.id} onClick={() => update("focus", option.id)}><span className="places-choice-mark" aria-hidden>{String(i + 1).padStart(2, "0")}</span><span><strong>{option.title}</strong><small>{option.subtitle}</small></span></button>)}</div>
    </section>}
    <ExperienceWorkspace id={id} choice={choice} lenses={lenses} lens={lens} onLens={(value) => update("lens", value)} />
  </>;
}

function CityWorkspace({ choice }: { choice: Choice }) {
  const [search, setSearch] = useSearchParams();
  const lenses = EXPERIENCES.cities.lenses;
  const lens = lenses.find((entry) => entry.id === search.get("lens")) ?? lenses[0];
  return <ExperienceWorkspace id="cities" choice={choice} lenses={lenses} lens={lens} showPreviewNotes={false} onLens={(value) => { const next = new URLSearchParams(search); next.set("lens", value); setSearch(next, { replace: true }); }} />;
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
        <div className="places-lens-copy" aria-live="polite"><p className="places-kicker">{lens.label}{id !== "gospels" ? " lens" : " perspective"}</p><h3>{lens.title}</h3><p>{lens.description}</p>{showPreviewNotes && <div className="places-next-build"><Compass size={18} aria-hidden /><p>{data.next}</p></div>}<Link to={`${BASE}/atlas?find=${encodeURIComponent(choice.place)}`}>Find {choice.place} in the atlas<ArrowRight size={16} aria-hidden /></Link></div>
      </div>
    </section>
  );
}

type CityCollection = typeof CITY_COLLECTIONS[number];
function CityCollectionPicker({ collection, choice, expanded, onCollection, onCity, onBack }: {
  collection: CityCollection; choice: Choice; expanded: boolean;
  onCollection: (entry: CityCollection) => void; onCity: (id: string) => void; onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const selectedCard = useRef<HTMLButtonElement>(null);
  const previousExpanded = useRef(expanded);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (previousExpanded.current === expanded) return;
    previousExpanded.current = expanded;
    (expanded ? backButton.current : selectedCard.current)?.focus({ preventScroll: true });
    if (heading.current && heading.current.getBoundingClientRect().top < 80) heading.current.scrollIntoView({ block: "start" });
  }, [expanded]);
  const visibleCollections = expanded ? [collection] : CITY_COLLECTIONS;
  return <section className="places-city-selector" aria-labelledby="city-collections-title" onKeyDown={(event) => { if (expanded && event.key === "Escape") { event.preventDefault(); onBack(); } }}>
    <div className="places-section-heading">
      <h2 id="city-collections-title" ref={heading}><span className="places-tier-number">01</span>{expanded ? "Choose a city" : "Choose a collection"}</h2>
      <span>{expanded ? "Explore inside this collection" : `${CITY_COLLECTIONS.length} collections and a city directory`}</span>
    </div>
    <LayoutGroup id="ancient-city-collections">
      <motion.div layout={!reducedMotion} className="places-city-collection-grid" role={expanded ? undefined : "group"} aria-label={expanded ? undefined : "City collections"}>
        <AnimatePresence initial={false} mode="popLayout">
          {visibleCollections.map((entry) => <motion.article key={entry.id} data-collection={entry.id} layout={!reducedMotion} className={`places-city-card${expanded ? " is-expanded" : ""}`} style={{ ...tint(entry.color), borderRadius: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ layout: reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }, opacity: { duration: reducedMotion ? 0 : .15 } }}>
            {expanded ? <div className="places-city-card-interior">
              <motion.div layout={reducedMotion ? false : "position"} className="places-city-card-navigation">
                <button ref={backButton} type="button" className="places-collections-back" onClick={onBack}><ArrowLeft size={16} aria-hidden />All collections</button>
                <span aria-hidden>/</span><span>{entry.title}</span>
              </motion.div>
              <motion.div layout={reducedMotion ? false : "position"} className="places-city-card-heading">
                <motion.span layoutId={reducedMotion ? undefined : `city-icon-${entry.id}`} className="places-city-icon"><entry.icon size={25} strokeWidth={1.4} aria-hidden /></motion.span>
                <div><motion.h3 layoutId={reducedMotion ? undefined : `city-title-${entry.id}`}>{entry.title}</motion.h3><p>{entry.subtitle}</p></div>
                <span className="places-city-count">{entry.cities.length} places</span>
              </motion.div>
              <motion.div key={`contents-${entry.id}`} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .22, delay: reducedMotion ? 0 : .16 }}>
                <p className="places-city-card-description">{entry.description}</p>
                <div className="places-choices places-city-choices" role="group" aria-label="Which city will you explore?">{entry.cities.map((city, index) => <button key={city.id} type="button" aria-pressed={choice.id === city.id} onClick={() => onCity(city.id)}><span className="places-choice-mark" aria-hidden>{String(index + 1).padStart(2, "0")}</span><span><strong>{city.title}</strong><small>{city.subtitle}</small></span>{choice.id === city.id ? <Check size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}</button>)}</div>
                <div className="places-city-card-footer"><span>Choose a city to explore below.</span><Link to={entry.passage.path}><BookOpen size={14} aria-hidden />{entry.passage.label}<ArrowUpRight size={13} aria-hidden /></Link></div>
              </motion.div>
            </div> : <button ref={entry.id === collection.id ? selectedCard : undefined} type="button" className="places-city-card-trigger" aria-label={entry.title} aria-expanded={false} onClick={() => onCollection(entry)}>
              <span className="places-city-collection-top"><motion.span layoutId={reducedMotion ? undefined : `city-icon-${entry.id}`}><entry.icon size={23} strokeWidth={1.4} aria-hidden /></motion.span><span>{entry.cities.length} places</span><ArrowUpRight size={16} aria-hidden /></span>
              <motion.strong layoutId={reducedMotion ? undefined : `city-title-${entry.id}`}>{entry.title}</motion.strong><small>{entry.subtitle}</small>
            </button>}
          </motion.article>)}
          {!expanded && <motion.div key="directory" layout={!reducedMotion} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .15 }}><FindCityCard /></motion.div>}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
    {!expanded && <p className="places-city-overlap">One city can open several stories. Open a collection to explore its cities.</p>}
  </section>;
}
