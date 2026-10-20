// "A passage through the manuscripts"'s CONTENT.md (run by scripts/export-pages.ts through study.ts).
// Read from the page's own wording (src/pages/study/passages/evidence.ts) and, for the record count, the same generated
// Manuscripts data the page reads, so the document always matches what a reader sees.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ManuscriptCollection } from "../../src/lib/manuscripts";
import {
  apparatus, cabinet, cases, chapters, editions, endings, heads, hero, intro, kinds, layers, lenses, readingsFor, sources, studies,
} from "../../src/pages/study/passages/evidence";
import { blocks, link, n, table } from "./study-lib";
import type { PageContent } from "./types";

const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
const DATA = path.join(WEBSITE, "data/manuscripts/collection.json");
const ADDRESS = "/study/passage-through-manuscripts";

/** The page's inline emphasis (<em>, <br>, <b>, ...) as Markdown. */
const md = (text: string) => text
  .replace(/<br\s*\/?>/g, " ").replace(/<\/?(em|cite)>/g, "*").replace(/<\/?(b|strong)>/g, "**")
  .replace(/<a href="([^"]+)">([^<]*)<\/a>/g, "[$2]($1)").replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/\*\s+\*/g, " ").trim();

/** "Name (siglum)" for an open record, from the collection when it has been built. */
type Names = Map<string, string>;

function chapterBlock(i: number): string {
  const chapter = chapters[i], study = cases.find((c) => c.id === chapter.caseId);
  if (!study) throw new Error(`passage study extractor: chapter ${chapter.id} names case "${chapter.caseId}", which evidence.ts does not define`);
  const rows = [...readingsFor(study.id, false), ...(study.toggle ? readingsFor(study.id, true) : [])];
  const witnessRows = [...new Map(rows.map((r) => {
    const row = [r.siglum, r.name, r.layer, `${r.before}${r.difference}${r.after ?? ""}`.trim(), r.gloss];
    return [row.join("|"), row] as const;
  })).values()];
  const extra = study.id === "galatians" ? md(apparatus.lead)
    : study.id === "romans" ? `${md(lenses.lead)} The three questions: ${lenses.items.map((l) => l.title).join(" · ")}.`
      : `${md(endings.lead)}`;
  return blocks(
    `## 0${i + 2} ${chapter.kicker} · ${md(chapter.title)}`,
    study.context,
    study.toggle && `The desk's switch, *${study.toggle.label}*: ${study.toggle.off} / ${study.toggle.on}.`,
    table(["Siglum", "Witness", "Layer", "Reading", "English"], witnessRows),
    `*${study.caption}*`,
    `**${chapter.close}.** ${extra}`,
  );
}

/** The passage study's page. The record count needs `bun run manuscripts` to have written data/manuscripts/. */
export function passagePages(): PageContent[] {
  const books = new Set(chapters.map((c) => c.book as number));
  let recordLine = "The record count appears once `bun run manuscripts` has written the Manuscripts data.";
  let names: Names = new Map();
  if (existsSync(DATA)) {
    const data: ManuscriptCollection = JSON.parse(readFileSync(DATA, "utf8"));
    const count = data.records.filter((r) => r.b?.some((b) => books.has(b))).length;
    names = new Map(data.records.map((r) => [r.i, r.g ? `${r.n} (${r.g})` : r.n]));
    recordLine = `${n(count)} open manuscript records hold Galatians, Romans or Mark; every witness named here opens its record sheet.`;
  }
  return [{
    dir: "Study/passage-through-manuscripts",
    title: "A passage through the manuscripts",
    markdown: blocks(
      `**Address:** ${link(ADDRESS)} · study 02 of The Bible: formation & transmission (${link("/study/academic?area=texts")})`,
      `**Heading:** ${hero.words} · *${hero.kicker}*`,
      `## Opening\n\nA passage through *the manuscripts*. ${hero.lead} ${hero.lede} ${recordLine}`,
      `## 01 ${md(heads.prologue.kicker)} · ${md(heads.prologue.title)}\n\n${intro}`,
      table(["Layer", "What it is"], layers),
      ...chapters.map((_, i) => chapterBlock(i)),
      `## 05 ${heads.gaps.kicker} · ${md(heads.gaps.title)}\n\n${heads.gaps.lead}`,
      table(["Kind", "What it tests"], kinds.map((k) => [k.title, k.line])),
      `## 06 ${heads.editions.kicker} · ${md(editions.title)}\n\n${editions.lead}`,
      table(["When", "Step"], editions.steps.map((s) => [s.when, `**${s.title}.** ${s.text}`])),
      `## 07 ${heads.cabinet.kicker} · ${md(heads.cabinet.title)}\n\n${heads.cabinet.lead}`,
      table(["Record", "Why it is here"], cabinet.map((c) => [names.get(c.rec) ?? c.rec, c.role])),
      `## 08 ${heads.close.kicker} · ${md(heads.close.title)}\n\n${studies.map(([href, , title]) => `${title} (${link(href)})`).join(" · ")}`,
      `**Sources:** ${Object.values(sources).map((s) => `[${s.label}](${s.url})`).join(" · ")}`,
    ),
  }];
}
