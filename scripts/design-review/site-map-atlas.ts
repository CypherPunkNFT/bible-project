// Atlas: the home, the map (with and without a place open), cities, journeys, Gospel events, history collections and
// the Catholic & Orthodox tradition page. Option lists are the site's own constants, read from its source files.
import { loadConstants } from "../pages/atlas-source.ts";
import { registerSiteModules } from "../pages/study-lib.ts";
import { fewest, firstOf, longestText, most, readJson, single, typical, variant, type TemplateDef } from "./model.ts";

interface Place { id: string; name: string; type: string; verses: string[] }
interface Choice { id: string; title: string }
interface Experience { options: Choice[]; lenses: Choice[] }
interface CityCollection { id: string; title: string; cities: Choice[] }
interface HistoryCollection { id: string; title: string; topics?: Choice[] }
interface Chapter { id: string; title: string; stops: unknown[] }

const ATLAS = "/study/atlas";
const ATLAS_SCOPE = ["src/pages/places/", "src/components/atlas/"];

export async function atlasTemplates(): Promise<{ templates: TemplateDef[]; valid: { places: string[] } }> {
  registerSiteModules();
  const places = readJson<Place[]>("data/places.json");
  const { CITY_COLLECTIONS } = (await import("../../src/pages/places/city-collections.ts")) as unknown as { CITY_COLLECTIONS: CityCollection[] };
  const { CITY_DETAILS } = (await import("../../src/pages/places/city-details.ts")) as { CITY_DETAILS: Record<string, unknown> };
  const { HISTORY_COLLECTIONS } = (await import("../../src/pages/places/history-collections.ts")) as unknown as { HISTORY_COLLECTIONS: HistoryCollection[] };
  const { buildPaulJourney } = (await import("../../src/pages/places/paul-journey.ts")) as unknown as { buildPaulJourney: (g: unknown) => { story: Chapter[]; letters: Chapter[] } };
  const { EXPERIENCES } = (await loadConstants("src/pages/places/AtlasCollection.tsx", ["EXPERIENCES"])) as { EXPERIENCES: Record<string, Experience> };
  const { TRADITIONS, LENS_LABELS } = (await loadConstants("src/pages/places/TraditionExperience.tsx", ["TRADITIONS", "LENS_LABELS"])) as { TRADITIONS: Choice[]; LENS_LABELS: Record<string, string> };
  const journey = buildPaulJourney(readJson("src/data/letters/paul-letters.json"));

  const mapPlace = (p: Place) => `${ATLAS}/map?place=${encodeURIComponent(p.id)}`;
  const map: TemplateDef = {
    id: "atlas-map", area: "atlas", name: "The map (a place opened)", address: "/study/atlas/map?place=<place>", instances: places.length + 1,
    what: "The street-level atlas of every Bible place; choosing a place opens its panel with the verses that name it.",
    entries: ["src/pages/AtlasPage.tsx", "src/components/atlas/StreetAtlasMap.tsx", "src/components/atlas/PlacePanel.tsx"], scopes: ATLAS_SCOPE,
    signature: { selector: ".maplibregl-map", label: "The map" },
    variants: [
      single("map", "The map, nothing chosen", "Every place on the map, with the filters.", `${ATLAS}/map`),
      variant({ id: "place", name: "A place opened", what: "The place panel beside the map (below it on a phone).", records: places, url: mapPlace, samples: [
        typical<Place>((p) => p.verses.length, (p) => p.name, "how many verses name it"),
        most<Place>("most-verses", "Most verses", (p) => p.verses.length, (p) => p.name, "verses"),
        longestText<Place>("longest-name", "Longest name", (p) => p.name, "name"),
        fewest<Place>("fewest", "One verse", (p) => p.verses.length, (p) => p.name, "verses"),
      ], coverage: "every place" }),
    ],
  };

  const memberships = CITY_COLLECTIONS.flatMap((c) => c.cities.map((city) => ({ collection: c, city })));
  type Member = (typeof memberships)[number];
  const cityUrl = (m: Member) => `${ATLAS}/cities?collection=${m.collection.id}&focus=${m.city.id}&view=city`;
  const cityName = (m: Member) => `${m.city.title} (${m.collection.title})`;
  const city: TemplateDef = {
    id: "atlas-city", area: "atlas", name: "City page", address: "/study/atlas/cities?collection=<c>&focus=<city>&view=city",
    what: "One city inside a collection: the city panel, and for the seven churches of Revelation, the church card.",
    entries: ["src/pages/places/CitySelection.tsx", "src/pages/places/CityDetailPanel.tsx"], scopes: ATLAS_SCOPE,
    variants: [
      variant({ id: "church", name: "One of the seven churches", what: "With the letter to the church (Revelation 2–3).", records: memberships.filter((m) => CITY_DETAILS[m.city.id]), url: cityUrl, samples: [firstOf<Member>(cityName, "church city"), longestText<Member>("longest-name", "Longest name", (m) => m.city.title, "name")] }),
      variant({ id: "city", name: "Any other city", what: "The general city panel.", records: memberships.filter((m) => !CITY_DETAILS[m.city.id]), url: cityUrl, samples: [firstOf<Member>(cityName, "city"), longestText<Member>("longest-name", "Longest name", (m) => m.city.title, "name"), longestText<Member>("longest-line", "Longest description", (m) => (m.city as Choice & { subtitle?: string }).subtitle ?? "", "description")] }),
    ],
  };

  const collections: TemplateDef = {
    id: "atlas-cities", area: "atlas", name: "City collection", address: "/study/atlas/cities?collection=<collection>",
    what: "A collection of cities (the seven churches, ports and trade, cities of refuge…) to choose from.",
    entries: ["src/pages/places/CitySelection.tsx"], scopes: ATLAS_SCOPE,
    variants: [
      single("all", "All collections", "The grid of collections and \"Find your city\".", `${ATLAS}/cities`),
      variant({ id: "collection", name: "One collection", what: "Its cities on the map and in a list.", records: CITY_COLLECTIONS, url: (c: CityCollection) => `${ATLAS}/cities?collection=${c.id}`, samples: [
        firstOf<CityCollection>((c) => c.title, "collection"),
        most<CityCollection>("most", "Most cities", (c) => c.cities.length, (c) => c.title, "cities"),
        fewest<CityCollection>("fewest", "Fewest cities", (c) => c.cities.length, (c) => c.title, "cities"),
      ] }),
    ],
  };

  const settlements = places.filter((p) => p.type === "settlement").length;
  const pages = Array.from({ length: Math.ceil(settlements / 24) }, (_, i) => i);
  const directory: TemplateDef = {
    id: "atlas-city-finder", area: "atlas", name: "Find your city", address: "/study/atlas/cities/find?page=<n>",
    what: `Every settlement (${settlements}), 24 to a page, with a search.`,
    entries: ["src/pages/places/CityDirectory.tsx"], scopes: ATLAS_SCOPE,
    variants: [
      variant({ id: "page", name: "A page of cities", what: "One page of the directory.", records: pages, url: (i: number) => `${ATLAS}/cities/find${i ? `?page=${i}` : ""}`, samples: [
        { id: "first", label: "First page", pick: (rs) => rs[0], why: () => "the first page, as most people see it" },
        { id: "last", label: "Last page", pick: (rs) => rs.at(-1), why: (i) => `the last page (page ${i + 1}), which is not full` },
      ] }),
      single("no-results", "A search with no results", "What a failed search looks like.", `${ATLAS}/cities/find?q=zzzz`),
    ],
  };

  const journeyChapters = [...journey.story.map((c) => ({ ...c, lens: "story" })), ...journey.letters.map((c) => ({ ...c, lens: "letters" }))];
  type JChapter = (typeof journeyChapters)[number];
  const soon = EXPERIENCES.journeys.options.flatMap((o) => EXPERIENCES.journeys.lenses.filter((l) => l.id !== "letters" || o.id === "paul" || o.id === "peter").map((l) => ({ focus: o, lens: l }))).filter((c) => !(c.focus.id === "paul" && (c.lens.id === "story" || c.lens.id === "letters")));
  type Soon = (typeof soon)[number];
  const journeys: TemplateDef = {
    id: "atlas-journey", area: "atlas", name: "Journey", address: "/study/atlas/journeys?focus=<person>&lens=<lens>&chapter=<chapter>",
    what: "Follow a life on the map. Paul's journey is built; the other travellers show what is coming.",
    entries: ["src/pages/places/JourneyExperience.tsx", "src/pages/places/JourneysHero.tsx"], scopes: ATLAS_SCOPE,
    variants: [
      single("start", "Journeys, nobody chosen", "The traveller cards.", `${ATLAS}/journeys`),
      variant({ id: "paul", name: "Paul's journey, one chapter", what: "The guided map: chapter rail, stops, play and pause.", records: journeyChapters, url: (c: JChapter) => `${ATLAS}/journeys?focus=paul&lens=${c.lens}&chapter=${c.id}`, samples: [
        firstOf<JChapter>((c) => c.title, "chapter"),
        most<JChapter>("most-stops", "Most stops", (c) => c.stops.length, (c) => c.title, "stops"),
        fewest<JChapter>("fewest", "Fewest stops", (c) => c.stops.length, (c) => c.title, "stops"),
      ] }),
      variant({ id: "coming", name: "A traveller still to come", what: "The \"coming next\" panel for a journey not built yet.", records: soon, url: (c: Soon) => `${ATLAS}/journeys?focus=${c.focus.id}&lens=${c.lens.id}`, samples: [firstOf<Soon>((c) => `${c.focus.title}, ${c.lens.title}`, "one")] }),
    ],
  };

  const gospelCombos = EXPERIENCES.gospels.options.flatMap((o) => EXPERIENCES.gospels.lenses.map((l) => ({ focus: o, lens: l })));
  type Combo = (typeof gospelCombos)[number];
  const gospels: TemplateDef = {
    id: "atlas-gospels", area: "atlas", name: "Gospel events", address: "/study/atlas/gospels?focus=<part>&lens=<gospel>",
    what: "A part of Jesus' life and one account (or all four) to follow; a preview of what is coming.",
    entries: ["src/pages/places/AtlasCollection.tsx"], scopes: ["src/pages/places/AtlasCollection.tsx", "src/pages/places/places-collection.css", "src/pages/places/RevealSelection.tsx"],
    variants: [variant({ id: "event", name: "One part, one account", what: "The preview workspace.", records: gospelCombos, url: (c: Combo) => `${ATLAS}/gospels?focus=${c.focus.id}&lens=${c.lens.id}`, samples: [
      firstOf<Combo>((c) => `${c.focus.title}, ${c.lens.title}`, "combination"),
      { id: "last", label: "Last", pick: (rs) => rs.at(-1), why: (c) => `the last combination: ${c.focus.title}, ${c.lens.title}` },
    ] })],
  };

  const historyGrids = HISTORY_COLLECTIONS.filter((c) => c.id !== "catholic-orthodox");
  const topics = historyGrids.flatMap((c) => (c.topics ?? []).map((t) => ({ collection: c, topic: t })));
  type HTopic = (typeof topics)[number];
  const history: TemplateDef = {
    id: "atlas-history", area: "atlas", name: "History collection", address: "/study/atlas/<collection>?topic=<topic>",
    what: "The early church, the Reformation and global missions: a grid of topics, each opening its places.",
    entries: ["src/pages/places/HistoryExperience.tsx"], scopes: ATLAS_SCOPE,
    variants: [
      variant({ id: "collection", name: "A collection", what: "Its grid of topics.", records: historyGrids, url: (c: HistoryCollection) => `${ATLAS}/${c.id}`, samples: [firstOf<HistoryCollection>((c) => c.title, "collection"), longestText<HistoryCollection>("longest-name", "Longest name", (c) => c.title, "name")] }),
      variant({ id: "topic", name: "A topic opened", what: "One topic and its places.", records: topics, url: (t: HTopic) => `${ATLAS}/${t.collection.id}?topic=${t.topic.id}`, samples: [firstOf<HTopic>((t) => t.topic.title, "topic"), longestText<HTopic>("longest-name", "Longest title", (t) => t.topic.title, "title")] }),
    ],
  };

  const traditionCombos = TRADITIONS.flatMap((t) => Object.keys(LENS_LABELS).map((lens) => ({ tradition: t, lens })));
  type TCombo = (typeof traditionCombos)[number];
  const tradition: TemplateDef = {
    id: "atlas-tradition", area: "atlas", name: "Catholic & Orthodox", address: "/study/atlas/catholic-orthodox?tradition=<t>&lens=<lens>",
    what: "Two traditions, four ways of looking at each (growth, centres, councils, worship).",
    entries: ["src/pages/places/TraditionExperience.tsx"], scopes: ["src/pages/places/TraditionExperience.tsx", "src/pages/places/tradition-experience.css"],
    variants: [variant({ id: "lens", name: "One tradition, one lens", what: "The tradition page.", records: traditionCombos, url: (c: TCombo) => `${ATLAS}/catholic-orthodox?tradition=${c.tradition.id}&lens=${c.lens}`, samples: [
      firstOf<TCombo>((c) => `${c.tradition.title}, ${LENS_LABELS[c.lens]}`, "combination"),
      { id: "last", label: "Last", pick: (rs) => rs.at(-1), why: (c) => `the last combination: ${c.tradition.title}, ${LENS_LABELS[c.lens]}` },
    ] })],
  };

  const home: TemplateDef = {
    id: "atlas-home", area: "atlas", name: "Atlas home", address: "/study/atlas",
    what: "The Atlas's front page: the floating map layers and the ways in.",
    entries: ["src/pages/places/AtlasCollection.tsx", "src/pages/places/AtlasLayerStack.tsx"], scopes: ["src/pages/places/AtlasCollection.tsx", "src/pages/places/AtlasLayerStack.tsx", "src/pages/places/layer-stack-data.ts", "src/pages/places/places-collection.css"],
    variants: [single("home", "Atlas home", "The front page.", ATLAS)],
  };

  return { templates: [home, map, collections, city, directory, journeys, gospels, history, tradition], valid: { places: places.map((p) => p.id) } };
}
