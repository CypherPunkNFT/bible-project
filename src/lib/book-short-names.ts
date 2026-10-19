/** Short book names for narrow screens (the reader toolbar on a phone). Books not listed keep their full name. */
const SHORT_NAMES: Record<string, string> = {
  DEU: "Deut",
  "1CH": "1 Chron",
  "2CH": "2 Chron",
  ECC: "Eccles",
  SNG: "Song",
  LAM: "Lam",
  "1CO": "1 Cor",
  "2CO": "2 Cor",
  PHP: "Phil",
  COL: "Col",
  "1TH": "1 Thess",
  "2TH": "2 Thess",
  REV: "Rev",
  ESG: "Esther (Gk)",
  WIS: "Wisdom",
  LJE: "Ep Jer",
  S3Y: "Song of Three",
  BEL: "Bel",
  MAN: "Pr Man",
  "1MA": "1 Macc",
  "2MA": "2 Macc",
  "3MA": "3 Macc",
  "4MA": "4 Macc",
  DAG: "Daniel (Gk)",
};

export function shortBookName(code: string, name: string): string {
  return SHORT_NAMES[code] ?? name;
}
