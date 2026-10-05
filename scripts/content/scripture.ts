import { readFileSync } from "node:fs";
import path from "node:path";
import type { ScriptureIndex } from "./model.ts";

/** Authoring uses readable, same-book references: Romans 3:10-12 or Isaiah 52:13-53:12. */
export function parseReference(reference: string, index: ScriptureIndex): [number, number] {
  const match = /^(.+) (\d+):(\d+)(?:[-–](?:(\d+):)?(\d+))?$/.exec(reference);
  if (!match) throw new Error(`Use a full book name and verses, such as Romans 3:10-12: ${reference}`);
  const name = match[1] === "Psalm" ? "Psalms" : match[1];
  const book = index.books.find((entry) => entry.name === name || entry.code === name);
  if (!book) throw new Error(`Unknown Bible book in ${reference}`);
  const chapter = Number(match[2]), verse = Number(match[3]);
  const endChapter = match[4] ? Number(match[4]) : chapter, endVerse = match[5] ? Number(match[5]) : verse;
  for (const [c, v] of [[chapter, verse], [endChapter, endVerse]]) {
    if (!Number.isSafeInteger(c) || c < 1 || c > book.chapters.length || !Number.isSafeInteger(v) || v < 1 || v > book.chapters[c - 1]) throw new Error(`Verse does not exist in KJV versification: ${reference}`);
  }
  const span: [number, number] = [book.num * 1e6 + chapter * 1000 + verse, book.num * 1e6 + endChapter * 1000 + endVerse];
  if (span[0] > span[1]) throw new Error(`Passage is reversed: ${reference}`);
  return span;
}

export function formatReference(span: readonly number[], index: ScriptureIndex): string {
  const start = span[0], end = span[1], book = index.books.find((entry) => entry.num === Math.floor(start / 1e6));
  if (!book || Math.floor(start / 1e6) !== Math.floor(end / 1e6)) throw new Error("Expected a same-book Scripture span");
  const c1 = Math.floor(start / 1000) % 1000, c2 = Math.floor(end / 1000) % 1000, v1 = start % 1000, v2 = end % 1000;
  return `${book.name} ${c1}:${v1}${start === end ? "" : c1 === c2 ? `-${v2}` : `-${c2}:${v2}`}`;
}

export function scriptureText(reference: string, index: ScriptureIndex, root: string): string {
  const span = parseReference(reference, index), book = index.books.find((entry) => entry.num === Math.floor(span[0] / 1e6))!;
  const first = Math.floor(span[0] / 1000) % 1000, last = Math.floor(span[1] / 1000) % 1000;
  const lines: string[] = [];
  for (let chapter = first; chapter <= last; chapter++) {
    const file = path.join(root, "data/text/kjv", book.code, `${Math.floor((chapter - 1) / 5)}.json`);
    const chunk = JSON.parse(readFileSync(file, "utf8")) as Record<string, { v: { n: string; r: (string | string[] | object)[] }[] }>;
    for (const verse of chunk[String(chapter)].v) {
      const id = book.num * 1e6 + chapter * 1000 + Number(verse.n);
      if (id >= span[0] && id <= span[1]) lines.push(`${chapter}:${verse.n} ${verse.r.map((run) => typeof run === "string" ? run : Array.isArray(run) ? run[0] : "").join("")}`);
    }
  }
  return lines.join("\n");
}
