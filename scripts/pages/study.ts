// The Study area's CONTENT.md files (run by scripts/export-pages.ts): the Study hub (/study) and its eight pages.
// Places & journeys (/study/atlas) belongs to the Atlas area. Each page's extractor lives in a study-*.ts file here.
import { STUDY_COLLECTIONS } from "../../src/data/study-collections";
import { chartPages } from "./study-charts";
import { gospelsPage } from "./study-gospels";
import { guidePages } from "./study-guides";
import { lettersPage } from "./study-letters";
import { blocks, link, table } from "./study-lib";
import { peoplePage } from "./study-people";
import { byClass, byTag, findAll, first, jsxRoots, literalConstant, wording } from "./study-source";
import type { Extractor, PageContent } from "./types";

const FILE = "src/pages/study/StudyCollection.tsx";

/** The Study hub: its introduction and the ten illustrated cards, in the order the page shows them. */
async function hub(): Promise<PageContent> {
  const roots = await jsxRoots(FILE, "StudyCollection");
  const intro = first(roots, byClass("study-intro"));
  const [eyebrow, copy] = findAll([intro], byTag("p")).filter((p) => !p.attrs.className?.includes("aside"));
  const aside = first([intro], byClass("study-intro-aside"));
  const heading = first(roots, byClass("study-collection-heading"));
  const cards = findAll(roots, byTag("Resource")).map((card) => [card.attrs.number, card.attrs.category, card.attrs.title, card.attrs.description, card.attrs.source, link(card.attrs.to)]);
  const note = first(roots, byClass("study-source-note"));
  const previews = await Promise.all(["GospelPreview", "MiraclePreview", "PeoplePreview", "LettersPreview", "NamesPreview", "PlacesPreview"].map(async (fn) => `${fn.replace("Preview", "")}: ${(await wording(FILE, fn)).join(" · ")}`));
  const chartNotes = findAll(roots, byTag("ChartPreview")).map((node) => `${node.attrs.kind}: ${node.attrs.note}`);
  const gospels = await literalConstant<{ name: string; reference: string }[]>(FILE, "gospels", { insideFunction: "GospelPreview" });
  return { dir: "Study", title: "Study", markdown: blocks(`**Address:** ${link("/study")} (the "Study" item in the site's main menu)`,
    `## Introduction\n\n- Eyebrow: ${eyebrow.text}\n- Title: **${first([intro], byTag("h1")).text}**\n- ${copy.text}\n- Beside it: ${first([aside], byTag("p")).text} · link "${first([aside], byTag("a")).text}"`,
    `## ${heading.children[0].text}\n\n${heading.children[1].text}`,
    table(["#", "Category", "Title", "Description", "Source line", "Opens"], cards),
    `Each card has its own artwork. Wording printed on it:\n\n${[...previews, ...chartNotes].map((line) => `- ${line}`).join("\n")}\n- Gospel references on the first card: ${gospels.map((g) => `${g.name} ${g.reference}`).join(" · ")}`,
    `## Foot\n\n${note.text}`,
    "## The study collections behind the cards (src/data/study-collections.ts)",
    table(["Study", "Address", "Lens", "Colour"], STUDY_COLLECTIONS.map((c) => [c.label, link(c.path), c.lens, c.color])),
    "Card 07 (Places & journeys, /study/atlas) belongs to the Atlas area and card 10 (Topics, /topics) to the Topics area; their content is listed there.") };
}

export const extract: Extractor = async () => {
  const [study, charts, gospels, guides, people, letters] = await Promise.all([hub(), chartPages(), gospelsPage(), guidePages(), peoplePage(), lettersPage()]);
  return [study, gospels, ...charts, people, ...guides, letters];
};
