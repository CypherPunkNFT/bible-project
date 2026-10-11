// Selected case studies: historical sources, researcher roles and independently verified study connections.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Find, Scholar } from "@/data/teachers/pages-types";
import { useScholars } from "../context";
import { cssVars, evidence, overviewOf, toneOf, type DiscoveryModel } from "./model";

interface CardProps { on: boolean; onChoose: () => void }

export function OverviewCard({ model, on, onChoose }: CardProps & { model: DiscoveryModel }) {
  const words = overviewOf(model);
  return <article className={`dsc-find dsc-find-all${on ? " dsc-on" : ""}`}>
    <button type="button" className="dsc-find-hit" aria-label={`Show all ${model.finds.length} discoveries`} onClick={onChoose} />
    <div className="dsc-find-top"><span className="dsc-year">{words.span}</span><span className="dsc-where">All {model.finds.length}</span></div>
    <h3>{words.title}</h3>
    <p>{words.from} {words.lie}</p>
    <div className="dsc-sum"><p className="dsc-step-k">Evidence and site connections</p><p>{words.reach}</p></div>
    <p className="dsc-find-hint">Scroll the list, or choose one.</p>
  </article>;
}

export function FindCard({ model, find, on, onChoose }: CardProps & { model: DiscoveryModel; find: Find }) {
  const record = evidence[find.id];
  return <article className={`dsc-find${on ? " dsc-on" : ""}`}>
    <button type="button" className="dsc-find-hit" aria-label={`Show ${find.name} on the map`} onClick={onChoose} />
    <div className="dsc-find-top">
      <span className="dsc-year">{record.date}</span>
      <span className="dsc-where">{find.where[0]}{model.inHoly.has(find.id) ? null : <> <em>· beyond this map</em></>}</span>
    </div>
    <h3>{find.name}</h3>
    <p>{find.line}</p>
    <div className="dsc-thread">
      <p className="kicker">Evidence and site connections</p>
      <ol>
        <li className="dsc-step"><p className="dsc-step-k">{record.role}</p>{find.by.map(id => <Chip key={id} scholar={model.byId[id]} />)}</li>
        <li className="dsc-step"><p className="dsc-step-k">Historical sources</p><ul className="dsc-evidence-links">{record.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={12} aria-hidden="true" /></a></li>)}</ul></li>
        {record.site ? <li className="dsc-step dsc-step-site"><p className="dsc-step-k">Verified study connection</p>
          <Link className="dsc-site-link" to={record.site.url}>{record.site.label}<ArrowUpRight size={14} aria-hidden="true" /></Link>
          <p className="dsc-step-v">{record.site.note}</p><a className="dsc-evidence-source" href={record.site.sourceUrl} target="_blank" rel="noreferrer">{record.site.sourceTitle}</a>
        </li> : <li className="dsc-step dsc-step-none"><p className="dsc-step-k">Site connection</p><p className="dsc-step-v">No feature connection verified in this review.</p></li>}
      </ol>
    </div>
  </article>;
}

function Chip({ scholar }: { scholar: Scholar }) {
  const { data, openProfile } = useScholars();
  return <button type="button" className="dsc-chip" style={cssVars({ "--tone": toneOf(scholar) })} onClick={(e) => openProfile(scholar.id, e.currentTarget)}>
    <i /><span><b>{scholar.name}</b><small>{data.faiths[scholar.faith]} · {data.fields[scholar.field]}</small></span>
    <ArrowRight size={14} aria-hidden="true" />
  </button>;
}
