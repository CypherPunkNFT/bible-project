// The two Atlas pages built on the places data: the map (/study/atlas/map) and Ancient Cities (/study/atlas/cities).
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { SECTIONS } from "../../src/lib/sections";
import type { BookInfo, Place, SectionId } from "../../src/lib/types";
import { CITY_COLLECTIONS } from "../../src/pages/places/city-collections";
import { CITY_DETAILS } from "../../src/pages/places/city-details";
import { resolveCityPlace } from "../../src/pages/places/city-places";
import { codeLink, count, siteLink, table, wordingSection, type Experience } from "./atlas-md";
import { loadConstants, WEBSITE } from "./atlas-source";

const DEPTH = 2;
/** The page's "Most-named places" list shows this many; every place is listed further down. */
const TOP_ON_PAGE = 24;

export interface PlacesData {
  places: Place[];
  books: BookInfo[];
}

async function readJson<T>(relative: string): Promise<T> {
  const file = path.join(WEBSITE, relative);
  const text = await readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
    throw new Error(`Atlas content needs ${relative} (built by scripts/build-data.py), but reading it failed: ${error.code ?? error.message}`);
  });
  return JSON.parse(text) as T;
}

export async function loadPlacesData(): Promise<PlacesData> {
  const places = await readJson<Place[]>("data/places.json");
  const catalog = await readJson<{ books: BookInfo[] }>("data/catalog.json");
  return { places, books: catalog.books };
}

/** The section that names a place most often decides its dot colour (same rule as AtlasPage.tsx). */
function dominantSection(place: Place, sectionOf: Map<number, SectionId>): SectionId {
  const counts = new Map<SectionId, number>();
  for (const id of place.verses) {
    const section = sectionOf.get(Math.floor(id / 1_000_000)) ?? "apocrypha";
    counts.set(section, (counts.get(section) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "history";
}

const tally = (values: string[]) =>
  [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

interface Preset {
  name: string;
}

/** Every fixed phrase an expression can produce: a string, or both sides of a condition. */
function phrases(node: ts.Expression): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isParenthesizedExpression(node)) return phrases(node.expression);
  if (ts.isConditionalExpression(node)) return [...phrases(node.whenTrue), ...phrases(node.whenFalse)];
  return [];
}

/**
 * The messages the map shows over itself when its list of map pieces cannot load. They are set in code
 * (setProblem in StreetAtlasMap.tsx), so the page-wording scan cannot see them.
 */
async function mapProblems(): Promise<string[]> {
  const relative = "src/components/atlas/StreetAtlasMap.tsx";
  const file = path.join(WEBSITE, relative);
  const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "setProblem") node.arguments.forEach((arg) => found.push(...phrases(arg)));
    node.forEachChild(visit);
  };
  visit(source);
  // The wording below says which message is the local one; if the code changes shape, say so rather than guess.
  if (found.length !== 2) throw new Error(`${relative}: expected 2 map error messages in setProblem(local ? a : b), found ${found.length}: ${JSON.stringify(found)}`);
  return found;
}

/** Every place, grouped by dot colour (in the Bible's order), A to Z inside each group. */
function everyPlace(coloured: { place: Place; section: SectionId }[]): string[] {
  const parts: string[] = [];
  for (const section of SECTIONS) {
    const group = coloured.filter((entry) => entry.section === section.id).sort((a, b) => a.place.name.localeCompare(b.place.name) || a.place.id.localeCompare(b.place.id));
    if (!group.length) continue;
    parts.push(`### ${section.name} (${count(group.length)})`, "", table(["Place", "Kind", "Verses", "Id"], group.map(({ place }) => [place.name, place.type, count(place.verses.length), place.id])), "");
  }
  return parts;
}

