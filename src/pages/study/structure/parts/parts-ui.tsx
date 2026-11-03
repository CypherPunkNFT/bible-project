import type { SectionFilter } from "@/components/charts/SectionGuide";
import { OutsideScroll } from "@/components/OutsideScroll";
import { RefLink } from "@/components/study/StudyParts";
import type { Measure } from "@/lib/chart-measures";
import { STUDY_MEASURES, TEXT_MEASURES } from "@/lib/chart-measures";
import type { PartsView } from "./use-parts";

/** The nine measures as pills in two labelled groups: what is counted in the text, what is found in the studies. */
export function MeasureGroups({ measure, onMeasure, className = "" }: { measure: Measure; onMeasure: (m: Measure) => void; className?: string }) {
  const group = (label: string, items: readonly { id: Measure; label: string }[]) => <div className="spart-group" role="group" aria-label={label}>
    <span>{label}</span>
    <div>{items.map((m) => <button key={m.id} type="button" aria-pressed={measure === m.id} onClick={() => onMeasure(m.id)}>{m.label}</button>)}</div>
  </div>;
  return <div className={`spart-measures ${className}`}>
    {group("Counted in the text", TEXT_MEASURES)}
    {group("Found in the studies", STUDY_MEASURES)}
  </div>;
}

/** The study measures' own note and the passages behind the count, as the real chart gave them. */
export function Evidence({ view, section }: { view: PartsView; section: SectionFilter }) {
  if (!view.isStudy || view.loading) return null;
  return <>
    {view.note && <p className="chart-measure-note">{view.note} Each entry counts once in every section cited; percentages compare those section placements. Open the source passages below.</p>}
    <details className="measure-evidence" open={!!section}><summary>Explore the passages · {view.detail.length} {section ? "entries here" : "source entries"}</summary>
      <OutsideScroll label="Source passages for the selected measure" className="measure-evidence-scroll" resetKey={`${view.label}:${section}`}>
        <ol>{view.detail.map((entry, i) => <li key={i}><strong>{entry.title}</strong><div>{entry.refs.map((ref, j) => <RefLink key={j} span={ref} />)}</div></li>)}</ol>
      </OutsideScroll>
      {view.detail.length === 0 && <p>No entries in this selection. Try another section or measure.</p>}
    </details>
  </>;
}
