import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { groupCitations, publicDomainBasis, publicationYear, readFeatureCitations, type Citation } from "./feature-citations.ts";

const on = (page: string) => ({ feature: "Letters study", page, address: `/study/letters/${page}` });
const cite = (author: string, title: string, year: string, url: string): Citation => ({ id: "x", author, title, year, url });

test("the edition read decides the year", () => {
  assert.equal(publicationYear("367 (trans. 1892)"), 1892);
  assert.equal(publicationYear("1886 (1890 reprint used)"), 1890);
  assert.equal(publicationYear("late 2nd century?"), null);
});

test("public-domain basis is honest about later works", () => {
  assert.match(publicDomainBasis("1915"), /^Public domain in the US/);
  assert.match(publicDomainBasis("1930"), /^Public domain in the US/);
  assert.match(publicDomainBasis("1951"), /may still be in copyright/);
  assert.match(publicDomainBasis(""), /to confirm/);
});

test("the same work under different titles, authors' forms and links becomes one record", () => {
  const works = groupCitations([
    { citation: cite("B. F. Westcott", "The Epistle to the Hebrews: The Greek Text with Notes and Essays (2nd ed.)", "1892", "https://archive.org/a"), on: on("overview") },
    { citation: cite("Brooke Foss Westcott", "The Epistle to the Hebrews: The Greek Text with Notes and Essays (2nd ed.)", "1892", "https://archive.org/a"), on: on("hebrews") },
    { citation: cite("Athanasius, tr. R. Payne-Smith", "Festal Letter 39", "1892", "https://newadvent.org/f"), on: on("hebrews") },
    { citation: cite("Athanasius (trans. R. Payne-Smith, NPNF)", "Festal Letter 39", "1892", "https://ccel.org/f"), on: on("overview") },
    { citation: cite("A. B. Davidson", "The Epistle to the Hebrews", "1882", "https://archive.org/d"), on: on("hebrews") },
  ]);
  assert.equal(works.length, 3);
  const athanasius = works.find((work) => work.author.startsWith("Athanasius"))!;
  assert.deepEqual(athanasius.urls, ["https://ccel.org/f", "https://newadvent.org/f"]);
  assert.deepEqual(athanasius.citedOn.map((c) => c.page).sort(), ["hebrews", "overview"]);
  assert.notEqual(works.find((work) => work.author === "A. B. Davidson")!.id, works.find((work) => work.author.includes("Westcott"))!.id);
});

test("the registered Letters files load and every work is cited somewhere", () => {
  const works = readFeatureCitations(path.resolve(import.meta.dirname, ".."));
  assert.ok(works.length > 50, `expected the Letters works, got ${works.length}`);
  assert.ok(works.every((work) => work.citedOn.length > 0 && work.urls.length > 0));
  assert.equal(new Set(works.map((work) => work.id)).size, works.length, "work ids must be unique");
});

test("different writers on one volume's page, and first and second epistles, stay apart", () => {
  const volume = "https://ccel.org/anf01";
  const works = groupCitations([
    { citation: cite("Clement of Rome (Ante-Nicene Fathers, vol. 1)", "First Epistle to the Corinthians", "1885", volume), on: on("paul") },
    { citation: cite("Ignatius (Ante-Nicene Fathers, vol. 1)", "To the Ephesians", "1885", volume), on: on("paul") },
    { citation: cite("R. Dykes Shaw", "\"Corinthians, First Epistle to the\", International Standard Bible Encyclopedia", "1915", "https://isbe/1"), on: on("paul") },
    { citation: cite("R. Dykes Shaw", "Corinthians, Second Epistle to the", "1915", "https://isbe/2"), on: on("paul") },
    { citation: cite("Eusebius, tr. A. C. McGiffert", "Church History, Book III", "1890", "https://e/3"), on: on("paul") },
    { citation: cite("Eusebius, tr. A. C. McGiffert", "Church History, book 6", "1890", "https://e/6"), on: on("hebrews") },
  ]);
  assert.equal(works.length, 5, works.map((w) => `${w.author} | ${w.title}`).join("\n"));
});
