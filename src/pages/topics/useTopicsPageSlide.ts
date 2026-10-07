import { useEffect, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

// The Atlas collection's transition (src/pages/places/usePlacesPageSlide.ts), kept separate so the two can change apart:
// the new page wipes in; family cards fold into the tile row on the way in and grow back on the way home.
const BASE = "/topics";
/** 0 = Topics home, 1 = a family, 2 = a topic; -1 = outside the collection. */
const depth = (pathname: string) => pathname === BASE || pathname === `${BASE}/` ? 0 : pathname.startsWith(`${BASE}/c/`) ? 1 : pathname.startsWith(`${BASE}/`) ? 2 : -1;

type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => Transition };

// Module state, so a page remounting inside the transition cannot cancel it.
let generation = 0;
let active: { transition: Transition; pathname: string } | undefined;

const clearSlide = () => {
  const data = document.documentElement.dataset;
  delete data.topicsSlide;
  delete data.topicsDirection;
  delete data.topicsMorph;
  document.body.style.removeProperty("padding-bottom");
};

/** Scroll smoothly until the clicked card sits just under the site header, then continue (immediately if it already does). */
function bringToTop(card: Element, then: () => void) {
  const headerBottom = document.querySelector("header.sticky")?.getBoundingClientRect().bottom ?? 0;
  const offset = card.getBoundingClientRect().top - Math.max(headerBottom, 0) - 16;
  const target = Math.max(0, window.scrollY + offset);
  // A card on the last row can sit below the furthest scroll; lend the page room until the slide clears it.
  const room = target - (document.documentElement.scrollHeight - innerHeight);
  if (room > 0) document.body.style.paddingBottom = `${Math.ceil(room)}px`;
  if (Math.abs(target - window.scrollY) < 8) { then(); return; }
  let done = false;
  const finish = () => { if (done) return; done = true; window.removeEventListener("scrollend", arrived); clearTimeout(timer); then(); };
  // Only a scroll that ends at the target counts (an earlier scroll can still report its end); the timer covers the rest.
  const arrived = () => { if (Math.abs(window.scrollY - target) < 4) finish(); };
  const timer = window.setTimeout(finish, 1200);
  window.addEventListener("scrollend", arrived);
  window.scrollTo({ top: target, behavior: "smooth" });
}

/** The leaving page is drawn in the arriving page's slot; shift it back to where it was on screen. */
function keepOldInPlace(oldTop: number | undefined) {
  const content = document.querySelector(".topics-page-slide");
  if (oldTop === undefined || !content) return;
  document.documentElement.style.setProperty("--topics-old-shift", `${oldTop - content.getBoundingClientRect().top}px`);
}

export function useTopicsPageSlide() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // A browser Back/Forward action during the slide supersedes the pending destination.
    if (active && active.pathname !== location.pathname) {
      generation++;
      active.transition.skipTransition();
      active = undefined;
      clearSlide();
    }
  }, [location.pathname]);

  return (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.target || link.hasAttribute("download")) return;
    const to = new URL(link.href);
    if (to.origin !== window.location.origin || to.pathname === location.pathname) return;
    const from = depth(location.pathname), next = depth(to.pathname);
    if (from < 0 || next < 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const doc = document as TransitionDocument;
    // Unsupported browsers keep normal, immediate link navigation.
    if (!doc.startViewTransition) return;

    event.preventDefault();
    const run = ++generation;
    active?.transition.skipTransition();
    // From the home page, the clicked card first rises to the top, so its fold into the tile row is a short move.
    const card = from === 0 ? link.closest("[data-topics-morph]") : null;
    const fromPath = location.pathname;
    if (card) bringToTop(card, () => {
      if (run === generation && window.location.pathname === fromPath) start(run, to, from, next, doc, navigate);
      else if (run === generation) document.body.style.removeProperty("padding-bottom");
    });
    else start(run, to, from, next, doc, navigate);
  };
}

function start(run: number, to: URL, from: number, next: number, doc: TransitionDocument, navigate: ReturnType<typeof useNavigate>) {
  const oldTop = document.querySelector(".topics-page-slide")?.getBoundingClientRect().top;
  const data = document.documentElement.dataset;
  data.topicsSlide = "wipe";
  data.topicsDirection = next >= from ? "forward" : "backward";
  if (from === 0 || next === 0) data.topicsMorph = "";
  const transition = doc.startViewTransition(() => {
    if (run !== generation) return;
    flushSync(() => navigate(`${to.pathname}${to.search}${to.hash}`));
    keepOldInPlace(oldTop);
  });
  active = { transition, pathname: to.pathname };
  void transition.finished.catch(() => undefined).then(() => {
    if (run !== generation) return;
    active = undefined;
    clearSlide();
  });
}
