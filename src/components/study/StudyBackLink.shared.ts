// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { isCameFrom, type CameFrom } from "@/lib/came-from";
import { homeAreaOf } from "@/pages/study/hub/way-back";
import "@/pages/study/study.css";
import { useLocation } from "react-router-dom";
export const STUDY_HUB: CameFrom = { path: "/study", label: "Study" };

export function useWayBack(fallback?: CameFrom): CameFrom {
  const { state, pathname } = useLocation();
  const carried = typeof state === "object" && state !== null ? (state as { from?: unknown }).from : undefined;
  return isCameFrom(carried) ? carried : fallback ?? homeAreaOf(pathname) ?? STUDY_HUB;
}
