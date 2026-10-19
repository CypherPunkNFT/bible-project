// The Manuscripts page's CONTENT.md (run by scripts/export-pages.ts through study.ts).
// Read from the same generated data the page reads, so the document always matches what a reader sees.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ManuscriptCollection } from "../../src/lib/manuscripts";
import { KINDS } from "../../src/pages/study/manuscripts/model";
import { blocks, link, n, table } from "./study-lib";
import type { PageContent } from "./types";

const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
const DATA = path.join(WEBSITE, "data/manuscripts/collection.json");
const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

/** The Manuscripts page. Absent until `bun run manuscripts` has written data/manuscripts/. */
export function manuscriptsPages(): PageContent[] {
  if (!existsSync(DATA)) return [];
  const data: ManuscriptCollection = JSON.parse(readFileSync(DATA, "utf8"));
  const C = data.counts;
  const cities = new Set(data.holders.map((h) => h.city)).size;
  return [{
    dir: "Study/manuscripts",
    title: "Manuscripts",
    markdown: blocks(
      `**Address:** ${link("/study/manuscripts")} · the featured card of The Bible: formation & transmission (${link("/study/academic?area=texts")})`,
      `**Built from** this project's own \`Research/Manuscripts/\` corpus by \`scripts/build-manuscripts.py\` on ${data.built}. The all-rights-reserved CSNTM file is never read. Nothing in \`Research/\` is written to by the website build.`,
      `## Opening\n\nManuscripts, *across the centuries*. The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. ${n(C.records)} records · ${n(C.dated)} dated (${pct(C.dated, C.records)}) · ${n(C.gaTotal)} Greek New Testament of about ${n(C.liste.total)} known · ${n(C.holders)} libraries in ${cities} cities · ${C.images} openly licensed pictures.`,
      "## 01 Through time · book by book\n\nOne title, three views on a pill: **Through time** (one lane per tradition from 250 BC to AD 1500, one dot per dated copy; choose a lane to open it across the chart, point at a copy to name it, choose it to open its record), **By book** (66 book tiles, a chapter grid for the chosen book, and its copies oldest first, filtered by Dead Sea Scrolls, Hebrew codices, Greek New Testament or early translations) and **How close** (for each New Testament book, when it was written, as a wide approximate editorial range, and its oldest copy in the open data).",
      `## 02 Where are they now?\n\nA map from Chicago to the Caucasus with ${cities} cities; choosing a city or a holder card slides its panel in with every record kept there, oldest first. ${n(C.placed)} records name a holder the page can place; ${n(C.withHolder - C.placed)} more name one not yet placed.`,
      table(["Holder", "City", "Country", "Records"], [...data.holders].sort((a, b) => b.n - a.n).map((h) => [h.name, h.city, h.country, n(h.n)])),
      "## 03 Every manuscript\n\nThe great witnesses on one sideways shelf (Hebrew Bible, Greek, early translations), then the whole catalogue: a crystal per kind, search, paging and three orders, in two tables on a torn sheet.",
      table(["Kind", "Group", "Records"], KINDS.map((k) => [k.label, k.group, n(C.byKind[k.key] ?? 0)])),
      `## 04 Keep going\n\nThe surviving witnesses (${link("/study/surviving-witnesses")}) · A passage through the manuscripts (${link("/study/passage-through-manuscripts")}) · The Dead Sea Scrolls (${link("/study/dead-sea-scrolls")}) · Has the Bible been changed beyond recognition? (${link("/apologetics/study/manuscripts")}) · Meet the scholars (${link("/teachers/scholars")})`,
      `## 05 Behind the records\n\nPapyri ${pct(C.ga.papyrus, C.liste.papyrus)} · majuscules ${pct(C.ga.majuscule, C.liste.majuscule)} · minuscules ${pct(C.ga.minuscule, C.liste.minuscule)} · lectionaries ${pct(C.ga.lectionary, C.liste.lectionary)} · all Greek New Testament ${pct(C.gaTotal, C.liste.total)} of the approximate Kurzgefasste Liste totals. Only ${n(C.lxxDated)} of ${n(C.byKind.lxx)} Greek Old Testament records carry a date; ${n(C.dssDated)} of ${n(C.byKind.dss)} scroll records do.`,
      "**Sources:** Wikidata (CC0); English Wikipedia (CC BY-SA 4.0); ETCBC Dead Sea Scrolls (CC BY-NC 4.0); Popović et al. 2025 (CC BY 4.0) and Wikipedia's Qumran lists and radiocarbon table (CC BY-SA 4.0) for scroll dates; Syriaca.org (CC BY 3.0); Wikimedia Commons, credited per picture; Natural Earth (public domain).",
      `**Left out, and why:** ${data.excluded.map((x) => `${x.n} (${x.why})`).join("; ")}. Two values are corrected and marked where they appear: the date of Codex Ephraemi and the contents of Codex Vaticanus.`,
    ),
  }];
}
