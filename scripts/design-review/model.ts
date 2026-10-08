// The design review inventory's model: a page TYPE (template) has variants (the same design rendered differently by
// kind or data shape); each variant lists every page it covers (its records) and the rules that pick its samples.
// Samples are picked by rule from the data, never by hand, and each says why it was picked.
import { readFileSync } from "node:fs";
import path from "node:path";
import { WEBSITE } from "./sources.ts";

export interface SampleRule<R> {
  id: string;
  label: string;
  pick: (records: R[]) => R | undefined;
  why: (record: R) => string;
}

export interface VariantDef<R = unknown> {
  id: string;
  name: string;
  what: string;
  records: R[];
  url: (record: R) => string;
  samples: SampleRule<R>[];
  /** Which of the records the machine checks open. Default: all of them. */
  checkRecords?: R[];
  coverage?: string;
}

export interface TemplateDef {
  id: string;
  area: string;
  name: string;
  what: string;
  address: string;
  /** Entry files and the folders that belong to this page type (for "Changed since accepted"). */
  entries: string[];
  scopes: string[];
  /** The section that makes this page type what it is: cropped on its own in the screenshots. */
  signature?: { selector: string; label: string };
  /** Total pages of this type, when the variants (which may overlap) do not add up to it. */
  instances?: number;
  variants: VariantDef<never>[];
}

export const AREAS = [
  { id: "people", title: "People" },
  { id: "study", title: "Study" },
  { id: "atlas", title: "Atlas" },
  { id: "topics", title: "Topics" },
  { id: "reader", title: "Bible reader" },
  { id: "letters", title: "Letters" },
  { id: "apologetics", title: "Apologetics" },
  { id: "testimonies", title: "Testimonies" },
  { id: "site", title: "Site" },
];

export function readJson<T>(relative: string): T {
  const file = path.join(WEBSITE, relative);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new Error(`design review: could not read ${relative} (${String(error)}); is the site's data built (bun run data)?`);
  }
}

/** A variant over records, typed at the call site, stored untyped in the template list. */
export const variant = <R>(def: VariantDef<R>) => def as unknown as VariantDef<never>;
/** A one-page variant (a one-off page, or one view of a page). */
export const single = (id: string, name: string, what: string, url: string): VariantDef<never> =>
  variant({ id, name, what, records: [url], url: (u: string) => u, samples: [{ id: "page", label: "The page", pick: (rs) => rs[0], why: () => "the only page of this design" }] });

const quote = (text: string) => `"${text.length > 70 ? text.slice(0, 67) + "…" : text}"`;
const byNumber = <R>(records: R[], measure: (r: R) => number) => [...records].sort((a, b) => measure(a) - measure(b));

/** The record in the middle by `measure`: the ordinary case. */
export const typical = <R>(measure: (r: R) => number, name: (r: R) => string, word: string): SampleRule<R> => ({
  id: "typical", label: "Typical",
  pick: (rs) => byNumber(rs, measure)[Math.floor(rs.length / 2)],
  why: (r) => `typical: ${name(r)}, in the middle of all of them by ${word}`,
});

export const longestText = <R>(id: string, label: string, text: (r: R) => string, word: string): SampleRule<R> => ({
  id, label,
  pick: (rs) => byNumber(rs, (r) => text(r).length).at(-1),
  why: (r) => `longest ${word}: ${quote(text(r))} (${text(r).length} characters)`,
});

export const most = <R>(id: string, label: string, measure: (r: R) => number, name: (r: R) => string, word: string): SampleRule<R> => ({
  id, label,
  pick: (rs) => byNumber(rs, measure).at(-1),
  why: (r) => `most ${word}: ${name(r)} (${measure(r).toLocaleString("en-US")})`,
});

export const fewest = <R>(id: string, label: string, measure: (r: R) => number, name: (r: R) => string, word: string): SampleRule<R> => ({
  id, label,
  pick: (rs) => byNumber(rs, measure)[0],
  why: (r) => `fewest ${word}: ${name(r)} (${measure(r).toLocaleString("en-US")}), a near-empty page`,
});

export const firstOf = <R>(name: (r: R) => string, word: string): SampleRule<R> => ({
  id: "first", label: "First",
  pick: (rs) => rs[0],
  why: (r) => `the first ${word}: ${name(r)}`,
});

/** Distinct samples only: when two rules pick the same page, the later one is dropped. */
export function pickSamples<R>(def: VariantDef<R>) {
  const seen = new Set<string>();
  const out: { id: string; label: string; url: string; why: string }[] = [];
  // 2–3 samples a design: the owner reviews dozens of screens, not hundreds. Small designs need fewer.
  const limit = def.records.length <= 6 ? 2 : 3;
  for (const rule of def.samples) {
    if (out.length >= limit) break;
    const record = rule.pick(def.records);
    if (record === undefined) continue;
    const url = def.url(record);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ id: rule.id, label: rule.label, url, why: rule.why(record) });
  }
  return out;
}
