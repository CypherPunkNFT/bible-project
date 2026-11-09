// Verse completion: build pool.json and vocabulary.json from the hand-kept curation.json and the BSB on disk
// (docs/features/verse-completion/design.md §4.3, §11). Every rule is checked first; nothing is written unless all pass.
// The generated files hold ids, numbers and single words only, never a verse's wording.
//   node --experimental-strip-types scripts/build-verse-completion.ts               write the two files
//   node --experimental-strip-types scripts/build-verse-completion.ts --check       fail if they are out of date
//   node --experimental-strip-types scripts/build-verse-completion.ts --review PATH  also write the curator's review
//                                                                                    sheet (with wording) outside src/
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BOOKS, bookOf, passageText, plainBook, startsSentence } from "./verse-completion-candidates.ts";
import { eligibleText, passageId } from "../src/pages/games/verse-completion/passage.ts";
import { chooseDecoys, endingOf, longestShare, splitPoints, type DecoyInput } from "../src/pages/games/verse-completion/pool-rules.ts";
import { normalize } from "../src/pages/games/verse-completion/words.ts";
import type { Level, Passage, PickLevel, Pool, Tier } from "../src/pages/games/verse-completion/model.ts";

/** Bump when the matcher or the build rules change, so saved rounds from the old rules are dropped (§4.3). */
export const RULES_VERSION = 1;
const FOLDER = "src/data/verse-completion";
const TIER_TARGETS: Record<Tier, number> = { 1: 150, 2: 250, 3: 200 };

export interface Curated { id: string; from: number; to: number; tier: Tier; split?: Partial<Record<Level, number>>; retired?: boolean; note: string }

export interface Built { pool: Pool; vocabulary: string[]; texts: Map<string, string>; report: Record<string, number | string> }

/** One curated row checked against §4.1 and turned into a passage without decoys yet. */
function checkedPassage(row: Curated, seen: Set<string>): { passage: Passage; text: string } {
  const where = `curation.json "${row.id}"`;
  if (seen.has(row.id)) throw new Error(`verse completion: ${where} appears twice`);
  seen.add(row.id);
  const book = bookOf(row.from);
  if (!book || ![1, 2, 3].includes(row.tier)) throw new Error(`verse completion: ${where} has an unknown book or tier ${row.tier} (expected 1–3)`);
  if (passageId(book.code, row.from, row.to) !== row.id) throw new Error(`verse completion: ${where} does not match its verses ${row.from}–${row.to}`);
  const text = passageText(row.from, row.to);
  if (eligibleText(text) === null || !startsSentence(row.from)) {
    throw new Error(`verse completion: ${where} is not a whole sentence of 8–45 words without digits or contractions`);
  }
  const words = eligibleText(text)!;
  const passage: Passage = { id: row.id, from: row.from, to: row.to, tier: row.tier, testament: row.from < 40e6 ? "ot" : "nt", words,
    split: splitPoints(text, row.split, row.id), decoys: { easy: ["", ""], medium: ["", ""] }, ...(row.retired ? { retired: true as const } : {}) };
  return { passage, text };
}

/** §4.2's balance rules over the active passages. */
function checkBalance(active: readonly Passage[]): Record<string, number> {
  const ot = active.filter((passage) => passage.testament === "ot").length;
  if (ot * 3 < active.length) throw new Error(`verse completion: only ${ot} of ${active.length} passages are Old Testament (at least a third needed)`);
  for (const book of BOOKS) {
    const count = active.filter((passage) => Math.floor(passage.from / 1e6) === book.num).length;
    if (count > active.length * 0.12) throw new Error(`verse completion: ${book.code} has ${count} of ${active.length} passages (12% at most)`);
  }
  const report: Record<string, number> = { passages: active.length, oldTestament: ot };
  for (const tier of [1, 2, 3] as const) {
    const count = active.filter((passage) => passage.tier === tier).length;
    if (Math.abs(count - TIER_TARGETS[tier]) > TIER_TARGETS[tier] * 0.2) throw new Error(`verse completion: tier ${tier} has ${count} passages (target ${TIER_TARGETS[tier]} ± 20%)`);
    report[`tier${tier}`] = count;
  }
  return report;
}

