// The release packs each translated language's content files into a few larger files (translation system, stage 7,
// job 29), so every further language adds about a hundred files to the release instead of about 850 (Cloudflare Workers
// takes at most 100,000 files per release). The local data/i18n/<folder>/ keeps one file per content file; only the
// release copy is packed (scripts/pack-language-files.ts), and the site finds a file in its pack through the language's
// manifest (src/lib/translated-packs.ts). No imports and no "@/" aliases: the release script loads this file under Node.
//
//   data/i18n/<folder>/packs.json                 {layout, version, packs: {path under data/: pack number}}
//   data/i18n/<folder>/packs/<version>/<n>.json   {path under data/: the file's JSON}
//   data/questions/bank.json (and each copy)      the bank's head: everything but the questions, plus questionParts
//   data/questions/bank-parts/<id>/<k>.json       the questions, cut by position, the same cuts in every language

/** Raised when the manifest or pack format changes, so a front end never reads packs it does not understand. */
export const LANGUAGE_PACK_LAYOUT = 1;
export const PACK_MANIFEST = "packs.json";
/** Translated folders read by their own loaders (resources/index.ts, debate-transcripts.ts, pages/games/translated-data.ts),
 * packed like TRANSLATED_DATA. */
export const PACKED_ELSEWHERE = ["resources/", "transcripts/", "odd-one-out/", "whos-older/", "memory-match/"];
/** Workers refuse a file over 25 MiB; packs and bank parts stay a megabyte under it. */
export const MAX_RELEASE_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PACK_BYTES = 24 * 1024 * 1024;
export const MAX_BANK_PARTS = 64;

export interface PackManifest {
  layout: number;
  version: string;
  packs: Map<string, number>;
}

export interface QuestionParts {
  count: number;
  folder: string;
}

const VERSION = /^[0-9a-f]{16}$/;
const SAFE_PATH = /^[A-Za-z0-9_\-/.]+$/;
const PARTS_FOLDER = /^questions\/bank-parts\/\d{1,2}-[0-9a-f]{16}$/;

/** A path under data/ the browser may ask for: only plain characters, no "..", no leading slash. */
export const safeDataPath = (path: string): boolean => SAFE_PATH.test(path) && !path.includes("..") && !path.startsWith("/");

/** Pack `n` of a language's packs, under data/. */
export const packPath = (folder: string, version: string, n: number): string => `i18n/${folder}/packs/${version}/${n}.json`;

/** The manifest as the site may trust it, or null when anything in it is not what the release writes. */
export function parsePackManifest(value: unknown): PackManifest | null {
  if (typeof value !== "object" || value === null) return null;
  const { layout, version, packs } = value as Record<string, unknown>;
  if (layout !== LANGUAGE_PACK_LAYOUT || typeof version !== "string" || !VERSION.test(version)) return null;
  if (typeof packs !== "object" || packs === null || Array.isArray(packs)) return null;
  const found = new Map<string, number>();
  for (const [path, n] of Object.entries(packs)) {
    if (!safeDataPath(path) || !Number.isInteger(n) || (n as number) < 0 || (n as number) > 9999) return null;
    found.set(path, n as number);
  }
  return { layout, version, packs: found };
}

/** A bank head's questionParts as the site may trust it, or null when the bank is one whole file. */
export function parseQuestionParts(value: unknown): QuestionParts | null {
  if (typeof value !== "object" || value === null) return null;
  const { count, folder } = value as Record<string, unknown>;
  if (!Number.isInteger(count) || (count as number) < 1 || (count as number) > MAX_BANK_PARTS) return null;
  if (typeof folder !== "string" || !PARTS_FOLDER.test(folder)) return null;
  return { count: count as number, folder };
}

/** Part `k` of the bank, under data/ (read translated like any content file). */
export const bankPartPath = (parts: QuestionParts, k: number): string => `${parts.folder}/${k}.json`;
