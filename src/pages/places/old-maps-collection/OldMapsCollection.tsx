import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./old-maps-collection.css";

// /study/atlas/old-maps: the merged design the owner approved on 2026-10-19 (mock-up: design/old-maps-directions, ?d=d).
// The sections are plain-DOM modules ported from that mock-up; this component only mounts them (in their own chunk,
// so the 1,093-map data loads only on this page) and removes them again on the way out.

export function OldMapsCollection() {
  const page = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const root = page.current;
    if (!root) return;
    let unmount: (() => void) | undefined;
    let cancelled = false;
    import("./index.js").then(({ mountOldMaps }) => {
      if (!cancelled) unmount = mountOldMaps(root, (to) => navigateRef.current(to));
    }).catch((error) => console.error("Old maps: the page could not be loaded", error));
    return () => { cancelled = true; unmount?.(); };
  }, []);

  return <div className="om-island om-view-d"><div ref={page} className="om-page" /></div>;
}
