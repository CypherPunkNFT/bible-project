// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { SongPassage, SongPlacedRef } from "@/lib/hymns";
export const numeralStyle = (label: string) => (label.length > 3 ? { fontSize: `${(4.4 / (0.47 * label.length)).toFixed(2)}rem`, top: ".2rem" } : undefined);

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII",
  "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];

export const readerUrl = (p: SongPassage) =>
  `/read/kjv/${p.code}/${p.chapter}?hl=${p.verses[0].n}${p.verses.length > 1 ? `-${p.verses[p.verses.length - 1].n}` : ""}`;

export const placedUrl = (r: SongPlacedRef) => `/read/kjv/${r.code}/${r.chapter}${r.whole ? "" : `?hl=${r.ref.split(":")[1].replace("–", "-")}`}`;
