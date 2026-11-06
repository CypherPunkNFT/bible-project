// node --experimental-strip-types --test scripts/release-translations.test.ts
// A language not marked released must never reach a release copy (translation system, stage 2).
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { siteLanguageProblems } from "../src/lib/site-languages-check.ts";
import { releasedFolders, SITE_LANGUAGES, type SiteLanguage } from "../src/lib/site-languages.ts";
import { assertOnlyReleasedTranslations, unreleasedTranslationEntries } from "./release-translations.ts";

// A made-up list: Spanish released, "xa" still being made.
// The fields the menu and the release do not look at.
const FIELDS = { bible: null, englishName: "Test", script: "Latn", plurals: ["one", "other"], digits: "latn", font: null, pseudo: false } as const;
const LANGUAGES: SiteLanguage[] = [
  { code: "en", name: "English", folder: null, dir: "ltr", released: true, ...FIELDS },
  { code: "es", name: "Español", folder: "es", dir: "ltr", released: true, ...FIELDS },
  { code: "xa", name: "Test", folder: "xa", dir: "ltr", released: false, ...FIELDS },
];

async function dataDirectory(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-translations-"));
  for (const folder of ["es", "xa"]) {
    await mkdir(path.join(root, "data", "i18n", folder), { recursive: true });
    await writeFile(path.join(root, "data", "i18n", folder, "ui.json"), "{}");
  }
  await writeFile(path.join(root, "data", "i18n", "notes.txt"), "stray");
  return root;
}

test("everything under data/i18n but the released folders is listed for leaving out", async () => {
  const root = await dataDirectory();
  try {
    const left = await unreleasedTranslationEntries(path.join(root, "data"), LANGUAGES);
    assert.deepEqual(left.map((entry) => path.basename(entry)).sort(), ["notes.txt", "xa"]);
    assert.ok(left.every((entry) => path.isAbsolute(entry)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a copy filtered the way the release step filters holds only the released language", async () => {
  const root = await dataDirectory();
  try {
    const data = path.join(root, "data");
    const site = path.join(root, "site");
    const left = await unreleasedTranslationEntries(data, LANGUAGES);
    await cp(data, path.join(site, "data"), { recursive: true, filter: (source) => !left.includes(path.resolve(source)) });
    assert.deepEqual(await readdir(path.join(site, "data", "i18n")), ["es"]);
    assert.deepEqual(await assertOnlyReleasedTranslations(site, LANGUAGES), { folders: ["es"] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a copy holding an unreleased language or a stray file is refused", async () => {
  const root = await dataDirectory();
  try {
    await cp(path.join(root, "data"), path.join(root, "site", "data"), { recursive: true });
    await assert.rejects(assertOnlyReleasedTranslations(path.join(root, "site"), LANGUAGES), /2 not released \(notes\.txt, xa\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a copy missing a released language is refused", async () => {
  const root = await dataDirectory();
  try {
    await mkdir(path.join(root, "site", "data", "i18n"), { recursive: true });
    await assert.rejects(assertOnlyReleasedTranslations(path.join(root, "site"), LANGUAGES), /missing 1 \(es\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// Stage 3, job 4: the real language file holds two made-up test languages (en-XA in data/i18n/xa, ar-XB in xb), generated
// by SiteTranslation/system/pseudo_language.py. Neither may ever reach a release, whatever is on disk.
test("the made-up languages in the real language file can never enter a release", async () => {
  const madeUp = SITE_LANGUAGES.filter((language) => language.pseudo);
  assert.deepEqual(madeUp.map((language) => [language.code, language.folder]), [["en-XA", "xa"], ["ar-XB", "xb"]]);
  const released = releasedFolders(SITE_LANGUAGES);
  for (const language of madeUp) {
    assert.equal(language.released, false, `${language.code} is marked released`);
    assert.ok(!released.includes(language.folder!), `${language.folder} is among the released folders`);
  }
  // A data folder holding every language's copy, made-up ones included: the release leaves both out, and refuses a copy
  // that holds either.
  const root = await mkdtemp(path.join(os.tmpdir(), "release-made-up-"));
  try {
    const data = path.join(root, "data");
    for (const language of SITE_LANGUAGES.filter((entry) => entry.folder)) {
      await mkdir(path.join(data, "i18n", language.folder!), { recursive: true });
      await writeFile(path.join(data, "i18n", language.folder!, "ui.json"), "{}");
    }
    const left = (await unreleasedTranslationEntries(data)).map((entry) => path.basename(entry)).sort();
    assert.deepEqual(left, ["xa", "xb"]);
    const site = path.join(root, "site");
    await cp(data, path.join(site, "data"), { recursive: true, filter: (source) => !left.map((name) => path.resolve(data, "i18n", name)).includes(path.resolve(source)) });
    assert.deepEqual((await assertOnlyReleasedTranslations(site)).folders.sort(), [...released].sort());
    for (const folder of left) {
      await cp(path.join(data, "i18n", folder), path.join(site, "data", "i18n", folder), { recursive: true });
      await assert.rejects(assertOnlyReleasedTranslations(site), new RegExp(`not released \\(${folder}\\)`));
      await rm(path.join(site, "data", "i18n", folder), { recursive: true, force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  // Marking either one released is refused by the file's own check, which every Node step that reads the file runs.
  const file = JSON.parse(readFileSync(new URL("../src/lib/site-languages.json", import.meta.url), "utf8")) as { languages: { pseudo: boolean; released: boolean }[] };
  assert.deepEqual(siteLanguageProblems(file), []);
  for (const index of file.languages.flatMap((language, at) => (language.pseudo ? [at] : []))) {
    const changed = structuredClone(file);
    changed.languages[index].released = true;
    assert.ok(siteLanguageProblems(changed).some((problem) => /can never be released/.test(problem)), `released made-up language ${index} was not refused`);
  }
});
