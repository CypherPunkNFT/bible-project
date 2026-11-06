import { afterEach, describe, expect, it, vi } from "vitest";
import { STUDIES } from "@/data/apologetics-studies";
import { searchStudies } from "./apologetics-search";
import { setSiteLanguage, type LanguageCode } from "./language";
import { chooseSiteLanguage } from "./page-translator";
import { foldWord, searchBible, searchLanguage, segmentsOf, wordsOf, type SearchLanguage } from "./search-language";
import { markInLanguage, queryWords, wordsInLanguage } from "./search-words";
import { commonWords } from "./study-search-language";
import { matchTopics, type TopicIndex } from "./topics";
import type { Translation } from "./types";
import SAMPLE from "./study-search-language.sample.json";

// The site search in each of the six languages (translation system, stage 5 job 16). The sample holds each language's
// translation of every study's title, summary and answer, copied from data/i18n/<folder>/ui.json
// on 2026-11-06, so these tests run without the data folder (not in git). The questions are a reader's own wording,
// not the studies' titles.
const QUESTIONS: Record<string, { code: LanguageCode; asks: [string, string][] }> = {
  es: { code: "es", asks: [["¿Resucitó Jesús de verdad?", "resurrection"], ["¿Quién eligió los libros de la Biblia?", "canon"], ["¿Cómo puede un Dios bueno permitir el dolor?", "suffering"]] },
  pt: { code: "pt-BR", asks: [["Jesus ressuscitou mesmo?", "resurrection"], ["Quem escolheu os livros da Bíblia?", "canon"]] },
  zh: { code: "zh-Hans", asks: [["耶稣真的复活了吗？", "resurrection"], ["谁选定了圣经的书卷？", "canon"]] },
  ar: { code: "ar", asks: [["هل قام يسوع من الموت حقا؟", "resurrection"], ["من اختار أسفار الكتاب المقدس؟", "canon"]] },
  hi: { code: "hi", asks: [["क्या यीशु सच में जी उठा?", "resurrection"], ["बाइबल की पुस्तकें किसने चुनीं?", "canon"]] },
  id: { code: "id", asks: [["Apakah Yesus benar-benar bangkit?", "resurrection"], ["Siapa yang memilih kitab-kitab Alkitab?", "canon"]] },
};

const sample = SAMPLE as Record<string, Record<string, string>>;
const languageOf = (folder: string, version = 1): SearchLanguage => ({ code: QUESTIONS[folder].code, version, translate: (english) => sample[folder][english] ?? null });
const top = (query: string, language: SearchLanguage | null, n = 3) => searchStudies(STUDIES, query, language).hits.slice(0, n).map((hit) => hit.study.id);

afterEach(() => {
  vi.unstubAllGlobals();
  setSiteLanguage("en");
});

describe.each(Object.keys(QUESTIONS))("site search in the %s copy", (folder) => {
  it.each(QUESTIONS[folder].asks)("a question in the language, %s, finds the %s study", (question, id) => {
    expect(top(question, languageOf(folder))).toContain(id);
  });

  it("finds it through the site's own phrase list, read as the page translator reads it", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => (url === `/data/i18n/${folder}/ui.json` ? sample[folder] : {}) })));
    await chooseSiteLanguage(QUESTIONS[folder].code);
    const language = searchLanguage(QUESTIONS[folder].code)!;
    expect(language.version).toBeGreaterThan(0);
    const [question, id] = QUESTIONS[folder].asks[0];
    expect(top(question, language)).toContain(id);
  });

  it("keeps the question's words as typed for the word tabs and drops only the language's commonest words", () => {
    const language = languageOf(folder);
    const [question] = QUESTIONS[folder].asks[1];
    const { words } = wordsInLanguage(question, language, commonWords(STUDIES, language));
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) expect(question.toLowerCase()).toContain(word);
  });

  it("marks the matching passage with its own language: the language's, or English where it has no translation yet", () => {
    const language = languageOf(folder), translations = new Set(Object.values(sample[folder]));
    const hits = searchStudies(STUDIES, QUESTIONS[folder].asks[0][0], language).hits.filter((hit) => hit.snippet);
    for (const hit of hits) expect(hit.snippetLang).toBe(translations.has(hit.snippet!.map((part) => part.text).join("")) ? language.code : "en");
  });
});

