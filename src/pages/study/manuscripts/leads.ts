// The plain lines that lead each part of the Manuscripts page (approved mock-up B), and the great witnesses' shelves,
// kept apart from the components so each lead can sit under its section's title.
import type { MsRecord } from "@/lib/manuscripts";
import { byDate, formatNumber, isDated, type MsIndex } from "./model";

export const SHELVES: [string, string, string[]][] = [
  ["Hebrew Bible", "The scrolls and the Masoretic codices", ["Q1343736", "1Qisaa", "Q741305", "Q116790777", "Q637584", "Q4494220", "Q733492"]],
  ["Greek", "Papyri and the great parchment codices", ["Q1165472", "Q1513469", "Q666654", "Q1809813", "Q697885", "Q673569", "Q209285", "Q152962", "Q818305", "Q606424", "Q318233", "Q912605", "Q290500", "Q701032"]],
  ["Early translations", "Syriac, Latin, Gothic, Coptic, Ge'ez and Armenian", ["Q4010239", "Q2590442", "Q3682090", "Q129906", "Q776755", "Q1246486", "Q2567818", "Q5140212", "Q5523330", "Q5332637"]],
];

export function shelves(index: MsIndex) {
  return SHELVES.map(([name, line, ids]) => {
    const list = ids.map((id) => index.byId.get(id)).filter((r): r is MsRecord => {
      if (!r) console.error(`cabinet: a listed witness is missing from the collection (${ids.join(", ")})`);
      return Boolean(r);
    }).sort(byDate);
    return { name, line, list };
  });
}

export const cabinetLead = (index: MsIndex) => {
  const all = shelves(index).flatMap((s) => s.list);
  return `A shelf for each family, oldest first. ${all.filter((r) => r.im).length} cases hold an openly licensed picture; where none is free to use, our own drawing of the form stands in. Choose a case to open its record.`;
};
export const lanesLead = (index: MsIndex) => `${formatNumber(index.data.records.filter(isDated).length)} dated records on one line of time. A copy dated only by century is spread across its century. Choose a tradition to open it across the whole chart; then point at a copy to read it below, and choose it to open the record. Under each name: how many copies have a date and can be placed, of all we hold.`;
export const booksLead = (index: MsIndex) => {
  const holding = index.data.records.filter((r) => r.b?.length).length;
  return `Each tile is a book, darker where more records hold it (scaled within each Testament). Choose one to list its copies, oldest first. ${formatNumber(holding)} records say which books they hold; the ${formatNumber(index.data.counts.lectionaries)} lectionaries hold readings rather than books and are left out.`;
};
export const closenessLead = () => "For each New Testament book: when it was written, as a wide approximate range that holds the main scholarly views, and the oldest copy in the open data that holds it. Most early copies are dated by their handwriting, so their dates are estimates too.";
export const catalogueLead = (index: MsIndex) => `Choose a kind to narrow the list, or search by name, number, library or book. ${formatNumber(index.data.records.length)} records from Wikidata, the ETCBC Dead Sea Scrolls and Syriaca.org.`;
