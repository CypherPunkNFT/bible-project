// What the picker's address may hold (design 1, 8, 9): the occasion (`o`) and the list (`list`), nothing else and nothing
// typed. Anyone can write a link, so both are checked: an occasion must be one the picker has, a list key must name a
// passage it has, each once, at most MAX_LIST of them. Pure functions; the page reads them on every render.
import { occasionBySlug, placeByKey, type Occasion } from "@/data/occasion-verses";

export const MAX_LIST = 30;
/** Longer than 30 of the longest keys; anything past it is cut before splitting. */
const MAX_RAW = 1500;

/** The keys of a ?list= value: known passages only (aliases resolved), each once, in the order given, at most MAX_LIST. */
export function readList(raw: string | null): string[] {
  const keys: string[] = [];
  for (const part of (raw ?? "").slice(0, MAX_RAW).split(",")) {
    const place = placeByKey(part);
    if (place && !keys.includes(place.key)) keys.push(place.key);
    if (keys.length === MAX_LIST) break;
  }
  return keys;
}

export interface PickerAddress { occasion: Occasion | undefined; keys: string[] }

export function readAddress(params: URLSearchParams): PickerAddress {
  return { occasion: occasionBySlug(params.get("o")), keys: readList(params.get("list")) };
}

/** The query for an occasion and a list, written by hand so the commas stay commas (keys hold only a-z, 0-9 and "-"). */
export function writeAddress({ occasion, keys }: PickerAddress): string {
  const parts = [occasion ? `o=${occasion.slug}` : "", keys.length ? `list=${keys.join(",")}` : ""].filter(Boolean);
  return parts.length ? `?${parts.join("&")}` : "";
}

/** True when the address holds anything the picker would drop (an unknown occasion, unknown or repeated keys, other parameters). */
export function needsCleaning(search: string, address: PickerAddress): boolean {
  return search.replace(/^\?/, "") !== writeAddress(address).replace(/^\?/, "");
}

/** The list with one key added at the end or taken out. */
export const toggleKey = (keys: string[], key: string): string[] =>
  keys.includes(key) ? keys.filter((item) => item !== key) : keys.length >= MAX_LIST ? keys : [...keys, key];

/** The list with one key moved one place up (-1) or down (1); unchanged at either end. */
export function moveKey(keys: string[], key: string, step: -1 | 1): string[] {
  const index = keys.indexOf(key);
  const target = index + step;
  if (index < 0 || target < 0 || target >= keys.length) return keys;
  const next = [...keys];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
