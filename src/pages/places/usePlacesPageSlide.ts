import { useEffect, useRef, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { ATLAS_BASE as BASE } from "./routes";
import { transitionTicker } from "@/components/ticker/transition-clock";
const ORDER = ["home", "map", "journeys", "cities", "gospels", "early-church", "catholic-orthodox", "reformation", "missions"];
const destination = (pathname: string) => pathname === BASE || pathname === `${BASE}/` ? "home" : pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length + 1).split("/")[0] : undefined;

// The owner compared one transition per destination and chose the wipe (Early Church) for all of them (2026-10-06).
const STYLE_BY_DESTINATION: Record<string, string> = Object.fromEntries(ORDER.map((id) => [id, "wipe"]));

const clearSlide = () => {
  const root = document.documentElement;
  delete root.dataset.placesSlide;
  delete root.dataset.placesDirection;
  delete root.dataset.placesMorph;
};

/** Click point and viewport middle, relative to the outgoing content, for transitions that start where you clicked. */
function setOrigin(event: MouseEvent<HTMLDivElement>, link: HTMLAnchorElement) {
  const content = link.closest(".places-page-slide") ?? document.querySelector(".places-page-slide");
  if (!content) return;
  const box = content.getBoundingClientRect();
  const keyboard = event.clientX === 0 && event.clientY === 0;
  const linkBox = link.getBoundingClientRect();
  const x = keyboard ? linkBox.left + linkBox.width / 2 : event.clientX;
  const y = keyboard ? linkBox.top + linkBox.height / 2 : event.clientY;
  const root = document.documentElement.style;
  root.setProperty("--places-ox", `${x - box.left}px`);
  root.setProperty("--places-oy", `${y - box.top}px`);
  root.setProperty("--places-vy", `${window.innerHeight / 2 - box.top}px`);
  return box.top;
}

/** The leaving page is drawn in the arriving page's slot; shift it back to where it was on screen. */
function keepOldInPlace(oldTop: number | undefined) {
  const content = document.querySelector(".places-page-slide");
  if (oldTop === undefined || !content) return;
  document.documentElement.style.setProperty("--places-old-shift", `${oldTop - content.getBoundingClientRect().top}px`);
}

type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => Transition };

/** Snapshot only the content: shared navigation stays still and outgoing routes cannot react to incoming query parameters. */
export function usePlacesPageSlide() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = useRef<{ transition: Transition; pathname: string; run: number }>();
  const generation = useRef(0);

  useEffect(() => {
    // A browser Back/Forward action during the slide supersedes the pending destination.
    if (active.current && active.current.pathname !== location.pathname) {
      generation.current++;
      active.current.transition.skipTransition();
      active.current = undefined;
      clearSlide();
    }
  }, [location.pathname]);
  useEffect(() => () => {
    generation.current++;
    active.current?.transition.skipTransition();
    clearSlide();
  }, []);

  return (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.target || link.hasAttribute("download")) return;
    const to = new URL(link.href);
    if (to.origin !== window.location.origin) return;
    const fromId = destination(location.pathname), toId = destination(to.pathname);
    if (!fromId || !toId || fromId === toId || !ORDER.includes(toId)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const doc = document as TransitionDocument;
    // Unsupported browsers retain normal, immediate link navigation.
    if (!doc.startViewTransition) return;

    event.preventDefault();
    const run = ++generation.current;
    active.current?.transition.skipTransition();
    // Leaving for a destination uses that destination's style; returning home replays the one you came through.
    const styleId = toId === "home" ? fromId : toId;
    const oldTop = setOrigin(event, link);
    document.documentElement.dataset.placesSlide = STYLE_BY_DESTINATION[styleId] ?? "fade";
    document.documentElement.dataset.placesDirection = ORDER.indexOf(toId) > ORDER.indexOf(fromId) ? "forward" : "backward";
    // Cards fold into tiles only to and from the Atlas home; between sub-pages the tile row stays perfectly still.
    if (fromId === "home" || toId === "home") document.documentElement.dataset.placesMorph = "";
    const transition = doc.startViewTransition(() => {
      if (run !== generation.current) return;
      flushSync(() => navigate(`${to.pathname}${to.search}${to.hash}`));
      keepOldInPlace(oldTop);
    });
    active.current = { transition, pathname: to.pathname, run };
    const label = toId === "home" ? "Back to the Atlas" : `Into ${toId} · ${STYLE_BY_DESTINATION[styleId] ?? "fade"}`;
    // Skipped transitions reject ready, but navigation still completes.
    void transition.ready.then(() => transitionTicker.attach(run, label)).catch(() => undefined);
    void transition.finished.catch(() => undefined).then(() => {
      transitionTicker.detach(run);
      if (run !== generation.current) return;
      active.current = undefined;
      clearSlide();
    });
  };
}
