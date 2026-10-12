// The finds list's cards: the "All 7" summary, and one card per find carrying its "from the dig to your screen" thread
// (who found or studied it → what came of it → where it reaches this site, or that it does not yet).
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Find, Scholar } from "@/data/teachers/pages-types";
import { useScholars } from "../context";
import { AREA_ROUTE, areaOf, cssVars, overviewOf, toneOf, type DiscoveryModel, type Step } from "./model";

interface CardProps { on: boolean; onChoose: () => void }

export function OverviewCard({ model, on, onChoose }: CardProps & { model: DiscoveryModel }) {
  const words = overviewOf(model);
  return <article className={`dsc-find dsc-find-all${on ? " dsc-on" : ""}`}>
    <button type="button" className="dsc-find-hit" aria-label={`Show all ${model.finds.length} discoveries`} onClick={onChoose} />
    <div className="dsc-find-top"><span className="dsc-year">{words.span}</span><span className="dsc-where">All {model.finds.length}</span></div>
    <h3>{words.title}</h3>
    <p>{words.from} {words.lie}</p>
    <div className="dsc-sum"><p className="dsc-step-k">From the dig to your screen</p><p>{words.reach}</p></div>
    <p className="dsc-find-hint">Scroll the list, or choose one.</p>
  </article>;
}

export function FindCard({ model, find, on, onChoose }: CardProps & { model: DiscoveryModel; find: Find }) {
  return <article className={`dsc-find${on ? " dsc-on" : ""}`}>
    <button type="button" className="dsc-find-hit" aria-label={`Show ${find.name} on the map`} onClick={onChoose} />
    <div className="dsc-find-top">
      <span className="dsc-year">{find.year}</span>
      <span className="dsc-where">{find.where[0]}{model.inHoly.has(find.id) ? null : <> <em>· beyond this map</em></>}</span>
    </div>
    <h3>{find.name}</h3>
    <p>{find.line}</p>
    <div className="dsc-thread">
      <p className="kicker">From the dig to your screen</p>
      <ol>{model.threads[find.id].steps.map((step, n) => <ThreadStep key={n} step={step} />)}</ol>
    </div>
  </article>;
}

function ThreadStep({ step }: { step: Step }) {
  switch (step.kind) {
    case "who": return <li className="dsc-step"><p className="dsc-step-k">Found or studied by</p><Chip scholar={step.scholar} /></li>;
    case "came": return <li className="dsc-step"><p className="dsc-step-k">What came of it</p><p className="dsc-step-v"><i>{step.work[0]}</i>, {step.work[1]}</p></li>;
    case "next": return <li className="dsc-step">
      <p className="dsc-step-k">Next in the chain of the text</p><Chip scholar={step.scholar} /><p className="dsc-step-v dsc-step-sub">{step.what}</p>
    </li>;
    case "none": return <li className="dsc-step dsc-step-none"><p className="dsc-step-k">On this site</p><p className="dsc-step-v">Not used on this site yet.</p></li>;
    case "site": {
      const area = areaOf(step.scholar);
      return <li className="dsc-step dsc-step-site">
        <p className="dsc-step-k">{step.site.status === "in-use" ? "Where it reaches this site" : "In the library, planned"}</p>
        {area && <Link className="dsc-site-link" to={AREA_ROUTE[area]}>{area}<ArrowUpRight size={14} aria-hidden="true" /></Link>}
        <p className="dsc-step-v dsc-step-sub">{step.site.note}</p>
      </li>;
    }
  }
}

function Chip({ scholar }: { scholar: Scholar }) {
  const { data, openProfile } = useScholars();
  return <button type="button" className="dsc-chip" style={cssVars({ "--tone": toneOf(scholar) })} onClick={(e) => openProfile(scholar.id, e.currentTarget)}>
    <i /><span><b>{scholar.name}</b><small>{data.faiths[scholar.faith]} · {data.fields[scholar.field]}</small></span>
    <ArrowRight size={14} aria-hidden="true" />
  </button>;
}
