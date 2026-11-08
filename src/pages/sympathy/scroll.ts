// Scrolling on the sympathy pages: to the address's #fragment once it is drawn, and to the card maker.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to the address's #fragment once the content it names is on the page (the site has no hash handling of its own). */
export function useScrollToHash(ready: boolean) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.({ block: "start" });
  }, [ready, hash]);
}

/** "Use on card": select the passage in the card maker and scroll there. */
export function scrollToMaker() {
  document.getElementById("card-maker")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}
