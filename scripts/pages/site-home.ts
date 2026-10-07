// CONTENT for two Site pages: Home (/) and the library (/library). Read from the page files and the site's data.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { nameGroups } from "../../src/data/faith-name-order";
import { groupVersions, VERSION_GROUPS } from "../../src/lib/languages";
import { SECTIONS } from "../../src/lib/sections";
import type { HomeData } from "../../src/lib/study";
import type { Catalog, Stats, Translation } from "../../src/lib/types";
import { blocks, link, loadCatalog, n, readJson, table, WEBSITE } from "./study-lib";
import { byClass, byTag, findAll, first, jsxRoots } from "./study-source";
import { componentProps, fill, looseConstant, readableText, wordingList } from "./site-source";
import type { PageContent } from "./types";

const HOME = "src/pages/HomePage.tsx";
const LANDING = "src/components/home/HomeLanding.tsx";
const ABOUT = "src/components/home/HomeAbout.tsx";
const LIBRARY = "src/pages/LibraryPage.tsx";

interface Tile { to: string; title: string; text: string }
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
  const [catalog, data] = await Promise.all([loadCatalog(), readJson<HomeData>("data/study/home.json")]);
  const versions = catalog.translations.length;
  const landing = await jsxRoots(LANDING, "HomeLanding");
  const watermarks = findAll(landing, byClass("home-watermark")).map((node) => node.text);
  const buttonTexts = new Set(findAll(landing, byTag("Link")).map((node) => node.text));
  const buttons = findAll(landing, byTag("Link")).map((node) => `"${node.text}" → ${node.attrs.to.startsWith("/") ? link(node.attrs.to) : "the chapter this visitor last read"}`);
  const quote = data.hero.word.text.replace(/^In the beginning was the Word,\s*/, "");
  const homeSource = await readFile(path.join(WEBSITE, ...HOME.split("/")), "utf8");
  const storyShown = homeSource.includes("HomeStory");
  const points = await looseConstant<{ title: string; text: string }[]>(ABOUT, "POINTS");
  const repository = await looseConstant<string>(ABOUT, "REPOSITORY");
  const tiles = await looseConstant<Tile[]>(HOME, "TILES");
  const roots = await jsxRoots(HOME, "HomePage");
  const hint = first(roots, byClass("home-names-hint"));
  const titles = ["Abba Father", "Jesus Christ", "Holy Spirit"];
  return { dir: "Site/home", title: "Home", markdown: blocks(
    `**Address:** ${link("/")} (the "Bible Project" name and logo at the left of the header open it)`,
    "## Opening screen",
    bullets((await readableText(LANDING, "HomeLanding")).filter((line) => !buttonTexts.has(line)).map((line) => (line.includes("free versions") ? fill(line, versions) : line))),
    `Under the title, once the verses load: “…${quote}” — ${data.hero.word.ref}. Behind the words, faint and large: ${watermarks.join(" (Hebrew, Genesis 1:1) and ")} (Greek, John 1:1), and a slow light.`,
    `Buttons: ${buttons.join(" · ")}. "Continue: <book chapter>" replaces "Begin with John 1" once this browser has read a chapter.`,
    `At the foot of the screen, a horizon in the reading chart's colours, Genesis to Revelation (the last three lines above sit under it; "One story" is a link): ${SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => s.name).join(" · ")}.`,
    storyShown ? "" : `Checked: the "One story" link at the foot points to #one-story, but nothing on the home page has that id. The section it was written for (HomeStory.tsx, "One story" in ${data.movements.length} movements from data/study/home.json) is not shown on the page, so the link does nothing.`,
    "## About this site",
    bullets((await readableText(ABOUT, "HomeAbout")).map((line) => (line.startsWith("…versions") ? fill(line, versions) : line))),
    table(["Card", "Text"], points.map((point) => [point.title, point.text])),
    `Links: "Get the code on GitHub" → ${repository} · "Every source and its licence" → ${link("/versions")}`,
    "## His names",
    `**${first(roots, byTag("h2")).text}** · ${hint.text.replace(/\s*Every name$/, "")} Link: "Every name" → ${link("/study/names")}`,
    `The names explorer: three large words, ${titles.map((title) => title.toUpperCase()).join(" · ")}, holding ${nameGroups.map((group, i) => `${group.length} names of the ${["Father", "Son", "Holy Spirit"][i]}`).join(", ")}. It is the same explorer as on the Names of God study; its names are listed in [that page's content](../../Study/names-and-descriptions-of-god/CONTENT.md).`,
    "## Ways in (four cards at the foot)",
    table(["Card", "Text", "Opens"], tiles.map((tile) => [tile.title, tile.text, link(tile.to)])),
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