/** Decoys for every passage at Easy and Medium, and the share of cards where the right ending is the longest. */
function addDecoys(inputs: readonly DecoyInput[]): Record<string, number> {
  const report: Record<string, number> = {};
  for (const level of ["easy", "medium"] as const satisfies readonly PickLevel[]) {
    inputs.forEach((input, index) => { input.passage.decoys[level] = chooseDecoys(index, inputs, level); });
    const byId = new Map(inputs.map((input) => [input.passage.id, input]));
    const length = (input: DecoyInput) => endingOf(input.text, input.passage.split[level]).keys.length;
    const share = longestShare(inputs.filter((input) => !input.passage.retired)
      .map((input) => ({ right: length(input), decoys: input.passage.decoys[level].map((id) => length(byId.get(id)!)) })));
    if (share < 0.25 || share > 0.42) throw new Error(`verse completion: the right ${level} ending is the longest on ${(share * 100).toFixed(1)}% of cards (25–42% wanted)`);
    report[`${level}LongestShare`] = Math.round(share * 1000) / 1000;
  }
  return report;
}

/** How many passages each level and testament filter can deal from (§7.3, reported at build time). */
function deckSizes(active: readonly Passage[]): Record<string, number> {
  const report: Record<string, number> = {};
  const tiers: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };
  for (const level of ["easy", "medium", "hard"] as const) {
    for (const testament of ["all", "ot", "nt"]) {
      report[`deck-${level}-${testament}`] = active.filter((passage) => passage.tier <= tiers[level] && (testament === "all" || passage.testament === testament)).length;
    }
  }
  return report;
}

/** Every distinct BSB word (§2.6), for the typo rule's "a real word is never a typo". */
export function bsbVocabulary(): string[] {
  const all = new Set<string>();
  for (const book of BOOKS) for (const text of Object.values(plainBook(book.num))) for (const word of normalize(text)) all.add(word);
  return [...all].sort();
}

export function buildPool(curated: readonly Curated[]): Built {
  const seen = new Set<string>();
  const inputs = curated.map((row) => checkedPassage(row, seen));
  const passages = inputs.map((input) => input.passage);
  const active = passages.filter((passage) => !passage.retired);
  const report: Record<string, number | string> = { ...checkBalance(active), ...addDecoys(inputs), ...deckSizes(active) };
  const vocabulary = bsbVocabulary();
  const texts = new Map(inputs.map((input) => [input.passage.id, input.text]));
  // The wording takes part in the hash but is never written out: a changed verse drops old rounds (§4.3).
  const stamp = createHash("sha256").update(JSON.stringify({ RULES_VERSION, passages, texts: [...texts], vocabulary })).digest("hex").slice(0, 20);
  report.stamp = stamp;
  return { pool: { stamp, passages }, vocabulary, texts, report };
}

/** The curator's check of every Pick prompt: opening, right ending and the two wrong ones, as the BSB has them. */
function reviewSheet(built: Built): string {
  const byId = new Map(built.pool.passages.map((passage) => [passage.id, passage]));
  const lines: string[] = [];
  for (const passage of built.pool.passages) {
    const text = built.texts.get(passage.id)!;
    for (const level of ["easy", "medium"] as const) {
      const ending = endingOf(text, passage.split[level]);
      const decoys = passage.decoys[level].map((id) => endingOf(built.texts.get(id)!, byId.get(id)!.split[level]).text);
      lines.push(`${passage.id} [${level}] ${text.slice(0, text.length - ending.text.length)}| ✓ ${ending.text} | ✗ ${decoys.join(" | ✗ ")}`);
    }
  }
  return lines.join("\n") + "\n";
}

const fileText = (value: unknown) => JSON.stringify(value) + "\n";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = buildPool(JSON.parse(readFileSync(`${FOLDER}/curation.json`, "utf8")) as Curated[]);
  const outputs: [string, string][] = [[`${FOLDER}/pool.json`, fileText(built.pool)], [`${FOLDER}/vocabulary.json`, fileText(built.vocabulary)]];
  if (process.argv.includes("--check")) {
    for (const [path, text] of outputs) if (readFileSync(path, "utf8") !== text) throw new Error(`verse completion: ${path} is out of date; run scripts/build-verse-completion.ts`);
  } else {
    for (const [path, text] of outputs) writeFileSync(path, text);
  }
  const review = process.argv.indexOf("--review");
  if (review >= 0) {
    const path = process.argv[review + 1];
    if (!path || resolve(path).startsWith(resolve("src"))) throw new Error("verse completion: give the review sheet a path outside src/");
    writeFileSync(path, reviewSheet(built));
  }
  console.log(JSON.stringify(built.report, null, 1));
}
