// CONTENT for two Site pages: Home (/) and the library (/library). Read from the page files and the site's data.
import { HOME_PATHS, HOME_PREVIEWS, HOME_STUDIES, HOME_TOPICS } from "../../src/components/home/collection-data";
import { groupVersions, VERSION_GROUPS } from "../../src/lib/languages";
import { PARTS } from "../../src/pages/library/part-content";
import type { Catalog, Stats, Translation } from "../../src/lib/types";
import { blocks, link, loadCatalog, n, readJson, table } from "./study-lib";
import { byTag, findAll, first, jsxRoots } from "./study-source";
import { componentProps, readableText, wordingList } from "./site-source";
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
    `An illustrated open Bible quotes John 1:1 (KJV). Five flat outlined collection shortcuts with individual colored line art share a single outer frame and internal borders, closing the opening screen; the marquee begins below the fold. The reading button opens John 1 or the last valid saved chapter. The redundant Explore the collections link has been removed.`,
    `Three full-page design comparisons are available at /?landing=outline, /?landing=gallery and /?landing=rail. An in-flow selector switches between outlined boxes, a centered introduction with an open gallery, and a compact illustrated navigation rail. The selector only appears on these comparison URLs; all collection links and lower content stay functional.`,
    "## Five collection doorways",
    table(["Collection", "Invitation", "Opens"], HOME_PATHS.map((item) => [item.title, item.subtitle, link(item.to)])),
    "## Moving illustrated previews",
    table(["Collection", "Title", "Opens"], HOME_PREVIEWS.map((item) => [item.label, item.title, link(item.to)])),
    "The strip repeats enough sequences to fill the current viewport and loops by exactly one sequence width, including on ultrawide screens and after resizing. It keeps moving on hover, pauses on keyboard focus or its Pause button, and becomes a static horizontally scrollable strip with reduced motion. Visual duplicates are hidden from assistive technology and tab order. All cards open real destinations.",
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
  const [catalog, stats] = await Promise.all([loadCatalog(), readJson<Stats>("data/stats.json")]);
  const roots = await jsxRoots(LIBRARY, "LibraryPage");
  const canon = stats.books.filter((book) => book.section !== "apocrypha");
  const sum = (pick: (book: Stats["books"][number]) => number) => canon.reduce((total, book) => total + pick(book), 0);
  // Every figure but "books" is computed on the page from data/stats.json and the catalogue.
  const values: Record<string, number> = { chapters: sum((b) => b.chapters.length), "verses (KJV)": sum((b) => b.verses), "words (KJV)": sum((b) => b.words), versions: catalog.translations.length };
  const figures = (await componentProps(LIBRARY, "LibraryPage", "Stat")).map((stat) => `**${n(values[String(stat.label)] ?? Number(stat.value))}** ${String(stat.label)}`);
  const summaries = await readJson<{ notice: string; chapters: Record<string, unknown> }>("data/summaries/JHN.json").catch(() => null);
  const summaryCount = summaries ? (await Promise.all(canon.map((book) => readJson<{ chapters: Record<string, unknown> }>(`data/summaries/${book.code}.json`).then((file) => Object.keys(file.chapters).length, () => 0)))).reduce((a, b) => a + b, 0) : 0;
  const partRows = PARTS.map((part) => {
    const books = canon.filter((book) => book.section === part.id);
    return [part.name, part.range, books.length, n(books.reduce((total, book) => total + book.chapters.length, 0)), part.writtenText];
  });
  const grouped = groupVersions(catalog.translations);
  const filters = ["All " + catalog.translations.length, ...VERSION_GROUPS.map((group) => `${group.title} ${grouped.find((g) => g.group.id === group.id)?.count ?? 0}`)];
  const lists = grouped.flatMap(({ group, count, sections }) => [`### ${group.title} (${count})`, ...sections.map((section) => blocks(section.label ? `*${section.label}*` : "",
    table(["Version", "Name", "Year", "Books", "Verses"], section.versions.map((version) => {
      const c = testaments(catalog, version);
      return [version.abbr, version.name, version.year, [c.ot && `${c.ot} OT`, c.nt && `${c.nt} NT`, c.apocrypha && `${c.apocrypha} Apocrypha`].filter(Boolean).join(" · "), n(version.verses)];
    }))))]);
  return { dir: "Site/library", title: "The library", markdown: blocks(
    `**Address:** ${link("/library")} (reached from the Bible page's "Library" card; the header's "Bible" item stays highlighted). The chosen chapter is kept in the address, e.g. ${link("/library?c=ROM.8")}.`,
    "## Heading",
    `- Eyebrow: The library
- Title: **${first(roots, byTag("h1")).text}**
- Figures: ${figures.join(" · ")}`,
    "## 01 · Move through the whole Bible",
    await wordingList("src/pages/library/River.tsx"),
    `All ${n(values.chapters)} chapters as one line of bars, coloured by part. Scrolling zooms around the pointer, dragging moves along, the strip below shows and moves the window, and clicking a part or book name flies to it. Bars can show verses, words or words of Jesus, scaled to the tallest chapter on screen. The ← → keys step one chapter at a time anywhere on the page (not while typing or inside a chart, tab row or switch).`,
    "## The chosen chapter",
    await wordingList("src/pages/library/ChapterPanel.tsx"),
    `Shows the chapter's verses, words, words of Jesus and reading time, a strip of its whole book, then its summary, "Notice" line and outline. The Read button opens the chapter in the version this browser last read when that version numbers chapters like the KJV and has the chapter, else in the KJV. Opens on John 1 unless the address names a chapter.`,
    `**Chapter summaries:** ${n(summaryCount)} of ${n(values.chapters)} chapters, one file per book in data/summaries/ (scripts/build-chapter-summaries.py, \`bun run summaries\`). They are AI-written and not yet checked; the outline column ends with the notice "AI-generated summary. It may contain mistakes and is still being checked."${summaries ? ` Each file also carries: "${summaries.notice}"` : " (Not built on this machine.)"}`,
    "## 02 · Six parts, one library",
    await wordingList("src/pages/library/Parts.tsx"),
    `"Through time" draws one lane per part: the light band is the time it tells of, the dark line when it was written, on an axis compressed across the ~400 years between the Testaments. Six tiles choose a part; its panel gives what it is, key moments, its figures from the data, and hand-written facts (traditional dating, marked "c."). Below, every chapter of the part as cells that darken with the chapter's length: "Choose a chapter" shows it above, "Mark as read" ticks it (kept in this browser only, shared with the reader's Read button).`,
    table(["Part", "Books", "Books in the part", "Chapters (KJV)", "Written"], partRows),
    "## 03 · The versions",
    `**The versions** · "${catalog.translations.length} free texts · sources and licences" (→ ${link("/versions")}). Filter buttons: ${filters.join(" · ")}. A box seven rows tall that scrolls, with the scrollbar outside its frame; each row opens the version at its first chapter ("Read").`,
    ...lists,
  ) };
}

export const homePages = () => Promise.all([home(), library()]);
