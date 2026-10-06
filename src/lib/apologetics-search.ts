import MiniSearch, { type SearchResult } from "minisearch";
import { stemmer } from "stemmer";
import type { ApStudy } from "@/data/apologetics-types";

/**
 * Keyword search for the question library, run in the visitor's browser (the studies ship with the page).
 * Whole words (or the start of the word being typed), English word forms ("forgive" = "forgiveness"), small typos
 * on longer words, ranked best first with the title counting most. A later meaning (vector) search can sit beside it.
 */

export interface SnippetPart { text: string; hit: boolean }
export interface StudyHit { study: ApStudy; snippet: SnippetPart[] | null }
export interface StudySearch { hits: StudyHit[]; partial: boolean }

const BOOST = { title: 4, keywords: 3, summary: 2, answer: 1.5, body: 1 };
const FIELDS = Object.keys(BOOST);
/** Words too common to tell studies apart; dropped from both the index and the query. */
const STOP_WORDS = new Set("a an and are as at be but by can could did do does for from had has have how i if in into is it its me my no not of on or our so than that the their them then there these they this to was we were what when where which who why will with would you your".split(" "));

/** One normalised search word, or null for a word to ignore. */
export function searchTerm(word: string): string | null {
  const plain = word.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[’']s?$/, "");
  return plain.length < 2 || STOP_WORDS.has(plain) ? null : stemmer(plain);
}

const bodyOf = (study: ApStudy) => [...study.reasoning, study.conclusion, ...study.sections.flatMap((s) => [s.title, s.body]), study.objection, study.reply, study.limit, study.prompt].join("\n");

const indexes = new WeakMap<readonly ApStudy[], MiniSearch>();
function indexFor(studies: readonly ApStudy[]): MiniSearch {
  let index = indexes.get(studies);
  if (!index) {
    index = new MiniSearch({ fields: FIELDS, processTerm: searchTerm, extractField: (study, field) => field === "body" ? bodyOf(study as ApStudy) : field === "keywords" ? (study as ApStudy).keywords.join(" ") : (study as Record<string, string>)[field] });
    index.addAll(studies);
    indexes.set(studies, index);
  }
  return index;
}

const OPTIONS = {
  boost: BOOST,
  // The word still being typed matches word starts, but only from 4 letters ("sin" must not find "since").
  prefix: (term: string, index: number, terms: string[]) => index === terms.length - 1 && term.length >= 4,
  // One wrong letter forgiven on longer words ("resurection"), never two ("respect" is not "resurrect").
  fuzzy: (term: string) => (term.length > 5 ? 1 : false),
};

/** The sentence that best shows why a study matched, when the match is not already visible on its card. */
function snippetFor(study: ApStudy, result: SearchResult): SnippetPart[] | null {
  const matchedTerms = Object.keys(result.match);
  const visible = matchedTerms.every((term) => result.match[term].some((field) => field === "title" || field === "summary"));
  if (visible) return null;
  const isHit = (word: string) => { const term = searchTerm(word); return term !== null && matchedTerms.includes(term); }; // the index's own matched words
  const sentences = [study.answer, bodyOf(study)].join("\n").split(/(?<=[.?!])\s+|\n/).filter((s) => s.trim());
  // Most matched words first, then the fuller sentence (up to a card's two lines), so a bare "What kind of freedom?" loses.
  const scored = sentences.map((sentence) => ({ sentence, score: new Set((sentence.match(/[\p{L}’']+/gu) ?? []).filter(isHit).map((w) => searchTerm(w))).size * 1000 + Math.min(sentence.length, 200) }));
  const best = scored.reduce((top, item) => (item.score > top.score ? item : top), { sentence: "", score: 0 });
  if (best.score < 1000) return null;
  return best.sentence.split(/([\p{L}’']+)/u).filter(Boolean).map((text) => ({ text, hit: /\p{L}/u.test(text) && isHit(text) }));
}

/** Studies matching every word (best first); if none has them all, studies matching any word, flagged as partial. */
export function searchStudies(studies: readonly ApStudy[], query: string): StudySearch {
  if (!query.split(/\s+/).some((word) => searchTerm(word))) return { hits: studies.map((study) => ({ study, snippet: null })), partial: false };
  const index = indexFor(studies);
  let results = index.search(query, { ...OPTIONS, combineWith: "AND" });
  const partial = results.length === 0;
  if (partial) {
    // Keep only the studies matching the most query words ("god forgive murder": god + forgive), not every study with "god".
    const any = index.search(query, { ...OPTIONS, combineWith: "OR" });
    const most = Math.max(0, ...any.map((result) => result.queryTerms.length));
    results = any.filter((result) => result.queryTerms.length === most);
  }
  const byId = new Map(studies.map((study) => [study.id, study]));
  return { partial: partial && results.length > 0, hits: results.map((result) => { const study = byId.get(result.id)!; return { study, snippet: snippetFor(study, result) }; }) };
}
