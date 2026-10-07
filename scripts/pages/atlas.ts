// Atlas area of the per-page content export (scripts/export-pages.ts): the Atlas home and its eight pages.
// Everything is read from the site's own code and data; nothing here restates content by hand.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { HISTORY_COLLECTIONS, TRADITION_STUDY_TOPICS } from "../../src/pages/places/history-collections";
import { ATLAS_BASE, atlasDestination } from "../../src/pages/places/routes";
import { codeLink, experienceMarkdown, siteLink, table, wordingSection, type Destination, type Experience, type HistoryCollection, type HistoryTopic } from "./atlas-md";
import { atlasHasPlace } from "../../src/pages/places/atlas-find";
import { citiesMarkdown, loadPlacesData, mapMarkdown, type PlacesData } from "./atlas-places";
import { paulJourneyMarkdown } from "./atlas-journey";
import { loadConstants, WEBSITE } from "./atlas-source";
import type { Extractor, PageContent } from "./types";

const DEPTH = 2;
type ExperienceId = "journeys" | "cities" | "gospels";
type LensId = "growth" | "centers" | "councils" | "worship";

interface Tradition {
  id: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  place: string;
  places: string[];
  lenses: Record<LensId, { title: string; description: string }>;
}

/** Folder under Pages/Atlas for each destination id the site uses. */
const FOLDERS: Record<string, string> = {
  atlas: "the-map", journeys: "journeys", cities: "ancient-cities", gospels: "gospel-events",
  "early-church": "the-early-church", "catholic-orthodox": "apostolic-church", reformation: "the-reformation", missions: "global-missions",
};

const collections = HISTORY_COLLECTIONS as unknown as readonly HistoryCollection[];
const shared = { file: "src/pages/places/AtlasCollection.tsx", functions: ["DestinationShell"] };

function homeMarkdown(destinations: readonly Destination[], ticker: boolean): string {
  const cards = (list: readonly Destination[], start: number) =>
    table(["#", "Eyebrow", "Card", "Description", "Footer", "Button", "Page"], list.map((item, index) => [
      String(start + index).padStart(2, "0"), item.eyebrow, item.title, item.description, item.detail, item.action,
      `[${FOLDERS[item.id]}](${FOLDERS[item.id]}/CONTENT.md) · ${siteLink(atlasDestination(item.id))}`,
    ]));
  return [
    `The Atlas home, ${siteLink(ATLAS_BASE)}, is "Places & journeys" in the Study collection. It shows eight illustrated cards in two rows.`,
    "",
    "## Row 1: the biblical world",
    "",
    cards(destinations, 1),
    "",
    "## Row 2: Beyond the New Testament",
    "",
    cards(collections, destinations.length + 1),
    "",
    "## On every Atlas page",
    "",
    `A "Back to Atlas" link, an "Open the map" link and a row of eight small tiles, one per page: ${[...destinations, ...collections].map((item) => item.title).join(" · ")}.${ticker ? ' On the local preview only (127.0.0.1 or localhost, or with ?ticker in the address), a "Ticker" button (a debugging tool for the page transitions) sits at the bottom right; visitors to the live site do not see it.' : ""}`,
    "",
  ].join("\n");
}

function topicTable(topics: readonly HistoryTopic[], placesLabel: string): string {
  return table(["Topic", "Subtitle", "Question", "Questions to explore", placesLabel], topics.map((topic) => [topic.title, topic.subtitle, topic.question, topic.threads.join(" · "), topic.places.join(" · ")]));
}

function sourcesList(data: HistoryCollection): string {
  return data.sources.map((source) => `- [${source.title}](${source.url})`).join("\n");
}

async function historyMarkdown(data: HistoryCollection): Promise<string> {
  const placesLabel = data.id === "missions" ? "Regional starting points" : "Places in this story";
  return [
    "## Page header",
    "",
    `- Eyebrow: Beyond the New Testament · ${data.title}`,
    `- Heading: ${data.heading}`,
    `- Introduction: ${data.intro}`,
    "",
    `## ${data.choose}`,
    "",
    `${data.topics.length} ${data.id === "missions" ? "regions" : "topics"}. Choosing one opens it in place: its question, three questions to explore, its places, the reading room, and links to the others.`,
    "",
    topicTable(data.topics, placesLabel),
    "",
    `## Reading room · ${data.title}`,
    "",
    sourcesList(data),
    "",
    await wordingSection([{ file: "src/pages/places/HistoryExperience.tsx", functions: ["TopicExperience"] }, shared], DEPTH),
  ].join("\n");
}

