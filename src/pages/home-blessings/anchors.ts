// The public anchors of a blessings page (design 5.1): items by their id (a Scripture item's id is its passage key), stations
// by theirs, and each verse beneath by its permanent passage key. A key already taken on the page gets "-2", "-3".
import { passageKey } from "@/data/sympathy/card-keys";
import type { BlessingPage } from "@/data/home-blessings";

export interface PageAnchors {
  /** One list per item, one id per verse beneath it (empty for older and Scripture items). */
  roots: string[][];
  /** One entry per station: its reading, the verses beneath its prayer and its aside. */
  stations: { reading: string; roots: string[]; aside: string | null }[];
}

export function pageAnchors(page: Pick<BlessingPage, "items" | "stations">): PageAnchors {
  const seen = new Map<string, number>();
  for (const id of [...page.items.map((item) => item.id), ...(page.stations ?? []).map((station) => station.id)]) seen.set(id, 1);
  const next = (key: string) => {
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count === 1 ? key : `${key}-${count}`;
  };
  const roots = page.items.map((item) => (item.kind === "written" || item.kind === "fill-in" ? item.rootedIn.map((passage) => next(passageKey(passage))) : []));
  const stations = (page.stations ?? []).map((station) => ({
    reading: next(passageKey(station.reading)),
    roots: station.rootedIn.map((passage) => next(passageKey(passage))),
    aside: station.aside ? next(passageKey(station.aside)) : null,
  }));
  return { roots, stations };
}

/** Every anchor on the page, for the arrival scroll. */
export function knownAnchors(page: Pick<BlessingPage, "items" | "stations">, anchors: PageAnchors): Set<string> {
  return new Set([
    ...page.items.map((item) => item.id),
    ...(page.stations ?? []).map((station) => station.id),
    ...anchors.roots.flat(),
    ...anchors.stations.flatMap((station) => [station.reading, ...station.roots, ...(station.aside ? [station.aside] : [])]),
  ]);
}

/** The anchor a shared link names, or null for a malformed or unsafe fragment. */
export function sharedAnchor(hash: string): string | null {
  try {
    const key = decodeURIComponent(hash.replace(/^#/, "")).toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) ? key : null;
  } catch (error) {
    console.warn(`home-blessings: the link's anchor "${hash}" could not be read`, error);
    return null;
  }
}
