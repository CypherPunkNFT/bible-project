// Paul's guided journey (Atlas → Journeys) for CONTENT.md: the same chapters and stops the page builds
// (src/pages/places/paul-journey.ts) from the Letters study's data.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Citation, LetterGroup } from "../../src/data/letters/types";
import { buildPaulJourney, type JourneyChapter } from "../../src/pages/places/paul-journey";
import { loadCatalog, refs, table, WEBSITE } from "./study-lib";

const LAYER = { scripture: "Named in Scripture", proposed: "Proposed by scholars", tradition: "Later tradition" } as const;
const source = (citations: Citation[]) => (id: string) => {
  const c = citations.find((item) => item.id === id);
  return c ? `${c.author.replace(/\s*\(.*\)$/, "")}, *${c.title.replace(/\s*\(.*\)$/, "")}* (${c.year})` : id;
};

export async function paulJourneyMarkdown(): Promise<string> {
  const group = JSON.parse(await readFile(path.join(WEBSITE, "src/data/letters/paul-letters.json"), "utf8")) as LetterGroup;
  const journey = buildPaulJourney(group);
  const catalog = await loadCatalog();
  const cite = source(journey.citations);
  const chapterBlock = (chapter: JourneyChapter, i: number, lens: string) => [
    `#### ${i + 1}. ${chapter.title}${chapter.years ? ` · AD ${chapter.years[0]}–${chapter.years[1]}` : ""}`,
    "",
    `Opens at [/study/atlas/journeys?focus=paul&lens=${lens}&chapter=${chapter.id}](https://bibleproject.io/study/atlas/journeys?focus=paul&lens=${lens}&chapter=${chapter.id}). ${chapter.route ? "The route is drawn dashed: the way between stops is reconstructed." : "No route line: the places are pins, not a journey."}`,
    "",
    chapter.summary,
    "",
    table(["#", "Stop", "Label", "Passages", "Note", "Sources"], chapter.stops.map((stop, n) => [n + 1, stop.name, LAYER[stop.layer], refs(catalog, stop.refs), stop.note && stop.note !== stop.name ? stop.note : "", stop.cites.map(cite).join("; ")])),
  ].join("\n");
  const stops = journey.story.reduce((n, c) => n + c.stops.length, 0);
  return [
    "## Paul's guided journey (built)",
    "",
    `Choosing Paul with the Story or Letters lens shows the journey on the atlas map instead of the preview: chapter buttons, the map with the route, and a panel that steps from stop to stop (Back, Next stop, All stops). The chapter and stop are kept in the address. Built only from the Letters study's data (${journey.story.length} story chapters, ${stops} stops). Years: ${journey.datingCites.map(cite).join("; ")}; the Bible states none.`,
    "",
    "### Story lens",
    "",
    ...journey.story.map((chapter, i) => chapterBlock(chapter, i, "story") + "\n"),
    "### Letters lens",
    "",
    ...journey.letters.map((chapter, i) => chapterBlock(chapter, i, "letters") + "\n"),
  ].join("\n");
}
