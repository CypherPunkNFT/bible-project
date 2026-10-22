// The questions page's filters: read from and written to the address (so a filtered view can be linked), and the
// counts each filter button shows. A button's count is what choosing it would give with every other filter kept, so
// the numbers always match the list.
import { CircleHelp, LayoutGrid, School, ScrollText, type LucideIcon } from "lucide-react";
import type { BankQuestion } from "@/lib/data";

export interface Filters { kind: string; topic: string; testament: string; book: string; collection: string; search: string; choices: boolean }
export type Facet = "kind" | "topic" | "testament" | "book" | "collection";
const FACETS: Facet[] = ["kind", "topic", "testament", "book", "collection"];
const PARAMS: Record<Facet | "search", string> = { kind: "kind", topic: "topic", testament: "t", book: "book", collection: "c", search: "q" };

export function readFilters(params: URLSearchParams): Filters {
  const get = (key: string) => params.get(key) ?? "";
  return { kind: get("kind"), topic: get("topic"), testament: get("t"), book: get("book"), collection: get("c"), search: get("q"), choices: params.get("mc") === "1" };
}

export function writeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of [...FACETS, "search"] as const) if (filters[key]) params.set(PARAMS[key], filters[key]);
  if (filters.choices) params.set("mc", "1");
  return params;
}

export const isFiltered = (f: Filters) => Boolean(f.kind || f.topic || f.testament || f.book || f.collection || f.search || f.choices);

/** One lower-case string per question for search: question, answer, choices, reference, lesson and collection. */
export const haystackOf = (q: BankQuestion) =>
  [q.question, q.answer, ...(q.options ?? []), q.reference ?? "", q.lesson ?? "", q.collection].join(" \u0001 ").toLowerCase();

export const searchTerms = (search: string) => search.toLowerCase().split(/\s+/).filter(Boolean);

const keysOf: Record<Facet, (q: BankQuestion) => string[]> = {
  kind: (q) => [q.kind],
  topic: (q) => [q.topic ?? "none"],
  testament: (q) => [q.testament ?? "none"],
  book: (q) => q.books,
  collection: (q) => [q.collection],
};

export interface Facets { rows: number[]; counts: Record<Facet, Map<string, number>> }

/** The questions that pass every filter, and per filter, how many each of its choices would give. */
export function facetsOf(questions: BankQuestion[], haystacks: string[], f: Filters): Facets {
  const terms = searchTerms(f.search);
  const counts = Object.fromEntries(FACETS.map((facet) => [facet, new Map<string, number>()])) as Record<Facet, Map<string, number>>;
  const rows: number[] = [];
  questions.forEach((q, index) => {
    if (f.choices && !q.options) return;
    if (terms.length && !terms.every((term) => haystacks[index].includes(term))) return;
    const failing = FACETS.filter((facet) => f[facet] && !keysOf[facet](q).includes(f[facet]));
    if (failing.length > 1) return;
    for (const facet of failing.length ? failing : FACETS) {
      for (const key of keysOf[facet](q)) counts[facet].set(key, (counts[facet].get(key) ?? 0) + 1);
    }
    if (!failing.length) rows.push(index);
  });
  return { rows, counts };
}

// The four kind chips, each with the section colour it takes on the page.
export interface Kind { id: string; label: string; note: string; tone: string; Icon: LucideIcon }
export const KINDS: Kind[] = [
  { id: "", label: "Everything", note: "Every question in the bank", tone: "var(--accent)", Icon: LayoutGrid },
  { id: "trivia", label: "Bible quiz", note: "Quick questions, one answer each", tone: "var(--gospels)", Icon: CircleHelp },
  { id: "lesson", label: "Sunday school", note: "Hurlbut's lessons of 1903, story by story", tone: "var(--history)", Icon: School },
  { id: "catechism", label: "Catechism", note: "What Christians believe, question by question", tone: "var(--prophets)", Icon: ScrollText },
];
export const kindTone = (kind: string) => KINDS.find((k) => k.id === kind)?.tone ?? "var(--accent)";

export const LETTERS = "ABCDEF";
