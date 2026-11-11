// The eighteen prompts (design §2 and §9): their shape, their limits, and that every string is one the translation
// collector takes whole (content/translation/page_rules.py: under 400 characters, starts with a word, no semicolon,
// equals sign or backslash) and none is a bare Bible verse.
import { describe, expect, it } from "vitest";
import { LONG_LIMIT, NAME_LIMIT, PARTS, QUESTIONS, QUESTION_COUNT, STORY_QUESTIONS, TITLE_LIMIT, WHEN_LIMIT, isAnswered, questionById, questionIndex } from "./questions";

const strings = (question: (typeof QUESTIONS)[number]): string[] => [question.short, question.text, question.heading ?? "", ...question.guidance, ...(question.example ?? [])].filter(Boolean);

describe("the questions", () => {
  it("are eighteen, in five parts, each with its own address-safe id", () => {
    expect(QUESTION_COUNT).toBe(18);
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(18);
    for (const question of QUESTIONS) expect(question.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(new Set(QUESTIONS.map((question) => question.part))).toEqual(new Set(PARTS.map((part) => part.key)));
    expect(QUESTIONS.map((question) => question.part)).toEqual([...QUESTIONS].sort((a, b) => PARTS.findIndex((p) => p.key === a.part) - PARTS.findIndex((p) => p.key === b.part)).map((question) => question.part));
  });

  it("give every story question a heading, a question, guidance and an example, and the title block none", () => {
    expect(STORY_QUESTIONS).toHaveLength(15);
    for (const question of STORY_QUESTIONS) {
      expect(question.heading?.trim()).toBeTruthy();
      expect(question.text.trim()).toBeTruthy();
      expect(question.guidance.length).toBeGreaterThan(0);
      expect(question.example?.length).toBeGreaterThan(0);
    }
    const lines = QUESTIONS.filter((question) => question.kind === "line");
    expect(lines.map((question) => question.id)).toEqual(["name", "title", "when"]);
    for (const question of lines) expect(question.heading).toBeUndefined();
    expect(questionById("name")?.limit).toBe(NAME_LIMIT);
    expect(questionById("title")?.limit).toBe(TITLE_LIMIT);
    expect(questionById("when")?.limit).toBe(WHEN_LIMIT);
    expect(questionById("one-sentence")?.limit).toBe(600);
    for (const question of STORY_QUESTIONS.filter((q) => q.id !== "one-sentence")) expect(question.limit).toBe(LONG_LIMIT);
  });

  it("write every string the way the translation collector takes it", () => {
    for (const question of QUESTIONS) {
      for (const text of strings(question)) {
        expect(text.length, text).toBeLessThan(400);
        expect(text, text).toMatch(/^\w/);
        expect(text, text).not.toMatch(/[;=\\]/);
        expect(text, text).not.toMatch(/\n/);
      }
    }
  });

  it("quotes Scripture only inside a sentence, never as a bare verse", () => {
    // A bare verse is a string whose first words are a reference or that is only a quotation; examples that name a
    // verse must say something of their own around it.
    for (const question of QUESTIONS) {
      for (const text of question.example ?? []) {
        expect(text, text).not.toMatch(/^["“]/);
        expect(text, text).not.toMatch(/^[1-3]?\s?[A-Z][a-z]+ \d+:\d+/);
      }
    }
  });

  it("knows what counts as answered", () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered("")).toBe(false);
    expect(isAnswered("   \n ")).toBe(false);
    expect(isAnswered(" a ")).toBe(true);
    expect(questionIndex("began")).toBe(0);
    expect(questionIndex("nothing")).toBe(-1);
  });
});
