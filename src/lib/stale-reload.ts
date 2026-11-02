/**
 * After a release the old code files are gone, so a tab opened before it fails the first time it opens a page it has
 * not loaded yet. One automatic reload fixes that; a second failure on the same page within RETRY_MS shows the error
 * instead of reloading forever.
 */
export const STALE_CODE = /dynamically imported module|Importing a module script failed|Unable to preload|Failed to fetch/i;
export const RELOAD_KEY = "bible-guide-reloaded-for-update";
export const RETRY_MS = 30_000;

/** `stored` is what remember() wrote last time ("path|time"), or null. */
export function mayReload(stored: string | null, path: string, now: number): boolean {
  if (!stored) return true;
  const cut = stored.lastIndexOf("|");
  const last = stored.slice(0, cut), at = Number(stored.slice(cut + 1));
  return last !== path || !(now - at < RETRY_MS);
}

export const remember = (path: string, now: number) => `${path}|${now}`;
