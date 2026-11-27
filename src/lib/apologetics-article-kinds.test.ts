import { describe, expect, it } from "vitest";
import { STUDIES } from "@/data/apologetics-library";
import { ARTICLE_KINDS, FORMAT_ORDER, UNKNOWN_KIND, articleFormat, articleKind, inField } from "./apologetics-article-kinds";
import { fieldFormats } from "@/components/apologetics/FieldArticles";

describe("field page article kinds (plan APOLOGETICS-FIELDS step 5)", () => {
  const base = STUDIES.find((study) => study.topic === "jesus")!;

  it("lists a study in its own field and in every field it names in alsoIn, and nowhere else", () => {
    const shared = { ...base, alsoIn: ["doubt"] };
    expect(inField(shared, "jesus")).toBe(true);
    expect(inField(shared, "doubt")).toBe(true);
    expect(inField(shared, "god")).toBe(false);
    expect(inField(base, "doubt")).toBe(false);
    // The hub card and the field cards count with inField: a shared article is counted in both fields.
    const studies = [...STUDIES.filter((study) => study.id !== base.id), shared];
    expect(studies.filter((study) => inField(study, "doubt")).length).toBe(STUDIES.filter((study) => study.topic === "doubt").length + 1);
    expect(studies.filter((study) => inField(study, "jesus")).length).toBe(STUDIES.filter((study) => study.topic === "jesus").length);
  });

  it("shows today's articles as short answers and an unknown format as an article", () => {
    expect(articleFormat({ ...base, format: undefined })).toBe("short-answer");
    expect(articleFormat({ ...base, format: "timeline" })).toBe("timeline");
    expect(articleKind("short-answer").label).toBe("Short answer");
    expect(articleKind("not-a-format")).toBe(UNKNOWN_KIND);
  });

  it("has one label, heading and icon for each of the ten formats, in the page's order", () => {
    expect(FORMAT_ORDER).toHaveLength(10);
    expect(new Set(FORMAT_ORDER)).toEqual(new Set(Object.keys(ARTICLE_KINDS)));
    expect(new Set(Object.values(ARTICLE_KINDS).map((kind) => kind.icon)).size).toBe(10);
  });

  it("names the formats a field holds; every live field holds today's short answers", () => {
    for (const topic of ["god", "jesus", "doubt", "bible", "reformed", "faith"]) expect(fieldFormats(topic)).toContain("short-answer");
  });
});
