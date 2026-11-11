import { useEffect } from "react";
import { DEFAULT_TITLE } from "@/lib/page-head";

/**
 * The tab title of an occasion page (design 5.1): its search title plus " · Bible Guide", which usePageHead keeps because
 * the page names itself. Leaving the page puts back the default title, so the next page is named afresh. Copied from the
 * "when you're…" head hook without its no-referrer policy, which belongs to that feature's quick exit.
 */
export function usePrayerHead(title: string) {
  useEffect(() => {
    document.title = `${title} · Bible Guide`;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
