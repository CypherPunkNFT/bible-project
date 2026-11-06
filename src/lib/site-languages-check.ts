// Checks site-languages.json, the one definition of each site language. Every value here reaches a file path
// (data/i18n/<folder>), a CSS selector or the release, and the file is edited by hand and by Python tools, so each
// value is held to a strict shape. No imports, so the release scripts can load it under Node as well as the site.

const FIELDS = ["code", "folder", "bible", "name", "englishName", "dir", "script", "plurals", "digits", "font", "released", "pseudo"];
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];
const SOURCE_CODE = "en";

// A web standard tag such as "pt-BR" or "zh-Hans"; a folder or Bible id of plain letters, digits and hyphens (never a
// dot or a slash, so it cannot leave data/i18n/); a font stack that cannot close the CSS rule it is written into.
const CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const FOLDER = /^[a-z][a-z0-9-]{1,15}$/;
const BIBLE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const SCRIPT = /^[A-Z][a-z]{3}$/;
const DIGITS = /^[a-z]{3,8}$/;
const FONT_FORBIDDEN = /[;{}<>\\]/;

type Entry = Record<string, unknown>;
const shown = (value: unknown): string => JSON.stringify(value) ?? String(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** What is wrong with one entry, each line saying the field, what was expected and what was found. */
export function entryProblems(entry: unknown, index: number): string[] {
  const where = `languages[${index}]`;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [`${where}: expected an object, got ${shown(entry)}`];
  const item = entry as Entry, label = `${where} (${shown(item.code)})`, problems: string[] = [];
  const expect = (ok: boolean, field: string, wanted: string) => {
    if (!ok) problems.push(`${label}.${field}: expected ${wanted}, got ${shown(item[field])}`);
  };
  for (const key of Object.keys(item)) if (!FIELDS.includes(key)) problems.push(`${label}: unknown field "${key}" (known: ${FIELDS.join(", ")})`);
  for (const key of FIELDS) if (!(key in item)) problems.push(`${label}: missing field "${key}"`);
  expect(typeof item.code === "string" && CODE.test(item.code), "code", "a web standard tag such as \"pt-BR\"");
  expect(item.folder === null || (typeof item.folder === "string" && FOLDER.test(item.folder)), "folder", "null or lowercase letters, digits and hyphens");
  expect(item.bible === null || (typeof item.bible === "string" && BIBLE.test(item.bible)), "bible", "null or a Bible id such as \"rvr\"");
  expect(isText(item.name), "name", "the menu's name");
  expect(isText(item.englishName), "englishName", "the name in English");
  expect(item.dir === "ltr" || item.dir === "rtl", "dir", "\"ltr\" or \"rtl\"");
  expect(typeof item.script === "string" && SCRIPT.test(item.script), "script", "an ISO 15924 code such as \"Latn\"");
  const plurals = item.plurals;
  expect(Array.isArray(plurals) && plurals.includes("other") && new Set(plurals).size === plurals.length &&
    plurals.every((category) => PLURAL_CATEGORIES.includes(category as string)), "plurals", `distinct categories from ${PLURAL_CATEGORIES.join("/")}, including "other"`);
  expect(typeof item.digits === "string" && DIGITS.test(item.digits), "digits", "a numbering system such as \"latn\"");
  expect(item.font === null || (isText(item.font) && !FONT_FORBIDDEN.test(item.font)), "font", "null or a font stack with no ; { } < > or backslash");
  expect(typeof item.released === "boolean", "released", "true or false (not a string)");
  expect(typeof item.pseudo === "boolean", "pseudo", "true or false (not a string)");
  if (item.pseudo === true && item.released === true) problems.push(`${label}: a made-up test language (pseudo) can never be released`);
  return problems;
}

/** What is wrong across the list: duplicates, and the source language (English, no folder, released) exactly once. */
function listProblems(entries: Entry[]): string[] {
  const problems: string[] = [];
  const repeated = (values: unknown[], field: string) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (typeof value !== "string") continue;
      const key = value.toLowerCase();
      if (seen.has(key)) problems.push(`languages: ${field} ${shown(value)} appears more than once (compared ignoring case)`);
      seen.add(key);
    }
  };
  repeated(entries.map((entry) => entry.code), "code");
  repeated(entries.map((entry) => entry.folder), "folder");
  const sources = entries.filter((entry) => entry.folder === null);
  if (sources.length !== 1) problems.push(`languages: expected exactly one source language (folder null), got ${sources.length}`);
  else if (sources[0].code !== SOURCE_CODE || sources[0].released !== true)
    problems.push(`languages: the source language (folder null) must be "${SOURCE_CODE}" and released; got ${shown(sources[0].code)}, released ${shown(sources[0].released)}`);
  return problems;
}

/** Every problem in a parsed site-languages.json; an empty list means it is sound. */
export function siteLanguageProblems(data: unknown): string[] {
  if (typeof data !== "object" || data === null || !Array.isArray((data as Entry).languages))
    return [`site-languages.json: expected an object with a "languages" list, got ${shown(data).slice(0, 80)}`];
  const unknown = Object.keys(data).filter((key) => key !== "about" && key !== "languages");
  const entries = (data as { languages: unknown[] }).languages;
  const problems = unknown.map((key) => `site-languages.json: unknown top-level field "${key}" (known: about, languages)`);
  entries.forEach((entry, index) => problems.push(...entryProblems(entry, index)));
  const objects = entries.filter((entry): entry is Entry => typeof entry === "object" && entry !== null && !Array.isArray(entry));
  return [...problems, ...listProblems(objects)];
}
