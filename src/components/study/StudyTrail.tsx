import { Link } from "react-router-dom";
import { StudyBackLink } from "./StudyBackLink";
import "./study-trail.css";

const AREAS = { texts: "The Bible: formation & transmission", history: "History & archaeology", languages: "Languages & translation", culture: "Ancient cultures & daily life", church: "Christian thought & church history" } as const;

/** Where an academic study belongs, directly above its eyebrow: the back button (to the page the visitor came from, else Academic studies),
 *  then the study's area, then (for a page inside a study) that study. */
export function StudyTrail({ area, n, parent }: { area: keyof typeof AREAS; n?: string; parent?: { to: string; label: string } }) {
  const to = `/study/academic?area=${area}`;
  return <nav className="study-trail" aria-label="Study navigation">
    <StudyBackLink fallback={{ path: to, label: "Academic studies" }} />
    <Link to={to}>{AREAS[area]}</Link>
    {parent && <><span aria-hidden="true">/</span><Link to={parent.to}>{parent.label}</Link></>}
    {n && <><span aria-hidden="true">/</span><span>{n}</span></>}
  </nav>;
}
