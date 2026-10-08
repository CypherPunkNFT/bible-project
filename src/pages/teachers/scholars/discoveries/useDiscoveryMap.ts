// The discoveries section's moving parts, kept out of React's render: the two map stages (Holy Land & Sinai, and the
// wider map) flying their cameras in requestAnimationFrame, the crossfade between them, and the list that chooses the
// card under its reading line as it is scrolled. React re-renders only when the chosen find or the map changes.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Find } from "@/data/teachers/pages-types";
import { VIEWS, type DiscoveryModel, type View } from "./model";
import { convertCam, reducedMotion, type Cam, type Projection } from "./projection";
import { MapStage, placeEdge, type MarkerSpec } from "./stage";

const overviewCam = (stage: MapStage, model: DiscoveryModel, view: View): Cam => {
  const points = model.finds.map((f) => model.data.views[view].points[`find:${f.id}`]).filter(Boolean);
  return stage.fit(points, 40, view === "med" ? 300 : 90);
};
/** Sit the chosen place a little left of centre so its name, to the right, has room. */
const findCam = (model: DiscoveryModel, find: Find, view: View): Cam => {
  const p = model.data.views[view].points[`find:${find.id}`], w = view === "med" ? 300 : find.id === "sinaiticus" ? 420 : 250;
  return { x: p[0] + w * 0.14, y: p[1], w };
};
export const viewOf = (model: DiscoveryModel, find: Find): View => (model.inHoly.has(find.id) ? "holyland" : "med");

export function useDiscoveryMap(model: DiscoveryModel, projections: Record<View, Projection>, markers: Record<View, MarkerSpec[]>) {
  const stagesEl = useRef<HTMLDivElement>(null), edgeRef = useRef<HTMLButtonElement>(null);
  const stages = useRef<Record<View, MapStage> | null>(null);
  const modeRef = useRef<View>("holyland");
  const [mode, setMode] = useState<View>("holyland");

  useLayoutEffect(() => {
    const host = stagesEl.current;
    if (!host) return;
    const make = (view: View) => {
      const el = host.querySelector<HTMLElement>(`.dsc-stage[data-view="${view}"]`);
      if (!el) throw new Error(`Discoveries map: the ${view} stage was not drawn`);
      return new MapStage(el, model.data.views[view], markers[view], view === "med" ? 120 : 90);
    };
    const made: Record<View, MapStage> = { holyland: make("holyland"), med: make("med") };
    const edgeFind = model.edgeFind;
    if (edgeFind) {
      const target = projections.holyland.project(edgeFind.where[2], edgeFind.where[1]);
      made.holyland.onRender = (stage) => { if (edgeRef.current && modeRef.current === "holyland") placeEdge(stage, edgeRef.current, target); };
    }
    for (const view of VIEWS) made[view].jump(overviewCam(made[view], model, view));
    stages.current = made;
    return () => { for (const view of VIEWS) made[view].destroy(); stages.current = null; };
  }, [model, projections, markers]);

  // The edge marker is shown again when the Holy Land map returns: place it once it is visible.
  useLayoutEffect(() => { stages.current?.holyland.render(); }, [mode]);

  const goTo = useCallback((next: View, camFor: (stage: MapStage) => Cam) => {
    const all = stages.current;
    if (!all) return;
    if (next !== modeRef.current) {
      all[next].jump(convertCam(projections, modeRef.current, next, all[modeRef.current].cam));
      modeRef.current = next;
      setMode(next);
    }
    all[next].fly(camFor(all[next]));
  }, [projections]);

  /** Fly to a find (on whichever map holds it), or back to all of them. */
  const show = useCallback((find: Find | null) => {
    for (const view of VIEWS) stages.current?.[view].setActive(find?.id ?? null);
    if (!find) goTo("holyland", (stage) => overviewCam(stage, model, "holyland"));
    else { const view = viewOf(model, find); goTo(view, () => findCam(model, find, view)); }
  }, [goTo, model]);

  const switchMap = useCallback((view: View) => {
    if (view !== modeRef.current) goTo(view, (stage) => overviewCam(stage, model, view));
  }, [goTo, model]);

  return { stagesEl, edgeRef, mode, show, switchMap };
}

/** The finds list: scrolling it makes the card under the reading line (a third of the way down, or the middle across on a
 *  phone) the chosen one; choosing a card scrolls it into place. A spacer after the last card lets it reach that line. */
export function useListFollow(onPick: (index: number) => void) {
  const listRef = useRef<HTMLDivElement>(null), endRef = useRef<HTMLDivElement>(null), programmatic = useRef(Number.NEGATIVE_INFINITY);
  const pickRef = useRef(onPick);
  useLayoutEffect(() => { pickRef.current = onPick; }, [onPick]);

  useEffect(() => {
    const list = listRef.current, end = endRef.current;
    if (!list || !end) return;
    const cards = () => [...list.querySelectorAll<HTMLElement>(".dsc-find")];
    const horizontal = () => getComputedStyle(list).flexDirection === "row";
    let pending = false, frame = 0;
    const onScroll = () => {
      if (pending || performance.now() - programmatic.current < 900) return;
      pending = true;
      frame = requestAnimationFrame(() => {
        pending = false;
        const h = horizontal(), line = h ? list.scrollLeft + list.clientWidth / 2 : list.scrollTop + Math.min(140, list.clientHeight * 0.3);
        let best = 0;
        cards().forEach((card, n) => { if ((h ? card.offsetLeft : card.offsetTop) <= line) best = n; });
        pickRef.current(best);
      });
    };
    const fitEnd = () => {
      const last = cards().at(-1);
      end.style.height = horizontal() || !last ? "" : `${Math.max(0, list.clientHeight - last.offsetHeight - 40)}px`;
    };
    const observer = new ResizeObserver(fitEnd);
    observer.observe(list);
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => { list.removeEventListener("scroll", onScroll); observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  const scrollToCard = useCallback((index: number) => {
    const list = listRef.current, card = list?.querySelectorAll<HTMLElement>(".dsc-find")[index];
    if (!list || !card) return;
    programmatic.current = performance.now();
    const behavior: ScrollBehavior = reducedMotion() ? "auto" : "smooth";
    if (getComputedStyle(list).flexDirection === "row") list.scrollTo({ left: card.offsetLeft - list.clientWidth / 2 + card.offsetWidth / 2, behavior });
    else list.scrollTo({ top: card.offsetTop - 14, behavior });
  }, []);

  return { listRef, endRef, scrollToCard };
}
