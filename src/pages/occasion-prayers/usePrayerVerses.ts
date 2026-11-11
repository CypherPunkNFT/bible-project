// The verses beneath an occasion page's prayers, loaded in one go from the Berean files (always "bsb", whatever language
// the site is shown in) through the sympathy loader, then handed back prayer by prayer (design 5.2, 7.2).
import { useMemo } from "react";
import type { Occasion } from "@/data/occasion-prayers";
import type { AsyncState } from "@/lib/useAsync";
import { useSympathyPassages, type ShownSympathy } from "@/pages/sympathy/useSympathyPassages";

export interface PrayerVerses {
  /** One list per prayer, in the page's order. */
  roots: ShownSympathy[][];
  blessing: ShownSympathy | null;
}

export function usePrayerVerses(occasion: Occasion): { state: AsyncState<PrayerVerses>; retry: () => void } {
  const passages = useMemo(
    () => [...occasion.prayers.flatMap((prayer) => prayer.rootedIn), ...(occasion.scriptureBlessing ? [occasion.scriptureBlessing] : [])],
    [occasion],
  );
  const { state, retry } = useSympathyPassages(`prayers:${occasion.slug}`, passages);
  const shaped = useMemo((): AsyncState<PrayerVerses> => {
    if (state.status !== "ready") return state;
    let index = 0;
    const roots = occasion.prayers.map((prayer) => prayer.rootedIn.map(() => state.value[index++]));
    return { status: "ready", value: { roots, blessing: occasion.scriptureBlessing ? state.value[index] : null } };
  }, [state, occasion]);
  return { state: shaped, retry };
}
