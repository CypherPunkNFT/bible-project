// Shared pieces of a hub's doors (HubDoors.tsx), kept apart from the component so fast refresh keeps working.
import type { ReactNode } from "react";

/** The chosen door: the one named by the search parameter, or null (none chosen: the hub shows every category). */
export function selectedDoor<K extends string>(value: string | null, keys: readonly K[]): K | null {
  return keys.find((key) => key === value) ?? null;
}

/** The frame every door drawing shares: a 200 x 215 box, strokes in currentColor (the door's tone), two faint rings. */
export const doorFrame = (figure: ReactNode) => <svg viewBox="0 0 200 215" className="hub-door-art" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
  <circle cx="100" cy="108" r="78" opacity=".18" /><circle cx="100" cy="108" r="60" opacity=".32" />{figure}
</svg>;
