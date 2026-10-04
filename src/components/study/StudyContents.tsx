import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useLayoutEffect, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { STUDY_COLLECTIONS } from "@/data/study-collections";
import { STUDY_SECTIONS } from "@/data/study-sections";
import { StudySectionPreview } from "./StudyArtwork";
import "@/pages/study/study.css";

export function StudyContents() {
  const location = useLocation();
  const slug = location.pathname.split("/")[2];
  const collection = STUDY_COLLECTIONS.find((item) => item.id === (slug === "prophets" ? "people" : slug)) ?? STUDY_COLLECTIONS[0];
  const sections = STUDY_SECTIONS[collection.id];

  // Guides fetch their content in small pieces, so an anchor may appear after navigation.
  useLayoutEffect(() => {
    const target = location.hash.slice(1);
    if (!target || (target !== "collection-contents" && target !== "prophets-directory" && !sections.some((item) => item.id === target))) return;
    const scroll = () => {
      const element = document.getElementById(target);
      if (!element) return false;
      element.scrollIntoView({ block: "start", behavior: "instant" });
      return true;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.hash, location.pathname, sections]);

  return <section id="collection-contents" className="study-contents" style={{ "--resource-color": `var(--${collection.color})` } as CSSProperties} aria-labelledby="collection-contents-title">
    <header><h2 id="collection-contents-title">In this collection</h2><p>Choose a starting point. Explore in any order.</p></header>
    <nav aria-label="Collection contents"><ol className="study-contents-grid" data-count={sections.length}>{sections.map((item, i) => {
      const to = location.pathname === "/study/prophets" && item.id === "prophets" ? "/study/prophets#prophets-directory" : item.to ?? `${collection.path}#${item.id}`;
      const externalPage = to.split("#")[0] !== location.pathname;
      return <li key={item.id}><Link to={to} className="study-content-card" aria-labelledby={`contents-${item.id}`}>
        <div className="study-content-meta"><span>{item.kind}</span><span>{String(i + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}</span></div>
        <StudySectionPreview kind={item.illustration} />
        <h3 id={`contents-${item.id}`}>{item.title}</h3><p>{item.description}</p>
        <span className="study-content-action">{externalPage ? (item.kind === "Library" ? "Open the library" : "Open the guide") : `Explore ${item.kind === "Chart" ? "the chart" : item.kind === "Map" ? "the map" : "the guide"}`}{externalPage ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}</span>
      </Link></li>;
    })}</ol></nav>
  </section>;
}
