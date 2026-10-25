// /people_mockup/moses (local preview only): Moses's real page with section 03 rebuilt as "Around him": the people
// around him and his connections joined into one section, by category and relationship (MosesAround.tsx).
// The real page draws inside its own shadow root; once it says it is ready (data-people-ready), the old section's
// content is hidden and the new one is drawn in its place, so the page's own code is left as it is.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCachedLoad } from "@/lib/people-pages";
import { loadPeople, loadPersonDetail } from "@/lib/study";
import MosesPage from "@/components/moses-page/MosesPage";
import { MosesAround } from "./MosesAround";
import fieldStyles from "./connections.css?inline";
import styles from "./moses-connected.css?inline";

const MOSES = "moses-exo-2-10";

/** Hide section 03's own content, add a slot for the new one, and rename its dot in the side rail. */
function takeOverSection(shadow: ShadowRoot): HTMLElement | undefined {
  const section = shadow.querySelector<HTMLElement>("#mg-people");
  if (!section || section.querySelector(".cx-slot")) return undefined;
  for (const child of section.children) (child as HTMLElement).style.display = "none";
  section.setAttribute("aria-label", "Around him");
  const rail = shadow.querySelector('[data-rail="mg-people"] span');
  if (rail) rail.textContent = "Around him";
  const slot = document.createElement("div");
  slot.className = "cx-slot";
  const style = document.createElement("style");
  style.textContent = fieldStyles + styles;
  slot.append(style);
  section.append(slot);
  return slot;
}

export default function MosesConnectedMockup() {
  const people = useCachedLoad("people", loadPeople);
  const detail = useCachedLoad(`person:${MOSES}`, () => loadPersonDetail(MOSES));
  const outer = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement>();
  const row = people.status === "ready" ? people.value.find((p) => p.id === MOSES) : undefined;
  // One person object for the page's life: a new one would make the Moses page draw itself again (and drop the section).
  const record = detail.status === "ready" ? detail.value : undefined;
  const person = useMemo(() => (row && record ? { ...row, ...record } : undefined), [row, record]);
  const loaded = Boolean(person);

  // Each time the page (re)draws, take section 03 over again.
  useEffect(() => {
    const element = outer.current;
    if (!element) return;
    const place = () => {
      const shadow = element.querySelector<HTMLElement>("[data-people-ready]")?.shadowRoot;
      const next = shadow && takeOverSection(shadow);
      if (next) setSlot(next);
    };
    const watch = new MutationObserver(place);
    watch.observe(element, { subtree: true, attributes: true, attributeFilter: ["data-people-ready"] });
    place();
    return () => watch.disconnect();
  }, [loaded]);

  if (people.status === "error" || detail.status === "error") return <p className="mx-auto max-w-7xl p-6">Moses’ page could not be loaded.</p>;
  if (!person) return <div className="min-h-[60vh] animate-pulse" role="status" aria-label="Loading Moses" />;
  return <div ref={outer}>
    <MosesPage person={person} />
    {slot?.isConnected && createPortal(<MosesAround />, slot)}
  </div>;
}
