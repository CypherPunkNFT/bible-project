// Family charades: small pure helpers behind the redesigned screens (docs/visual-audits/charades-redesign.md), kept
// out of the component files so they can be tested on their own.
import type { Scene } from "./deck";

const SAMPLE_IDS = ["noah-builds-ark", "david-goliath", "jonah-fish", "lions-den"];

/** The scenes the start screen's sample card shows in turn: four well-known ones, filled from short titles if the file lacks any. */
export function sampleTitles(scenes: readonly Scene[]): string[] {
  const picks = SAMPLE_IDS.map((id) => scenes.find((s) => s.id === id)?.title).filter((t): t is string => !!t);
  const fill = scenes.filter((s) => s.title.length <= 22 && !picks.includes(s.title)).slice(0, 4 - picks.length).map((s) => s.title);
  return [...picks, ...fill].slice(0, 4);
}

/** How long each sample title stays before the next slides in. */
export const SAMPLE_MS = 3600;

/** The recap bar's two shares: the score and the best, each against the larger of the two (0 to 1). */
export function bestShares(score: number, best: number): { score: number; best: number } {
  const top = Math.max(score, best, 1);
  return { score: Math.max(0, score) / top, best: Math.max(0, best) / top };
}
