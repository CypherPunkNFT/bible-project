// The games' data in the site's language. apply.py writes each game data file's translated copy (content/translation
// extract.py GAME_DATA) to data/i18n/<folder>/<game>/<file>, as it does the Resources files (src/data/resources/index.ts).
// A game reads the copy only when it was made from the same build of its English file: the same "stamp", a hash of the
// whole file, which apply.py copies unchanged. A stale copy, or one that cannot be read, leaves the English on screen.
import { languageFolder, reloadingForLanguage } from "@/lib/language";
import { safeDataPath } from "@/lib/language-packs";
import { readPacked } from "@/lib/translated-packs";

export interface StampedData { stamp: string }

const isStamped = (value: unknown): value is StampedData =>
  typeof value === "object" && value !== null && typeof (value as StampedData).stamp === "string";

async function readCopy(path: string): Promise<unknown> {
  const packed = await readPacked(path);
  if (packed) return packed.value;
  const response = await fetch(`/data/${path}`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** The translated copy of `file` (a path under src/data/, such as "odd-one-out/sets.json"), or null when the site is in
 *  English or the copy is stale or unreadable. */
export async function readTranslatedCopy<T extends StampedData>(file: string, english: T): Promise<T | null> {
  const folder = languageFolder();
  if (!folder) return null;
  const path = `i18n/${folder}/${file}`;
  if (!safeDataPath(path)) throw new Error(`games: ${path} is not a plain path under data/`);
  try {
    const copy = await readCopy(path);
    if (isStamped(copy) && copy.stamp === english.stamp) return copy as T;
    console.warn(`games: data/${path} was made from another build of the English (stamp ${isStamped(copy) ? copy.stamp : "none"}, now ${english.stamp}); showing the English until apply.py runs again`);
  } catch (error) {
    console.warn(`games: could not read data/${path} (${String(error)}); showing the English`);
  }
  return null;
}

/** The game's data in the site's language: the translated copy when it matches `english`, else `english` itself. The
 *  read counts as content being read again for a new language, so a language change waits for it (useAsync does too). */
export function inSiteLanguage<T extends StampedData>(file: string, english: T): Promise<T> {
  const reading = readTranslatedCopy(file, english).then((copy) => copy ?? english);
  reloadingForLanguage(reading);
  return reading;
}
