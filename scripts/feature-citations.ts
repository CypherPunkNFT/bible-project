// Works cited by the site's own pages (content/feature-citations.json lists which data files carry a `citations`
// list). The same work cited on several pages, or under slightly different titles, becomes one record with every page
// that cites it, so the Sources page can say where each work is used.
import fs from "node:fs";
import path from "node:path";

export interface Citation { id: string; author: string; title: string; year: string; url: string; where?: string }
export interface CitedOn { feature: string; page: string; address: string }
export interface CitedWork { id: string; title: string; author: string; year: string; basis: string; urls: string[]; citedOn: CitedOn[] }
interface Registry { features: { id: string; label: string; pages: { file: string; page: string; address: string }[] }[] }

/** The last publication year in the year field ("367 (trans. 1892)" -> 1892): the edition actually read. */
export function publicationYear(year: string): number | null {
  const years = [...year.matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)].map((match) => Number(match[1]));
  return years.length ? Math.max(...years) : null;
}

/** US public-domain basis from the edition's year (works published 1930 or earlier are public domain in 2026). */
export function publicDomainBasis(year: string): string {
  const published = publicationYear(year);
  if (published === null) return "No publication year recorded; public-domain basis to confirm";
  if (published <= 1930) return `Public domain in the US (published ${published})`;
  return `Published ${published}: cited for reference, may still be in copyright`;
}

const surname = (author: string) => {
  const name = author.split(/\(|,\s*(?:tr\.?|trans\.?|ed\.?)\s/i)[0].trim();
  return (name.split(/\s+/).at(-1) ?? name).toLowerCase().replace(/[^a-z]/g, "");
};
/** A title without quotes, notes in brackets, subtitles, or edition/volume/book/encyclopedia trailers. */
const titleStem = (title: string) => title.toLowerCase().replace(/[“”"‘’']/g, "").replace(/\([^)]*\)/g, "").split(/[:;]/)[0]
  .replace(/,\s*(international standard bible encyclop\w*|ed\.|edited|\d+(st|nd|rd|th) ed|new edition|vol\.?\s|volume|book\s|with introduction).*$/, "")
  .replace(/^(the|a|an)\s+/, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const slug = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** Every `citations` array anywhere in a data file. */
function citationsIn(value: unknown, file: string, found: Citation[] = []): Citation[] {
  if (Array.isArray(value)) value.forEach((item) => citationsIn(item, file, found));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key !== "citations") { citationsIn(child, file, found); continue; }
      if (!Array.isArray(child)) throw new Error(`feature citations: "citations" in ${file} is not a list`);
      for (const citation of child as Partial<Citation>[]) {
        const missing = (["author", "title", "url"] as const).filter((field) => typeof citation[field] !== "string" || !citation[field]);
        if (missing.length) throw new Error(`feature citations: citation "${citation.id ?? "?"}" in ${file} has no ${missing.join(", ")}`);
        found.push({ ...citation, year: citation.year ?? "" } as Citation);
      }
    }
  }
  return found;
}

/** Group citations into works: the same author's surname with the same link or the same title is the same work. */
export function groupCitations(cited: { citation: Citation; on: CitedOn }[]): CitedWork[] {
  const parent = cited.map((_, index) => index);
  const root = (index: number): number => (parent[index] === index ? index : (parent[index] = root(parent[index])));
  const firstByKey = new Map<string, number>();
  cited.forEach(({ citation }, index) => {
    // A link alone is not enough: one web page can hold a whole volume of different writers.
    for (const key of [`url:${surname(citation.author)}|${citation.url}`, `work:${surname(citation.author)}|${titleStem(citation.title)}`]) {
      const seen = firstByKey.get(key);
      if (seen === undefined) firstByKey.set(key, index);
      else parent[root(index)] = root(seen);
    }
  });
  const groups = new Map<number, number[]>();
  cited.forEach((_, index) => groups.set(root(index), [...(groups.get(root(index)) ?? []), index]));
  const works = [...groups.values()].map((members) => {
    const items = members.map((index) => cited[index]);
    const best = [...items].sort((a, b) => b.citation.title.length - a.citation.title.length || a.citation.url.localeCompare(b.citation.url))[0].citation;
    const citedOn: CitedOn[] = [];
    for (const { on } of items) if (!citedOn.some((c) => c.feature === on.feature && c.page === on.page)) citedOn.push(on);
    return {
      id: `cited-${slug(`${surname(best.author)}-${titleStem(best.title)}`)}`,
      title: best.title, author: best.author, year: best.year, basis: publicDomainBasis(best.year),
      urls: [...new Set(items.map((item) => item.citation.url))].sort(),
      citedOn,
    };
  });
  return works.sort((a, b) => a.author.localeCompare(b.author, "en") || a.title.localeCompare(b.title, "en"));
}

/** Read the registry and every data file it names. Throws with the file name when one is missing or malformed. */
export function readFeatureCitations(root: string): CitedWork[] {
  const registryFile = path.join(root, "content/feature-citations.json");
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8")) as Registry;
  const cited: { citation: Citation; on: CitedOn }[] = [];
  for (const feature of registry.features) {
    for (const page of feature.pages) {
      const file = path.join(root, ...page.file.split("/"));
      if (!fs.existsSync(file)) throw new Error(`feature citations: ${page.file} (listed for ${feature.label} · ${page.page} in content/feature-citations.json) does not exist`);
      const on = { feature: feature.label, page: page.page, address: page.address };
      for (const citation of citationsIn(JSON.parse(fs.readFileSync(file, "utf8")), page.file)) cited.push({ citation, on });
    }
  }
  return groupCitations(cited);
}
