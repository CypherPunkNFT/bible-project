import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import type { Measure } from "@/lib/chart-measures";
import { loadStats } from "@/lib/data";
import type { Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useParts } from "@/pages/study/structure/parts/use-parts";
import { BandVariant, MosaicVariant, RingVariant, StageVariant } from "./variants";
import "@/pages/charts.css";
import "@/pages/study/structure/structure.css";
import "./parts-mockup.css";

const VERSIONS = [
  { id: "a", name: "The original" }, { id: "b", name: "One band" }, { id: "c", name: "Ring and rail" }, { id: "d", name: "Mosaic" }, { id: "e", name: "Stage" },
] as const;

/** /study/structure_parts_mockup: the "parts" container of the Structure mock-up five ways (owner, 2026-11-03). A is the
 *  container as it is; B to E redraw it. The floating pill switches version (?v=b) and the chosen part and measure
 *  carry across, so the five can be compared on the same question. */
export default function PartsMockup() {
  const stats = useAsync(loadStats, "stats");
  const [params, setParams] = useSearchParams();
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "a";
  const [section, setSection] = useState<SectionFilter>("");
  const [measure, setMeasure] = useState<Measure>("words");
  return <div className="charts-hub charts-open study-explorers mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--history)" } as CSSProperties}>
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>The shape of the Bible</strong></div>
    <section aria-labelledby="parts-title" className="shape-section spart-section">
      <header className="shape-section-head"><span>01</span><div><h2 id="parts-title">The <em>parts</em></h2><p>Choose a part to see its share of the whole, by any of nine measures. The part you choose also narrows the books below.</p></div></header>
      <div className="charts-explorer shape-card"><div className="charts-stage">
        {stats.status === "loading" ? <Loading /> : stats.status === "error" ? <p role="alert">This chart could not be loaded.</p>
          : version === "a" ? <><SectionDonut stats={stats.value} section={section} onSection={setSection} plain /><SectionGuide section={section} /></>
          : <Variant version={version} stats={stats.value} measure={measure} onMeasure={setMeasure} section={section} onSection={setSection} />}
      </div></div>
    </section>
    <nav className="spart-pill" aria-label="Version of this container">
      {VERSIONS.map((v) => <button key={v.id} type="button" aria-pressed={version === v.id} title={v.name}
        onClick={() => setParams(v.id === "a" ? {} : { v: v.id }, { replace: true })}>{v.id.toUpperCase()}</button>)}
    </nav>
  </div>;
}

function Variant({ version, stats, ...rest }: { version: string; stats: Stats; measure: Measure; onMeasure: (m: Measure) => void; section: SectionFilter; onSection: (s: SectionFilter) => void }) {
  const view = useParts(stats, rest.measure, rest.section);
  const props = { view, ...rest };
  return version === "b" ? <BandVariant {...props} /> : version === "c" ? <RingVariant {...props} /> : version === "d" ? <MosaicVariant {...props} /> : <StageVariant {...props} />;
}
