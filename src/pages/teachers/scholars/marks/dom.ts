// Small browser helpers the Scholars sections share: CSS custom properties as a style, reduced motion, a media query.
import { useEffect, useState, type CSSProperties } from "react";

/** CSS custom properties ("--d", "--tone"…) as a React style. */
export const cssVars = (vars: Record<string, string>): CSSProperties => vars as CSSProperties;

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Whether a media query matches now; re-renders when it flips. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
