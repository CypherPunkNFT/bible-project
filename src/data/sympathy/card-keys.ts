// Permanent passage keys (design 5.5): "psalm-34-18", "john-11-25b", "2-corinthians-1-3-4". A key sits in a card link or a
// funeral-list link in someone's messages for years, so it is computed from the verse ids alone through the fixed table
// below, never from the catalogue's book names (which may be reworded or translated, and which load later).
// KEPT_KEYS is the committed list a test holds the data to: a key may never disappear. A key retired on purpose moves to
// KEY_ALIASES, pointing at its replacement.
import type { LifeEventPassage } from "../life-events/types";

/** Book number (1–66) -> the word a key uses. Fixed: never change an entry. */
export const KEY_BOOKS: readonly string[] = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", "1-samuel", "2-samuel",
  "1-kings", "2-kings", "1-chronicles", "2-chronicles", "ezra", "nehemiah", "esther", "job", "psalm", "proverbs",
  "ecclesiastes", "song-of-songs", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel",
  "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew",
  "mark", "luke", "john", "acts", "romans", "1-corinthians", "2-corinthians", "galatians", "ephesians",
  "philippians", "colossians", "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy", "titus", "philemon",
  "hebrews", "james", "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude", "revelation"
];

/** The key of a passage: book word, chapter, first verse, last verse if a range, and the excerpt's "a"/"b" mark. */
export function passageKey(passage: Pick<LifeEventPassage, "from" | "to" | "part">): string {
  const book = KEY_BOOKS[Math.floor(passage.from / 1_000_000) - 1];
  if (!book) throw new Error(`sympathy: no key word for the book of verse ${passage.from} (expected a book number from 1 to 66)`);
  const chapter = Math.floor(passage.from / 1000) % 1000;
  const first = passage.from % 1000;
  const last = (passage.to ?? passage.from) % 1000;
  return `${book}-${chapter}-${first}${last !== first ? `-${last}` : ""}${passage.part?.mark ?? ""}`;
}

/** Keys retired on purpose -> the key that replaces them. Empty at launch. */
export const KEY_ALIASES: Readonly<Record<string, string>> = {};

/**
 * Every key the site has ever handed out in a card link or a funeral-list link (written 2026-11-07 at launch). Add new
 * keys here when passages are added; never remove one (move it to KEY_ALIASES instead).
 */
export const KEPT_KEYS: readonly string[] = [
  "1-corinthians-15-20-26", "1-corinthians-15-42-44", "1-corinthians-15-51-57", "1-corinthians-15-55-57",
  "1-peter-5-7", "1-thessalonians-4-13-14", "1-thessalonians-4-13-18", "2-corinthians-1-3-4", "2-corinthians-13-14",
  "2-corinthians-4-16-18", "2-corinthians-5-1-8", "2-samuel-1-26a", "2-thessalonians-2-16-17", "2-timothy-1-5",
  "2-timothy-4-6-8", "2-timothy-4-7-8", "deuteronomy-33-27a", "ecclesiastes-3-1-11", "ecclesiastes-3-4",
  "genesis-25-8", "genesis-3-19b", "hebrews-13-20-21", "hebrews-13-5b", "isaiah-25-6-9", "isaiah-25-8", "isaiah-35-10",
  "isaiah-40-11", "isaiah-40-28-31", "isaiah-40-29-31", "isaiah-41-10", "isaiah-42-3", "isaiah-43-2", "isaiah-46-4",
  "isaiah-54-5", "isaiah-66-13a", "jeremiah-1-5", "job-1-21b", "job-12-10", "job-19-25", "job-19-25-27",
  "john-11-17-27", "john-11-25-26", "john-11-25b", "john-11-35", "john-14-1-6", "john-14-27", "john-16-33",
  "john-6-37-40", "jude-1-24-25", "lamentations-3-22-23", "lamentations-3-22-26", "lamentations-3-31-33", "luke-12-6",
  "mark-10-14b", "matthew-10-29", "matthew-11-28", "matthew-25-21", "matthew-5-4", "nahum-1-7", "numbers-6-24-26",
  "philippians-1-21-23", "philippians-1-3", "philippians-3-20-21", "proverbs-12-10", "proverbs-16-31",
  "proverbs-17-17", "proverbs-17-6", "proverbs-18-24", "proverbs-20-7", "proverbs-31-28-29", "proverbs-31-30-31",
  "psalm-103-13", "psalm-103-13-14", "psalm-103-15-18", "psalm-103-8-18", "psalm-116-15", "psalm-121-1-2",
  "psalm-121-1-8", "psalm-139-1-12", "psalm-139-12", "psalm-145-8-9", "psalm-145-9", "psalm-146-9", "psalm-147-3",
  "psalm-147-9", "psalm-23-1-6", "psalm-23-4", "psalm-30-5b", "psalm-34-18", "psalm-36-6", "psalm-4-8", "psalm-46-1",
  "psalm-46-1-11", "psalm-56-8", "psalm-61-2", "psalm-62-8", "psalm-68-5", "psalm-73-26", "psalm-9-9", "psalm-90-1-12",
  "psalm-90-1-2", "psalm-90-12", "revelation-14-13", "revelation-21-1-7", "revelation-21-4", "revelation-7-13-17",
  "romans-12-15", "romans-14-7-9", "romans-14-8", "romans-15-13", "romans-8-18", "romans-8-26", "romans-8-31-39",
  "song-of-songs-8-7a",
];
