import { useEffect, useRef, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { loadPeople, loadPersonDetail } from "@/lib/study";
import { personIdOf } from "@/lib/people-slugs";
import { preparePeoplePage, preload } from "@/lib/people-pages";
import { isApostleEndpoint } from "@/lib/people-pages-index";
import "@/pages/apologetics-transitions.css";
import "./long-memory-transition.css";

type Transition = { finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => Transition };
const memory = (path: string) => path === "/study/long-memory";
const person = (path: string) => /^\/people\/[^/]+\/?$/.test(path);
const study = (path: string) => path === "/study" || path === "/study/theology" || path === "/study/academic" || path === "/study/people";
const hub = (path: string) => path === "/study" || path === "/study/theology" || path === "/study/academic";
const people = (path: string) => path === "/study/people";
const connected = (a: string, b: string) => (memory(a) && (person(b) || study(b))) || ((person(a) || study(a)) && memory(b)) || (hub(a) && people(b)) || (people(a) && hub(b));
const clear = () => {
  delete document.documentElement.dataset.memoryPageSlide;
  delete document.documentElement.dataset.apSectionSlide;
  document.documentElement.style.removeProperty("--ap-old-shift");
};
async function ready(path: string) {
  const start = performance.now();
  while (performance.now() - start < 1800) {
    const selector = memory(path) ? "[data-memory-ready=true]" : person(path) ? "[data-people-ready]" : "#main .study-experience, #main .study-landing, #main [data-people-ready]";
    if (document.querySelector(selector) || (study(path) && document.querySelector("#main > :not([data-page-loading])"))) return;
    await new Promise(resolve => setTimeout(resolve, 16));
  }
}

/** Shares Worldviews' selected rise motion, without animating the site header. */
export function useLongMemoryTransition() {
  const location = useLocation(), navigate = useNavigate();
  const active = useRef<Transition | null>(null), generation = useRef(0);
  const target = useRef<string | null>(null);
  useEffect(() => {
    if (target.current && target.current !== location.pathname) {
      generation.current++; active.current?.skipTransition(); active.current = null; target.current = null; clear();
    }
  }, [location.pathname]);
  useEffect(() => () => { generation.current++; active.current?.skipTransition(); if (target.current) clear(); }, []);

  return async (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // composedPath also finds the back link inside Moses' shadow root.
    const anchor = event.nativeEvent.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    const to = new URL(anchor.href), here = new URL(window.location.href);
    if (to.origin !== here.origin || !connected(here.pathname, to.pathname)) return;
    event.preventDefault(); event.stopPropagation();
    const run = ++generation.current;
    active.current?.skipTransition(); active.current = null; clear();
    target.current = to.pathname;
    const state = person(here.pathname) ? undefined : {from:{path:here.pathname+here.search+here.hash,label:memory(here.pathname)?"Long Memory":"Study"}};
    if (memory(to.pathname)) await Promise.allSettled([import("@/pages/study/LongMemoryPage")]);
    if (people(to.pathname)) await Promise.allSettled([import("@/pages/study/PeoplePage"), preload("people", loadPeople)]);
    if (person(to.pathname)) {
      const id = personIdOf(to.pathname.split("/")[2]);
      await Promise.allSettled([
        import("@/pages/PersonPage"), preload("people", loadPeople), preload(`person:${id}`, () => loadPersonDetail(id)),
        ...(isApostleEndpoint(id) ? [preparePeoplePage(id,"mission")] : []),
      ]);
    }
    if (run !== generation.current || window.location.pathname !== here.pathname) return;
    const update = () => flushSync(() => navigate(to.pathname+to.search+to.hash,{state}));
    const doc = document as TransitionDocument;
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { target.current = null; update(); return; }
    const oldTop = document.getElementById("main")?.getBoundingClientRect().top;
    document.documentElement.dataset.memoryPageSlide = "true";
    document.documentElement.dataset.apSectionSlide = "3";
    const transition = doc.startViewTransition(async () => {
      if (run !== generation.current) return;
      update(); await ready(to.pathname);
      const newTop = document.getElementById("main")?.getBoundingClientRect().top;
      if (oldTop !== undefined && newTop !== undefined) document.documentElement.style.setProperty("--ap-old-shift",`${oldTop-newTop}px`);
    });
    active.current = transition;
    void transition.finished.catch(() => undefined).then(() => {
      if (run !== generation.current) return;
      active.current = null; target.current = null; clear();
    });
  };
}
