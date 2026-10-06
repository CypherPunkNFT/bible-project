import { matchTopics, placeOf, type TopicIndex } from "./topics";

const index: TopicIndex = {
  source: "test",
  categories: [{ id: "god", title: "God", description: "", subcategories: [{ id: "attributes-of-god", title: "Attributes of God", description: "", topics: ["love-of-god", "grace"] }] }],
  topics: { "love-of-god": { title: "The Love of God", points: 10, refs: 50 }, grace: { title: "Grace", points: 5, refs: 86 }, "grace-of-god": { title: "The Grace of God", points: 3, refs: 20 } },
};

describe("topics", () => {
  it("matches topic names by every word, the one that starts with the query first", () => {
    expect(matchTopics(index, "grace")).toEqual(["grace", "grace-of-god"]);
    expect(matchTopics(index, "love god")).toEqual(["love-of-god"]);
    expect(matchTopics(index, "to")).toEqual([]);
  });
  it("finds where a topic sits", () => {
    expect(placeOf(index, "grace")?.subcategory.id).toBe("attributes-of-god");
    expect(placeOf(index, "nowhere")).toBeNull();
  });
});
