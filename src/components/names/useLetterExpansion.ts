import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 900;

/** Expand a stationary name field from its glyph edges, then fold it back. */
export function useLetterExpansion(expanded: boolean, filterId: string, maxRadius = 220) {
  const morphologyRef = useRef<SVGFEMorphologyElement>(null);
  const glyphsRef = useRef<SVGGElement>(null);
  const rectangleRef = useRef<SVGRectElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useLayoutEffect(() => {
    const morphology = morphologyRef.current;
    const glyphs = glyphsRef.current;
    const rectangle = rectangleRef.current;
    const button = buttonRef.current;
    if (!morphology || !glyphs || !rectangle || !button) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = expanded ? 1 : 0;
    const direction = expanded ? 1 : -1;
    let frame: number | null = null;
    let previousTime = performance.now();
    let previousMode: "glyphs" | "morphing" | "rectangle" | undefined;

    const paint = () => {
      const value = progress.current;
      const mode = value === 0 ? "glyphs" : value === 1 ? "rectangle" : "morphing";
      // One eased progress value makes interrupted motion retrace the same edges.
      const eased = (1 - Math.cos(Math.PI * value)) / 2;
      morphology.setAttribute("radius", (maxRadius * eased).toFixed(3));

      if (mode !== previousMode) {
        rectangle.setAttribute("visibility", mode === "rectangle" ? "visible" : "hidden");
        if (mode === "rectangle") {
          // Inner text groups explicitly set visibility, so hide their whole subtree.
          glyphs.setAttribute("display", "none");
        } else {
          glyphs.removeAttribute("display");
        }
        if (mode === "morphing") {
          glyphs.setAttribute("filter", `url(#${filterId})`);
        } else {
          // Both resting states avoid filtering and keep the folded text crisp.
          glyphs.removeAttribute("filter");
        }
        previousMode = mode;
      }

      button.dataset.edgeProgress = String(value);
      button.dataset.edgeState = value === 0 ? "collapsed" : value === 1 ? "expanded" : expanded ? "expanding" : "collapsing";
    };

    const cancelFrame = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    const tick = (time: number) => {
      frame = null;
      const elapsed = Math.max(0, time - previousTime);
      previousTime = time;
      progress.current = Math.max(0, Math.min(1, progress.current + direction * elapsed / DURATION_MS));
      paint();
      if (progress.current !== target) frame = requestAnimationFrame(tick);
    };

    const onMotionPreferenceChange = () => {
      if (!motionPreference.matches) return;
      cancelFrame();
      progress.current = target;
      paint();
    };

    if (motionPreference.matches) progress.current = target;
    paint();
    if (progress.current !== target) frame = requestAnimationFrame(tick);
    motionPreference.addEventListener("change", onMotionPreferenceChange);

    return () => {
      cancelFrame();
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
    };
  }, [expanded, filterId, maxRadius]);

  return { morphologyRef, glyphsRef, rectangleRef, buttonRef };
}
