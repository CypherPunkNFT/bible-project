import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { STUDY_COLLECTIONS, type StudyCollectionId } from "@/data/study-collections";
import "@/pages/study/study.css";

export function StudyMiniature({ kind }: { kind: StudyCollectionId }) {
  return <svg className="study-miniature" viewBox="0 0 240 70" fill="none" aria-hidden="true">
    {kind === "references" && <>{[30, 46, 68, 92, 115, 142, 165, 196].map((end, i) => <path key={end} d={`M8 59 Q${end / 2 + 8} ${52 - i * 9} ${end + 25} 59`} stroke="currentColor" opacity={.2 + i * .09} />)}<path d="M8 64H231" stroke="currentColor" strokeWidth="3" opacity=".7" /></>}
    {kind === "structure" && Array.from({ length: 48 }, (_, i) => <rect key={i} x={8 + i % 16 * 14} y={12 + Math.floor(i / 16) * 17} width="10" height="12" rx="2" fill="currentColor" opacity={.2 + i % 7 * .1} />)}
    {kind === "gospels" && [12, 20, 17, 43, 34, 54, 31, 22, 42, 59, 48, 15, 28, 39, 20, 9].map((height, i) => <rect key={i} x={8 + i * 14} y={64 - height} width="10" height={height} rx="2" fill="currentColor" opacity={.25 + height / 90} />)}
    {kind === "versions" && <><path d="M8 48H230" stroke="currentColor" opacity=".4" />{[20, 67, 109, 157, 191, 219].map((x, i) => <g key={x}><path d={`M${x} 48V${i % 2 ? 18 : 32}`} stroke="currentColor" /><circle cx={x} cy={i % 2 ? 18 : 32} r="4" fill="currentColor" opacity={.4 + i * .1} /></g>)}</>}
    {kind === "people" && <><path d="M120 18V35H45V52M120 35V52M120 35H195V52" stroke="currentColor" opacity=".5" />{[[120, 12], [45, 58], [120, 58], [195, 58]].map(([x, y]) => <circle key={x + ':' + y} cx={x} cy={y} r="8" fill="currentColor" fillOpacity=".2" stroke="currentColor" />)}</>}
    {kind === "places" && <><path d="M15 50Q60 0 105 40T225 15" stroke="currentColor" strokeDasharray="3 4" />{[[15, 50], [75, 24], [140, 42], [225, 15]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="9" fill="currentColor" opacity=".15" /><circle cx={x} cy={y} r="3" fill="currentColor" /></g>)}</>}
    {kind === "miracles" && <>{[24, 45, 66, 87].map((r) => <ellipse key={r} cx="120" cy="36" rx={r} ry={r / 3} stroke="currentColor" opacity={1 - r / 110} />)}<path d="M120 16V56M110 36H130" stroke="currentColor" /></>}
    {kind === "letters" && <>{[175, 130, 210, 95].map((w, i) => <g key={w}><rect x="12" y={9 + i * 15} width={w} height="9" rx="2" fill="currentColor" opacity=".3" /><path d={`M${w / 3 + 12} ${9 + i * 15}v9M${w * .7 + 12} ${9 + i * 15}v9`} stroke="currentColor" /></g>)}</>}
    {kind === "names" && <>{[80, 120, 160].map((x, i) => <circle key={x} cx={x} cy="35" r="28" stroke="currentColor" opacity={.3 + i * .2} />)}<path d="M40 35H200" stroke="currentColor" opacity=".25" /></>}
  </svg>;
}

export function StudyCollectionNav() {
  const { pathname } = useLocation();
  const slug = pathname.split("/")[2];
  const active = STUDY_COLLECTIONS.find((item) => item.id === (slug === "prophets" ? "people" : slug)) ?? STUDY_COLLECTIONS[0];
  return <nav className="study-collection-nav" aria-label="Study collections">{active.related.map((id) => {
    const item = STUDY_COLLECTIONS.find((entry) => entry.id === id)!;
    return <Link key={id} to={item.path} className="study-collection-cover" aria-current={active.id === id ? "page" : undefined} style={{ "--resource-color": `var(--${item.color})` } as CSSProperties}>
      <span><item.icon size={16} aria-hidden="true" />{item.label}</span><StudyMiniature kind={id} />
    </Link>;
  })}</nav>;
}
