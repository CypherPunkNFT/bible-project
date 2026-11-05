// node --experimental-strip-types --test scripts/release-translations.test.ts
// A language not marked released must never reach a release copy (translation system, stage 2).
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { SiteLanguage } from "../src/lib/site-languages.ts";
import { assertOnlyReleasedTranslations, unreleasedTranslationEntries } from "./release-translations.ts";

// A made-up list: Spanish released, "xa" still being made.
const LANGUAGES: SiteLanguage[] = [
  { code: "en", name: "English", folder: null, dir: "ltr", released: true },
  { code: "es", name: "Español", folder: "es", dir: "ltr", released: true },
  { code: "xa", name: "Test", folder: "xa", dir: "ltr", released: false },
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
