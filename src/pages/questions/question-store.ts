// The question bank as the Questions pages read it (owner, 2026-11-19: the pages downloaded and parsed the whole 16 MB
// bank before the first question showed). In English it comes from its split files (scripts/split-data/datasets.ts,
// src/lib/split-data.ts): the head and every row's list layer open the questions and test pages (the counts, filters,
// book ring, statistics and the test's pool); the words of a question come for the rows on screen, in small files, and
// for every row only for a search; the tagged passages come with a question's words, or all at once for a chapter. The
// children's page reads only its two collections. In another language, or where the split is missing or a file of it
// fails, the store holds the whole bank, read as before (loadQuestionBank), with everything loaded.
import { loadQuestionBank, loadSplitManifest, loadSplitPart, type BankQuestion, type QuestionBank } from "@/lib/data";
import { languageFolder } from "@/lib/language";
import { expandRow, type SplitHead, type SplitManifest } from "@/lib/split-data";
import { useAsync } from "@/lib/useAsync";
import { useEffect, useState } from "react";
import { inTheme, THEMES } from "./test/themes";

const DATASET = "questions";
export type Layer = "list" | "text" | "passages";
/** The keys each layer may set on a row (scripts/split-data/datasets.ts); anything else in a file is left out. */
const KEYS: Record<Layer, readonly string[]> = {
  list: ["kind", "topic", "testament", "books", "collection", "tradition", "level", "children", "standalone", "link", "lead_in", "people", "places"],
  text: ["question", "answer", "options", "answer_choice", "reference", "lesson", "child"],
  passages: ["passages"],
};
const LAYERS = Object.keys(KEYS) as Layer[];

interface HeadData extends Pick<QuestionBank, "kinds" | "topics" | "books" | "collections"> {
  themes: Record<string, number[]>;
  withoutOptions: number[];
  ranges: Record<string, [number, number][]>;
}

export interface QuestionStore {
  /** `questions[i]` is the bank's row i. From the split, a row has only its list layer until `need` brings the rest
   *  (`has`); on the children's page, rows outside its collections stay empty. Read the words only where `has` says so. */
  bank: QuestionBank;
  /** Each theme's questions (test/themes.ts), by place in the bank. */
  themes: Map<string, Set<number>>;
  /** The questions without options, which "multiple choice only" leaves out. */
  withoutOptions: Set<number>;
  /** Where each collection's rows lie: [first, after last) runs. */
  ranges: Record<string, [number, number][]>;
  /** True when every layer of every row is here (the whole bank). */
  whole: boolean;
  has: (layer: Layer, row: number) => boolean;
  /** True when the layer is here for every row. */
  ready: (layer: Layer) => boolean;
  /** Brings a layer for these rows (and the list layer under them); resolves once it has merged. On a failure the store
   *  turns into the whole bank, so a page never waits for ever. */
  need: (layer: Layer, rows: number[] | "all") => Promise<void>;
  /** Hears every merge (and the change to the whole bank); returns the way to stop. */
  listen: (listener: () => void) => () => void;
}

const isHead = (v: unknown): v is SplitHead<HeadData> => {
  if (typeof v !== "object" || v === null) return false;
  const { keys, order, data } = v as SplitHead<HeadData>;
  return Array.isArray(keys) && (order === undefined || Array.isArray(order)) && typeof data === "object" && data !== null
    && Array.isArray(data.collections) && Array.isArray(data.topics) && Array.isArray(data.books) && Array.isArray(data.withoutOptions);
};

/** A list of places from its gaps, refused unless every place rises and lies inside the bank. */
function places(gaps: unknown, rows: number, what: string): number[] {
  if (!Array.isArray(gaps)) throw new Error(`Question split: ${what} is not a list`);
  let at = 0;
  return gaps.map((gap, i) => {
    at += gap;
    if (!Number.isInteger(gap) || (i > 0 && gap < 1) || gap < 0 || at >= rows) throw new Error(`Question split: ${what} has a place outside the bank (${at})`);
    return at;
  });
}

function readHead(head: SplitHead<HeadData>, rows: number) {
  // The pages read row i of every layer at place i, which holds while the opening is every row (datasets.ts).
  if (head.order && head.order.some((place, i) => place !== i)) throw new Error("Question split: rows are not in the bank's order");
  const themes = new Map(THEMES.map((theme) => [theme.id, new Set(places(head.data.themes?.[theme.id], rows, `theme ${theme.id}`))]));
  const withoutOptions = new Set(places(head.data.withoutOptions.map((p, i, all) => p - (i ? all[i - 1] : 0)), rows, "withoutOptions"));
  const ranges = head.data.ranges;
  if (typeof ranges !== "object" || ranges === null) throw new Error("Question split: the head has no collection ranges");
  for (const [title, runs] of Object.entries(ranges)) {
    if (!Array.isArray(runs) || !runs.every((r) => Array.isArray(r) && Number.isInteger(r[0]) && Number.isInteger(r[1]) && r[0] >= 0 && r[0] < r[1] && r[1] <= rows))
      throw new Error(`Question split: collection ${title} has bad row ranges`);
  }
  return { themes, withoutOptions, ranges };
}

