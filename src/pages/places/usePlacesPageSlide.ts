import { useEffect, useRef, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { ATLAS_BASE as BASE } from "./routes";
const ORDER = ["home", "map", "journeys", "cities", "gospels", "early-church", "catholic-orthodox", "reformation", "missions"];
const destination = (pathname: string) => pathname === BASE || pathname === `${BASE}/` ? "home" : pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length + 1).split("/")[0] : undefined;

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
      delete document.documentElement.dataset.placesSlide;
    }
  }, [location.pathname]);
  useEffect(() => () => {
    generation.current++;
    active.current?.transition.skipTransition();
    delete document.documentElement.dataset.placesSlide;
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
    document.documentElement.dataset.placesSlide = ORDER.indexOf(toId) > ORDER.indexOf(fromId) ? "forward" : "backward";
    const transition = doc.startViewTransition(() => {
      if (run !== generation.current) return;
      flushSync(() => navigate(`${to.pathname}${to.search}${to.hash}`));
    });
    active.current = { transition, pathname: to.pathname, run };
    // Skipped transitions reject ready, but navigation still completes.
    void transition.ready.catch(() => undefined);
    void transition.finished.catch(() => undefined).then(() => {
      if (run !== generation.current) return;
      active.current = undefined;
      delete document.documentElement.dataset.placesSlide;
    });
  };
}
