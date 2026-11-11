import { useEffect } from "react";
import { DEFAULT_TITLE } from "@/lib/page-head";

/**
 * The tab title of a blessings page (design 5.1): its search title plus " · Bible Guide". Leaving the page puts back the
 * default title, so the next page is named afresh. The pattern of the prayers feature's usePrayerHead.
 */
export function useBlessingHead(title: string) {
  useEffect(() => {
    document.title = `${title} · Bible Guide`;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
