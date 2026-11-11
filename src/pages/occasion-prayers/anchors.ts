// The public anchors of an occasion page (design 5.1): prayers by their id, the older prayer by "older-prayer", and each
// verse by its permanent passage key. A verse that roots two prayers on one page gets "-2" on its second appearance.
import { passageKey } from "@/data/sympathy/card-keys";
import type { Occasion } from "@/data/occasion-prayers";

export interface PageAnchors {
  /** One list per prayer, one id per verse beneath it. */
  roots: string[][];
  /** The closing page's blessing from Scripture, if any. */
  blessing: string | null;
}

export function pageAnchors(occasion: Pick<Occasion, "prayers" | "scriptureBlessing">): PageAnchors {
  const seen = new Map<string, number>();
  const next = (key: string) => {
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count === 1 ? key : `${key}-${count}`;
  };
  const roots = occasion.prayers.map((prayer) => prayer.rootedIn.map((passage) => next(passageKey(passage))));
  return { roots, blessing: occasion.scriptureBlessing ? next(passageKey(occasion.scriptureBlessing)) : null };
}

/** The anchor a shared link names, or null for a malformed or unsafe fragment. */
export function sharedAnchor(hash: string): string | null {
  try {
    const key = decodeURIComponent(hash.replace(/^#/, "")).toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) ? key : null;
  } catch {
    return null;
  }
}
