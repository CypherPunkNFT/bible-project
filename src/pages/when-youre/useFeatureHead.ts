import { useEffect } from "react";
import { DEFAULT_TITLE } from "@/lib/page-head";

/**
 * Route-local head policy (design 5.1, 6.6, 7.1): a topic page names itself with its search title (usePageHead keeps a
 * title a page sets), an unknown address marks itself noindex, and a no-referrer policy covers the quick exit while the
 * feature is mounted. Cleanup leaves the title unnamed so the next page is named afresh, and restores the prior policy.
 */
export function useFeatureHead(title: string | null, unknown = false) {
  useEffect(() => {
    if (title) document.title = `${title} · Bible Guide`;
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]');
    const oldPolicy = existing?.content;
    const policy = existing ?? Object.assign(document.createElement("meta"), { name: "referrer" });
    policy.content = "no-referrer";
    if (!existing) document.head.append(policy);
    const robots = unknown ? Object.assign(document.createElement("meta"), { name: "robots", content: "noindex" }) : null;
    if (robots) document.head.append(robots);
    return () => {
      if (title) document.title = DEFAULT_TITLE;
      if (existing) existing.content = oldPolicy ?? "";
      else policy.remove();
      robots?.remove();
    };
  }, [title, unknown]);
}