export async function mapMarkdown({ places, books }: PlacesData): Promise<string> {
  const sectionOf = new Map(books.map((book) => [book.num, book.section]));
  const sectionName = new Map(SECTIONS.map((section) => [section.id, section.name]));
  const coloured = places.map((place) => ({ place, section: dominantSection(place, sectionOf) }));
  const top = [...coloured].sort((a, b) => b.place.verses.length - a.place.verses.length).slice(0, TOP_ON_PAGE);
  const [localProblem, liveProblem] = await mapProblems();
  const sharedNames = tally(places.map((place) => place.name)).filter(([, n]) => n > 1).length;
  const { PRESETS } = (await loadConstants("src/components/atlas/StreetAtlasMap.tsx", ["PRESETS"], ["BOUNDS"])) as { PRESETS: Preset[] };
  const references = places.reduce((sum, place) => sum + place.verses.length, 0);
  return [
    `The map shows **${count(places.length)} places** from OpenBible.info's Bible geocoding (CC BY 4.0), named in ${count(references)} verse references in all. Data file: [data/places.json](../../../Website/data/places.json) (generated by ${codeLink("scripts/build-data.py", DEPTH)}; not in git).`,
    "",
    "## Filters above the map",
    "",
    `- Section buttons (a place shows if any verse naming it is in a chosen section): ${SECTIONS.filter((section) => section.id !== "apocrypha").map((section) => `${section.name} (${section.span})`).join(" · ")}`,
    `- Book list: "Any book", then the ${books.filter((book) => book.num <= 66).length} books from ${books[0].name} to ${books.filter((book) => book.num <= 66).at(-1)?.name}`,
    "- A \"Find a place…\" name box, a count of places shown, and Clear filters",
    "",
    "## Map region buttons",
    "",
    PRESETS.map((preset) => preset.name).join(" · "),
    "",
    "## Places by kind",
    "",
    table(["Kind (shown above the name in the place panel)", "Places"], tally(places.map((place) => place.type)).map(([kind, n]) => [kind, count(n)])),
    "",
    "## Places by dot colour",
    "",
    "Each dot takes the colour of the part of the Bible that names it most often.",
    "",
    table(["Section", "Places"], tally(coloured.map((entry) => entry.section)).map(([id, n]) => [sectionName.get(id as SectionId) ?? id, count(n)])),
    "",
    `## Most-named places (the ${TOP_ON_PAGE} the page lists, with no filters chosen)`,
    "",
    table(["#", "Place", "Kind", "Verses", "Colour", "Link"], top.map(({ place, section }, index) => [index + 1, place.name, place.type, count(place.verses.length), sectionName.get(section) ?? section, siteLink(`/study/atlas/map?place=${place.id}`)])),
    "",
    `## Every place (${count(places.length)}), by dot colour`,
    "",
    `A to Z within each colour. "Verses" is how many verses name the place (the number its panel shows). ${count(sharedNames)} names belong to more than one place; the id tells them apart, and \`/study/atlas/map?place=<id>\` opens one.`,
    "",
    ...everyPlace(coloured),
    "## The place panel",
    "",
    "Opening a place shows its kind, its name, how many verses name it, a location-confidence percentage, \"Where it is named\" (book by book, each reference a link to the reader) and the verses themselves in the KJV, 15 at a time.",
    "",
    "## When the map cannot load",
    "",
    `If the map's list of pieces cannot be loaded, a notice covers the map (set in ${codeLink("src/components/atlas/StreetAtlasMap.tsx", DEPTH)}); the filters and the most-named list still work. A single dropped map square is retried and shows nothing.`,
    "",
    table(["Shown on", "Message"], [["The local preview (an address starting localhost or 127.)", localProblem], ["The live site and everywhere else", liveProblem]]),
    "",
    await wordingSection([{ file: "src/pages/AtlasPage.tsx" }, { file: "src/components/atlas/StreetAtlasMap.tsx" }, { file: "src/components/atlas/PlacePanel.tsx" }], DEPTH),
  ].join("\n");
}

export async function citiesMarkdown({ places }: PlacesData, header: Experience): Promise<string> {
  const settlements = places.filter((place) => place.type === "settlement").length;
  const identities = new Set(CITY_COLLECTIONS.flatMap((collection) => collection.cities.map((city) => city.id)));
  const parts = [
    "## Page header",
    "",
    `- Eyebrow: ${header.kicker}`,
    `- Heading: ${header.title}`,
    `- Introduction: ${header.description}`,
    "",
    `## Collections (${CITY_COLLECTIONS.length}, plus Find Your City)`,
    "",
    `${count(identities.size)} different cities across the collections; a city in several collections is the same place each time. "Verses" is how many verses name the city's atlas place (the number shown when it opens).`,
    "",
  ];
  for (const collection of CITY_COLLECTIONS) {
    parts.push(
      `### ${collection.title}`,
      "",
      `*${collection.subtitle}.* ${collection.description} Passage: [${collection.passage.label}](https://bibleproject.io${collection.passage.path}).`,
      "",
      table(["City", "Subtitle", "Atlas place", "Verses"], collection.cities.map((city) => {
        const place = resolveCityPlace(places, city);
        return [city.title, city.subtitle, place ? `${place.name} (${place.id}${city.placeId ? ", pinned" : ""})` : "not on the atlas", place ? count(place.verses.length) : "—"];
      })),
      "",
    );
  }
  parts.push("## City notes (written for the Seven Churches only)", "", "Every other city shows its subtitle and its verse list.", "");
  for (const [id, detail] of Object.entries(CITY_DETAILS)) {
    const title = CITY_COLLECTIONS.flatMap((collection) => collection.cities).find((city) => city.id === id)?.title ?? id;
    parts.push(`### ${title}`, "", `- **${detail.churchTitle}** ([${detail.passage.label}](https://bibleproject.io${detail.passage.path})): ${detail.church}`, `- **The city:** ${detail.city}`, "");
  }
  parts.push(
    "## Find Your City (/study/atlas/cities/find)",
    "",
    `A searchable directory of all ${count(settlements)} places of the kind "settlement", A to Z, 24 per page, each with its verse count and coordinates, opening it on the map.`,
    "",
    await wordingSection([
      { file: "src/pages/places/CitySelection.tsx" },
      { file: "src/pages/places/CityDetailPanel.tsx" },
      { file: "src/pages/places/CityMapExperience.tsx" },
      { file: "src/pages/places/CityDirectory.tsx" },
    ], DEPTH),
  );
  return parts.join("\n");
}
