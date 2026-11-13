// The Odd one out deck (owner 2026-11-12: tried as a mock-up, approved and put in the game): every odd one out a
// player meets becomes a card they keep, with one sentence, the book that names it most and how many verses name it.
// Cards are in cards.json (scripts/mockup_odd_deck_cards.py); the deck itself is kept in this browser under
// bp-odd-one-out-deck (a deck collected on the mock-up, under its old key, is carried over).
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

const file = cardsFile as unknown as { cards: CardData[] };
export const CARDS = new Map(file.cards.map((card) => [card.id, card]));
export const TOTAL = { person: 0, place: 0, book: 0 };
for (const card of file.cards) TOTAL[card.kind] += 1;
export const ERAS = PEOPLE_PERIODS.filter((period) => period.id !== "");

const KEY = "bp-odd-one-out-deck";
/** Where the mock-up kept the deck before it went into the game: read once when the new key is empty. */
const MOCKUP_KEY = "oo-deck-mockup";
const listeners = new Set<() => void>();
let kept: Kept[] = read();

function read(): Kept[] {
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(MOCKUP_KEY);
    const list = raw ? (JSON.parse(raw) as Kept[]) : [];
    return Array.isArray(list) ? list.filter((entry) => CARDS.has(entry.id)) : [];
  } catch (error) {
    console.warn("Odd one out deck: could not read the saved deck, starting an empty one", error);
    return [];
  }
}

function write(next: Kept[]) {
  kept = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch (error) {
    console.warn("Odd one out deck: could not save the deck (it stays for this visit)", error);
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

export const kindLabel = (kind: CardData["kind"]) => (kind === "person" ? "Person" : kind === "place" ? "Place" : "Book");
export const eraLabel = (id: string | undefined) => ERAS.find((era) => era.id === id)?.label ?? "Era not given";