describe("the language index", () => {
  it("leaves English exactly as it was", () => {
    for (const query of ["forgive", "resurection", "who decided the canon", "why does god allow suffering"]) {
      expect(searchStudies(STUDIES, query, null)).toEqual(searchStudies(STUDIES, query));
    }
  });

  it("still finds a study for an English question asked on a translated site", () => {
    expect(top("resurrection", languageOf("es"))).toContain("resurrection");
  });

  it("is rebuilt when the language or its phrase list changes, and an index built before the list was read is not kept", () => {
    const empty: SearchLanguage = { code: "es", version: 0, translate: () => null };
    expect(top("¿Quién eligió los libros de la Biblia?", empty)).not.toContain("canon");
    expect(top("¿Quién eligió los libros de la Biblia?", languageOf("es", 0))).toContain("canon");
    expect(top("谁选定了圣经的书卷？", languageOf("zh"))).toContain("canon");
  });

  it("returns every study for a question of only common words or punctuation", () => {
    expect(searchStudies(STUDIES, "¿?", languageOf("es")).hits).toHaveLength(STUDIES.length);
    expect(searchStudies(STUDIES, "de la el", languageOf("es")).hits).toHaveLength(STUDIES.length);
  });
});

describe("words in every script", () => {
  it("folds accents on Latin letters, and Arabic vowel marks, alif forms and the article", () => {
    expect(foldWord("Resucitó")).toBe("resucito");
    expect(foldWord("Bíblia")).toBe("biblia");
    expect(foldWord("الْمَوْت")).toBe("موت");
    expect(foldWord("أسفار")).toBe("اسفار");
  });

  it("keeps Hindi vowel signs, which are letters of the word (दुख is not दख)", () => {
    expect(foldWord("दुख")).toBe("दुख");
    expect(foldWord("दुख")).not.toBe(foldWord("दख"));
    expect(wordsOf("परमेश्वर दुख क्यों", "hi")).toEqual(["परमेश्वर", "दुख", "क्यों"]);
  });

  it("cuts Chinese, which has no spaces, into words", () => {
    expect(wordsOf("耶稣真的复活了吗？", "zh-Hans")).toContain("复活");
  });

  it("without the browser's word breaker, cuts a Chinese run into pairs and other scripts into letter runs", () => {
    const breaker = (Intl as unknown as { Segmenter?: unknown }).Segmenter;
    try {
      (Intl as unknown as { Segmenter?: unknown }).Segmenter = undefined;
      expect(wordsOf("复活了吗", "zh-Hans")).toEqual(["复活", "活了", "了吗"]);
      expect(segmentsOf("Jesús vive.", "es").filter((s) => s.word).map((s) => s.text)).toEqual(["Jesús", "vive"]);
      expect(wordsOf("दुख क्यों", "hi")).toEqual(["दुख", "क्यों"]);
    } finally {
      (Intl as unknown as { Segmenter?: unknown }).Segmenter = breaker;
    }
  });

  it("marks words in the language by comparing words, never by building a pattern from the question", () => {
    const parts = markInLanguage("¿Resucitó Jesús?", ["resucitó", "(.*)"], languageOf("es"));
    expect(parts.filter((p) => p.word !== null).map((p) => p.text)).toEqual(["Resucitó"]);
  });

  it("leaves English word tabs to the English rules", () => {
    expect(queryWords("why does God allow suffering").words).toEqual(["god", "allow", "suffering"]);
  });
});

describe("topics in the language", () => {
  const index = { categories: [], topics: { pain: { title: "El sufrimiento", points: 1, refs: 3, f: 0, s: "t" }, cross: { title: "复活", points: 1, refs: 2, f: 0, s: "t" }, death: { title: "الموت", points: 1, refs: 1, f: 0, s: "t" } } } as unknown as TopicIndex;
  it("finds a topic by a word without its accent, a two-character Chinese word, and an Arabic word with marks", () => {
    expect(matchTopics(index, "sufrimiento", 12, foldWord)).toEqual(["pain"]);
    expect(matchTopics(index, "复活", 12, foldWord)).toEqual(["cross"]);
    expect(matchTopics(index, "مَوْت", 12, foldWord)).toEqual(["death"]);
  });
});

describe("the Bible the exact-words search reads", () => {
  const bibles = [{ slug: "kjv", lang: "en" }, { slug: "rvr", lang: "es" }, { slug: "cuv", lang: "zh-Hans" }] as Translation[];
  it("is the one last read when it is in the site's language, else the language's own", () => {
    expect(searchBible(bibles, languageOf("es"), "kjv")).toBe("rvr");
    expect(searchBible(bibles, languageOf("es"), undefined)).toBe("rvr");
    expect(searchBible(bibles, languageOf("zh"), "cuv")).toBe("cuv");
  });
});
