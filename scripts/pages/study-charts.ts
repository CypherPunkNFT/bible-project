// CONTENT for the Study pages built on ChartsPage: Connections in Scripture (/study/references), The shape of the
// Bible (/study/structure) and Versions & languages (/study/versions). Jesus & the Gospels shares the page frame
// (chartArea) and lives in study-gospels.ts.
import { PROPHECY_PASSAGES, SECTION_INSIGHTS } from "../../src/data/chart-insights";
import { STUDY_COLLECTIONS, type StudyCollectionId } from "../../src/data/study-collections";
import { STUDY_SECTIONS } from "../../src/data/study-sections";
import { groupOf, languageName, VERSION_GROUPS } from "../../src/lib/languages";
import { SECTIONS } from "../../src/lib/sections";
import type { ArcData, Catalog, Stats } from "../../src/lib/types";
import { blocks, link, loadCatalog, n, readJson, ref, refs, registerSiteModules, table, type Span } from "./study-lib";
import { byClass, byTag, findAll, first, jsxRoots, wording } from "./study-source";
import type { PageContent } from "./types";

const CHARTS = "src/pages/ChartsPage.tsx";
const CANON = SECTIONS.filter((section) => section.id !== "apocrypha");

/** The "In this collection" cards of a study, as StudyContents shows them. */
export async function contentsCards(id: StudyCollectionId, behaviour?: string): Promise<string> {
  const roots = await jsxRoots("src/components/study/StudyContents.tsx", "StudyContents");
  const sections = STUDY_SECTIONS[id], collection = STUDY_COLLECTIONS.find((item) => item.id === id)!;
  const rows = sections.map((item, i) => [`${String(i + 1).padStart(2, "0")} / ${String(sections.length).padStart(2, "0")}`, item.kind, item.title, item.description,
    item.to ? `opens ${link(item.to)}` : `${collection.path}#${item.id} (shown below the cards)`]);
  return blocks(`## In this collection\n\n**${first(roots, byTag("h2")).text}** ${first(roots, byTag("p")).text}`,
    table(["Card", "Kind", "Title", "Text", "Opens"], rows),
    behaviour ?? "Cards that stay on this page show one section at a time below them (\"Explore below\" / \"Now exploring\"); a card with its own page says \"Open the guide\" or \"Open the library\".");
}

interface ChartPanel { id: string; title: string; lead: string; source: string }

/** One ChartsPage study: its heading, contents cards and the panels (title, lead, source line) in order. */
export async function chartArea(areaId: string, collectionId: StudyCollectionId): Promise<{ header: string; panels: ChartPanel[] }> {
  const roots = await jsxRoots(CHARTS, "ChartsPage");
  const area = first(roots, (node) => node.tag === "section" && node.attrs.id === areaId);
  if (!area) throw new Error(`Study content: no section "${areaId}" in ${CHARTS}`);
  const heading = first([area], byClass("chart-area-heading"));
  const [kicker, lead] = findAll([heading], byTag("p"));
  // The OpenBible.info credit is a shared link (const source) dropped into two source lines; name it instead of "…".
  const credit = first(roots, (node) => node.tag === "a" && (node.attrs.href ?? "").includes("openbible"))?.text ?? "…";
  const panels = findAll([area], byTag("ChartPanel")).map((panel) => ({ id: panel.attrs.id, title: panel.attrs.title, lead: panel.attrs.lead, source: panel.attrs.source.replace(/ …$/, ` ${credit}`) }));
  const collection = STUDY_COLLECTIONS.find((item) => item.id === collectionId)!;
  const back = first(roots, byClass("chart-back-map"));
  const header = blocks(
    `**Address:** ${link(collection.path)} · **Card label on the Study page:** ${collection.label} (${collection.lens})`,
    `## Heading\n\n- Kicker: ${kicker.text}\n- Title: **${first([heading], byTag("Heading")).text}**\n- Lead: ${lead.text}\n- Above it: "Back to Study" and the study's name; at the foot: "${back.text}"`,
    await contentsCards(collectionId),
  );
  return { header, panels };
}

/** A panel's heading block: position, kind, title, lead and its source line. */
export function panelHead(panels: ChartPanel[], collectionId: StudyCollectionId, id: string): string {
  const panel = panels.find((item) => item.id === id);
  const sections = STUDY_SECTIONS[collectionId], position = sections.findIndex((item) => item.id === id);
  if (!panel || position < 0) throw new Error(`Study content: no chart panel "${id}" in ${CHARTS}`);
  return `## ${String(position + 1).padStart(2, "0")} / ${String(sections.length).padStart(2, "0")} · ${sections[position].kind}: ${panel.title}\n\n${panel.lead}\n\n*Source line:* ${panel.source}`;
}

