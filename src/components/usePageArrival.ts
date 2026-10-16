import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const transitionFlags = ["sitePageSlide", "apSectionSlide", "memoryPageSlide", "studySlide", "teacherSlide", "resourceSlide", "placesSlide", "peopleSlide", "topicsSlide"];

/** Default arrival for routes without a section-owned transition. Navigation stays with the router. */
export function usePageArrival() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    const from = previous.current;
    previous.current = pathname;
    if (from.startsWith("/apologetics") || pathname.startsWith("/apologetics")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main");
    if (!main) return;
    const owned = () => transitionFlags.some(flag => document.documentElement.dataset[flag] !== undefined);
    if (owned()) return;
    let animation: Animation | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const start = performance.now();
    const arrive = () => {
      if (owned()) return;
      // Wait for a lazy route to replace its loading screen before starting the motion.
      if (main.querySelector("[data-page-loading]") && performance.now() - start < 5000) {
        timer = setTimeout(arrive, 32);
        return;
      }
      animation = main.animate(
        [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 440, easing: "cubic-bezier(.22,1,.36,1)", id: "standard-page-arrival" },
      );
    };
    // Let section-level layout effects claim their own transition first.
    timer = setTimeout(arrive, 0);
    return () => { clearTimeout(timer); animation?.cancel(); };
  }, [pathname]);
}
