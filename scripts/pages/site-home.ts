// CONTENT for two Site pages: Home (/) and the library (/library). Read from the page files and the site's data.
import { HOME_PATHS, HOME_PREVIEWS, HOME_STUDIES, HOME_TOPICS } from "../../src/components/home/collection-data";
import { groupVersions, VERSION_GROUPS } from "../../src/lib/languages";
import { SECTIONS } from "../../src/lib/sections";
import type { Catalog, Stats, Translation } from "../../src/lib/types";
import { blocks, link, loadCatalog, n, readJson, table } from "./study-lib";
import { byTag, findAll, first, jsxRoots } from "./study-source";
import { componentProps, fill, readableText, wordingList } from "./site-source";
import type { PageContent } from "./types";

const HOME = "src/pages/HomePage.tsx";
const LIBRARY = "src/pages/LibraryPage.tsx";

const bullets = (lines: string[]) => lines.map((line) => `- ${line}`).join("\n");
const isNewTestament = (section: string) => ["gospels", "epistles", "revelation"].includes(section);

/** "39 OT · 27 NT · 14 Apocrypha", as the versions list prints a version's books. */
export function testaments(catalog: Catalog, version: Translation): { ot: number; nt: number; apocrypha: number } {
  const sectionOf = (code: string) => catalog.books.find((book) => book.code === code)?.section ?? "";
  const codes = Object.keys(version.books);
  const nt = codes.filter((code) => isNewTestament(sectionOf(code))).length;
  const apocrypha = codes.filter((code) => sectionOf(code) === "apocrypha").length;
  return { ot: codes.length - nt - apocrypha, nt, apocrypha };
}

async function home(): Promise<PageContent> {
  const catalog = await loadCatalog();
  const roots = await jsxRoots(HOME, "HomePage");
  const destinations = findAll(roots, byTag("Link")).filter((node) => node.attrs.to?.startsWith("/"));
  return { dir: "Site/home", title: "Home", markdown: blocks(
    `**Address:** ${link("/")}`,
    "## Opening and page copy",
    bullets(await readableText(HOME, "HomePage")),
    `Catalogue figures: ${catalog.translations.length} Bible versions; ${new Set(catalog.translations.map((v) => v.lang)).size} language codes, using the same count as the Bible hub.`,
    `An illustrated open Bible quotes John 1:1 (KJV). Five flat outlined collection shortcuts with individual colored line art close the opening screen; the marquee begins below the fold. The reading button opens John 1 or the last valid saved chapter. The redundant Explore the collections link has been removed.`,
    `Three full-page design comparisons are available at /?landing=outline, /?landing=gallery and /?landing=rail. An in-flow selector switches between outlined boxes, a centered introduction with an open gallery, and a compact illustrated navigation rail. The selector only appears on these comparison URLs; all collection links and lower content stay functional.`,
    "## Five collection doorways",
    table(["Collection", "Invitation", "Opens"], HOME_PATHS.map((item) => [item.title, item.subtitle, link(item.to)])),
    "## Moving illustrated previews",
    table(["Collection", "Title", "Opens"], HOME_PREVIEWS.map((item) => [item.label, item.title, link(item.to)])),
    "The strip keeps moving on hover, pauses on keyboard focus or its Pause button, and becomes a static horizontally scrollable strip with reduced motion. Visual duplicates are hidden from assistive technology and tab order. All cards open real destinations.",
    "## Study previews",
    table(["Study", "Text", "Contents", "Opens"], HOME_STUDIES.map((item) => [item.title, item.text, item.note, link(item.to)])),
    "His names now previews the dedicated Names of God study; the full explorer is unchanged on /study/names.",
    "## Topic previews",
    table(["Family", "Text", "Opens"], HOME_TOPICS.map((item) => [item.title, item.text, link(item.to)])),
    "## Other direct links on the page",
    table(["Label", "Opens"], destinations.map((node) => [node.text, link(node.attrs.to)])),
    "The five numbered sections preview Bible, Study, Apologetics, Topics and Atlas. The final invitation includes Testimonies, Sources & references, the public source-code repository and Psalm 119:105 (KJV). Legacy HomeLanding, HomeAbout and HomeStory components are no longer rendered.",
  ) };
}