const controls = async (file: string) => `*Interface wording (${file.split("/").pop()}):* ${(await wording(file)).join(" · ")}`;

async function references(): Promise<PageContent> {
  const [{ header, panels }, arcs, pairs, catalog] = await Promise.all([chartArea("references", "references"), readJson<ArcData>("data/xref-arcs.json"), readJson<[string, string, number][]>("data/xref-books.json"), loadCatalog()]);
  const bookOf = arcs.chapters.map((label) => label.split(" ")[0]);
  const perBook = new Map<string, number>();
  let total = 0;
  for (const [a, b, count] of arcs.arcs) {
    total += count;
    for (const code of new Set([bookOf[a], bookOf[b]])) perBook.set(code, (perBook.get(code) ?? 0) + count);
  }
  const books = catalog.books.filter((book) => bookOf.includes(book.code));
  const canon = catalog.books.filter((book) => book.num <= 66), index = new Map(canon.map((book, i) => [book.code, i]));
  const top = pairs.filter(([a, b]) => a !== b && index.has(a) && index.has(b)).sort((x, y) => y[2] - x[2]).slice(0, 100);
  const name = (code: string) => canon[index.get(code)!].name;
  return { dir: "Study/connections-in-scripture", title: "Connections in Scripture", markdown: blocks(header,
    panelHead(panels, "references", "arcs"),
    `The arc chart draws ${n(arcs.arcs.length)} arcs between ${n(arcs.chapters.length)} chapters: **${n(total)} cross-references between chapters** for the whole Bible ("The whole Bible" in the live line above it). Choosing a book lights its arcs and shows its own total:`,
    table(["Book", "Cross-references between chapters"], books.map((book) => [book.name, n(perBook.get(book.code) ?? 0)])),
    `Legend: ${CANON.map((section) => section.name).join(" · ")}.`, await controls("src/components/charts/ArcDiagram.tsx"),
    panelHead(panels, "references", "matrix"),
    `A 66 × 66 grid (rows: from, columns: to) of ${n(pairs.length)} book pairs that have cross-references. Beside it, "Most cross-referenced book pairs": the top 100 pairs between different books, each selectable.`,
    table(["#", "From → to", "Cross-references"], top.map(([a, b, count], i) => [i + 1, `${name(a)} → ${name(b)}`, n(count)])),
    await controls("src/components/charts/BookMatrix.tsx"),
    "Sources: OpenBible.info cross-references (CC BY), credited and linked in each panel's source line.") };
}

