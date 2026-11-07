// node --experimental-strip-types --test scripts/pack-language-files.test.ts (in npm run test:release)
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { bankPartPath, packPath, parsePackManifest, parseQuestionParts } from "../src/lib/language-packs.ts";
import { assertFrontEndReadsLanguagePacks, sitePacksLanguages } from "./language-packs-guard.mjs";
import { assertTranslatedFilesUnderLimit, choosePartCount, packLanguageFiles, planPacks, splitQuestionBanks, translatedDataPrefixes } from "./pack-language-files.ts";

const scratch = await mkdtemp(path.join(tmpdir(), "language-packs-"));
after(() => rm(scratch, { recursive: true, force: true }));
let made = 0;
const PREFIXES = ["topics/t/", "topics/index.json", "creeds/", "study/people-packs/", "questions/bank.json", "questions/bank-parts/"];

async function put(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof value === "string" ? value : JSON.stringify(value));
}

const question = (i: number, words: string) => ({ question: `${words} ${i}?`, answer: words, kind: i % 2 ? "trivia" : "study", link: { book: "GEN", chapter: 1 + (i % 50) } });

/** A release copy with two languages: topics, creeds, person packs, a resource, ui.json and a question bank. */
async function releaseSite(questions = 40): Promise<string> {
  const site = path.join(scratch, `case${made++}`, ".release", `testimonies-ab${String(made).padStart(4, "0")}`, "site");
  await put(path.join(site, "data", "questions", "bank.json"), { schema: "x", kinds: {}, topics: [], books: [], collections: [], questions: Array.from({ length: questions }, (_, i) => question(i, "Who")) });
  for (const folder of ["es", "hi"]) {
    const root = path.join(site, "data", "i18n", folder);
    for (let i = 0; i < 12; i++) await put(path.join(root, "topics", "t", `topic-${String(i).padStart(2, "0")}.json`), { title: `${folder} ${i}`, body: "x".repeat(400) });
    await put(path.join(root, "topics", "index.json"), { topics: 12 });
    await put(path.join(root, "creeds", "doc", "nicene.json"), { text: `${folder} creed` });
    await put(path.join(root, "study", "people-packs", "128", "7.json"), { abraham: { name: `${folder} Abraham` } });
    await put(path.join(root, "resources", "life.json"), { life: folder });
    await put(path.join(root, "ui.json"), { Home: folder });
    await put(path.join(root, "questions", "bank.json"), { schema: "x", kinds: {}, topics: [], books: [], collections: [], questions: Array.from({ length: questions }, (_, i) => question(i, folder === "es" ? "Quién" : "कौन")) });
  }
  return site;
}

test("the translated folders are read from src/lib/language.ts", async () => {
  const prefixes = await translatedDataPrefixes();
  for (const prefix of ["topics/t/", "creeds/", "questions/bank.json", "questions/bank-parts/", "study/people-packs/"]) assert.ok(prefixes.includes(prefix), prefix);
});

test("files are packed by folder, a new pack starting when the next file would pass the target", () => {
  const sizes = new Map([["a/1.json", 60], ["a/2.json", 50], ["a/3.json", 200], ["b/1.json", 10]]);
  assert.deepEqual(planPacks(sizes, 100), [["a/1.json"], ["a/2.json"], ["a/3.json"], ["b/1.json"]]);
  assert.deepEqual(planPacks(sizes, 120), [["a/1.json", "a/2.json"], ["a/3.json"], ["b/1.json"]]);
});

test("each language's content files become a few packs, every file found where the manifest says", async () => {
  const site = await releaseSite();
  const counts = await packLanguageFiles(site, ["es", "hi"], { target: 1500, prefixes: PREFIXES, checkFrontEnd: false });
  for (const count of counts) {
    assert.equal(count.packed, 16, "12 topics, the topic index, a creed, a person pack and a resource");
    assert.ok(count.packs < count.packed, `${count.packs} packs for ${count.packed} files`);
    const root = path.join(site, "data", "i18n", count.folder);
    const manifest = parsePackManifest(JSON.parse(await readFile(path.join(root, "packs.json"), "utf8")));
    assert.ok(manifest, "the manifest reads back");
    const n = manifest.packs.get("topics/t/topic-03.json");
    assert.notEqual(n, undefined);
    const pack = JSON.parse(await readFile(path.join(site, "data", packPath(count.folder, manifest.version, n!)), "utf8"));
    assert.equal(pack["topics/t/topic-03.json"].title, `${count.folder} 3`);
    assert.equal(manifest.packs.get("resources/life.json") !== undefined, true, "resources are packed too");
    const left = (await readdir(root, { recursive: true })).map(String).filter((name) => name.endsWith(".json") && !name.includes("packs"));
    assert.deepEqual(left.map((name) => name.replaceAll("\\", "/")).sort(), ["questions/bank.json", "ui.json"], "only unpacked files stay");
  }
  assert.ok(sitePacksLanguages(site));
});

