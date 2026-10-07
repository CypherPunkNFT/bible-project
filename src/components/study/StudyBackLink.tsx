import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "@/pages/study/study.css";

/** `inline`: a small link that sits at the end of the eyebrow line (People & genealogies) instead of a button on its own line. */
export function StudyBackLink({ inline = false }: { inline?: boolean } = {}) {
  return <Link to="/study" className={inline ? "study-back-inline" : "study-back-button"}><ArrowLeft size={inline ? 14 : 17} aria-hidden="true" />Back to Study</Link>;
}
