import { arc, pie } from "d3-shape";
import { X } from "lucide-react";
import { useState } from "react";
import { SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import type { Measure } from "@/lib/chart-measures";
import { sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Evidence, MeasureGroups } from "./parts-ui";
import { toneStyle, useParts, type Part, type PartsView } from "./use-parts";
import "./parts.css";

export interface VariantProps { view: PartsView; measure: Measure; onMeasure: (m: Measure) => void; section: SectionFilter; onSection: (s: SectionFilter) => void }
const pick = (section: SectionFilter, onSection: (s: SectionFilter) => void, id: Part["id"]) => onSection(section === id ? "" : id);

/** Ring and rail: the measures down the left as a rail, one large ring in the middle, the six parts down the right.
 *  The chosen part has a circled X to the left of its row that clears it. */
export function RingVariant({ view, measure, onMeasure, section, onSection }: VariantProps) {
  const { parts, active, total, unit } = view;
  const slices = pie<Part>().value((p) => p.value).sort(null).padAngle(.014)(parts);
  const shape = arc<(typeof slices)[number]>().innerRadius(74).outerRadius(104).cornerRadius(3);
  return <div className="spart spart-c">
    <div className="spart-c-grid">
      <MeasureGroups measure={measure} onMeasure={onMeasure} className="spart-rail" />
      <div className="spart-c-ring">
        <svg viewBox="-110 -110 220 220" role="img" aria-label={`Distribution of ${view.label.toLowerCase()} by part`}>
          {slices.filter((s) => s.value > 0).map((s) => <path key={s.data.id} d={shape(s) ?? ""} fill={sectionColor(s.data.id)} opacity={section && section !== s.data.id ? .22 : 1} onClick={() => pick(section, onSection, s.data.id)} />)}
          <text textAnchor="middle" y={4} className="spart-ring-number">{formatNumber(active?.value ?? total)}</text>
          <text textAnchor="middle" y={22} className="spart-ring-unit">{active ? `${active.name} · ${active.share}%` : unit}</text>
        </svg>
        <p>{view.insight}</p>
      </div>
      <ul className="spart-c-parts">{parts.map((p) => <li key={p.id}>
        {section === p.id ? <button type="button" className="spart-c-clear" aria-label={`Clear ${p.name}`} onClick={() => onSection("")}><X size={13} aria-hidden="true" /></button> : <span className="spart-c-clear" aria-hidden="true" />}
        <button type="button" className="spart-c-row" aria-pressed={section === p.id} style={toneStyle(p.id)} onClick={() => pick(section, onSection, p.id)}>
          <span className="spart-c-name"><i />{p.name}</span><span className="spart-c-share">{p.share}%</span>
          <span className="spart-c-bar"><b style={{ width: `${p.share}%` }} /></span><small>{formatNumber(p.value)} {unit} · {p.span}</small></button></li>)}</ul>
    </div>
    <SectionGuide section={section} />
    <Evidence view={view} section={section} />
  </div>;
}

/** The parts container as the owner chose it (ring and rail, 2026-11-03). */
export function RingParts({ stats, section, onSection }: { stats: Stats; section: SectionFilter; onSection: (s: SectionFilter) => void }) {
  const [measure, setMeasure] = useState<Measure>("words");
  const view = useParts(stats, measure, section);
  return <RingVariant view={view} measure={measure} onMeasure={setMeasure} section={section} onSection={onSection} />;
}
