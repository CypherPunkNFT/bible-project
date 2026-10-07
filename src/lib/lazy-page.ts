import { lazy, type ComponentType } from "react";

// Each page is its own file, named by its content (e.g. MiraclesPage-Bkgdk73n.js). After the site is rebuilt, a tab
// opened earlier still asks for the old names, the server no longer has them, and the page used to go blank. A page
// whose file fails to load now reloads the site once to pick up the new files; a second failure within a minute is
// left to the error boundary (a message with a Reload button) instead of reloading again and again.
const RELOADED_AT = "lazy-page-reloaded-at";
const RETRY_WINDOW_MS = 60_000;

function reloadedRecently(): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOADED_AT) ?? 0) < RETRY_WINDOW_MS;
  } catch {
    return true; // storage blocked: never risk a reload loop
  }
}

function markReload() {
  try {
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    // Storage blocked: reloadedRecently() already says true, so this path is not reached.
  }
}

/** React.lazy for a page file, recovering from a stale build by reloading once. */
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(() => load().catch((error: unknown) => {
    if (reloadedRecently()) throw error;
    markReload();
    window.location.reload();
    return new Promise<{ default: ComponentType<P> }>(() => {}); // the reload replaces the page; nothing renders meanwhile
  }));
}
