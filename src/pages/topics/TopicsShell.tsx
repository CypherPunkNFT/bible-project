import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { categoryStyle, sectionOf, TOPIC_SECTIONS } from "@/lib/topic-style";
import { categoryUrl, type TopicIndex } from "@/lib/topics";
import { morph, orderedFamilies, tint } from "./topics-shared";

/** Family and topic pages: the line back, the sections as a scrolling strip, the current section's family tiles, then the
 * page itself (the part that transitions). */
export function TopicsShell({ index, current, back, children }: { index: TopicIndex; current: string; back: ReactNode; children: ReactNode }) {
  const section = sectionOf(current) ?? TOPIC_SECTIONS[0];
  const families = orderedFamilies(index).filter((family) => section.categories.includes(family.id));
  const strip = useRef<HTMLElement>(null);
  // On narrow screens the strip scrolls; bring the current section into view (sideways only, never the page).
  useEffect(() => {
    const bar = strip.current, chip = bar?.querySelector<HTMLElement>(".is-current");
    if (bar && chip) bar.scrollLeft = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
  }, [section.id]);
  return (
    <div className="topics-collection mx-auto max-w-7xl px-4 sm:px-6" style={tint(current)}>
      <div className="topics-topline">{back}<span>{section.title}</span></div>
      <nav ref={strip} className="topics-sections" aria-label="Topic sections">
        {TOPIC_SECTIONS.map((entry, i) => {
          const first = entry.categories.find((id) => index.categories.some((family) => family.id === id));
          return first && <NavLink key={entry.id} to={categoryUrl(first)} className={entry.id === section.id ? "is-current" : undefined} aria-current={entry.id === section.id ? "true" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{entry.title}</NavLink>;
        })}
      </nav>
      <nav className="topics-tiles" aria-label={`Families in ${section.title}`} style={{ "--tile-count": Math.min(Math.max(families.length, 4), 7) } as CSSProperties}>
        {families.map((family) => {
          const { Icon } = categoryStyle(family.id);
          return <NavLink key={family.id} to={categoryUrl(family.id)} data-topics-morph style={morph(family.id)} className={family.id === current ? "is-current" : undefined}><Icon strokeWidth={1.35} aria-hidden /><span>{family.title}</span></NavLink>;
        })}
      </nav>
      <div className="topics-page-slide">{children}</div>
    </div>
  );
}
