import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "@/pages/study/study.css";

export function StudyBackLink() {
  return <Link to="/study" className="study-back-button"><ArrowLeft size={17} aria-hidden="true" />Back to Study</Link>;
}
