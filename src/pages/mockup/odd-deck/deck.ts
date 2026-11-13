// The Odd one out deck (mock-ups, owner 2026-11-12): every odd one out a player meets becomes a card they keep, with
// one sentence, the book that names it most, how many verses name it, its era, map point or place in the canon, and
// why it was the odd one. Cards are in cards.json (scripts/mockup_odd_deck_cards.py); the deck itself is kept in this
// browser. A first visit is given a small deck from real sets, so the mock-up never opens empty.
import { useSyncExternalStore } from "react";
import { headline, type SetEntry, type SetsFile } from "@/pages/games/odd-one-out/game";
import { PEOPLE_PERIODS } from "@/lib/people-periods";
import cardsFile from "./cards.json";

export type Section = "history" | "poetry" | "prophets" | "gospels" | "acts" | "epistles" | "revelation";
export interface CardData {
  id: string; name: string; href: string; kind: "person" | "place" | "book"; line: string;
  top: { book: string; n: number; sec: Section }; verses: number;
  era?: string; at?: [number, number]; type?: string; canon?: number; chapters?: number; genre?: string;
}
/** One kept card: which card, why it was odd where the player met it, whether they spotted it, and when. */
export interface Kept { id: string; why: string; spotted: boolean; at: number }

const file = cardsFile as unknown as { cards: CardData[]; dots: [number, number][] };
export const CARDS = new Map(file.cards.map((card) => [card.id, card]));
export const MAP_DOTS = file.dots;
export const TOTAL = { person: 0, place: 0, book: 0 };
for (const card of file.cards) TOTAL[card.kind] += 1;
export const ERAS = PEOPLE_PERIODS.filter((period) => period.id !== "");

const KEY = "oo-deck-mockup";
const listeners = new Set<() => void>();
let kept: Kept[] = read();

function read(): Kept[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Kept[]) : [];
    return Array.isArray(list) ? list.filter((entry) => CARDS.has(entry.id)) : [];
  } catch (error) {
    console.warn("Odd one out deck mock-up: could not read the saved deck", error);
    return [];
  }
}

function write(next: Kept[]) {
  kept = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch (error) {
    console.warn("Odd one out deck mock-up: could not save the deck (it stays for this visit)", error);
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const isKept = (id: string) => kept.some((entry) => entry.id === id);
/** The kept cards, newest first. */
export const useDeck = () => useSyncExternalStore(subscribe, () => kept, () => kept);

const whyOf = (data: SetsFile, set: SetEntry) => headline(data, set).oddPhrase;

/** Keep the set's odd one (newest first); meeting a card again keeps the first reason and marks it spotted if it now is. */
export function keep(data: SetsFile, set: SetEntry, spotted: boolean): CardData | undefined {
  const card = CARDS.get(set.odd);
  if (!card) return undefined;
  const before = kept.find((entry) => entry.id === set.odd);
  const entry: Kept = before ? { ...before, spotted: before.spotted || spotted, at: Date.now() }
    : { id: set.odd, why: whyOf(data, set), spotted, at: Date.now() };
  write([entry, ...kept.filter((other) => other.id !== set.odd)]);
  return card;
}

/** A first visit gets twelve cards from real sets, four of each kind, so the mock-up shows a deck at once. */
export function seedOnce(data: SetsFile) {
  if (kept.length > 0) return;
  const picked: Kept[] = [];
  const counts = { person: 0, place: 0, book: 0 };
  for (const set of data.sets) {
    const card = CARDS.get(set.odd);
    if (!card || counts[card.kind] >= 4 || picked.some((entry) => entry.id === card.id)) continue;
    counts[card.kind] += 1;
    picked.push({ id: card.id, why: whyOf(data, set), spotted: picked.length % 3 !== 2, at: Date.now() - picked.length * 3_600_000 });
    if (picked.length === 12) break;
  }
  write(picked);
}

export const kindLabel = (kind: CardData["kind"]) => (kind === "person" ? "Person" : kind === "place" ? "Place" : "Book");
export const eraLabel = (id: string | undefined) => ERAS.find((era) => era.id === id)?.label ?? "Era not given";