async function library(): Promise<PageContent> {
  const [catalog, stats, places] = await Promise.all([loadCatalog(), readJson<Stats>("data/stats.json"), readJson<unknown[]>("data/places.json")]);
  const roots = await jsxRoots(LIBRARY, "LibraryPage");
  const canonVerses = stats.books.filter((book) => book.section !== "apocrypha").reduce((sum, book) => sum + book.verses, 0);
  // "versions" and "verses (KJV)" are computed on the page (the catalogue's length; the KJV's verses in the 66 books).
  const figures = (await componentProps(LIBRARY, "LibraryPage", "Stat")).map((stat) => {
    const value = stat.label === "versions" ? catalog.translations.length : stat.label === "verses (KJV)" ? canonVerses : Number(stat.value);
    return `**${n(value)}**${typeof stat.suffix === "string" ? stat.suffix : ""} ${String(stat.label)}`;
  });
  const kjv = catalog.translations.find((version) => version.slug === "kjv");
  if (!kjv) throw new Error("Site content: data/catalog.json has no KJV; the reading chart is built on it");
  const chartBooks = catalog.books.filter((book) => kjv.books[book.code]);
  const split = findAll(await jsxRoots("src/components/LibraryChart.tsx", "LibraryChart"), byTag("ReadingChart"))[0]?.attrs.splitBefore;
  const sectionRows = SECTIONS.map((section) => {
    const books = chartBooks.filter((book) => book.section === section.id);
    return [section.name, section.span, books.length, n(books.reduce((sum, book) => sum + kjv.books[book.code].length, 0))];
  });
  const chapters = chartBooks.filter((book) => book.section !== "apocrypha").reduce((sum, book) => sum + kjv.books[book.code].length, 0);
  const grouped = groupVersions(catalog.translations);
  const filters = ["All " + catalog.translations.length, ...VERSION_GROUPS.map((group) => `${group.title} ${grouped.find((g) => g.group.id === group.id)?.count ?? 0}`)];
  const lists = grouped.flatMap(({ group, count, sections }) => [`### ${group.title} (${count})`, ...sections.map((section) => blocks(section.label ? `*${section.label}*` : "",
    table(["Version", "Name", "Year", "Books", "Verses"], section.versions.map((version) => {
      const c = testaments(catalog, version);
      return [version.abbr, version.name, version.year, [c.ot && `${c.ot} OT`, c.nt && `${c.nt} NT`, c.apocrypha && `${c.apocrypha} Apocrypha`].filter(Boolean).join(" · "), n(version.verses)];
    }))))]);
  // The caption reads "<hovered chapter…> / N chapters, Genesis to Revelation…"; the second half is what shows at rest.
  const spectrum = (await readableText("src/components/ChapterSpectrum.tsx")).find((line) => line.includes("Genesis to Revelation"))?.split(" / ").at(-1) ?? "";
  return { dir: "Site/library", title: "The library", markdown: blocks(
    `**Address:** ${link("/library")} (reached from the Bible page's "Library" card; the header's "Bible" item stays highlighted)`,
    "## Heading",
    `- Eyebrow: Library\n- Title: **${first(roots, byTag("h1")).text}**\n- Figures: ${figures.join(" · ")}`,
    `Checked against the data: data/places.json holds ${n(places.length)} places; the KJV (data/stats.json) has ${n(canonVerses)} verses in the 66 books. The cross-reference figure is written into the page.`,
    "## The reading chart",
    await wordingList("src/components/LibraryChart.tsx"),
    `Two buttons choose what a click does: "Open chapters" (opens the chapter in the version this browser last read, if it numbers chapters like the KJV, else in the KJV) or "Mark as read". A progress bar above the chart shows the reading done in each section. The chart breaks into a second block before ${catalog.books.find((book) => book.code === split)?.name ?? split ?? "—"}; "Apocrypha" adds the apocryphal books.`,
    table(["Section", "Books", "Books on the chart", "Chapters (KJV)"], sectionRows),
    `Without the Apocrypha: ${n(chapters)} chapters in ${chartBooks.filter((book) => book.section !== "apocrypha").length} books.`,
    "## The versions",
    `**The versions** · "${catalog.translations.length} free texts · sources and licences" (→ ${link("/versions")}). Filter buttons: ${filters.join(" · ")}. A box seven rows tall that scrolls, with the scrollbar outside its frame; each row opens the version at its first chapter ("Read").`,
    ...lists,
    "## The Bible, chapter by chapter",
    `${fill(spectrum, n(stats.books.filter((book) => book.section !== "apocrypha").reduce((sum, book) => sum + book.chapters.length, 0)))} Bars are coloured by section and sized by the number of words (KJV).`,
  ) };
}

export const homePages = () => Promise.all([home(), library()]);
