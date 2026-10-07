/** Topics (scripts/build-topics.py): R. A. Torrey's New Topical Textbook (1897) in a two-level taxonomy. */
import type { Span } from "./study";

export interface TopicSubcategory { id: string; title: string; description: string; topics: string[] }
export interface TopicCategory { id: string; title: string; description: string; subcategories: TopicSubcategory[] }
export interface TopicSummary { title: string; points: number; refs: number }
export interface TopicIndex { source: string; categories: TopicCategory[]; topics: Record<string, TopicSummary> }

export interface TopicItem { text: string; refs: Span[] }
export interface TopicPoint extends TopicItem { see: string[]; items?: TopicItem[] }
export interface KeyVerse { span: Span; text: string; point: string }
export interface Topic { id: string; title: string; category: string; subcategory: string; points: TopicPoint[]; relatedStudies: string[]; keyVerses: KeyVerse[] }
/** Per book (scripts/build-topics.py): chapter -> [[topic id, passages cited], ...], most cited first. */
export type ChapterTopics = Record<string, [string, number][]>;

export const topicUrl = (id: string) => `/topics/${id}`;
export const categoryUrl = (category: string, subcategory?: string) => `/topics/c/${category}${subcategory ? `#${subcategory}` : ""}`;

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
  const q = query.toLowerCase().trim();
  return hits.sort(([, a], [, b]) => Number(b.title.toLowerCase().replace(/^the /, "").startsWith(q)) - Number(a.title.toLowerCase().replace(/^the /, "").startsWith(q)) || b.refs - a.refs).slice(0, limit).map(([id]) => id);
}
