import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  LANGUAGE_PACK_LAYOUT, MAX_BANK_PARTS, MAX_PACK_BYTES, MAX_RELEASE_FILE_BYTES, PACK_MANIFEST, PACKED_ELSEWHERE, packPath, parsePackManifest,
  parseQuestionParts, safeDataPath, type QuestionParts,
} from "../src/lib/language-packs.ts";
import { assertFrontEndReadsLanguagePacks } from "./language-packs-guard.mjs";

// Release only (translation system, stage 7, job 29; design in SiteTranslation/system/HANDOFF.md, "Shipping languages
// within 100,000 files"). Works on the release COPY: the shared data folder, which the preview and the Python tools read,
// keeps one file per content file. Two steps, both after the people are packed (pack-person-files.ts,
// release-translations.ts packTranslatedPeople):
//   splitQuestionBanks   the question bank, English and every released language, into parts cut at the same questions,
//                        so no copy can pass Workers' 25 MiB limit as the bank or a language's wording grows
//   packLanguageFiles    each released language's content files into packs of about PACK_TARGET_BYTES, by folder
// Then assertTranslatedFilesUnderLimit refuses the release if any file in a language folder is still over 25 MiB.

export const PACK_TARGET_BYTES = 2 * 1024 * 1024;
const BANK_PART_START_BYTES = 8 * 1024 * 1024;
const LANGUAGE_FILE = path.join(import.meta.dirname, "..", "src", "lib", "language.ts");

/** TRANSLATED_DATA as src/lib/language.ts holds it: the paths the site reads through the pack-aware loaders. */
export async function translatedDataPrefixes(file = LANGUAGE_FILE): Promise<string[]> {
  const found = /const TRANSLATED_DATA = (\[[^\]]*\]);/.exec(await readFile(file, "utf8"));
  if (!found) throw new Error(`Language packing refused: ${file} has no \`const TRANSLATED_DATA = [...]\` line to read the translated folders from.`);
  const prefixes = JSON.parse(found[1]) as unknown;
  if (!Array.isArray(prefixes) || !prefixes.every((prefix) => typeof prefix === "string" && safeDataPath(prefix))) {
    throw new Error(`Language packing refused: TRANSLATED_DATA in ${file} is not a list of plain data paths: ${found[1]}`);
  }
  return prefixes;
}

/** Every file under `root` as a path relative to it with "/"; refuses a link anywhere or a file with more than one name. */
async function releaseFiles(root: string, prefix = ""): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(root, relative);
    const info = await lstat(full);
    if (info.isSymbolicLink()) throw new Error(`Language packing refused: ${full} is a link; the release must hold copies, or packing would change the shared originals.`);
    if (info.isDirectory()) found.push(...(await releaseFiles(root, relative)));
    else if (info.nlink > 1) throw new Error(`Language packing refused: ${full} has ${info.nlink} names (a hard link to a shared file).`);
    else found.push(relative);
  }
  return found;
}

/** Refuses a folder that is not a real folder inside a .release/testimonies-* copy. */
async function assertReleaseCopy(folder: string): Promise<void> {
  if ((await lstat(folder)).isSymbolicLink()) throw new Error(`Language packing refused: ${folder} is a link, not a copied folder.`);
  const real = await realpath(folder);
  if (!real.split(path.sep).some((part, i, parts) => part === ".release" && /^testimonies-[A-Za-z0-9]{6}$/.test(parts[i + 1] ?? ""))) {
    throw new Error(`Language packing refused: ${folder} resolves to ${real}, outside a .release/testimonies-* copy.`);
  }
}

async function writeNew(file: string, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, body);
  await rename(`${file}.tmp`, file);
}

const bytes = (text: string) => Buffer.byteLength(text);
const hash16 = (hasher: ReturnType<typeof createHash>) => hasher.digest("hex").slice(0, 16);

/** Groups sorted files by folder and cuts each folder into packs: a new pack starts when the next file would pass the target. */
export function planPacks(sizes: Map<string, number>, target = PACK_TARGET_BYTES): string[][] {
  const packs: string[][] = [];
  let folder = "", size = 0;
  for (const file of [...sizes.keys()].sort()) {
    const here = path.posix.dirname(file);
    const current = packs.at(-1);
    if (!current || here !== folder || (current.length && size + sizes.get(file)! > target)) {
      packs.push([]);
      folder = here;
      size = 0;
    }
    packs.at(-1)!.push(file);
    size += sizes.get(file)!;
  }
  return packs;
}

