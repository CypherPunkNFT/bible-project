// node --experimental-strip-types --test scripts/source-directory.test.ts
// The reference directory links Internet Archive items and Gutenberg books at addresses that last (source permissions
// register of 2026-11-27, bucket 1): never a rotating storage server, never a file inside a Gutenberg book.
import assert from "node:assert/strict";
import { test } from "node:test";
import { stableLink, stableLinks } from "./source-directory.ts";

test("Internet Archive storage-server links become the item page", () => {
  assert.equal(stableLink("https://dn760007.eu.archive.org/0/items/outlinesoftheolo00hodguoft/outlinesoftheolo00hodguoft.pdf"), "https://archive.org/details/outlinesoftheolo00hodguoft");
  assert.equal(stableLink("https://ia801602.us.archive.org/5/items/worksofpresident10edwa/worksofpresident10edwa.pdf"), "https://archive.org/details/worksofpresident10edwa");
  assert.equal(stableLink("http://ia600601.us.archive.org/items/abc/abc_djvu.txt?x=1#p"), "https://archive.org/details/abc");
});

test("Gutenberg file and mirror links become the book's landing page", () => {
  assert.equal(stableLink("https://www.gutenberg.org/cache/epub/11449/pg11449-images.html"), "https://www.gutenberg.org/ebooks/11449");
  assert.equal(stableLink("https://mirrors.xmission.com/gutenberg/1/1/4/4/11449/11449-0.txt"), "https://www.gutenberg.org/ebooks/11449");
  assert.equal(stableLink("https://mirrors.xmission.com/gutenberg/4/2/5/5/42557/42557-h/42557-h.htm"), "https://www.gutenberg.org/ebooks/42557");
  assert.equal(stableLink("https://mirrors.xmission.com/gutenberg/0/5/5.txt"), "https://www.gutenberg.org/ebooks/5"); // books under 10 sit in 0/<n>/
});

test("stable addresses pass through unchanged", () => {
  for (const url of ["https://archive.org/details/abc", "https://archive.org/download/abc/abc.pdf", "https://www.gutenberg.org/ebooks/11449",
    "https://scholar.archive.org/work/xyz", "https://web.archive.org/web/2020/https://example.org/", "https://example.org/items/abc"]) assert.equal(stableLink(url), url);
});

test("links that now share an address are folded, keeping held, formats and dates", () => {
  const links = stableLinks([
    { url: "https://archive.org/details/abc", sourceId: "", name: "Internet Archive historic scans", held: false, format: "html", edition: "1877" },
    { url: "https://dn760007.eu.archive.org/0/items/abc/abc.pdf", sourceId: "", name: "dn760007.eu.archive.org", held: true, format: "pdf", edition: "", acquired: "2026-10-05" },
    { url: "https://dn760007.eu.archive.org/0/items/abc/abc_djvu.txt", sourceId: "", name: "dn760007.eu.archive.org", held: true, format: "text", edition: "" },
    { url: "https://archive.org/download/abc/abc.pdf", sourceId: "", name: "archive.org", held: true, format: "pdf" },
  ]);
  assert.deepEqual(links, [
    { url: "https://archive.org/details/abc", sourceId: "", name: "Internet Archive historic scans", held: true, format: "html, pdf, text", edition: "1877", acquired: "2026-10-05" },
    { url: "https://archive.org/download/abc/abc.pdf", sourceId: "", name: "archive.org", held: true, format: "pdf" },
  ]);
});

test("a lone storage link is renamed after its new host", () => {
  assert.deepEqual(stableLinks([{ url: "https://dn790007.ca.archive.org/0/items/x/x.pdf", sourceId: "", name: "dn790007.ca.archive.org", held: true, format: "pdf" }]),
    [{ url: "https://archive.org/details/x", sourceId: "", name: "archive.org", held: true, format: "pdf" }]);
});
