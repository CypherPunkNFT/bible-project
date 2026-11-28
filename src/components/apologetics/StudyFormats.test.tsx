import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { compileDocuments } from "../../../scripts/content/compile.ts";
import { formatFixture, marker } from "../../../scripts/content/format-fixtures.ts";
import { STUDY_FORMATS, walk, type ContentDocument, type ScriptureIndex, type StudyFormat } from "../../../scripts/content/model.ts";
import scriptureIndex from "../../../content/apologetics/scripture-index.json";
import editorial from "../../../content/apologetics/editorial/library.json";
import type { ApStudy } from "@/data/apologetics-types";
import { CatalogContext } from "@/lib/catalog";
import { catalog } from "@/pages/life-events/test-kit";
import { FormatArticle, MoreObjections } from "./StudyFormats";
import { essayPart, essayPartUrl, formatPlaces, hasFormatPage } from "@/lib/apologetics-formats";

// Each format's page draws the step-3 fixture of that format (scripts/content/format-fixtures.ts). Case study and
// questions answered have no published article yet (the plan's samples wait on owner decision 4 and job 10.5), so this
// is their proof that the page shows every text the content holds.
const fixture = (format: StudyFormat, extra: Record<string, unknown> = {}) => {
  const doc = formatFixture(format); doc.publication = "published"; Object.assign(doc.content, extra);
  return { doc, study: compileDocuments([doc, editorial as unknown as ContentDocument], scriptureIndex as ScriptureIndex).STUDIES[0] as unknown as ApStudy };
};
const frame = (children: ReactNode) => <CatalogContext.Provider value={catalog}><MemoryRouter>{children}</MemoryRouter></CatalogContext.Provider>;
const draw = (study: ApStudy, part = 1) => render(frame(<FormatArticle study={study} part={part} />));
/** Every text a reader should see: block text, objections, questions and terms. */
function texts(content: unknown): string[] {
  const found: string[] = [];
  walk(content, (entry) => { for (const key of ["text", "objection", "question", "term"]) if (typeof entry[key] === "string" && entry[key]) found.push(entry[key] as string); });
  return found;
}
const close = (id: string) => ({ id, text: `Closing ${id}.`, citations: [{ kind: "scripture", reference: "Romans 3:23" }] });

describe("article format pages", () => {
  for (const format of STUDY_FORMATS.filter((f) => f !== "short-answer" && f !== "essay")) {
    it(`draws every text of the ${format} format, the shared closing blocks included`, () => {
      // Any format may carry a conclusion and a prompt beside its own items (formats.ts SHARED); they must show too.
      const { doc, study } = fixture(format, { conclusion: close("conclusion"), prompt: close("conversation") });
      expect(hasFormatPage(study)).toBe(true);
      const shown = draw(study).container.textContent ?? "";
      expect(shown).toContain(marker(format));
      for (const text of texts(doc.content)) expect(shown, `${format}: ${text}`).toContain(text);
      expect(formatPlaces(study, 1).length).toBeGreaterThan(0);
    });
  }

  it("shows every essay text across its parts: the lede on the first, the close on the last", () => {
    const { doc, study } = fixture("essay");
    const shown = [1, 2, 3].map((part) => { const view = draw(study, part); const text = view.container.textContent ?? ""; view.unmount(); return text; }).join(" ");
    for (const text of texts(doc.content)) expect(shown, text).toContain(text);
  });

  it("shows one essay part per page, with the next part's address at its foot", () => {
    draw(fixture("essay").study, 2);
    expect(screen.getByRole("heading", { level: 2, name: "Part 2" })).toBeTruthy();
    expect(screen.queryByText("The lede.")).toBeNull();
    expect(screen.getByRole("link", { name: /Next part · 3 of 3/ }).getAttribute("href")).toBe("/apologetics/study/fixture-essay/part/3");
    expect(screen.getAllByRole("link", { name: /Part 1/ })[0].getAttribute("href")).toBe("/apologetics/study/fixture-essay");
  });

  it("finds the nearest part to a part number the essay does not have", () => {
    const { study } = fixture("essay");
    expect([essayPart(study, "0"), essayPart(study, "9"), essayPart(study, "x"), essayPart(study, undefined)]).toEqual([1, 3, 1, 1]);
    expect(essayPartUrl("a", 1)).toBe("/apologetics/study/a");
  });

  it("keeps a short answer on today's page and adds its further objection pairs", () => {
    const { study } = fixture("short-answer");
    expect(hasFormatPage(study)).toBe(false);
    expect(render(frame(<MoreObjections study={study} />)).container.textContent).toContain(marker("short-answer"));
  });

  it("marks a reading's extract as the edition's own English, never translated, left to right", () => {
    const quote = draw(fixture("reading").study).container.querySelector("blockquote")!;
    expect([quote.getAttribute("translate"), quote.getAttribute("lang"), quote.getAttribute("dir")]).toEqual(["no", "en", "ltr"]);
  });
});
