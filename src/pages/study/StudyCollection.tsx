import { ArrowDown, ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { StudyResourceCards } from "./StudyResourceCards";
import "./study.css";

export default function StudyCollection() {
  return (
    <div className="study-hub mx-auto max-w-7xl px-4 sm:px-6">
      <header className="study-intro">
        <div>
          <p className="study-eyebrow"><span /> The study collection</p>
          <h1>Go deeper into <em>the Word.</em></h1>
          <p className="study-intro-copy">Follow a life. Compare the accounts. Discover the shape, connections and setting of Scripture. Guides, charts and maps bring different questions to the same open Bible.</p>
        </div>
        <div className="study-intro-aside">
          <BookOpen size={28} strokeWidth={1.1} aria-hidden="true" />
          <p>Ten ways to explore.<br /><span>Every path leads to Scripture.</span></p>
          <a href="#study-collection">Find your starting point <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </header>
      {/* Topics and the Names of God open the collection as a pair (owner 2026-10-08), now that Topics has left the header. */}
      <div id="study-collection" className="study-collection-heading"><span>Explore the collection</span><span>Open a guide. Begin anywhere.</span></div>
      <StudyResourceCards />
      <div className="study-source-note"><BookOpen size={20} strokeWidth={1.4} aria-hidden="true" /><p>Made for an open Bible.<span>Built from public-domain reference books and openly licensed data. Every passage links to the reader.</span></p><Link to="/versions">Meet the sources <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
  );
}
