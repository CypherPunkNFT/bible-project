// The owner's scroll rule (2026-11-17): long lists are drawn a window of rows at a time (WindowedRows / useRowWindow),
// never paged by a "Show more", "Load more", "Show all N" or Previous/Next button. A guard over the lists that had one.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const WINDOWED = [
  "src/components/study/PersonProfile.tsx",
  "src/components/reader/VersePanel.tsx",
  "src/components/atlas/PlacePanel.tsx",
  "src/pages/teachers/scholars/built/SourceDetails.tsx",
  "src/pages/SearchPage.tsx",
  "src/components/study/GospelPortraits.tsx",
  "src/pages/teachers/scholars/directory/Rows.tsx",
  "src/pages/teachers/scholars/catalogue/ContributorTable.tsx",
  "src/pages/teachers/scholars/catalogue/PopulationWorks.tsx",
  "src/pages/teachers/scholars/catalogue/PopulationCoverage.tsx",
  "src/components/sources/CorpusDashboard.tsx",
  "src/components/letters/LetterParts.tsx",
  "src/pages/study/hymns/Catalogue.tsx",
  "src/pages/study/strongs/Bench.tsx",
  "src/pages/teachers/preachers/bible/Panels.tsx",
  "src/pages/study/connections/VerseLinks.tsx",
  "src/pages/study/museums/MuseumPage.tsx",
  "src/pages/teachers/preachers/drawer/ProfileWorks.tsx",
  "src/pages/teachers/shared/AcquiredCatalogue.tsx",
  "src/pages/teachers/scholars/Fields.tsx",
  "src/pages/study/hymns/Through.tsx",
  "src/pages/teachers/preachers/through/BookPanel.tsx",
  "src/components/study/PeopleCatalog.tsx",
];
// Lists short enough to show whole (under about 100 rows): shown whole, with no button either.
const WHOLE = [
  "src/components/letters/browse/parts-letter.tsx",
  "src/components/letters/LetterBlocks.tsx",
  "src/components/letters/ThemeCards.tsx",
  "src/pages/study/hymns/WholeBible.tsx",
  "src/pages/study/museums/MuseumArchaeologyPage.tsx",
  "src/pages/teachers/scholars/Directory.tsx",
  "src/pages/teachers/scholars/Catalogue.tsx",
];
// Button text as code writes it (a template or JSX text), so comments quoting the old buttons do not count.
const PAGER = /`Show (more|all|\$\{)|>\s*(Load|Show) more|More connections|`View all|setLimit\(|aria-label="[^"]*pages"/;

describe("long lists follow the scroll rule", () => {
  it.each(WINDOWED)("%s draws its list with WindowedRows and has no pager", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toMatch(/WindowedRows/);
    expect(source).not.toMatch(PAGER);
  });
  it.each(WHOLE)("%s has no pager", (file) => {
    expect(readFileSync(file, "utf8")).not.toMatch(PAGER);
  });
});
