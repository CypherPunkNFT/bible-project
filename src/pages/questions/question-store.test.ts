// The question bank in parts (question-store.ts, scripts/split-data/datasets.ts): the head's themes, options and ranges
// are the bank's own, each row comes back whole from its layers, a page reads only the files its rows lie in, and a file
// that does not match its manifest turns the store into the whole bank. Built here in memory from data/questions/bank.json,
// which is made on each computer (not in git); without it these tests are skipped.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFromSource } from "../../../scripts/split-data.ts";
import { DATASETS } from "../../../scripts/split-data/datasets.ts";
import type { BankQuestion, QuestionBank } from "@/lib/data";
import { openQuestionStore } from "./question-store";
import { inTheme, THEMES } from "./test/themes";

const root = path.resolve(__dirname, "../../..");
const source = path.join(root, "data/questions/bank.json");
const hasBank = existsSync(source);
const bank: QuestionBank = hasBank ? JSON.parse(readFileSync(source, "utf8")) : { kinds: {}, topics: [], books: [], collections: [], questions: [] };
const built = hasBank ? buildFromSource(DATASETS.find((d) => d.name === "questions")!) : null;

const reply = (value: unknown) => new Response(typeof value === "string" ? value : JSON.stringify(value), { headers: { "content-type": "application/json" } });
/** Serves the split (and the whole bank) the way the site does; `change` may alter a part's rows; records every address. */
function serve(change?: (file: string, rows: unknown[]) => unknown[]) {
  const asked: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const address = String(url).split("?")[0];
    asked.push(address);
    if (address === "/data/questions/bank.json") return reply(bank);
    const file = address.replace("/data/split/questions/", "");
    if (file === "manifest.json") return reply(built!.manifest);
    const bytes = built!.files.get(file);
    if (!bytes) return new Response("missing", { status: 404 });
    const value = JSON.parse(bytes.toString());
    return reply(change && Array.isArray(value) ? change(file, value) : value);
  }));
  return asked;
}
const TEXT = ["question", "answer", "options", "answer_choice", "reference", "lesson", "child"] as const;
const parts = (asked: string[], layer: string) => asked.filter((a) => a.startsWith(`/data/split/questions/${layer}-`)).length;

afterEach(() => vi.unstubAllGlobals());

describe.skipIf(!hasBank)("the question bank in parts", () => {
  it("carries each theme's questions, the questions without options and each collection's rows as the bank has them", async () => {
    serve();
    const store = await openQuestionStore();
    expect(store.whole).toBe(false);
    for (const theme of THEMES) {
      const wanted = bank.questions.flatMap((q, i) => (inTheme(theme, q) ? [i] : []));
      expect([...store.themes.get(theme.id)!], theme.id).toEqual(wanted);
    }
    expect([...store.withoutOptions]).toEqual(bank.questions.flatMap((q, i) => (q.options ? [] : [i])));
    for (const [title, runs] of Object.entries(store.ranges)) {
      const rows = runs.flatMap(([from, to]) => Array.from({ length: to - from }, (_, k) => from + k));
      expect(rows).toEqual(bank.questions.flatMap((q, i) => (q.collection === title ? [i] : [])));
    }
  });

  it("opens with the list layer only, then reads just the text files a screen's rows lie in", async () => {
    const asked = serve();
    const store = await openQuestionStore();
    await store.need("list", "all");
    expect(store.ready("list")).toBe(true);
    expect(parts(asked, "text")).toBe(0);
    const row = bank.questions.length - 1;
    expect(store.bank.questions[row].kind).toBe(bank.questions[row].kind);
    expect(store.bank.questions[row].question).toBeUndefined();
    await store.need("text", [0, 1, 2, row]);
    expect(parts(asked, "text")).toBe(2);
    expect(store.has("text", row) && store.has("text", 0)).toBe(true);
    expect(store.ready("text")).toBe(false);
    for (const key of TEXT) expect(store.bank.questions[row][key as keyof BankQuestion]).toEqual(bank.questions[row][key as keyof BankQuestion]);
  });

  it("gives back every row whole once every layer is read", async () => {
    serve();
    const store = await openQuestionStore();
    await Promise.all([store.need("text", "all"), store.need("passages", "all")]);
    const unread = new Set(["subjects", "options_by"]); // in the details, which these pages do not read
    const strip = (q: BankQuestion) => Object.fromEntries(Object.entries(q).filter(([key]) => !unread.has(key)));
    expect(store.bank.questions.map(strip)).toEqual(bank.questions.map(strip));
  });

  it("reads only the files the children's two collections lie in", async () => {
    const asked = serve();
    const store = await openQuestionStore();
    const rows = (store.ranges["A Catechism for Young Children"] ?? []).flatMap(([from, to]) => Array.from({ length: to - from }, (_, k) => from + k));
    expect(rows.length).toBeGreaterThan(0);
    await store.need("text", rows);
    expect(parts(asked, "list")).toBeLessThan(built!.manifest.layers.list.files.length);
    expect(store.bank.questions[rows[0]].question).toBe(bank.questions[rows[0]].question);
  });

  it("turns into the whole bank when a file does not hold the rows its manifest says", async () => {
    const asked = serve((file, rows) => (file.startsWith("text-") ? rows.slice(1) : rows));
    const store = await openQuestionStore();
    await store.need("text", [0]);
    expect(store.whole).toBe(true);
    expect(asked).toContain("/data/questions/bank.json");
    expect(store.bank.questions[0].question).toBe(bank.questions[0].question);
    expect(store.has("text", 5) && store.ready("passages")).toBe(true);
  });
});