/** The store for the whole bank: what the split's head carries, worked out here as the pages did before. */
function wholeFigures(bank: QuestionBank) {
  const themes = new Map(THEMES.map((theme) => [theme.id, new Set(bank.questions.flatMap((q, i) => (inTheme(theme, q) ? [i] : [])))]));
  const withoutOptions = new Set(bank.questions.flatMap((q, i) => (q.options ? [] : [i])));
  const ranges: Record<string, [number, number][]> = {};
  bank.questions.forEach((q, i) => {
    const runs = (ranges[q.collection] ??= []);
    const last = runs[runs.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else runs.push([i, i + 1]);
  });
  return { themes, withoutOptions, ranges };
}

function makeStore(bank: QuestionBank, figures: ReturnType<typeof wholeFigures>, whole: boolean): QuestionStore & { listeners: Set<() => void> } {
  const listeners = new Set<() => void>();
  return {
    bank, ...figures, whole, listeners,
    has: () => true,
    ready: () => true,
    need: () => Promise.resolve(),
    listen: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

async function wholeStore(): Promise<QuestionStore> {
  const bank = await loadQuestionBank();
  return makeStore(bank, wholeFigures(bank), true);
}

/** The store from the split files: the head now, each layer's files when a page needs them. */
async function splitStore(manifest: SplitManifest): Promise<QuestionStore> {
  for (const layer of LAYERS) if (!manifest.layers[layer]) throw new Error(`Question split: no ${layer} layer`);
  const head = await loadSplitPart<SplitHead<HeadData>>(DATASET, manifest.head, isHead);
  const rows = manifest.rows;
  const figures = readHead(head, rows);
  const { kinds, topics, books, collections } = head.data;
  const bank: QuestionBank = { kinds, topics, books, collections, questions: new Array<BankQuestion>(rows) };
  const store = makeStore(bank, figures, false);
  // Each layer's files with the rows they start at; a file is read once (its promise kept) and marked when merged.
  const files = Object.fromEntries(LAYERS.map((layer) => {
    let start = 0;
    return [layer, manifest.layers[layer].files.map((f) => { const at = start; start += f.rows; return { ...f, start: at, merged: false, pending: null as Promise<void> | null }; })];
  })) as Record<Layer, { file: string; rows: number; start: number; merged: boolean; pending: Promise<void> | null }[]>;
  const fileOf = (layer: Layer, row: number) => {
    const list = files[layer];
    let low = 0, high = list.length - 1;
    while (low < high) { const mid = (low + high + 1) >> 1; if (list[mid].start <= row) low = mid; else high = mid - 1; }
    return list[low];
  };
  const read = (layer: Layer, part: (typeof files)[Layer][number]) => part.pending ??= loadSplitPart<unknown[]>(DATASET, part.file, Array.isArray).then((values) => {
    if (values.length !== part.rows) throw new Error(`Question split: ${part.file} holds ${values.length} rows, ${part.rows} expected`);
    values.forEach((value, i) => {
      const row = expandRow(value, head.keys) as Record<string, unknown>;
      const target = (layer === "list" ? {} : bank.questions[part.start + i]) as Record<string, unknown>;
      for (const key of KEYS[layer]) if (Object.prototype.hasOwnProperty.call(row, key)) target[key] = row[key];
      if (layer === "list") bank.questions[part.start + i] = target as unknown as BankQuestion;
    });
    part.merged = true;
  }).catch((error: unknown) => { part.pending = null; throw error; });

  let fallback: Promise<void> | null = null;
  const toWhole = (error: unknown) => fallback ??= (async () => {
    console.warn("Question split failed; reading the whole bank", error);
    const full = await loadQuestionBank();
    Object.assign(store, { bank: full, ...wholeFigures(full), whole: true, has: () => true, ready: () => true, need: () => Promise.resolve() });
  })();
  const tell = () => { for (const listener of store.listeners) listener(); };
  store.has = (layer, row) => fileOf(layer, row).merged;
  store.ready = (layer) => files[layer].every((f) => f.merged);
  store.need = async (layer, wanted) => {
    const parts = (layer: Layer) => wanted === "all" ? files[layer] : [...new Set(wanted.filter((r) => r >= 0 && r < rows).map((r) => fileOf(layer, r)))];
    const missing = (layer: Layer) => parts(layer).filter((p) => !p.merged);
    if (!missing("list").length && !missing(layer).length) return;
    try {
      // The list layer makes the row objects the other layers merge into, so it comes first.
      await Promise.all(missing("list").map((p) => read("list", p)));
      if (layer !== "list") await Promise.all(missing(layer).map((p) => read(layer, p)));
    } catch (error) {
      await toWhole(error);
    }
    tell();
  };
  return store;
}

/** The store in the reader's language: the split in English, falling back to the whole bank. */
export async function openQuestionStore(): Promise<QuestionStore> {
  if (languageFolder() !== null) return wholeStore();
  let manifest: SplitManifest;
  try {
    manifest = await loadSplitManifest(DATASET);
    return await splitStore(manifest);
  } catch (error) {
    console.warn("Question split unavailable; reading the whole bank", error);
    return wholeStore();
  }
}

/** The store with what the page opens with: `opening` names the layers and rows it needs before it draws. */
export function useQuestionStore(opening: (store: QuestionStore) => [Layer, number[] | "all"][], key: string) {
  const loaded = useAsync(async () => {
    const store = await openQuestionStore();
    for (const [layer, rows] of opening(store)) await store.need(layer, rows);
    return store;
  }, `questions/${key}`);
  const store = loaded.status === "ready" ? loaded.value : null;
  // Every merge redraws the page, so the rows just brought show.
  const [version, setVersion] = useState(0);
  useEffect(() => store?.listen(() => setVersion((v) => v + 1)), [store]);
  const failed = loaded.status === "error" ? (loaded.error instanceof Error ? loaded.error.message : String(loaded.error)) : null;
  return { store, version, failed };
}
