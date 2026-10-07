import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { categoryStyle, sectionOf } from "@/lib/topic-style";
import { categoryUrl, type TopicIndex } from "@/lib/topics";
import { morph, orderedFamilies, tint } from "./topics-shared";

/** Family and topic pages: the line back, the twelve family tiles, then the page itself (the part that transitions). */
export function TopicsShell({ index, current, back, children }: { index: TopicIndex; current: string; back: ReactNode; children: ReactNode }) {
  return (
    <div className="topics-collection mx-auto max-w-7xl px-4 sm:px-6" style={tint(current)}>
      <div className="topics-topline">{back}<span>{sectionOf(current)?.title ?? "Topics"}</span></div>
      <nav className="topics-tiles" aria-label="Topic families">
        {orderedFamilies(index).map((family) => {
          const { Icon } = categoryStyle(family.id);
          return <NavLink key={family.id} to={categoryUrl(family.id)} data-topics-morph style={morph(family.id)} className={family.id === current ? "is-current" : undefined}><Icon strokeWidth={1.35} aria-hidden /><span>{family.title}</span></NavLink>;
        })}
      </nav>
      <div className="topics-page-slide">{children}</div>
    </div>
  );
}
