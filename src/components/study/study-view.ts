import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "react-router-dom";
import { transitionTicker } from "@/components/ticker/transition-clock";
import { STUDY_SECTIONS } from "@/data/study-sections";
import type { StudyCollectionId } from "@/data/study-collections";
import "./study-transitions.css";

/**
 * One section of a study at a time. The cards at the top choose it; the first section is shown until
 * one is chosen. Switching plays a view transition in the study's own "brush", so each study can be compared.
 */
export const STUDY_BRUSH: Record<StudyCollectionId, string> = {
  references: "wipe", structure: "rise", gospels: "reveal", versions: "blur",
  people: "wipe", places: "fade", miracles: "zoom", letters: "turn", names: "fade",
};

/** Sections shown on the study's own page (cards with `to` open another page instead). */
export const studyTabs = (collection: StudyCollectionId) => STUDY_SECTIONS[collection].filter((item) => !item.to).map((item) => item.id);

/**
 * A study's opening view when no card is chosen, if it is not simply the first card: Letters opens on an overview of
 * all 21 letters below its four cards.
 */
export const STUDY_HOME: Partial<Record<StudyCollectionId, string>> = { letters: "letters-overview" };

// Anchors inside a section that should open it (miracle groups, harmony events).
function resolveAnchor(collection: StudyCollectionId, anchor: string): string | undefined {
  const tabs = studyTabs(collection);
  if (tabs.includes(anchor) || anchor === STUDY_HOME[collection]) return anchor;
  if (collection === "miracles" && anchor.startsWith("who-")) return "other-miracles";
  if (collection === "gospels" && anchor.startsWith("event-")) return "harmony";
  return undefined;
}

const selected = new Map<StudyCollectionId, string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

function current(collection: StudyCollectionId) {
  const tabs = studyTabs(collection);
  return selected.get(collection) ?? resolveAnchor(collection, window.location.hash.slice(1)) ?? STUDY_HOME[collection] ?? tabs[0] ?? "";
}

/** The section shown for this study; follows in-page anchors such as #who-elijah or #event-12. */
export function useStudyView(collection: StudyCollectionId) {
  const location = useLocation();
  const view = useSyncExternalStore(subscribe, () => current(collection));
  useEffect(() => {
    const id = resolveAnchor(collection, location.hash.slice(1));
    if (id && id !== current(collection)) { selected.set(collection, id); emit(); }
  }, [collection, location.key, location.hash]);
  return view;
}

/** Leaving a study forgets its choice, so the next visit opens on the first section again. */
export function useForgetStudyViewOnLeave(collection: StudyCollectionId) {
  useEffect(() => () => { selected.delete(collection); }, [collection]);
}

type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => Transition };
let runs = 0;
let active: Transition | undefined;

const clearSlide = () => {
  const root = document.documentElement;
  delete root.dataset.studySlide;
  delete root.dataset.studyDirection;
};

/** Run `update` (a section change) inside the study's transition, starting from the clicked card. */
export function runStudyTransition(collection: StudyCollectionId, forward: boolean, click: { x: number; y: number } | undefined, label: string, update: () => void) {
  const doc = document as TransitionDocument;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  active?.skipTransition();
  const run = ++runs;
  const root = document.documentElement;
  const panel = document.querySelector("[data-study-panel]")?.getBoundingClientRect();
  if (panel && click) {
    root.style.setProperty("--study-ox", `${click.x - panel.left}px`);
    root.style.setProperty("--study-oy", `${click.y - panel.top}px`);
  }
  root.dataset.studySlide = STUDY_BRUSH[collection];
  root.dataset.studyDirection = forward ? "forward" : "backward";
  const transition = doc.startViewTransition(() => flushSync(update));
  active = transition;
  void transition.ready.then(() => transitionTicker.attach(run, `${label} · ${STUDY_BRUSH[collection]}`)).catch(() => undefined);
  void transition.finished.catch(() => undefined).then(() => {
    transitionTicker.detach(run);
    if (run !== runs) return;
    active = undefined;
    clearSlide();
  });
}

/** Choose a section: swap it in with the study's transition and keep the address shareable. */
export function selectStudySection(collection: StudyCollectionId, id: string, click?: { x: number; y: number }) {
  const from = current(collection);
  if (from === id) { window.history.replaceState(window.history.state, "", `#${id}`); return; }
  const tabs = studyTabs(collection);
  // A home view is not a card (index -1), so leaving it plays forward and returning to it plays backward.
  runStudyTransition(collection, tabs.indexOf(id) > tabs.indexOf(from), click, `Study · ${id}`, () => {
    selected.set(collection, id);
    emit();
    // replaceState, not navigate: the page's own anchor handling would scroll away from the cards.
    window.history.replaceState(window.history.state, "", `#${id}`);
  });
}