async function removeEmptyFolders(root: string, files: string[]): Promise<void> {
  const folders = [...new Set(files.map((file) => path.posix.dirname(file)))].sort((a, b) => b.length - a.length);
  for (const folder of folders) {
    for (let at = folder; at !== "."; at = path.posix.dirname(at)) {
      if (!existsSync(path.join(root, at))) continue; // removed already, as the parent of a deeper folder
      if ((await readdir(path.join(root, at))).length) break;
      await rmdir(path.join(root, at));
    }
  }
}

/** One language: packs its content files, writes packs.json, reads every pack back, then removes the originals. */
async function packLanguage(site: string, folder: string, prefixes: string[], target: number) {
  const root = path.join(site, "data", "i18n", folder);
  await assertReleaseCopy(root);
  const all = await releaseFiles(root);
  const packable = (file: string) => !file.startsWith("questions/") && [...prefixes, ...PACKED_ELSEWHERE].some((prefix) => file.startsWith(prefix));
  const chosen = all.filter(packable);
  const texts = new Map<string, string>();
  const hasher = createHash("sha256");
  for (const file of chosen.sort()) {
    if (!safeDataPath(file)) throw new Error(`Language packing refused: ${folder}/${file} has characters the site will not ask for.`);
    const text = await readFile(path.join(root, file), "utf8");
    JSON.parse(text); // every packed file must be JSON; a broken one stops the release here, not in a reader's browser
    texts.set(file, text);
    hasher.update(`${file}\0${text}\0`);
  }
  const version = hash16(hasher);
  const plan = planPacks(new Map([...texts].map(([file, text]) => [file, bytes(text)])), target);
  const manifest: Record<string, number> = {};
  for (const [n, files] of plan.entries()) {
    const body = `{${files.map((file) => `${JSON.stringify(file)}:${texts.get(file)!.trim()}`).join(",")}}`;
    if (bytes(body) > MAX_PACK_BYTES) throw new Error(`Language packing refused: ${folder} pack ${n} would be ${bytes(body)} bytes (${files.join(", ")}); the limit is ${MAX_PACK_BYTES}. One file that size must be split at its source.`);
    await writeNew(path.join(site, "data", packPath(folder, version, n)), body);
    for (const file of files) manifest[file] = n;
  }
  // Read each pack back and find every file where the site will look, holding exactly what the file held.
  for (const [n, files] of plan.entries()) {
    const pack = JSON.parse(await readFile(path.join(site, "data", packPath(folder, version, n)), "utf8")) as Record<string, unknown>;
    for (const file of files) {
      if (JSON.stringify(pack[file]) !== JSON.stringify(JSON.parse(texts.get(file)!))) throw new Error(`Language packing: ${folder}/${file} reads back differently from pack ${n}.`);
    }
  }
  const manifestBody = JSON.stringify({ layout: LANGUAGE_PACK_LAYOUT, version, packs: manifest });
  if (parsePackManifest(JSON.parse(manifestBody))?.packs.size !== chosen.length) throw new Error(`Language packing: ${folder}'s manifest does not read back as ${chosen.length} files.`);
  await writeNew(path.join(root, PACK_MANIFEST), manifestBody);
  for (const file of chosen) await rm(path.join(root, file));
  await removeEmptyFolders(root, chosen);
  return { folder, filesBefore: all.length, packed: chosen.length, packs: plan.length, filesAfter: all.length - chosen.length + plan.length + 1 };
}

/** Packs every released language's content files in the release copy; returns the counts per language. */
export async function packLanguageFiles(site: string, folders: string[], { target = PACK_TARGET_BYTES, prefixes, checkFrontEnd = true }: { target?: number; prefixes?: string[]; checkFrontEnd?: boolean } = {}) {
  if (checkFrontEnd) assertFrontEndReadsLanguagePacks(site);
  const translated = prefixes ?? (await translatedDataPrefixes());
  const counts = [];
  for (const folder of folders) counts.push(await packLanguage(site, folder, translated, target));
  return counts;
}

interface Bank { questions: unknown[]; [key: string]: unknown }

async function readBank(file: string): Promise<{ text: string; bank: Bank }> {
  const text = await readFile(file, "utf8");
  const bank = JSON.parse(text) as Bank;
  if (!Array.isArray(bank.questions)) throw new Error(`Question bank split refused: ${file} has no questions list.`);
  if (bank.questionParts !== undefined) throw new Error(`Question bank split refused: ${file} is already split.`);
  return { text, bank };
}

