import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { isCameFrom, type CameFrom } from "@/lib/came-from";
import "@/pages/study/study.css";

/** The back button on every study opened from a card. Goes back to the page the visitor came from when a study card carried it (the Explore the Bible area of Scripture & Theology),
 *  and to `fallback` (the Study hub unless the page says otherwise) when they arrived directly. */
export function StudyBackLink({ fallback = { path: "/study", label: "Study" } }: { fallback?: CameFrom } = {}) {
  const state: unknown = useLocation().state;
  const carried = typeof state === "object" && state !== null ? (state as { from?: unknown }).from : undefined;
  const from = isCameFrom(carried) ? carried : fallback;
  return <Link to={from.path} className="study-back-button"><ArrowLeft size={17} aria-hidden="true" />Back to {from.label}</Link>;
}
