import { loadPlain } from "./data";
import type { Catalog, PlainBook, Translation } from "./types";

export function scriptureText(catalog: Catalog, version: Translation, books: PlainBook[]): string {
  const codes = Object.keys(version.books);
  if (books.length !== codes.length) throw new Error("Incomplete edition");
  let verses = 0;
  const sections = codes.map((code, index) => {
    const book = books[index];
    const entries = Object.entries(book);
    if (!entries.length || entries.some(([ref, text]) => !ref.includes(":") || typeof text !== "string")) {
      throw new Error(`Invalid book: ${code}`);
    }
    // Some source chapter labels are empty (e.g. LXX Proverbs 30). Validate the
    // complete edition's verse count below without inventing text for those labels.
    verses += entries.length;
    const name = catalog.books.find((book) => book.code === code)?.name ?? code;
    return `${name} (${code})\r\n\r\n${entries.map(([ref, text]) => `${code} ${ref} ${text}`).join("\r\n")}`;
  });
  if (verses !== version.verses) throw new Error("Incomplete verse count");
  const credit = version.credit;
  const header = [
    `${version.name} (${version.abbr})`,
    `Edition: ${version.year} | Language: ${version.lang}`,
    "Source: eBible.org — https://ebible.org/",
    "Free download from Bible Project. All books available in this site's edition are included.",
    "UTF-8 plain verse text; introductions, headings, footnotes and formatting are omitted.",
    ...(credit ? [credit.text, credit.url, `${credit.licence}: ${credit.licenceUrl}`, credit.changes] : [
      version.slug === "kjv"
        ? "Public domain except in the United Kingdom, where the Crown holds a perpetual patent."
        : "Public domain.",
    ]),
  ];
  return `${header.join("\r\n")}\r\n\r\n${sections.join("\r\n\r\n")}\r\n`;
}

export async function prepareScriptureDownload(catalog: Catalog, version: Translation, progress: (done: number, total: number) => void): Promise<Blob> {
  const codes = Object.keys(version.books);
  const books: PlainBook[] = [];
  // Bound simultaneous requests; preserve the edition's book and verse order.
  for (let index = 0; index < codes.length; index += 4) {
    books.push(...await Promise.all(codes.slice(index, index + 4).map((code) => loadPlain(version.slug, code))));
    progress(books.length, codes.length);
  }
  return new Blob(["\uFEFF", scriptureText(catalog, version, books)], { type: "text/plain;charset=utf-8" });
}
