import { type CameFrom } from "@/lib/came-from";
import "@/pages/study/study.css";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useWayBack } from "./StudyBackLink.shared";

/** The back button at the top of every study opened from a card. */
export function StudyBackLink({ fallback }: { fallback?: CameFrom } = {}) {
  const from = useWayBack(fallback);
  return <Link to={from.path} className="study-back-button"><ArrowLeft size={17} aria-hidden="true" />{`Back to ${from.label}`}</Link>;
}

/** The closing link at the foot of a study: the same way back as the button at its top, so the two always agree. */
export function StudyReturnLink({ className, fallback }: { className?: string; fallback?: CameFrom }) {
  const from = useWayBack(fallback);
  return <Link to={from.path} className={className}>{`Return to ${from.label} ↑`}</Link>;
}