async function structure(): Promise<PageContent> {
  const [{ header, panels }, stats, catalog] = await Promise.all([chartArea("structure", "structure"), readJson<Stats>("data/stats.json"), loadCatalog()]);
  registerSiteModules();
  const { buildStudyMeasures, entriesBySection, STUDY_MEASURES, TEXT_MEASURES } = await import("../../src/lib/chart-measures");
  const [harmony, miracles, names] = await Promise.all([readJson<Parameters<typeof buildStudyMeasures>[0]>("data/study/harmony.json"), readJson<Parameters<typeof buildStudyMeasures>[1]>("data/study/miracles.json"), readJson<Parameters<typeof buildStudyMeasures>[2]>("data/study/names.json")]);
  const study = buildStudyMeasures(harmony, miracles, names);
  const textValue = (id: string, books: Stats["books"]) => books.reduce((sum, book) => sum + (id === "books" ? 1 : id === "chapters" ? book.chapters.length : id === "red" ? book.red : id === "verses" ? book.verses : book.words), 0);
  const columns = [...TEXT_MEASURES, ...STUDY_MEASURES];
  const rows = CANON.map((section) => {
    const books = stats.books.filter((book) => book.section === section.id);
    return [`${section.name} (${section.span})`, ...columns.map((measure) => {
      const entries = (study as Record<string, { title: string; refs: Span[] }[]>)[measure.id];
      return n(entries ? entriesBySection(entries, catalog.books).get(section.id)?.length ?? 0 : textValue(measure.id, books));
    })];
  });
  const guides = await jsxRoots("src/components/charts/SectionGuide.tsx", "SectionGuide");
  const insights = CANON.map((section) => { const insight = SECTION_INSIGHTS[section.id]!;
    return `### Why ${section.name}? (${section.span})\n\n- ${insight.why}\n- **How to read it:** ${insight.read}\n- **A thread to follow:** ${insight.thread} (${ref(catalog, insight.ref)})`; });
  const sizes = stats.books.map((book) => [book.name, SECTIONS.find((s) => s.id === book.section)!.name, n(book.chapters.length), n(book.verses), n(book.words)]);
  const canonBooks = stats.books.filter((book) => book.section !== "apocrypha");
  const longest = (key: "words" | "verses") => canonBooks.reduce((a, b) => (a[key] >= b[key] ? a : b)).name;
  return { dir: "Study/the-shape-of-the-bible", title: "The shape of the Bible", markdown: blocks(header,
    `Above each of the three charts: section filter buttons (Whole Bible · ${CANON.map((s) => s.name).join(" · ")}); a choice carries through all three.`,
    panelHead(panels, "structure", "sections"),
    `With no section chosen, the guide reads: **${first(guides, byTag("h3")).text}** ${findAll(guides, byTag("p")).slice(0, 2).map((p) => p.text).join(" ")}`,
    "With a section chosen, the guide shows:", ...insights,
    `"Measure by" buttons: ${columns.map((m) => m.label).join(" · ")}. The donut and the list beside it show each section's value and share; a one-line insight is computed for the chosen section. Values (KJV, no Apocrypha):`,
    table(["Section", ...columns.map((m) => m.label)], rows),
    `Notes shown under the study measures:\n\n${STUDY_MEASURES.map((m) => `- **${m.label}:** ${m.note}`).join("\n")}`,
    `"Explore the passages" lists each measure's entries: miracles ${study.miracles.length}, selected prophecies ${study.prophecies.length}, Gospel episodes ${study.episodes.length}, names of God ${study.names.length} (the full lists are in the Miracles, Jesus & the Gospels and Names pages' CONTENT). The selected prophecies are only listed here:`,
    table(["Selected prophecy", "Passage"], PROPHECY_PASSAGES.map((entry) => [entry.title, refs(catalog, entry.refs)])),
    await controls("src/components/charts/SectionDonut.tsx"),
    panelHead(panels, "structure", "sizes"),
    `Buttons Words / Verses / Chapters, order "Bible order" or "Longest first", and "Include Apocrypha". Longest canonical book: ${longest("words")} by words and ${longest("verses")} by verses. Every bar opens the book in the reader.`,
    table(["Book", "Section", "Chapters", "Verses", "Words"], sizes),
    panelHead(panels, "structure", "chapters"),
    `One numbered tile per chapter for ${canonBooks.length} books and ${n(canonBooks.reduce((sum, book) => sum + book.chapters.length, 0))} chapters (the counts per book are in the table above); colour depth shows words. Hovering a tile reads "<Book> <chapter> — <verses> verses, <words> words".`,
    await controls("src/components/charts/ChapterGrid.tsx"),
    "Sources: the KJV text as built for the site (word, verse and chapter counts; red-letter words); the study measures come from the Harmony, Miracles and Names data; the section guides are this site's own wording.") };
}

async function versions(): Promise<PageContent> {
  const [{ header, panels }, catalog] = await Promise.all([chartArea("versions", "versions"), loadCatalog()]);
  const sorted = [...catalog.translations].sort((a, b) => a.year - b.year || a.abbr.localeCompare(b.abbr));
  const span = (t: Catalog["translations"][number], from: number, to: number) => catalog.books.filter((b) => b.num >= from && b.num <= to && t.books[b.code]).length;
  return { dir: "Study/versions-and-languages", title: "Versions & languages", markdown: blocks(header,
    panelHead(panels, "versions", "timeline"),
    `${sorted.length} editions, as a timeline (1350–2030; earlier ones are listed under it as "Earlier than this axis") or a "Chronological list". A filter shows one group: ${VERSION_GROUPS.map((g) => g.title).join(" · ")}. *Interface wording:* ${(await wording("src/components/charts/VersionsTimeline.tsx")).join(" · ")}`,
    table(["Year", "Abbreviation", "Name", "Language", "Group"], sorted.map((t) => [t.year, t.abbr, t.name, languageName(t.lang), groupOf(t.lang).title])),
    panelHead(panels, "versions", "coverage"),
    "A grid of every version (rows, its abbreviation opening the reader) against every book (Genesis to Revelation, then the Apocrypha); filled squares are included books, with the total at the right.",
    table(["Version", "Old Testament books", "New Testament books", "Apocrypha books", "Total"], catalog.translations.map((t) => [t.abbr, span(t, 1, 39), span(t, 40, 66), span(t, 67, 999), Object.keys(t.books).length])),
    await controls("src/components/charts/CoverageMatrix.tsx"),
    `## 03 / 03 · Library: Choose an edition\n\n${STUDY_SECTIONS.versions[2].description} This card opens ${link("/library")} (the Library page has its own content).`,
    "Sources: each edition's own record in the version catalogue (data/catalog.json, built from the eBible.org downloads listed in Website/SOURCES.md).") };
}

export const chartPages = () => Promise.all([references(), structure(), versions()]);
