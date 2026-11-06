import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { STUDY_BRANCHES } from "@/pages/study/hub/collections";
import { ACADEMIC_DRAFTS, UNPLACED_DRAFTS } from "./academic-drafts";
import { ResearchFields, ResearchValue } from "./ResearchBlocks";

const root = join(__dirname, "../../../../content/academic-research");
const areaIds = STUDY_BRANCHES.academic.areas.map(area => area.id);
const research = ACADEMIC_DRAFTS.map(draft => ({ draft, file: JSON.parse(readFileSync(join(root, draft.file), "utf-8")) as Record<string, unknown> }));

describe("the Academic drafts mock-up", () => {
  it("places every draft in the index on an Academic hub subject", () => {
    expect(UNPLACED_DRAFTS.map(entry => `${entry.order} ${entry.title} (${entry.category})`)).toEqual([]);
    for (const draft of ACADEMIC_DRAFTS) expect(areaIds, `${draft.title} → ${draft.areaId}`).toContain(draft.areaId);
    expect(new Set(ACADEMIC_DRAFTS.map(draft => draft.slug)).size).toBe(ACADEMIC_DRAFTS.length);
  });

  it("shows the five researched drafts of the next-twenty sequence", () => {
    expect(ACADEMIC_DRAFTS.map(draft => draft.slug).sort()).toEqual(expect.arrayContaining([
      "between-the-testaments", "cyrus-restoration-and-return", "mesha-and-the-world-of-moab",
      "traditions-shared-roots-divisions", "why-translations-differ",
    ]));
    for (const draft of ACADEMIC_DRAFTS) expect(draft.premise?.length ?? 0, `${draft.title} has a premise for its card`).toBeGreaterThan(40);
  });

  it.each(research.map(({ draft, file }) => [draft.title, draft.slug, file] as const))("reads %s whole", (_title, slug, file) => {
    expect(file.slug).toBe(slug);
    const html = renderToStaticMarkup(<MemoryRouter>{Object.entries(file).map(([key, value]) =>
      typeof value === "object" && value !== null && !Array.isArray(value) ? <ResearchFields key={key} record={value as Record<string, unknown>} /> : <ResearchValue key={key} value={value} field={key} />)}</MemoryRouter>);
    expect(html.length).toBeGreaterThan(5000);
    expect(html).not.toContain("[object Object]");
    expect(html).not.toContain("Nested too deep");
  });
});
