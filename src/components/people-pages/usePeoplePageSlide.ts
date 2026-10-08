import { useEffect, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { transitionTicker } from "@/components/ticker/transition-clock";
import { ASPECTS, apostleFor, isApostleEndpoint, isAspect, prophetFor, rulerFor, timeRank, type Aspect } from "@/lib/people-pages-index";
import type { ProphetEra } from "@/data/people-pages/types";

/**
 * The page wipe between a person page and their ruler, apostle or prophet pages, between rulers, apostles or prophets,
 * and from the three guides (the
 * Atlas's Early Church wipe, src/pages/places/usePlacesPageSlide.ts; each collection keeps its own copy so they can
 * change apart). The new page comes in from the side the reader is heading to: later rulers from the right, earlier
 * ones from the left; going back, the old page wipes away. No fades. Shared navigation stays still: only the
 * `.people-page-slide` content takes part.
 *
 * Links that carry router state (the "came from" for the back link) repeat it in `data-state`, because this hook
 * navigates in place of the link (SlideLink.tsx).
 */
type Place = { kind: "person" | "special" | "guide" | "other"; id?: string; aspect?: Aspect };

function placeOf(url: URL): Place {
  const person = /^\/people\/([^/]+)(?:\/([a-z]+))?\/?$/.exec(url.pathname);
  if (person) return isAspect(person[2]) ? { kind: "special", id: person[1], aspect: person[2] } : person[2] ? { kind: "other" }
    : isApostleEndpoint(person[1]) ? { kind: "special", id: person[1], aspect: "mission" } : { kind: "person", id: person[1] };
  const view = url.searchParams.get("view");
  if (url.pathname === "/study/people" && (view === "rulers" || view === "apostles" || view === "prophets")) return { kind: "guide" };
  return { kind: "other" };
}

const ERA_ORDER: ProphetEra[] = ["wilderness", "judges", "united", "divided", "exile", "nt"];
/** A prophet's place in time: the era, then the story order within it. */
const prophetRank = (id: string) => { const p = prophetFor(id); return p ? ERA_ORDER.indexOf(p.era) * 1000 + p.order : 0; };

/** Forward = towards the right: into a special page (along the switch: person, rule, mission, word), to a later ruler,
 *  to the next apostle, to a later prophet. */
function forward(from: Place, to: Place): boolean {
  if (from.kind === "special" && to.kind === "guide") return false;
  if (from.id && from.id === to.id) return to.kind === "special" && (from.kind !== "special" || ASPECTS.indexOf(to.aspect!) > ASPECTS.indexOf(from.aspect!));
  if (from.kind === "special" && to.kind === "special" && from.id && to.id) {
    if (to.aspect === "rule" && from.aspect === "rule") {
      const a = rulerFor(from.id), b = rulerFor(to.id);
      return a && b ? timeRank(b) >= timeRank(a) : true;
    }
    if (to.aspect === "mission" && from.aspect === "mission") return (apostleFor(to.id)?.order ?? 0) >= (apostleFor(from.id)?.order ?? 0);
    if (to.aspect === "word" && from.aspect === "word") return prophetRank(to.id) >= prophetRank(from.id);
  }
  return true;
}

/** Waits until the arriving page marks itself ready (its data and code loaded), so the wipe never shows a loading frame.
 *  Polls on a timer, never requestAnimationFrame: the browser draws no frames while a view transition's update runs,
 *  so a frame-based check never fired and every wipe froze until the browser's 4-second abort (fixed 2026-10-08). */
function arrived(key: string, timeout = 900): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (document.querySelector(`[data-people-ready="${CSS.escape(key)}"]`) || performance.now() - start > timeout) resolve();
      else setTimeout(check, 16);
    };
    check();
  });
}

export const readyKey = (place: { kind: string; id?: string; aspect?: string; view?: string }) => `${place.kind}:${place.id ?? place.view ?? ""}:${place.aspect ?? ""}`;

type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => void | Promise<void>) => Transition };

// Module state, so a page remounting inside the transition cannot cancel it.
let generation = 0;
let active: { transition: Transition; pathname: string } | undefined;

const clearSlide = () => {
  const data = document.documentElement.dataset;
  delete data.peopleSlide;
  delete data.peopleDirection;
};

/** The leaving page is drawn in the arriving page's slot; shift it back to where it was on screen. */
function keepOldInPlace(oldTop: number | undefined) {
  const content = document.querySelector(".people-page-slide");
  if (oldTop === undefined || !content) return;
  document.documentElement.style.setProperty("--people-old-shift", `${oldTop - content.getBoundingClientRect().top}px`);
}

export function usePeoplePageSlide() {
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

  return (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.target || link.hasAttribute("download")) return;
    const to = new URL(link.href);
    const here = new URL(window.location.href);
    if (to.origin !== here.origin || (to.pathname === here.pathname && to.search === here.search)) return;
    const from = placeOf(here), next = placeOf(to);
    // Only journeys that involve a ruler or apostle page wipe; person to person (relatives) stays as it was.
    if (from.kind !== "special" && next.kind !== "special") return;
    if (from.kind === "other" || next.kind === "other") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const doc = document as TransitionDocument;
    if (!doc.startViewTransition) return; // unsupported browsers keep normal, immediate navigation

    event.preventDefault();
    let state: unknown;
    try { state = link.dataset.state ? JSON.parse(link.dataset.state) : undefined; } catch { state = undefined; }
    const run = ++generation;
    active?.transition.skipTransition();
    const oldTop = document.querySelector(".people-page-slide")?.getBoundingClientRect().top;
    const data = document.documentElement.dataset;
    data.peopleSlide = "wipe";
    data.peopleDirection = forward(from, next) ? "forward" : "backward";
    const view = to.searchParams.get("view") ?? undefined;
    const transition = doc.startViewTransition(async () => {
      if (run !== generation) return;
      flushSync(() => navigate(`${to.pathname}${to.search}${to.hash}`, { state }));
      await arrived(readyKey({ ...next, view }));
      keepOldInPlace(oldTop);
    });
    active = { transition, pathname: to.pathname };
    const label = next.kind === "guide" ? "Back to the guide" : `Into ${next.aspect ?? "person"} · wipe`;
    void transition.ready.then(() => transitionTicker.attach(run, label)).catch(() => undefined);
    void transition.finished.catch(() => undefined).then(() => {
      transitionTicker.detach(run);
      if (run !== generation) return;
      active = undefined;
      clearSlide();
    });
  };
}
