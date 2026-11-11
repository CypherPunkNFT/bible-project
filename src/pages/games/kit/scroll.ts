// Scroll to the top when the screen changes (the audits' shared fault 4: seven games open a new screen where the old
// one's button was, so on a phone the new puzzle sits above the top of the screen). Skips the first mount, so the
// router's own scroll restoration and a saved game's return are left alone, and only moves when the key changes.
import { useEffect, useRef, type RefObject } from "react";
import { hasWindow } from "./env";

/** Scrolls the page (or `scroller`, for a game that plays in its own full-screen layer) to the top each time `key`
 * changes: pass the screen's name, the round number, or anything that is new when a new screen opens. */
export function useScrollTopOn(key: unknown, scroller?: RefObject<HTMLElement | null>): void {
  const previous = useRef(key);
  useEffect(() => {
    if (Object.is(previous.current, key)) return;
    previous.current = key;
    if (!hasWindow()) return;
    const target = scroller?.current;
    if (target) target.scrollTo?.({ top: 0, behavior: "auto" });
    else window.scrollTo?.({ top: 0, behavior: "auto" });
  }, [key, scroller]);
}