/** The map link's words, or why there is none: it is offered only when the map holds a place by that name. */
const findLink = ({ places }: PlacesData, place: string) => (atlasHasPlace(places, place) ? `Find ${place} in the atlas` : `None: ${place} is not an atlas place, so the link is not shown`);

async function apostolicMarkdown(data: HistoryCollection, placesData: PlacesData): Promise<string> {
  const { TRADITIONS, LENS_LABELS } = (await loadConstants("src/pages/places/TraditionExperience.tsx", ["LENS_LABELS", "TRADITIONS"])) as {
    TRADITIONS: Tradition[];
    LENS_LABELS: Record<LensId, string>;
  };
  const lensIds = Object.keys(LENS_LABELS) as LensId[];
  return [
    "## Page header",
    "",
    `- Eyebrow: Beyond the New Testament · ${data.title}`,
    `- Heading: ${data.heading}`,
    `- Introduction: ${data.intro}`,
    "",
    `## ${data.choose}`,
    "",
    table(["Tradition", "Eyebrow", "Subtitle", "Description", "Places", "Map link"], TRADITIONS.map((item) => [item.title, item.eyebrow, item.subtitle, item.description, item.places.join(" · "), findLink(placesData, item.place)])),
    "",
    "## Lenses, per tradition",
    "",
    ...TRADITIONS.flatMap((item) => [`### ${item.title}`, "", table(["Button", "Heading shown", "What it says"], lensIds.map((id) => [LENS_LABELS[id], item.lenses[id].title, item.lenses[id].description])), ""]),
    `## Reading room · ${data.title}`,
    "",
    sourcesList(data),
    "",
    "## Kept in the code but not shown on the Atlas",
    "",
    "The owner moved these topics off the Atlas on 2026-10-06 (they read as studies, not maps). They are not yet placed in Study.",
    "",
    topicTable(TRADITION_STUDY_TOPICS, "Places"),
    "",
    await wordingSection([{ file: "src/pages/places/TraditionExperience.tsx" }, shared], DEPTH),
  ].join("\n");
}

export const extract: Extractor = async () => {
  const { DESTINATIONS, EXPERIENCES } = (await loadConstants("src/pages/places/AtlasCollection.tsx", ["DESTINATIONS", "EXPERIENCES"])) as {
    DESTINATIONS: readonly Destination[];
    EXPERIENCES: Record<ExperienceId, Experience>;
  };
  const placesData = await loadPlacesData();
  const ticker = (await readFile(path.join(WEBSITE, "src/pages/places/AtlasCollection.tsx"), "utf8")).includes("<TransitionTicker");
  const workspace = [{ file: "src/pages/places/AtlasCollection.tsx", functions: ["ExperiencePreview", "ExperienceWorkspace", "DestinationShell"] }];
  const title = (id: string) => [...DESTINATIONS, ...collections].find((item) => item.id === id)?.title ?? id;
  // The map page's card is also called "Atlas", like the home; keep the two apart.
  const page = (id: string, markdown: string): PageContent => ({ dir: `Atlas/${FOLDERS[id]}`, title: id === "atlas" ? "Atlas (the map)" : title(id), markdown });

  const pages: PageContent[] = [
    { dir: "Atlas", title: "Atlas", markdown: [homeMarkdown(DESTINATIONS, ticker), await wordingSection([{ file: "src/pages/places/AtlasCollection.tsx", functions: ["CollectionHome", "DestinationShell"] }], 1)].join("\n") },
    page("atlas", await mapMarkdown(placesData)),
    page("journeys", [experienceMarkdown(EXPERIENCES.journeys, { placeColumn: "Starts at (map link)", lensNote: "The Letters lens appears only for Paul and Peter." }), "", await paulJourneyMarkdown(), "", await wordingSection(workspace, DEPTH)].join("\n")),
    page("cities", await citiesMarkdown(placesData, EXPERIENCES.cities)),
    page("gospels", [
      experienceMarkdown(EXPERIENCES.gospels, { placeColumn: "Starts at (map link)" }),
      "",
      `The full harmony of the Gospels (Robertson's events) is a Study page, not this one: ${codeLink("src/pages/ChartsPage.tsx", DEPTH)} at ${siteLink("/study/gospels")}.`,
      "",
      await wordingSection(workspace, DEPTH),
    ].join("\n")),
    ...(await Promise.all(collections.map(async (data) => page(data.id, data.id === "catholic-orthodox" ? await apostolicMarkdown(data, placesData) : await historyMarkdown(data))))),
  ];
  return pages;
};
