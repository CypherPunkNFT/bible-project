// The source directory in the reader's language (translation system, stage 5 job 12). The directory is rebuilt with
// every build, so a translated copy of it would go stale at once; instead content/translation/apply.py writes its words
// ({English: translation}, data/i18n/<folder>/sources.json) and these put them over whatever English the build made.
// Only words a reader sees are swapped: titles, authors, editions and rights stay as published, and ids, links and the
// facets' metadata are never touched (facets.json is checked against the English records).
import type { Directory, SourceEntry } from "./types";

export type SourceWords = Readonly<Record<string, string>>;

const word = (words: SourceWords, text: string): string => words[text] || text;

export function translateDirectory(directory: Directory, words: SourceWords | null): Directory {
  if (!words) return directory;
  return {
    ...directory,
    collections: directory.collections.map((collection) => ({
      ...collection, label: word(words, collection.label), definition: word(words, collection.definition),
    })),
  };
}

export function translateEntry(entry: SourceEntry, words: SourceWords): SourceEntry {
  return {
    ...entry,
    kind: word(words, entry.kind),
    status: word(words, entry.status),
    role: word(words, entry.role),
    links: entry.links.map((link) => (link.name ? { ...link, name: word(words, link.name) } : link)),
    citedOn: entry.citedOn?.map((cited) => ({ ...cited, feature: word(words, cited.feature), page: word(words, cited.page) })),
  };
}

export const translateEntries = (entries: SourceEntry[] | null, words: SourceWords | null): SourceEntry[] | null =>
  entries && words ? entries.map((entry) => translateEntry(entry, words)) : entries;
