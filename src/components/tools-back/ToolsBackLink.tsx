// The way back to the tools hub from a tool's page: an arrow and "All tools" above the page's title, like the games'
// "All games" (src/pages/games/games.css .gm-back) and the study pages' back button. Every tool page shows it (owner,
// 2026-11-11: "there should be a button going back to tools … there should be an arrow"); before, eleven tools had a
// plain "Tools" kicker and twelve had no link back at all.
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./tools-back.css";

export function ToolsBackLink() {
  return <Link className="tools-back" to="/tools"><ArrowLeft size={14} aria-hidden="true" />All tools</Link>;
}
