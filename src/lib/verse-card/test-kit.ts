// Shared by the verse card tests: Berean verses read from the repository's own Bible files (so no test types a verse
// out), a fixed-width measure, and a recording canvas context.
import { readdirSync, readFileSync } from "node:fs";
import { plainWords } from "@/lib/data";
import type { Run as BibleRun } from "@/lib/types";
import type { Measure } from "./canvas";

interface ChapterFile { c: string; v: { n: number | string; r: BibleRun[] }[] }

const books = new Map<string, Record<string, ChapterFile>>();

function bookFiles(code: string): Record<string, ChapterFile> {
  let found = books.get(code);
  if (!found) {
    found = {};
    const folder = `data/text/bsb/${code}`;
    for (const name of readdirSync(folder)) Object.assign(found, JSON.parse(readFileSync(`${folder}/${name}`, "utf8")) as Record<string, ChapterFile>);
    books.set(code, found);
  }
  return found;
}

/** A Berean verse's plain words, or undefined when the Berean has no such verse. */
export function bereanVerse(code: string, chapter: number, verse: number): string | undefined {
  const words = bookFiles(code)[String(chapter)]?.v.find((entry) => Number(entry.n) === verse);
  return words ? plainWords(words.r) : undefined;
}

/** Several verses joined with a space, as a card draws them. */
export function bereanVerses(code: string, chapter: number, first: number, last: number): string {
  const words: string[] = [];
  for (let verse = first; verse <= last; verse++) words.push(bereanVerse(code, chapter, verse) ?? "");
  return words.filter(Boolean).join(" ");
}

/** Every letter half its font size wide, as canvasMeasure falls back to without a canvas. */
export const fixedMeasure: Measure = (text, font) => text.length * parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? "16") * 0.5;

export interface Recorded { op: string; args: unknown[]; font?: string; fillStyle?: unknown }

/** A canvas context that records what is drawn on it. */
export function recordingContext(): { context: CanvasRenderingContext2D; calls: Recorded[]; texts: () => Recorded[] } {
  const calls: Recorded[] = [];
  const state: { font: string; fillStyle: unknown } = { font: "", fillStyle: "" };
  const record = (op: string) => (...args: unknown[]) => { calls.push({ op, args, font: state.font, fillStyle: state.fillStyle }); };
  const gradient = { addColorStop: record("addColorStop") };
  const context = new Proxy({} as Record<string, unknown>, {
    get(_target, key: string) {
      if (key === "font") return state.font;
      if (key === "fillStyle") return state.fillStyle;
      if (key === "createLinearGradient") return (...args: unknown[]) => { calls.push({ op: key, args }); return gradient; };
      return record(key);
    },
    set(_target, key: string, value: unknown) {
      if (key === "font") state.font = value as string;
      else if (key === "fillStyle") state.fillStyle = value;
      else calls.push({ op: `set ${key}`, args: [value] });
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { context, calls, texts: () => calls.filter((call) => call.op === "fillText") };
}
