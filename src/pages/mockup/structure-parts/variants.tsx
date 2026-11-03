import { SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import { RefLink } from "@/components/study/StudyParts";
import { SECTION_INSIGHTS } from "@/data/chart-insights";
import { formatNumber } from "@/lib/utils";
import { Evidence, MeasureGroups } from "@/pages/study/structure/parts/parts-ui";
import { toneStyle, type Part } from "@/pages/study/structure/parts/use-parts";
import { RingVariant, type VariantProps } from "@/pages/study/structure/parts/RingParts";

export { RingVariant };

const pick = (section: SectionFilter, onSection: (s: SectionFilter) => void, id: Part["id"]) => onSection(section === id ? "" : id);

/** B · One band: the whole Bible as a single strip cut into its six parts, each part as wide as its share. */
export function BandVariant({ view, measure, onMeasure, section, onSection }: VariantProps) {
  const { parts, active, total, unit } = view;
  return <div className="spart spart-b">
    <MeasureGroups measure={measure} onMeasure={onMeasure} />
    <div className="spart-b-lead">
      <div><span>{active ? active.name : "The whole Bible"}</span><strong>{formatNumber(active?.value ?? total)}</strong><small>{unit}</small></div>
      <p>{view.insight}</p>
    </div>
    <div className="spart-band" role="group" aria-label={`The six parts by ${view.label.toLowerCase()}`}>
      {parts.map((p) => <button key={p.id} type="button" aria-pressed={section === p.id} aria-label={`${p.name}: ${p.share}%`} title={`${p.name} · ${p.share}%`}
        style={{ ...toneStyle(p.id), flex: `${Math.max(p.value, total * 0.012)} 1 0` }} onClick={() => pick(section, onSection, p.id)} data-dim={!!section && section !== p.id} />)}
    </div>
    <ul className="spart-legend">{parts.map((p) => <li key={p.id}><button type="button" aria-pressed={section === p.id} style={toneStyle(p.id)} onClick={() => pick(section, onSection, p.id)}>
      <i /><span>{p.name}</span><strong>{p.share}%</strong><small>{formatNumber(p.value)}</small></button></li>)}</ul>
    <SectionGuide section={section} />
    <Evidence view={view} section={section} />
  </div>;
}

/** D · Mosaic: the parts as tiles whose areas are their shares, the Old Testament in the top row and the New below. */
export function MosaicVariant({ view, measure, onMeasure, section, onSection }: VariantProps) {
  const { parts, active, total, unit } = view;
  const rows = [{ label: "Old Testament", items: parts.slice(0, 3) }, { label: "New Testament", items: parts.slice(3) }];
  const weight = (p: Part) => Math.max(p.value, total * 0.015);
  return <div className="spart spart-d">
    <div className="spart-d-top">
      <MeasureGroups measure={measure} onMeasure={onMeasure} />
      <div className="spart-d-total"><strong>{formatNumber(active?.value ?? total)}</strong><span>{active ? `${active.name} · ${unit}` : `${unit} in the whole Bible`}</span></div>
    </div>
    <div className="spart-mosaic" role="group" aria-label={`The six parts by ${view.label.toLowerCase()}`}>
      {rows.map((row) => <div key={row.label} className="spart-mosaic-row" style={{ flex: `${row.items.reduce((n, p) => n + weight(p), 0)} 1 0` }}>
        <em>{row.label}</em>
        {row.items.map((p) => <button key={p.id} type="button" aria-pressed={section === p.id} style={{ ...toneStyle(p.id), flex: `${weight(p)} 1 0` }} data-dim={!!section && section !== p.id} onClick={() => pick(section, onSection, p.id)}>
          <span>{p.name}</span><strong>{p.share}%</strong><small>{formatNumber(p.value)}</small></button>)}
      </div>)}
    </div>
    <p className="spart-d-insight">{view.insight}</p>
    <SectionGuide section={section} />
    <Evidence view={view} section={section} />
  </div>;
}

/** E · Stage: the chosen part takes the stage with its reading guide written beside its number; the six parts are a
 *  quiet list, and the measures sit in a dock that floats at the foot of the container while you scroll. */
export function StageVariant({ view, measure, onMeasure, section, onSection }: VariantProps) {
  const { parts, active, subject, total, unit } = view;
  const insight = active ? SECTION_INSIGHTS[active.id] : undefined;
  return <div className="spart spart-e">
    <div className="spart-e-grid">
      <div className="spart-e-stage" style={toneStyle(active?.id ?? subject.id)}>
        <p className="spart-e-kicker">{active ? active.span : "Six parts · 66 books"}</p>
        <h3>{active ? active.name : "The whole Bible"}</h3>
        <div className="spart-e-figure"><strong>{formatNumber(active?.value ?? total)}</strong><span>{active ? `${active.share}% of the ${unit}` : unit}</span></div>
        <p className="spart-e-insight">{view.insight}</p>
        {insight ? <div className="spart-e-guide">
          <div><h4>Why {active!.name}?</h4><p>{insight.why}</p></div>
          <div><h4>How to read it</h4><p>{insight.read}</p></div>
          <div><h4>A thread to follow</h4><p>{insight.thread}</p><RefLink span={insight.ref} /></div>
        </div> : <p className="spart-e-hint">Choose a part to see why it is shaped as it is, how to read it, and a thread to follow.</p>}
      </div>
      <ul className="spart-e-list">{parts.map((p) => <li key={p.id}><button type="button" aria-pressed={section === p.id} style={toneStyle(p.id)} onClick={() => pick(section, onSection, p.id)}>
        <i /><span>{p.name}</span><strong>{p.share}%</strong><b style={{ width: `${p.share}%` }} /></button></li>)}</ul>
    </div>
    <Evidence view={view} section={section} />
    <div className="spart-e-dock"><MeasureGroups measure={measure} onMeasure={onMeasure} className="spart-flat" /></div>
  </div>;
}
