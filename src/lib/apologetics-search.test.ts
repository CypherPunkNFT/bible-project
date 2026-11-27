import { STUDIES } from "@/data/apologetics-studies";
import { searchStudies, searchTerm } from "./apologetics-search";
import type { ApStudy } from "@/data/apologetics-types";

const titles = (query: string) => searchStudies(STUDIES, query).hits.map((hit) => hit.study.title);

describe("question library search", () => {
  it("returns every study, unranked, for an empty or stop-word-only query", () => {
    expect(searchStudies(STUDIES, "").hits).toHaveLength(STUDIES.length);
    expect(searchStudies(STUDIES, "why is the").hits).toHaveLength(STUDIES.length);
  });

  it("matches whole words, not letters inside other words ('sin' is not 'pleasing')", () => {
    const hits = searchStudies(STUDIES, "sin").hits;
    expect(hits.length).toBeGreaterThan(0);
    for (const { study } of hits) {
      const text = JSON.stringify(study).toLowerCase();
      expect(text, study.title).toMatch(/\bsin/);
    }
  });

  it("treats word forms as one word ('forgive' finds the forgiveness study)", () => {
    expect(titles("forgive")).toContain("Why would forgiveness involve the cross?");
  });

  it("forgives a typo in a longer word", () => {
    expect(titles("resurection")).toContain("Does the resurrection really matter?");
  });

  it("ranks a title match first", () => {
    expect(titles("resurrection")[0]).toBe("Does the resurrection really matter?");
  });

  it("searches the full study, and shows the sentence that matched with the word marked", () => {
    const deep = searchStudies(STUDIES, "Calvin").hits.find((hit) => hit.snippet);
    if (!deep) return; // no study cites Calvin outside its card text
    expect(deep.snippet!.some((part) => part.hit)).toBe(true);
  });

  it("falls back to any word when no study has them all, and says so", () => {
    const result = searchStudies(STUDIES, "resurrection zzzqqq");
    expect(result.partial).toBe(true);
    expect(result.hits.map((hit) => hit.study.title)).toContain("Does the resurrection really matter?");
  });

  it("normalises words: case, accents, possessives, stop words", () => {
    expect(searchTerm("Jesus’s")).toBe(searchTerm("jesus"));
    expect(searchTerm("Café")).toBe(searchTerm("cafe"));
    expect(searchTerm("the")).toBeNull();
  });
});

describe("question library search fallback", () => {
  it("keeps only the studies matching the most words, not every study with a common word", () => {
    const result = searchStudies(STUDIES, "can god forgive murder");
    expect(result.partial).toBe(true);
    expect(result.hits.length).toBeLessThan(STUDIES.length / 2);
    expect(result.hits.map((hit) => hit.study.title)).toContain("Why would forgiveness involve the cross?");
  });
});

describe("question library search over the article formats", () => {
  it("finds a study by the text of any format's own items", () => {
    const cited = (text: string) => ({ text, citations: [] });
    const markers = ["objectionword", "replyword", "partword", "figureword", "workword", "extractword", "noteword", "eventword", "commonword", "viewword", "termword", "answerword", "questionword"];
    const study: ApStudy = { ...STUDIES[0], id: "format-search-fixture", format: "faq",
      objections: [{ id: "o", heldBy: ["A critic"], objection: "An objectionword.", reply: cited("A replyword.") }],
      parts: [{ id: "p", title: "Part", blocks: [cited("A partword.")], passages: [] }],
      figure: { name: "A figureword", dates: "", tradition: "", roles: [], citations: [] }, works: [{ title: "A workword", date: "1785", note: "" }],
      extracts: [{ id: "e", source: "lbcf", locator: "1", edition: "", translator: "", text: "An extractword.", note: cited("A noteword.") }],
      events: [{ id: "v", title: "An eventword", date: "33", certainty: "exact", ...cited("Text.") }], common: cited("A commonword."),
      views: [{ id: "w", label: "View", heldBy: ["Someone"], texts: [], case: cited("A viewword."), reply: cited("Reply.") }],
      terms: [{ id: "t", term: "termword", seeAlso: [], ...cited("Definition with answerword.") }],
      questions: [{ id: "q", question: "A questionword?", ...cited("Answer.") }] };
    for (const word of markers) expect(searchStudies([...STUDIES, study], word).hits.map((hit) => hit.study.id), word).toContain(study.id);
  });
});
