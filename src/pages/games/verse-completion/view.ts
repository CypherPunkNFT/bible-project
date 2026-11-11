// Verse completion: the small pure rules behind the redesigned screens (docs/visual-audits/verse-completion-redesign.md):
// a card's mark on the progress trail, the stars' share for the round's title, and which words in a typed result were
// shown by a hint. Nothing here changes scoring; it only decides what is drawn.
import type { TrailMark } from "../kit/trail";
import type { Mark } from "./match";
import type { Done } from "./storage";

/** One answered card on the trail: three stars right, one or two part, none (or skipped) wrong. */
export const trailMarkFor = (done: Done): Exclude<TrailMark, "empty" | "current"> =>
  done.status === "skipped" || done.stars === 0 ? "wrong" : done.stars === 3 ? "right" : "part";

/** The round's trail: every dealt card, the ones played marked, the next one current until the round is over. */
export function roundTrail(done: readonly Done[], total: number): TrailMark[] {
  return Array.from({ length: Math.max(total, done.length) }, (_, i) =>
    done[i] ? trailMarkFor(done[i]) : i === done.length ? "current" : "empty");
}

/** True when every answered card earned three stars (and at least one card was answered): the confetti moment. */
export const perfectRound = (done: readonly Done[]): boolean => {
  const answered = done.filter((card) => card.status === "answered");
  return answered.length > 0 && answered.every((card) => card.stars === 3);
};

/** The delay before hidden word `i` lands in its gap, in ms: a tenth of a second each, never more than 1.8 s in total
 * so a thirty-word Hard result finishes while the eye is still on it. */
export const landDelayMs = (i: number): number => Math.min(i * 100, 1800);

/** How a result mark is drawn: a hinted word is "shown", whatever the matcher wrote against it. */
export type Shown = Mark["verdict"] | "shown";
export const shownVerdict = (mark: Mark, index: number, hinted: ReadonlySet<number> | undefined): Shown =>
  hinted?.has(index) ? "shown" : mark.verdict;

/** How many of the dashes a typed answer has reached so far: one per typed word, never past the hidden count. */
export const typedReach = (typed: string, hiddenCount: number): number =>
  Math.min(hiddenCount, typed.trim() ? typed.trim().split(/\s+/).length : 0);

/** True when a key press belongs to something else, so the 1, 2, 3 word keys leave it alone: a form field, or an open
 * dialog (the Leave round confirm). */
export function keyIsTaken(target: EventTarget | null): boolean {
  if (typeof document !== "undefined" && document.querySelector("dialog[open]")) return true;
  return typeof Element !== "undefined" && target instanceof Element && target.closest("input, textarea, select, [contenteditable=true]") !== null;
}
