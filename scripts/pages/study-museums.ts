// Museum-Grade Archaeology's CONTENT.md (run by scripts/export-pages.ts through study.ts).
// Read from the same generated data the pages read, so the document always matches what a reader sees.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { blocks, link, table } from "./study-lib";
import type { PageContent } from "./types";

const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
const INDEX = path.join(WEBSITE, "data/museums/index.json");

interface Card { slug: string; name: string; place: string; group: string; state: string; records: number; listed: number; photographs: number; catalogue_rows: number }
interface Index { generated: string; counts: Record<string, number>; cards: Card[]; other_holders: { name: string; records: number }[] }

const GROUPS: [string, string][] = [
  ["collections", "Open collections these records came from"],
  ["holders", "Institutions these records name as the holder"],
  ["coming-soon", "Not yet held"],
];

/** The museum pages. Absent until `npm run museums` has written data/museums/. */
export function museumPages(): PageContent[] {
  if (!existsSync(INDEX)) return [];
  const index: Index = JSON.parse(readFileSync(INDEX, "utf8"));
  const counts = index.counts;
  return [{
    dir: "Study/museum-archaeology",
    title: "Museum-Grade Archaeology",
    markdown: blocks(
      `**Address:** ${link("/study/museum-archaeology")} · one page per collection at ${link("/study/museum-archaeology/british-museum")} and the rest`,
      `**Built from** this project's own \`Research/Artifacts/\` corpus, retrieved ${index.generated}, by \`scripts/build-museums.py\`. Nothing in \`Research/\` is written to by the website build.`,
      `## What it holds\n\n${counts.cards} cards · ${counts.records_in_corpus.toLocaleString()} records read · ${counts.photographs} openly licensed photographs · ${counts.catalogue_rows_matched} of ${counts.catalogue_rows} archaeology catalogue rows matched · ${counts.institutions_recorded} institutions named as holders.`,
      "## Two kinds of card, never added together\n\nThe collections are where the records were fetched from; the holders are the institutions those same records name. One tablet is both a catalogue record and a British Museum object, so a total across the page would count most of the corpus twice.",
      ...GROUPS.map(([group, heading]) => {
        const cards = index.cards.filter((card) => card.group === group);
        return cards.length === 0 ? "" : blocks(
          `### ${heading}`,
          table(
            ["Collection", "Where", "Records held", "Listed", "Photographs", "Catalogue rows", "Address"],
            cards.map((card) => [
              card.name,
              card.place,
              card.state === "coming-soon" ? "Coming soon" : card.records.toLocaleString(),
              card.state === "coming-soon" ? "—" : card.listed,
              card.photographs || "—",
              card.catalogue_rows || "—",
              link(`/study/museum-archaeology/${card.slug}`),
            ]),
          ),
        );
      }),
      `## Named, but with no page here\n\n${index.other_holders.length} further institutions and private collections are named as holders inside the cuneiform catalogues. The page lists them with their record counts and no page of their own, because we hold catalogue rows about their objects and nothing fetched from the institutions themselves.`,
      "## What is never shown\n\nAn image whose licence is absent or not open, and an image under an attribution licence whose photographer the source did not record. Every photograph carries its own licence and credit, because the licences differ record by record.",
    ),
  }];
}
