// Exact author credits from the shared feature evidence. These are source labels, not reconciled people.
export interface SourceUse { page: string; address: string; locator: string; evidence: string }
export interface SourceRecord { id: string; author: string; title: string; year: string | number; url: string; kind: "data" | "citation" | "bibliography"; uses: SourceUse[] }
export interface SourceFeature { id: string; label: string; sources: SourceRecord[] }
export interface CreditRecord extends SourceRecord { featureId: string; featureLabel: string }
export interface AuthorCredit { name: string; records: CreditRecord[]; pages: number; areas: number }
export type CreditSort = "pages" | "name";

export function buildCredits(features: SourceFeature[]): AuthorCredit[] {
  const groups = new Map<string, CreditRecord[]>();
  for (const feature of features) for (const source of feature.sources) {
    const records = groups.get(source.author) ?? [];
    records.push({ ...source, featureId: feature.id, featureLabel: feature.label });
    groups.set(source.author, records);
  }
  return [...groups].map(([name, records]) => ({ name, records,
    // Different content pages sometimes share one route; count the actual content files.
    pages: new Set(records.flatMap(r => r.uses.map(u => u.evidence))).size,
    areas: new Set(records.map(r => r.featureId)).size,
  }));
}

export function selectCredits(features: SourceFeature[], query: string, area: string, sort: CreditSort): AuthorCredit[] {
  const credits = buildCredits(area ? features.filter(f => f.id === area) : features);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return credits.filter(c => {
    const text = `${c.name} ${c.records.map(r => r.title).join(" ")}`.toLocaleLowerCase();
    return words.every(w => text.includes(w));
  }).sort((a, b) => (sort === "pages" ? b.pages - a.pages || b.areas - a.areas : 0) || a.name.localeCompare(b.name));
}

/** Present one destination per content page while retaining all distinct locators. */
export function groupUses(uses: SourceUse[]): SourceUse[] {
  const pages = new Map<string, { use: SourceUse; locators: Set<string> }>();
  for (const use of uses) {
    const key = `${use.evidence}|${use.address}|${use.page}`;
    const page = pages.get(key) ?? { use, locators: new Set<string>() };
    if (use.locator) page.locators.add(use.locator);
    pages.set(key, page);
  }
  return [...pages.values()].map(({ use, locators }) => ({ ...use, locator: [...locators].join("; ") }));
}
