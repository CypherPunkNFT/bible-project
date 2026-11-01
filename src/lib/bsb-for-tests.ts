// Tests of studies whose files name verses: the Berean's words for a verse, from the built Bible.
import { readFileSync } from "node:fs";

export function bsbWords(verse: { code: string; chapter: number; verse: number }): string {
  const chapter = JSON.parse(readFileSync(`data/plain/bsb/${verse.code}.json`, "utf8")) as Record<string, string>;
  return chapter[`${verse.chapter}:${verse.verse}`] ?? "";
}
