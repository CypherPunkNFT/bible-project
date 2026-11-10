// Typed answers (design §6.3): suggestions from the closed list, never judged by spelling.
import storyFile from "@/data/emoji-stories/stories.json";
import { editDistance, searchIndex, searchWords, suggest } from "./answer-match";
import type { StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const index = searchIndex(stories);
const top = (text: string) => suggest(index, text)[0]?.story.id;

describe("emoji stories answer matching", () => {
  it("finds every title and every alias's own story first", () => {
    for (const story of stories) {
      for (const label of [story.title, ...story.aliases]) expect(top(label), `"${label}"`).toBe(story.id);
    }
  });

  it("finds Noah from the spec's own words", () => {
    for (const text of ["noah", "the flood", "Noahs ark", "Noah's ark", "ark"]) expect(top(text), text).toBe("noah-flood");
  });

  it("forgives spelling of five letters or more", () => {
    expect(top("zacheus")).toBe("zacchaeus");
    expect(top("Zaccheus")).toBe("zacchaeus");
    expect(top("bartimeus")).toBe("bartimaeus");
    expect(editDistance("zacheus", "zaccheus")).toBe(1);
    expect(editDistance("form", "from")).toBe(1);
  });

  it("lists every story of a person with several, for the player to choose", () => {
    const david = stories.filter((story) => story.people.some((person) => person.name === "David")).map((story) => story.id);
    expect(david.length).toBeGreaterThan(1);
    expect(suggest(index, "david").map((entry) => entry.story.id)).toEqual(expect.arrayContaining(david));
  });

  it("suggests nothing for a little word alone, or for a single letter", () => {
    expect(suggest(index, "the")).toEqual([]);
    expect(suggest(index, "a")).toEqual([]);
    expect(suggest(index, "n")).toEqual([]);
  });

  it("matches accents and curly apostrophes as plain letters", () => {
    expect(searchWords("Noah’s Ark")).toEqual(searchWords("noahs ark"));
    expect(searchWords("Zacchæus Élie")).toEqual(["zacchæus", "elie"]);
    expect(top("Noah’s ark")).toBe("noah-flood");
    expect(top("Ruth & Boaz")).toBe("ruth");
  });

  it("finds a story by the start of each word", () => {
    expect(top("mos bask")).toBe("baby-moses");
  });

  it("shows at most six suggestions, best first", () => {
    const list = suggest(index, "jesus");
    expect(list.length).toBeLessThanOrEqual(6);
    expect(list.map((entry) => entry.score)).toEqual([...list.map((entry) => entry.score)].sort((a, b) => b - a));
  });
});
