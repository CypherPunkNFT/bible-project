import { useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from "react-router-dom";
import "./site-page-transitions.css";

const ownedFlags = ["apSectionSlide", "memoryPageSlide", "studySlide", "teacherSlide", "resourceSlide", "placesSlide", "peopleSlide", "topicsSlide"];
type Transition = { finished: Promise<void>; skipTransition: () => void };
type TransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => Transition };

/** One default for router links AND programmatic navigation; preserves router state and options. */
export function PageTransitions({ children }: { children: ReactNode }) {
  const context = useContext(NavigationContext);
  const location = useLocation();
  const active = useRef<Transition>();
  const target = useRef<string>();
  const generation = useRef(0);
  const navigator = useMemo(() => {
    const original = context.navigator;
    const wrap = (method: "push" | "replace"): typeof original.push => (...args) => {
      const to = new URL(original.createHref(args[0]), window.location.href);
      const from = window.location.pathname;
      const doc = document as TransitionDocument;
      if (to.pathname === from || from.startsWith("/apologetics") || to.pathname.startsWith("/apologetics") ||
          !document.getElementById("main") || !doc.startViewTransition ||
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          ownedFlags.some(flag => document.documentElement.dataset[flag] !== undefined)) {
        original[method](...args); return;
      }
      const run = ++generation.current;
      active.current?.skipTransition();
      target.current = to.pathname;
      const root = document.documentElement;
      root.dataset.sitePageSlide = "true";
      const oldTop = document.getElementById("main")!.getBoundingClientRect().top;
      const transition = doc.startViewTransition(async () => {
        if (run !== generation.current) return;
        flushSync(() => original[method](...args));
        // Native transitions suppress animation frames while this callback runs.
        // Wait on timers for lazy route content, never requestAnimationFrame.
        const start = performance.now();
        do {
          await new Promise(resolve => setTimeout(resolve, 32));
          if (run !== generation.current) return;
        } while (document.querySelector("#main [data-page-loading]") && performance.now() - start < 2500);
        const newTop = document.getElementById("main")?.getBoundingClientRect().top ?? oldTop;
        root.style.setProperty("--site-old-shift", `${oldTop - newTop}px`);
      });
      active.current = transition;
      void transition.finished.catch(() => undefined).then(() => {
        if (run !== generation.current) return;
        active.current = undefined; target.current = undefined;
        delete root.dataset.sitePageSlide;
        root.style.removeProperty("--site-old-shift");
      });
    };
    return { ...original, push: wrap("push"), replace: wrap("replace") };
  }, [context.navigator]);
  useEffect(() => {
    if (active.current && target.current !== location.pathname) {
      generation.current++; active.current.skipTransition(); active.current = undefined; target.current = undefined;
      delete document.documentElement.dataset.sitePageSlide;
      document.documentElement.style.removeProperty("--site-old-shift");
    }
  }, [location.pathname]);
  useEffect(() => () => {
    generation.current++; active.current?.skipTransition();
    delete document.documentElement.dataset.sitePageSlide;
    document.documentElement.style.removeProperty("--site-old-shift");
  }, []);
  return <NavigationContext.Provider value={{ ...context, navigator }}>{children}</NavigationContext.Provider>;
}
