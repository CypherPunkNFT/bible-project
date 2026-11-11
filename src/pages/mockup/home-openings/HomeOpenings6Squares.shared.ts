// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { createContext, useLayoutEffect, type ReactElement, type RefObject } from "react";
export const COLUMN_WIDEST = 240, COLUMN_NARROWEST = 176, GAP_WIDEST = 40, GAP_NARROWEST = 12, EDGE_WIDEST = 32, EDGE_NARROWEST = 12;

export function useSquareRoom(stage: RefObject<HTMLElement>, on: boolean) {
  useLayoutEffect(() => {
    const section = stage.current;
    if (!on || !section) return;
    const place = () => {
      const wall = section.querySelector(".hm6-wall")?.getBoundingClientRect();
      if (!wall || innerWidth <= 860) { section.dataset.squares = "none"; return; }
      const room = wall.left - section.getBoundingClientRect().left, spare = room - COLUMN_WIDEST;
      const least = GAP_NARROWEST + EDGE_NARROWEST, most = GAP_WIDEST + EDGE_WIDEST;
      const share = Math.min(1, Math.max(0, (spare - least) / (most - least)));
      const gap = GAP_NARROWEST + (GAP_WIDEST - GAP_NARROWEST) * share, edge = EDGE_NARROWEST + (EDGE_WIDEST - EDGE_NARROWEST) * share;
      const column = Math.min(COLUMN_WIDEST, room - gap - edge);
      section.style.setProperty("--hm6-square", `${wall.width}px`);
      section.style.setProperty("--hm6-gap", `${gap}px`);
      section.style.setProperty("--hm6-column", `${column}px`);
      section.dataset.squares = column >= COLUMN_NARROWEST ? "fit" : "none";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(section);
    return () => observer.disconnect();
  }, [stage, on]);
}

export const DoorwayArt = createContext<Partial<Record<string, () => ReactElement>>>({});
