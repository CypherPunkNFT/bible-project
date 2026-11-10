// Bible twenty questions: the plain functions and words the screens share, kept apart from the components so the
// page's fast refresh keeps working. Answer words, a person's address, the lazily loaded verse notes, where a player's
// answers differ from the notes (design §10.2), the name search (§10.1) and the question sections (§9.2).
import { useEffect, useState } from "react";
import { split, type Answer, type Engine, type ReverseAnswer, type TqPerson, type Turn } from "./engine";

const SHOWN = 8;

export const ANSWER_WORDS: Record<Answer, string> = { y: "Yes", n: "No", d: "Don't know" };

export const personHref = (person: TqPerson) => `/people/${person.slug || person.id}`;

/** refs[person id][tag id] = verse id, for the "why" of a value; null until loaded, or when it failed (never blocks). */
export type EvidenceRefs = Record<string, Record<string, number>>;
let evidence: Promise<{ version: string; refs: EvidenceRefs }> | null = null;

export function useEvidence(version: string): EvidenceRefs | null {
  const [refs, setRefs] = useState<EvidenceRefs | null>(null);
  useEffect(() => {
    let live = true;
    evidence ??= import("@/data/twenty-questions/twenty-questions-evidence.json").then((m) => m.default as unknown as { version: string; refs: EvidenceRefs });
    evidence.then((file) => { if (live) setRefs(file.version === version ? file.refs : {}); }).catch((error: unknown) => {
      evidence = null; // a later screen may try again
      console.warn("Twenty questions: the verse notes did not load; references are left out:", error);
    });
    return () => { live = false; };
  }, [version]);
  return refs;
}

export interface Difference { tag: number; answer: "y" | "n"; note: "y" | "n" }

/** Every yes or no answer that contradicts the person's true value; unsure, n/a and "Don't know" never do. */
export function differences(engine: Engine, person: number, turns: readonly Turn[]): Difference[] {
  const letters = engine.data.people[person].v;
  return turns.flatMap((t) => {
    if (t.kind !== "q" || t.answer === "d") return [];
    const letter = letters[t.tag].toLowerCase();
    return (letter === "y" || letter === "n") && letter !== t.answer ? [{ tag: t.tag, answer: t.answer, note: letter }] : [];
  });
}

export const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Pool members matching the search: a name that starts with it before one that only contains it, then tier, then fame. */
export function searchPool(engine: Engine, query: string): number[] {
  const q = fold(query);
  if (!q) return [];
  const scored: { p: number; score: number }[] = [];
  engine.data.people.forEach((person, p) => {
    const names = [person.label, ...person.also].map(fold);
    const score = names.some((n) => n.startsWith(q) || n.includes(` ${q}`)) ? 0 : names.some((n) => n.includes(q)) ? 1 : -1;
    if (score >= 0) scored.push({ p, score: score * 1000 + (person.t - 1) * 500 + person.f });
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, SHOWN).map((s) => s.p);
}

export const GROUPS: [string, string][] = [["who", "Who"], ["when", "When"], ["role", "Role"], ["family", "Family and people"],
  ["story", "Story"], ["places", "Places"], ["books", "Books"]];
export const REVERSE_WORDS: Record<ReverseAnswer, string> = { yes: "Yes", no: "No", unknown: "The Bible doesn't say", na: "That doesn't really apply" };

/** How evenly a question splits the people: 1 for half and half, 0 when everyone would answer the same. */
export function evenness(engine: Engine, people: readonly number[], tag: number): number {
  const [yes, no] = split(engine, engine.truth, people, tag);
  return yes + no ? (2 * Math.min(yes, no)) / (yes + no) : 0;
}
