import { createElement, type ReactNode } from "react";
import type { Flow, KeyWord, Letter, MapLayer, Timeline } from "@/data/letters/types";
import { ART } from "./art";
import { GROUP_KEYS, type LettersData } from "./data";

/** "AD 40–150", or "Not dated" when the sources give no date. */
export const dates = (l: Letter) => (l.date.from ? `AD ${l.date.from}${l.date.to && l.date.to !== l.date.from ? `–${l.date.to}` : ""}` : "Not dated");

const KIND_TONES: Record<string, string> = { teaching: "prophets", practice: "poetry", personal: "acts", praise: "epistles", defence: "history", appeal: "acts", "church order": "gospels",
  charge: "revelation", answer: "prophets", worship: "epistles", encouragement: "poetry", correction: "history", warning: "revelation", prayer: "gospels" };
/** The colour of an outline part by what it does (teaching, practice, warning…). */
export const kindTone = (kind?: string) => `var(--${(kind && KIND_TONES[kind]) || "epistles"})`;

// ── The line drawings: static SVG markup (art.ts) turned into React elements once, by name ─────
const drawn = new Map<string, ReactNode>();
const reactName = (name: string) => (name === "class" ? "className" : name.startsWith("aria-") || name.startsWith("data-") ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
function toReact(node: Element, key: number): ReactNode {
  const props: Record<string, unknown> = { key };
  for (const attr of Array.from(node.attributes)) {
    props[reactName(attr.name)] = attr.name === "style" ? Object.fromEntries(attr.value.split(";").filter(Boolean).map((rule) => { const [k, ...v] = rule.split(":"); return [reactName(k.trim()), v.join(":").trim()]; })) : attr.value;
  }
  const children = Array.from(node.childNodes).map((child, i) => (child.nodeType === 1 ? toReact(child as Element, i) : child.textContent));
  return createElement(node.tagName, props, ...children);
}
/** A drawing's elements, parsed from its markup the first time it is asked for. */
export function drawing(name: string): ReactNode {
  if (!drawn.has(name)) {
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${ART[name] ?? ""}</svg>`, "image/svg+xml");
    drawn.set(name, Array.from(doc.documentElement.children).map((child, i) => toReact(child, i)));
  }
  return drawn.get(name);
}

// ── Charts that combine the four collections ─────────────────────────────────────────────
const GROUP_NAME = { paul: "Paul's letters", hebrews: "Hebrews", general: "James, Peter & Jude", john: "The letters of John" } as const;

export function allLettersTimeline(data: LettersData): Timeline {
  return { id: "all-letters", title: "When the letters were written", axis: "years",
    events: data.letters.filter((l) => l.date.from && l.date.to).map((l) => ({ label: l.name, from: l.date.from!, to: l.date.to!, letter: l.code })),
    claim: { text: "Each bar spans the widest range of dates the sources propose. No letter states its own date; 2 John and 3 John have no proposed date in these sources." } };
}

export function destinationLayers(data: LettersData): MapLayer[] {
  const ids = { paul: "letter-destinations", hebrews: "destinations", general: "first-peter-provinces", john: "ephesus" } as const;
  return GROUP_KEYS.flatMap((k) => data.groups[k].maps.filter((m) => m.id === ids[k]).map((m) => ({ ...m, id: `${k}-${m.id}`, title: GROUP_NAME[k] })));
}

/** Each of Paul's letters as a two-stop route, from where it was written to where it went. */
export function travelLayers(data: LettersData): MapLayer[] {
  const maps = data.groups.paul.maps, from = maps.find((m) => m.id === "written-from"), to = maps.find((m) => m.id === "letter-destinations");
  if (!from || !to) return [];
  return data.groups.paul.letters.flatMap((l) => {
    const a = from.stops.find((s) => s.letter === l.code), b = to.stops.find((s) => s.letter === l.code);
    return a && b ? [{ id: `travel-${l.code}`, title: l.name, route: true, stops: [a, b], claim: { text: `${l.name}: from ${a.name} to ${b.name}.` } }] : [];
  });
}

export function allFlow(data: LettersData): Flow {
  const links = GROUP_KEYS.flatMap((k) => (data.groups[k].flows.find((f) => f.id === "ot-sources")?.links ?? []).map((l) => ({ ...l, target: data.groups[k].title })));
  const merged = new Map<string, Flow["links"][number]>();
  for (const l of links) {
    const key = `${l.source}→${l.target}`, p = merged.get(key);
    merged.set(key, p ? { ...p, value: p.value + l.value, refs: [...(p.refs ?? []), ...(l.refs ?? [])] } : l);
  }
  return { id: "all-ot", title: "The Old Testament behind the letters", links: [...merged.values()],
    claim: { text: "Every Old Testament passage the letters quote, traced from the book it comes from to the letters that quote it. The Psalms, Isaiah and the books of Moses carry most of the weight. John's letters quote no Old Testament passage; their one band is 1 John's allusion to Cain (Genesis 4:8)." } };
}

/** Each collection's words summed by Strong's number, one column per collection; optionally only words several share. */
export function groupWordColumns(data: LettersData, minGroups = 1): { letters: Letter[]; columns: Record<string, string[]> } {
  const sums = GROUP_KEYS.map((k) => {
    const m = new Map<string, KeyWord>();
    for (const w of data.groups[k].letters.flatMap((l) => l.words)) { const p = m.get(w.strongs); m.set(w.strongs, p ? { ...p, count: p.count + w.count } : { ...w, byChapter: undefined, note: undefined }); }
    return [k, m] as const;
  });
  const shared = (s: string) => sums.filter(([, m]) => m.has(s)).length >= minGroups;
  const letters = sums.map(([k, m]) => ({ ...data.groups[k].letters[0], code: k, name: data.groups[k].title, words: [...m.values()].filter((w) => shared(w.strongs)) }));
  return { letters, columns: Object.fromEntries(GROUP_KEYS.map((k) => [k, data.groups[k].letters.map((l) => l.code)])) };
}