test("a file too big for a pack stops the release, naming it", async () => {
  const site = await releaseSite();
  await put(path.join(site, "data", "i18n", "es", "creeds", "doc", "huge.json"), { text: "y".repeat(25 * 1024 * 1024) });
  await assert.rejects(packLanguageFiles(site, ["es"], { prefixes: PREFIXES, checkFrontEnd: false }), /creeds\/doc\/huge\.json/);
});

test("packing refuses a folder outside a release copy, or a link inside one", async () => {
  const outside = path.join(scratch, "shared", "data", "i18n", "es");
  await put(path.join(outside, "topics", "t", "a.json"), { a: 1 });
  await assert.rejects(packLanguageFiles(path.join(scratch, "shared"), ["es"], { prefixes: PREFIXES, checkFrontEnd: false }), /outside a \.release/);
  const site = await releaseSite();
  try {
    await symlink(outside, path.join(site, "data", "i18n", "es", "topics", "linked"), "junction");
  } catch {
    return; // no right to make links here; the link refusal is then not testable on this machine
  }
  await assert.rejects(packLanguageFiles(site, ["es"], { prefixes: PREFIXES, checkFrontEnd: false }), /is a link/);
});

test("the question bank is split into parts cut at the same questions in every copy", async () => {
  const site = await releaseSite(40);
  const result = await splitQuestionBanks(site, ["es", "hi"], { startBytes: 1000 });
  assert.ok(result.parts > 1, `${result.parts} parts`);
  for (const data of [path.join(site, "data"), path.join(site, "data", "i18n", "es"), path.join(site, "data", "i18n", "hi")]) {
    const head = JSON.parse(await readFile(path.join(data, "questions", "bank.json"), "utf8"));
    assert.deepEqual(head.questions, [], "the head keeps an empty questions list, so older checks still accept it");
    const parts = parseQuestionParts(head.questionParts);
    assert.ok(parts);
    const joined = [];
    for (let k = 0; k < parts.count; k++) joined.push(...JSON.parse(await readFile(path.join(data, bankPartPath(parts, k)), "utf8")));
    assert.equal(joined.length, 40);
    assert.equal(joined[17].link.chapter, 18);
  }
});

test("a bank that would pass 25 MiB is cut into parts that do not", () => {
  const big = { questions: Array.from({ length: 300 }, (_, i) => ({ ...question(i, "Who"), answer: "z".repeat(120 * 1024) })) };
  const count = choosePartCount([big]);
  assert.ok(JSON.stringify(big.questions).length > 25 * 1024 * 1024, "the test bank is over the limit");
  const size = Math.ceil(300 / count);
  for (let k = 0; k < count; k++) assert.ok(JSON.stringify(big.questions.slice(k * size, (k + 1) * size)).length <= 24 * 1024 * 1024);
});

test("the split refuses copies whose questions do not line up", async () => {
  const site = await releaseSite(10);
  const file = path.join(site, "data", "i18n", "hi", "questions", "bank.json");
  const bank = JSON.parse(await readFile(file, "utf8"));
  bank.questions.pop();
  await put(file, bank);
  await assert.rejects(splitQuestionBanks(site, ["es", "hi"]), /has 9 questions/);
  bank.questions.push({ ...question(9, "x"), kind: "other" });
  await put(file, bank);
  await assert.rejects(splitQuestionBanks(site, ["es", "hi"]), /question 9 .* is not the English question 9/);
});

test("any translated file over 25 MiB stops the release", async () => {
  const site = await releaseSite();
  assert.ok((await assertTranslatedFilesUnderLimit(site, ["es", "hi"])).bytes > 0);
  await put(path.join(site, "data", "i18n", "hi", "ui.json"), "x".repeat(9000));
  await assert.rejects(assertTranslatedFilesUnderLimit(site, ["es", "hi"], 8000), /hi\/ui\.json is 9000 bytes/);
});

test("the guard refuses a front end that cannot read packs", async () => {
  const site = await releaseSite();
  await put(path.join(site, "assets", "index-1.js"), "fetch('people-packs/')");
  assert.throws(() => assertFrontEndReadsLanguagePacks(site), /predates language packs/);
  await put(path.join(site, "assets", "index-2.js"), "const a='packs.json',b=x.questionParts");
  assert.doesNotThrow(() => assertFrontEndReadsLanguagePacks(site));
});