/** The same questions in every copy, position by position: same count, and each question's kind and link equal. */
function assertSameQuestions(copies: [string, Bank][]): void {
  const [englishFile, english] = copies[0];
  for (const [file, bank] of copies.slice(1)) {
    if (bank.questions.length !== english.questions.length) throw new Error(`Question bank split refused: ${file} has ${bank.questions.length} questions; ${englishFile} has ${english.questions.length}. Rerun apply.py.`);
    bank.questions.forEach((question, i) => {
      const [a, b] = [english.questions[i], question] as Record<string, unknown>[];
      if (a?.kind !== b?.kind || JSON.stringify(a?.link ?? null) !== JSON.stringify(b?.link ?? null)) throw new Error(`Question bank split refused: question ${i} of ${file} is not the English question ${i} (kind or link differs).`);
    });
  }
}

/** The smallest part count, starting from the largest copy's size over 8 MiB, at which every part of every copy fits. */
export function choosePartCount(copies: Bank[], startBytes = BANK_PART_START_BYTES, limit = MAX_PACK_BYTES): number {
  const total = copies[0].questions.length;
  const largest = Math.max(...copies.map((bank) => bytes(JSON.stringify(bank.questions))));
  for (let count = Math.max(1, Math.ceil(largest / startBytes)); count <= MAX_BANK_PARTS; count++) {
    const size = Math.ceil(total / count);
    const fits = copies.every((bank) => Array.from({ length: count }, (_, k) => bank.questions.slice(k * size, (k + 1) * size)).every((part) => bytes(JSON.stringify(part)) <= limit));
    if (fits) return count;
  }
  throw new Error(`Question bank split refused: even ${MAX_BANK_PARTS} parts leave one over ${limit} bytes; a single question that large must be fixed at its source.`);
}

/** Splits data/questions/bank.json and each released language's copy in the release copy into parts. */
export async function splitQuestionBanks(site: string, folders: string[], { startBytes = BANK_PART_START_BYTES, limit = MAX_PACK_BYTES } = {}): Promise<{ copies: number; parts: number; questions: number; largestPart: number }> {
  const files = [path.join(site, "data", "questions", "bank.json"), ...folders.map((folder) => path.join(site, "data", "i18n", folder, "questions", "bank.json"))];
  const copies: [string, Bank][] = [];
  const hasher = createHash("sha256");
  for (const file of files) {
    await assertReleaseCopy(path.dirname(file));
    const info = await lstat(file);
    if (info.isSymbolicLink() || info.nlink > 1) throw new Error(`Question bank split refused: ${file} is a link to another file.`);
    const { text, bank } = await readBank(file);
    hasher.update(`${file.slice(site.length)}\0${text}\0`);
    copies.push([file, bank]);
  }
  assertSameQuestions(copies);
  const count = choosePartCount(copies.map(([, bank]) => bank), startBytes, limit);
  const parts: QuestionParts = { count, folder: `questions/bank-parts/${count}-${hash16(hasher)}` };
  if (!parseQuestionParts(parts)) throw new Error(`Question bank split: ${JSON.stringify(parts)} is not a layout the site reads.`);
  const size = Math.ceil(copies[0][1].questions.length / count);
  let largestPart = 0;
  for (const [file, bank] of copies) {
    const data = path.dirname(path.dirname(file)); // data/ or data/i18n/<folder>/
    for (let k = 0; k < count; k++) {
      const body = JSON.stringify(bank.questions.slice(k * size, (k + 1) * size));
      largestPart = Math.max(largestPart, bytes(body));
      await writeNew(path.join(data, parts.folder, `${k}.json`), body);
    }
    let joined = 0;
    for (let k = 0; k < count; k++) joined += (JSON.parse(await readFile(path.join(data, parts.folder, `${k}.json`), "utf8")) as unknown[]).length;
    if (joined !== bank.questions.length) throw new Error(`Question bank split: ${file}'s parts hold ${joined} questions; expected ${bank.questions.length}.`);
    await writeNew(file, JSON.stringify({ ...bank, questions: [], questionParts: parts }));
  }
  return { copies: copies.length, parts: count, questions: copies[0][1].questions.length, largestPart };
}

/** Refuses the release if any file in a released language's folder is over Workers' 25 MiB limit. */
export async function assertTranslatedFilesUnderLimit(site: string, folders: string[], limit = MAX_RELEASE_FILE_BYTES): Promise<{ largest: string; bytes: number }> {
  let largest = { largest: "", bytes: 0 };
  for (const folder of folders) {
    const root = path.join(site, "data", "i18n", folder);
    for (const file of await releaseFiles(root)) {
      const size = (await lstat(path.join(root, file))).size;
      if (size > limit) throw new Error(`Release refused: data/i18n/${folder}/${file} is ${size} bytes; Cloudflare Workers refuses files over ${limit}. Split it (scripts/pack-language-files.ts).`);
      if (size > largest.bytes) largest = { largest: `${folder}/${file}`, bytes: size };
    }
  }
  return largest;
}
