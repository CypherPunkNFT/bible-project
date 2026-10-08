import type { ReadingPlace } from "./data";

/**
 * The reader's place, carried from one apostle page to the next when they switch with the counter: the section at the
 * top of the window and how far into it. Kept only briefly, so a later visit never jumps.
 */
let carried: ReadingPlace | null = null;
export const rememberPlace = (place: ReadingPlace | null) => { carried = place; };
export function takePlace(): ReadingPlace | null {
  const place = carried;
  carried = null;
  return place && Date.now() - place.at < 4000 ? place : null;
}
