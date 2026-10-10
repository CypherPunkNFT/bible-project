/** Topics (scripts/build-topics.py): Torrey's New Topical Textbook (1897) and Nave's Topical Bible (1896/1903), with Easton's
 * Bible Dictionary (1897) articles, in a two-level taxonomy (family -> group -> topics). */
import type { Span } from "./study";

export interface TopicSubcategory { id: string; title: string; description: string; topics: string[] }
export interface TopicCategory { id: string; title: string; description: string; subcategories: TopicSubcategory[] }
/** f: the bundle file holding the topic (data/topics/t/<f>.json); s: its sources, "t" Torrey and/or "n" Nave. */
export interface TopicSummary { title: string; points: number; refs: number; f: number; s: string }
/** aliases: Nave's "See ..." headings -> the topic they point to. */
/** A great passage from Nave's "Select readings". */
export interface Reading { title: string; refs: Span[] }
export interface TopicIndex { source: string; categories: TopicCategory[]; topics: Record<string, TopicSummary>; aliases: Record<string, string>; readings?: Reading[] }

export interface TopicItem { text: string; refs: Span[] }
export interface TopicPoint extends TopicItem { see: string[]; items?: TopicItem[] }
export interface KeyVerse { span: Span; text: string; point: string }
/** One paragraph of a dictionary article: text, and verse references as [start id, end id, label]. */
export type ArticleParagraph = (string | [number, number, string])[];
/** points: Torrey's; nave: Nave's; dictionary: Easton's article. */
/** book: a book of the Bible's reader code; parts: the topics split out of this one (in order); parent: the topic this one was split from. */
/** A library book that treats a topic, matched by meaning in the local search index (scripts/link-topic-library.py). */
export interface LibraryBook { title: string; author: string; url: string; distance: number }
export interface Topic { id: string; title: string; category: string; subcategory: string; points: TopicPoint[]; nave?: TopicPoint[]; dictionary?: ArticleParagraph[]; relatedStudies: string[]; keyVerses: KeyVerse[]; book?: string; parts?: string[]; parent?: string }
/** Per book (scripts/build-topics.py): chapter -> [[topic id, passages cited], ...], most cited first. */
export type ChapterTopics = Record<string, [string, number][]>;

export const topicUrl = (id: string) => `/topics/${id}`;
export const categoryUrl = (category: string, subcategory?: string) => `/topics/c/${category}${subcategory ? `?group=${subcategory}` : ""}`;

export const topicCount = (category: TopicCategory) => category.subcategories.reduce((n, sub) => n + sub.topics.length, 0);

/** Where a topic sits: its category and subcategory. */
export function placeOf(index: TopicIndex, topicId: string): { category: TopicCategory; subcategory: TopicSubcategory } | null {
  for (const category of index.categories) for (const subcategory of category.subcategories) if (subcategory.topics.includes(topicId)) return { category, subcategory };
  return null;
}

/** Topic ids whose title contains every word of the query (case-insensitive), best (title starts with it) first. */
export function matchTopics(index: TopicIndex, query: string, limit = 12): string[] {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  if (!words.length) return [];
  const hits = Object.entries(index.topics).filter(([, t]) => words.every((word) => t.title.toLowerCase().includes(word)));
  // Nave's "See ..." headings find the topic they point to ("Josias" finds Josiah).
  for (const [alias, target] of Object.entries(index.aliases ?? {})) {
    if (index.topics[target] && words.every((word) => alias.includes(word)) && !hits.some(([id]) => id === target)) hits.push([target, index.topics[target]]);
  }
  const q = query.toLowerCase().trim();
  return hits.sort(([, a], [, b]) => Number(b.title.toLowerCase().replace(/^the /, "").startsWith(q)) - Number(a.title.toLowerCase().replace(/^the /, "").startsWith(q)) || b.refs - a.refs).slice(0, limit).map(([id]) => id);
}

/** "1 point · 1 passage", "3 points · 12 passages". */
export const pointsAndPassages = (points: number, passages: number) => points === 0 && passages === 0 ? "Dictionary article" :
  `${points} ${points === 1 ? "point" : "points"} · ${passages.toLocaleString("en-US")} ${passages === 1 ? "passage" : "passages"}`;
