// Every verse a blessings page shows, loaded in one go from the Berean files (always "bsb", whatever language the site is
// shown in) through the sympathy loader, then looked up by the passage it was asked for (design 2.6, 9.1).
import { useMemo } from "react";
import type { BlessingPage } from "@/data/home-blessings";
import type { SympathyPassage } from "@/data/sympathy";
import type { AsyncState } from "@/lib/useAsync";
import { useSympathyPassages, type ShownSympathy } from "@/pages/sympathy/useSympathyPassages";

export type ShownVerses = Map<SympathyPassage, ShownSympathy>;

/** Every passage on the page, in page order, each once. */
export function pagePassages(page: BlessingPage): SympathyPassage[] {
  const all: SympathyPassage[] = [];
  for (const item of page.items) {
    if (item.kind === "scripture") all.push(item.passage);
    if (item.kind === "written" || item.kind === "fill-in") all.push(...item.rootedIn);
  }
  for (const station of page.stations ?? []) all.push(station.reading, ...station.rootedIn, ...(station.aside ? [station.aside] : []));
  return [...new Set(all)];
}

export function useBlessingVerses(page: BlessingPage): { state: AsyncState<ShownVerses>; retry: () => void } {
  const passages = useMemo(() => pagePassages(page), [page]);
  const { state, retry } = useSympathyPassages(`blessings:${page.slug}`, passages);
  const shaped = useMemo((): AsyncState<ShownVerses> => {
    if (state.status !== "ready") return state;
    return { status: "ready", value: new Map(passages.map((passage, index) => [passage, state.value[index]])) };
  }, [state, passages]);
  return { state: shaped, retry };
}
