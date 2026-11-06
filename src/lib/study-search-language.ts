import MiniSearch, { type SearchResult } from "minisearch";
import type { ApStudy } from "@/data/apologetics-types";
import type { SnippetPart, StudySearch } from "./apologetics-search";
import { foldWord, isHanWord, segmentsOf, wordsOf, type SearchLanguage } from "./search-language";

/**
 * The question library's search in a language other than English (search-language.ts): each study indexed in the
 * language's own words, with its English kept as a weak extra field so an English question still finds it. No word
 * forms (stemming) beyond the start of a word; words in more than half the studies count as too common to search on,
 * which does for every language what the English stop-word list does for English.
 */

const BOOST = { title: 4, summary: 2, answer: 1.5, body: 1, english: 0.5 };
const FIELDS = Object.keys(BOOST);

interface StudyText { id: string; title: string; summary: string; answer: string; body: string; english: string; fields: { text: string; translated: boolean }[] }
interface LanguageIndex { search: MiniSearch<StudyText>; common: Set<string>; texts: Map<string, StudyText> }

const bodyParts = (study: ApStudy) => [...study.reasoning, study.conclusion, ...study.sections.flatMap((s) => [s.title, s.body]), study.objection, study.reply, study.limit, study.prompt];

function studyText(study: ApStudy, language: SearchLanguage): StudyText {
  const shown = (english: string) => { const translated = english ? language.translate(english) : null; return { text: translated ?? english, translated: translated !== null }; };
  const fields = [study.answer, ...bodyParts(study)].filter(Boolean).map(shown);
  const english = [study.title, study.summary, study.answer, ...bodyParts(study), ...study.keywords].join("\n");
  return { id: study.id, title: shown(study.title).text, summary: shown(study.summary).text, answer: fields[0]?.text ?? "", body: fields.slice(1).map((f) => f.text).join("\n"), english, fields };
}

/** Words found in more than half the studies (in the language or their English): too common to tell studies apart. */
function commonIn(texts: StudyText[], code: string): Set<string> {
  const counts = new Map<string, number>();
  for (const text of texts) for (const word of new Set(wordsOf(FIELDS.map((f) => text[f as keyof StudyText]).join("\n"), code))) counts.set(word, (counts.get(word) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n > texts.length / 2).map(([word]) => word));
}

const built = new WeakMap<readonly ApStudy[], Map<string, LanguageIndex>>();

function indexFor(studies: readonly ApStudy[], language: SearchLanguage): LanguageIndex {
  const key = `${language.code} ${language.version}`;
  const cached = built.get(studies)?.get(key);
  if (cached) return cached;
  const texts = studies.map((study) => studyText(study, language));
  const common = commonIn(texts, language.code);
  const search = new MiniSearch<StudyText>({ fields: FIELDS, tokenize: (text) => wordsOf(text, language.code), processTerm: (term) => (term && !common.has(term) ? term : null) });
  search.addAll(texts);
  const index = { search, common, texts: new Map(texts.map((text) => [text.id, text])) };
  // Built before the phrase list was read, it would stay English: kept only once there is a list to build from.
  if (language.version > 0) {
    if (!built.has(studies)) built.set(studies, new Map());
    built.get(studies)!.set(key, index);
  }
  return index;
}

/** The words too common to search on, in this language: the word tabs leave them out, as English leaves out "the". */
export const commonWords = (studies: readonly ApStudy[], language: SearchLanguage): Set<string> => indexFor(studies, language).common;

const OPTIONS = {
  boost: BOOST,
  // The question is cut, folded and stripped of common words by the index's own tokenize and processTerm.
  prefix: (term: string) => !isHanWord(term) && [...term].length >= 4,
  fuzzy: (term: string) => (!isHanWord(term) && [...term].length > 6 ? 1 : false),
};

/** The field (answer, a step of the reasoning, a section) holding most of the matched words, shortest first, drawn
 * whole: a sentence cut out of it could cut a test language's start or end marks. Null when the card already shows why. */
function snippetFor(text: StudyText, result: SearchResult, code: string): { parts: SnippetPart[]; lang: string } | null {
  const matched = new Set(Object.keys(result.match));
  if ([...matched].every((term) => result.match[term].some((field) => field === "title" || field === "summary"))) return null;
  const hits = (field: string) => new Set(wordsOf(field, code).filter((word) => matched.has(word))).size;
  const best = text.fields.map((field) => ({ field, score: hits(field.text) })).filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score || a.field.text.length - b.field.text.length)[0];
  if (!best) return null;
  const parts = segmentsOf(best.field.text, code).map((s) => ({ text: s.text, hit: s.word && matched.has(foldWord(s.text)) }));
  return { parts, lang: best.field.translated ? code : "en" };
}

/** Studies holding every word of the question (best first); if none has them all, those holding the most, flagged as partial. */
export function searchStudiesIn(studies: readonly ApStudy[], query: string, language: SearchLanguage): StudySearch {
  const index = indexFor(studies, language);
  const terms = wordsOf(query, language.code).filter((word) => !index.common.has(word));
  if (!terms.length) return { hits: studies.map((study) => ({ study, snippet: null })), partial: false };
  let results = index.search.search(query, { ...OPTIONS, combineWith: "AND" });
  const partial = results.length === 0;
  if (partial) {
    const any = index.search.search(query, { ...OPTIONS, combineWith: "OR" });
    const most = Math.max(0, ...any.map((result) => result.queryTerms.length));
    results = any.filter((result) => result.queryTerms.length === most);
  }
  const byId = new Map(studies.map((study) => [study.id, study]));
  return {
    partial: partial && results.length > 0,
    hits: results.map((result) => {
      const snippet = snippetFor(index.texts.get(result.id)!, result, language.code);
      return { study: byId.get(result.id)!, snippet: snippet?.parts ?? null, snippetLang: snippet?.lang };
    }),
  };
}
