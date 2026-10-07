// CONTENT for the Site page "The Bible and the reader": /bible (the way in) and /read/<version>/<book>/<chapter>.
// The Bible text itself is not listed; only what surrounds it, and the versions a reader can choose.
import { groupVersions, languageName } from "../../src/lib/languages";
import { NUMBERING_LABEL } from "../../src/lib/numbering";
import { blocks, link, loadCatalog, n, table } from "./study-lib";
import { fill, looseConstant, readableText, wordingList } from "./site-source";
import { testaments } from "./site-home";
import type { PageContent } from "./types";

const BIBLE = "src/pages/BiblePage.tsx";
const READER = "src/pages/ReaderPage.tsx";
const PARTS: [string, string][] = [
  ["src/components/reader/ReaderToolbar.tsx", "The toolbar (versions, book and chapter, reading options)"],
  ["src/components/reader/VersionMenu.tsx", "The versions menu"],
  ["src/components/reader/BookPicker.tsx", "The book and chapter picker"],
  ["src/components/reader/ParallelText.tsx", "Side by side reading"],
  ["src/components/reader/VersePanel.tsx", "A verse's cross-references (the side panel)"],
  ["src/components/reader/ChapterCrossRefs.tsx", "The chapter's cross-references"],
  ["src/components/reader/ChapterPlaces.tsx", "Places in this chapter"],
  ["src/components/reader/ChapterTopics.tsx", "Topics in this chapter"],
];

export async function readerPage(): Promise<PageContent> {
  const catalog = await loadCatalog();
  const languages = new Set(catalog.translations.map((version) => version.lang)).size;
  const bible = (await readableText(BIBLE)).map((line) => (line.startsWith("… versions") ? fill(line, catalog.translations.length, languages) : line));
  const shelves = await looseConstant<string[]>(BIBLE, "SHELVES");
  const toggles = await looseConstant<string[][]>("src/components/reader/ReaderToolbar.tsx", "TOGGLES");
  const sideBySide = await looseConstant<number>("src/components/reader/VersionMenu.tsx", "MAX_SIDE_BY_SIDE");
  const parts = await Promise.all(PARTS.map(async ([file, title]) => blocks(`### ${title}`, file.endsWith("VersionMenu.tsx") ? fill(await wordingList(file), sideBySide) : await wordingList(file))));
  const rows = groupVersions(catalog.translations).flatMap(({ group, sections }) => sections.flatMap((section) => section.versions.map((version) => {
    const books = testaments(catalog, version);
    return [group.title, version.abbr, version.name, languageName(version.lang), version.year, `${books.ot} · ${books.nt} · ${books.apocrypha}`, n(version.verses),
      NUMBERING_LABEL[version.numbering], version.credit ? `${version.credit.licence}: "${version.credit.text}". ${version.credit.changes}` : "Public domain", link(`/read/${version.slug}/${Object.keys(version.books)[0]}/${Object.values(version.books)[0][0]}`)];
  })));
  const credited = catalog.translations.filter((version) => version.credit);
  return { dir: "Site/bible-reader", title: "The Bible and the reader", markdown: blocks(
    `**Addresses:** ${link("/bible")} (the "Bible" item in the site's main menu) · ${link("/read")} (opens the chapter this browser last read, else Genesis 1 in the KJV) · /read/<version>/<book>/<chapter>, e.g. ${link("/read/kjv/JHN/3")}; ?v=<verse> marks a verse.`,
    "## The Bible (/bible)",
    bible.map((line) => `- ${line}`).join("\n"),
    `The "Library" card shows a shelf of book spines: ${shelves.join(" · ")}, and opens ${link("/library")}. The "Read" card shows an open book at John 1 and opens the chapter last read (its foot names it, e.g. "Romans 8 · KJV"), or the reader at Genesis 1.`,
    "## The reader (/read/…)",
    "One chapter of one version, with the previous and next chapter on arrows at either side (across books, within the books that version has), a \"Mark read\" box that feeds the Library's reading chart, and, on wide screens, a cross-references panel beside the text. The chapter read last is remembered in this browser.",
    `Reading options (kept in this browser): text size from 85% to 150% in steps of 10%, and switches ${toggles.map((toggle) => `"${toggle[1]}"`).join(", ")} (all on except one verse per line).`,
    await wordingList(READER),
    ...parts,
    `## The versions a reader can choose (${catalog.translations.length}, in ${languages} languages)`,
    "In the order of the versions menu: English by name, then the original and ancient languages, then translations. \"Books\" counts Old Testament · New Testament · Apocrypha; the link opens each version at its first chapter.",
    table(["Group", "Version", "Name", "Language", "Year", "Books", "Verses", "Verse numbering", "Licence", "Opens"], rows),
    `Every version is public domain except ${credited.map((version) => version.name).join(", ")}, whose credit line is shown under its text wherever it is read. All texts come from eBible.org.`,
  ) };
}
