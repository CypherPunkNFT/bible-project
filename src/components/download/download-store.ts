// The one download running on the site and its panel's state (see download.ts).

/** A task still running after this long shows the panel. */
export const SHOW_AFTER_MS = 400;
/** How long "Done" stays up. */
export const DONE_FOR_MS = 1600;

export interface ActiveDownload { id: number; label: string; percent: number | null; phase: "running" | "done"; visible: boolean }

let active: ActiveDownload | null = null;
const listeners = new Set<() => void>();
export const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const snapshot = () => active;
export function setActive(next: ActiveDownload | null) { active = next; listeners.forEach(listener => listener()); }
export const downloadBusy = () => active?.phase === "running";
