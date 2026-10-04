import type { CSSProperties } from "react";
import { RefLink } from "@/components/study/StudyParts";
import { SECTION_INSIGHTS } from "@/data/chart-insights";
import { SECTIONS, SECTION_BY_ID, sectionColor } from "@/lib/sections";
import type { SectionId } from "@/lib/types";

export type SectionFilter = SectionId | "";
export function SectionFilters({ value, onChange }: { value: SectionFilter; onChange: (value: SectionFilter) => void }) {
  return <div className="section-filters" role="group" aria-label="Bible sections">
    <button type="button" aria-pressed={!value} onClick={() => onChange("")}>Whole Bible</button>
    {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => <button key={s.id} type="button" aria-pressed={value === s.id} onClick={() => onChange(s.id)} style={{ "--section-color": sectionColor(s.id) } as CSSProperties}><i />{s.name}</button>)}
  </div>;
}

export function SectionGuide({ section }: { section: SectionFilter }) {
  const insight = section ? SECTION_INSIGHTS[section] : undefined;
  if (!section || !insight) return <div className="section-guide section-guide-intro">
    <div><h3>A library of different voices.</h3><p>Story, poetry, prophecy and letters ask us to read in different ways. Choose a section to explore its literary character and place in Scripture.</p></div>
    <p>These are this site's reading-chart groups. Individual books mix literary forms, and other Bible traditions arrange the books differently. <a href="https://bibleproject.com/videos/literary-styles-bible/" target="_blank" rel="noreferrer">Explore literary styles ↗</a></p>
  </div>;
  return <aside className="section-guide" style={{ "--section-color": sectionColor(section) } as CSSProperties} aria-label={SECTION_BY_ID[section].name + " literary guide"}>
    <div><p className="section-guide-label">{SECTION_BY_ID[section].span}</p><h3>Why {SECTION_BY_ID[section].name}?</h3><p>{insight.why}</p></div>
    <div><h4>How to read it</h4><p>{insight.read}</p></div>
    <div className="section-guide-thread"><h4>A thread to follow</h4><p>{insight.thread}</p><RefLink span={insight.ref} /></div>
  </aside>;
}
