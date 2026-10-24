import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isUnnamed, pageHead } from "@/lib/page-head";

// Names every page for search engines that run it (src/lib/page-head.ts has the rules): the tab title, the description
// and the one official address. A page that sets document.title itself keeps it. Pages load their content late, so the
// head is read again as the page fills in, for a few seconds after each arrival.

const WATCH_MS = 6000;

function setMeta(selector: string, create: () => HTMLElement, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
}

function shownOnPage() {
  const main = document.getElementById("main");
  const heading = main?.querySelector("h1")?.innerText ?? "";
  const paragraph = [...(main?.querySelectorAll("p") ?? [])].map((p) => p.innerText.trim()).find((text) => text.length >= 60) ?? "";
  return { heading, paragraph };
}

export function usePageHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    let named = "";
    const apply = () => {
      const head = pageHead(pathname, shownOnPage());
      if (isUnnamed(document.title) || document.title === named) {
        document.title = head.title;
        named = head.title;
      }
      setMeta('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" }), "content", head.description);
      setMeta('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", head.canonical);
    };
    apply();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (timer === undefined) timer = setTimeout(() => { timer = undefined; apply(); }, 250);
    });
    const main = document.getElementById("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    const stop = setTimeout(() => observer.disconnect(), WATCH_MS);
    return () => {
      observer.disconnect();
      clearTimeout(stop);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [pathname]);
}
