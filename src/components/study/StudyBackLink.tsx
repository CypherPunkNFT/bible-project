import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { isCameFrom, type CameFrom } from "@/lib/came-from";
import { homeAreaOf } from "@/pages/study/hub/way-back";
import "@/pages/study/study.css";

const STUDY_HUB: CameFrom = { path: "/study", label: "Study" };

/** The way back from a study: the page the visitor came from when a card carried it; otherwise `fallback` when the page
 *  names one; otherwise the area of Scripture & Theology or Academic Studies that lists the study (owner, 2026-11-06:
 *  never the Study page when the study belongs to one of them); the Study page only for a study neither lists. */
export function useWayBack(fallback?: CameFrom): CameFrom {
  const { state, pathname } = useLocation();
  const carried = typeof state === "object" && state !== null ? (state as { from?: unknown }).from : undefined;
  return isCameFrom(carried) ? carried : fallback ?? homeAreaOf(pathname) ?? STUDY_HUB;
}

/** The back button at the top of every study opened from a card. */
export function StudyBackLink({ fallback }: { fallback?: CameFrom } = {}) {
  const from = useWayBack(fallback);
  return <Link to={from.path} className="study-back-button"><ArrowLeft size={17} aria-hidden="true" />Back to {from.label}</Link>;
}

/** The closing link at the foot of a study: the same way back as the button at its top, so the two always agree. */
export function StudyReturnLink({ className, fallback }: { className?: string; fallback?: CameFrom }) {
  const from = useWayBack(fallback);
  return <Link to={from.path} className={className}>{`Return to ${from.label} ↑`}</Link>;
}
