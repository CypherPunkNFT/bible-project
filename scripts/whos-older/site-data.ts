// Who's older? build: reads the site's existing data (design §2.2). Nothing here writes. Used only by
// scripts/build-whos-older.ts, on this PC: the per-person family files are never fetched by the game (§4.4).
import fs from "node:fs";
import path from "node:path";

export const SITE = path.resolve(import.meta.dirname, "..", "..");
const DATA = path.join(SITE, "data");

export const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;

export interface PersonRow { id: string; n: string; o: string[]; b: string; c: number; p: string; g?: number | null }
export interface PersonFile { s?: string; pa?: string[] }

export function loadPeople(): Map<string, PersonRow> {
  return new Map(readJson<PersonRow[]>(path.join(DATA, "study", "people.json")).map((row) => [row.id, row]));
}

const personFiles = new Map<string, PersonFile | null>();
/** One person's family file (data/study/people/<id>.json), or null if it is missing. */
export function loadPersonFile(id: string): PersonFile | null {
  if (!personFiles.has(id)) {
    const file = path.join(DATA, "study", "people", `${id}.json`);
    personFiles.set(id, fs.existsSync(file) ? readJson<PersonFile>(file) : null);
  }
  return personFiles.get(id)!;
}

/** Person id -> readable address slug, from src/data/people-slugs.json. */
export function loadSlugs(): Map<string, string> {
  const { slugs } = readJson<{ slugs: Record<string, string> }>(path.join(SITE, "src", "data", "people-slugs.json"));
  const byId = new Map<string, string>();
  for (const [slug, id] of Object.entries(slugs)) if (!byId.has(id)) byId.set(id, slug);
  return byId;
}

export interface Book { num: number; code: string; name: string }
export function loadBooks(): Map<number, Book> {
  const { books } = readJson<{ books: Book[] }>(path.join(DATA, "catalog.json"));
  return new Map(books.filter((b) => b.num <= 66).map((b) => [b.num, b]));
}

/** The Berean Standard Bible text from data/text/bsb/, one book at a time. */
export class Bsb {
  private cache = new Map<string, Map<number, Map<number, string>>>();
  private books: Map<number, Book>;
  constructor(books: Map<number, Book>) { this.books = books; }

  private book(code: string): Map<number, Map<number, string>> {
    if (!this.cache.has(code)) {
      const folder = path.join(DATA, "text", "bsb", code);
      if (!fs.existsSync(folder)) throw new Error(`BSB text for ${code} not found at ${folder}`);
      const chapters = new Map<number, Map<number, string>>();
      for (const name of fs.readdirSync(folder).filter((f) => f.endsWith(".json"))) {
        const file = readJson<Record<string, { v: { n: string; r: unknown[] }[] }>>(path.join(folder, name));
        for (const [number, chapter] of Object.entries(file)) {
          const verses = new Map<number, string>();
          for (const verse of chapter.v) {
            if (!/^\d+$/.test(String(verse.n))) continue;
            const text = verse.r.filter((part): part is string => typeof part === "string").join("");
            verses.set(Number(verse.n), text.replace(/\s+/g, " ").trim());
          }
          chapters.set(Number(number), verses);
        }
      }
      this.cache.set(code, chapters);
    }
    return this.cache.get(code)!;
  }

  /** One verse's text, or null if the verse id is not in the text. */
  verse(id: number): string | null {
    const book = this.books.get(Math.floor(id / 1_000_000));
    if (!book) return null;
    return this.book(book.code).get(Math.floor(id / 1000) % 1000)?.get(id % 1000) ?? null;
  }
}

interface ReignDates { system: string; from?: number; to?: number }
interface RegnalRecord { age?: { years: number }; length?: { years: number } }
interface RulerEntry { id: string; personIds?: string[]; dates?: ReignDates[]; records?: RegnalRecord[] }
interface ProphetEntry { id: string; kings?: { person?: { personId?: string } }[] }

/** A reign in one dating system, BC as positive years and AD as negative, as on the people-pages. */
export interface Reign { system: string; start: number; end: number }
export interface PageRuler { reigns: Reign[]; ages: number[] }

/** Rulers and prophets from src/data/people-pages/, keyed by every person id they carry. */
export function loadPeoplePages(): { rulers: Map<string, PageRuler>; prophetKings: Map<string, string | null> } {
  const folder = path.join(SITE, "src", "data", "people-pages");
  const rulers = new Map<string, PageRuler>();
  const prophetKings = new Map<string, string | null>();
  for (const name of fs.readdirSync(folder).filter((f) => f.endsWith(".json") && f !== "index.json")) {
    const file = readJson<{ rulers?: RulerEntry[]; prophets?: ProphetEntry[] }>(path.join(folder, name));
    for (const ruler of file.rulers ?? []) {
      const length = ruler.records?.find((r) => r.length)?.length?.years;
      const reigns: Reign[] = [];
      for (const d of ruler.dates ?? []) {
        const start = d.from ?? (d.to !== undefined && length !== undefined ? d.to + length : undefined);
        if (start === undefined) continue;
        reigns.push({ system: d.system, start, end: d.to ?? start });
      }
      const ages = [...new Set((ruler.records ?? []).flatMap((r) => (r.age ? [r.age.years] : [])))];
      for (const id of [ruler.id, ...(ruler.personIds ?? [])]) rulers.set(id, { reigns, ages });
    }
    for (const prophet of file.prophets ?? []) prophetKings.set(prophet.id, prophet.kings?.[0]?.person?.personId ?? null);
  }
  return { rulers, prophetKings };
}

const THEOGRAPHIC = path.join(SITE, "..", "sources", "theographic", "theographic-bible-metadata-master", "CSV", "People.csv");

/** RFC 4180 rows: quoted fields may hold commas, quotes ("") and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Theographic birth years by name, for names that occur once among its people; null if the held copy is absent. */
export function loadTheographicBirths(): Map<string, number> | null {
  if (!fs.existsSync(THEOGRAPHIC)) return null;
  const [header, ...rows] = parseCsv(fs.readFileSync(THEOGRAPHIC, "utf8").replace(/^\uFEFF/, ""));
  const nameAt = header.indexOf("name");
  const birthAt = header.indexOf("birthYear");
  if (nameAt < 0 || birthAt < 0) throw new Error(`${THEOGRAPHIC}: expected name and birthYear columns, got ${header.slice(0, 15).join(", ")}`);
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row[nameAt], (counts.get(row[nameAt]) ?? 0) + 1);
  const births = new Map<string, number>();
  for (const row of rows) {
    const year = Number(row[birthAt]);
    if (counts.get(row[nameAt]) === 1 && row[birthAt] && Number.isInteger(year) && year !== 0) births.set(row[nameAt], year);
  }
  return births;
}
