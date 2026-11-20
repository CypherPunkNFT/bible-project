// A part of a page that mounts only when it comes near the screen (within 300px), then stays mounted for the visit. Until
// then it holds an empty placeholder of about its height, so the page does not jump. First written for the Teachers
// subpages' maps and source diagrams (pages/teachers/shared/Frame.tsx); shared on 2026-11-19 so the Hymns page's
// sections and the homepage's "Close to home" map wait too (a 4x-throttled phone spent 7 s drawing all of Hymns at once).
// Where the browser has no IntersectionObserver it mounts at once. `eager` mounts it now (a jump link to it or past it).
import { useEffect, useRef, useState, type ReactNode } from "react";

export function DeferredSection({ children, className, minHeight = "min(800px, 90vh)", eager = false }: {
  children: ReactNode;
  className?: string;
  /** The placeholder's height until it mounts: about the height of what it will hold. */
  minHeight?: string;
  eager?: boolean;
}) {
  const [ready, setReady] = useState(eager), ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (eager) setReady(true); }, [eager]);
  useEffect(() => {
    if (ready || !ref.current) return;
    if (!("IntersectionObserver" in window)) { setReady(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "300px 0px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ready]);
  // `eager` shows it in this very render, so a jump made right after finds it drawn; the effect above keeps it mounted.
  const shown = ready || eager;
  return <div ref={ref} className={className} data-deferred={!shown || undefined} style={!shown ? { minHeight } : undefined}>{shown ? children : null}</div>;
}
