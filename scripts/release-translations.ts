import { lstat, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { personPackPath } from "../src/lib/person-pack.ts";
import { releasedFolders, SITE_LANGUAGES, type SiteLanguage } from "../src/lib/site-languages.ts";
import { PERSON_PACKS } from "./pack-person-files.ts";

// Release only: the translated copies (data/i18n/<folder>/, written by content/translation/apply.py) go out with the site
// once the languages are published (owner, 2026-11-02). The site's fallback answers a missing file with its page (200,
// HTML), so a half-written language would show broken pages, not English: the release refuses unless every language is
// complete. On the live site people are read from packs (pack-person-files.ts), so each language's people are packed the
// same way, holding the same people as the English pack of that number.

// Only languages marked `released` in src/lib/site-languages.ts go out. Anything else under data/i18n/ (a language still
// being made, a test language, a stray file) is left out of the copy and refused if it gets in (translation system,
// stage 2: nothing goes live by accident).

/** The released languages' folders (src/lib/site-languages.ts). */
async function languageFolders(languages: readonly SiteLanguage[] = SITE_LANGUAGES): Promise<string[]> {
  const folders = releasedFolders(languages);
  if (!folders.length) throw new Error("Translations: no released language folders in src/lib/site-languages.ts.");
  return folders;
}

/** Everything directly under data/i18n/ that is not a released language's folder: never copied into a release. */
export async function unreleasedTranslationEntries(data: string, languages: readonly SiteLanguage[] = SITE_LANGUAGES): Promise<string[]> {
  const released = new Set(releasedFolders(languages));
  const entries = await readdir(path.join(data, "i18n")).catch(() => [] as string[]);
  return entries.filter((name) => !released.has(name)).map((name) => path.resolve(data, "i18n", name));
}

/** Refuses a release copy whose data/i18n/ holds anything but the released languages' folders. */
export async function assertOnlyReleasedTranslations(site: string, languages: readonly SiteLanguage[] = SITE_LANGUAGES): Promise<{ folders: string[] }> {
  const root = path.join(site, "data", "i18n");
  const found = (await readdir(root).catch(() => [] as string[])).sort();
  const expected = releasedFolders(languages).sort();
  const extra = found.filter((name) => !expected.includes(name));
  const missing = expected.filter((name) => !found.includes(name));
  if (extra.length || missing.length) {
    throw new Error(`Translations: the release's data/i18n must hold exactly the released languages (${expected.join(", ")}); it has ${extra.length} not released (${extra.join(", ")}) and is missing ${missing.length} (${missing.join(", ")}).`);
  }
  return { folders: found };
}

async function filesUnder(root: string, prefix = ""): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await filesUnder(root, relative)));
    else found.push(relative);
  }
  return found;
}

/** Refuses the release unless every language has ui.json, the same files as the others, and every person. */
export async function assertTranslationsComplete(data: string, languages: readonly SiteLanguage[] = SITE_LANGUAGES): Promise<{ languages: number; filesEach: number }> {
  const folders = await languageFolders(languages);
  const english = (await readdir(path.join(data, "study", "people"))).filter((name) => name.endsWith(".json")).length;
  let first: Set<string> | null = null;
  for (const folder of folders) {
    const root = path.join(data, "i18n", folder);
    const files = new Set(await filesUnder(root).catch(() => [] as string[]));
    if (!files.has("ui.json")) throw new Error(`Translations: ${root} has no ui.json; run content/translation/apply.py before releasing.`);
    const people = [...files].filter((name) => name.startsWith("study/people/")).length;
    if (people !== english) throw new Error(`Translations: ${folder} has ${people} people; English has ${english}. Rerun apply.py.`);
    for (const name of files) {
      if ((await stat(path.join(root, name))).size === 0) throw new Error(`Translations: ${folder}/${name} is empty.`);
    }
    if (first) {
      const missing = [...first].filter((name) => !files.has(name));
      const extra = [...files].filter((name) => !first!.has(name));
      if (missing.length || extra.length) throw new Error(`Translations: ${folder} differs from ${folders[0]}: ${missing.length} missing (${missing.slice(0, 3).join(", ")}), ${extra.length} extra (${extra.slice(0, 3).join(", ")}).`);
    } else first = files;
  }
  return { languages: folders.length, filesEach: first?.size ?? 0 };
}

/** In the release copy, after packPersonFiles: each language's people into packs matching the English ones. */
export async function packTranslatedPeople(site: string, languages: readonly SiteLanguage[] = SITE_LANGUAGES): Promise<{ languages: number; packs: number }> {
  const englishPacks = path.join(site, "data", "study", path.dirname(personPackPath(0, PERSON_PACKS)));
  const packNames = (await readdir(englishPacks)).filter((name) => name.endsWith(".json"));
  const folders = await languageFolders(languages);
  for (const folder of folders) {
    const study = path.join(site, "data", "i18n", folder, "study");
    const people = path.join(study, "people");
    if ((await lstat(people)).isSymbolicLink() || !(await realpath(people)).includes(`${path.sep}.release${path.sep}`)) {
      throw new Error(`Translated person packing refused: ${people} is not a folder inside a .release copy.`);
    }
    await mkdir(path.join(study, path.dirname(personPackPath(0, PERSON_PACKS))), { recursive: true });
    for (const name of packNames) {
      const pack = JSON.parse(await readFile(path.join(englishPacks, name), "utf8")) as Record<string, unknown>;
      const translated: Record<string, unknown> = {};
      for (const id of Object.keys(pack)) translated[id] = JSON.parse(await readFile(path.join(people, `${id}.json`), "utf8"));
      await writeFile(path.join(study, path.dirname(personPackPath(0, PERSON_PACKS)), name), JSON.stringify(translated));
    }
    await rm(people, { recursive: true });
  }
  return { languages: folders.length, packs: packNames.length };
}
