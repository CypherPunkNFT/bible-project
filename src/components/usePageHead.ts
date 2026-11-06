import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isUnnamed, pageHead, type Translate } from "@/lib/page-head";
import { languageFolder, useSiteLanguage, type LanguageCode } from "@/lib/language";
import { englishOf, phrase, setOwnTitle } from "@/lib/page-translator";

// Names every page for search engines that run it (src/lib/page-head.ts has the rules): the tab title, the description
// and the one official address, in the reader's language. A page that sets document.title itself keeps it (the page
// translator swaps that one). Pages load their content late, and the page translator swaps their words just after
// React draws them, so the head is read again as the page fills in, for a few seconds after each arrival or change of
// language.

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
  const subheading = main?.querySelector("h2")?.innerText ?? "";
  const paragraph = [...(main?.querySelectorAll("p") ?? [])].map((p) => p.innerText.trim()).find((text) => text.length >= 60) ?? "";
  return { heading, subheading, paragraph };
}

/** The language's own wording for page-head.ts's fixed texts, from its phrase list; none in English. */
const translateInto = (language: LanguageCode): Translate | undefined =>
  languageFolder(language) ? (english) => phrase(english, language) : undefined;

/** A title nothing has named yet: the site's own, in English or as the page translator put it into a language. */
const unnamed = (title: string) => isUnnamed(title) || isUnnamed(englishOf(title));

export function usePageHead() {
  const { pathname } = useLocation();
  const language = useSiteLanguage();
  // The last title this hook set, on any page: a page that names nothing must not keep the previous page's name.
  const named = useRef("");
  useEffect(() => {
    const apply = () => {
      const head = pageHead(pathname, shownOnPage(), translateInto(language));
      if (unnamed(document.title) || document.title === named.current) {
        setOwnTitle(head.title);
        named.current = head.title;
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
    // characterData too: the page translator swaps a heading's words in place, after this effect has read them.
    if (main) observer.observe(main, { childList: true, subtree: true, characterData: true });
    const stop = setTimeout(() => observer.disconnect(), WATCH_MS);
    return () => {
      observer.disconnect();
      clearTimeout(stop);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [pathname, language]);
}
