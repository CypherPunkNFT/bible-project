import { useEffect } from "react";

/** Hold the CSS animations in blocks that are scrolled out of sight.
 *
 * The home page carries about 1,700 animations, over 250 of them looping for ever, and on a page some
 * 9,000px tall nearly all of them sit far outside the window. WebKit keeps drawing every one, which took
 * roughly a quarter of the frame budget and showed as a stutter on whatever was actually on screen.
 * A block wakes 200px before it scrolls in, so nothing is ever caught starting up. */
export function usePauseOffscreen(selector: string): void {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!blocks.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.toggleAttribute("data-still", !entry.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    blocks.forEach((block) => observer.observe(block));
    return () => {
      observer.disconnect();
      blocks.forEach((block) => block.removeAttribute("data-still"));
    };
  }, [selector]);
}
