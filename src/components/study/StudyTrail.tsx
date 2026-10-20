import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./study-trail.css";

const AREAS = { texts: "The Bible: formation & transmission", history: "History & archaeology" } as const;

/** Where an academic study belongs, as one small line directly above its eyebrow: back to Academic studies, then the study's area,
 *  then (for a page inside a study) that study. */
export function StudyTrail({ area, n, parent }: { area: keyof typeof AREAS; n?: string; parent?: { to: string; label: string } }) {
  const to = `/study/academic?area=${area}`;
  return <nav className="study-trail" aria-label="Study navigation">
    <Link to={to}><ArrowLeft size={13} aria-hidden="true" />Academic studies</Link>
    <span aria-hidden="true">/</span><Link to={to}>{AREAS[area]}</Link>
    {parent && <><span aria-hidden="true">/</span><Link to={parent.to}>{parent.label}</Link></>}
    {n && <><span aria-hidden="true">/</span><span>{n}</span></>}
  </nav>;
}
