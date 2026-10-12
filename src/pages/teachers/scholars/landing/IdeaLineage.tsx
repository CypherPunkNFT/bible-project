import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { IDEA_CHAINS } from "./idea-chains";
import { toneVar } from "../marks/shapes";
import "./idea-lineage.css";

export function IdeaLineage() {
  const [active,setActive]=useState(0),[selected,setSelected]=useState(0);
  const chain=IDEA_CHAINS[active],node=chain.nodes[selected];
  const choose=(index:number)=>{setActive(index);setSelected(0);};
  const navigate=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    let next=index;
    if(event.key==="ArrowRight")next=(index+1)%IDEA_CHAINS.length;
    else if(event.key==="ArrowLeft")next=(index+IDEA_CHAINS.length-1)%IDEA_CHAINS.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=IDEA_CHAINS.length-1;
    else return;
    event.preventDefault();choose(next);document.getElementById(`lineage-tab-${next}`)?.focus();
  };
  return <section className="idea-lineage" aria-label="Five fields of study" style={{"--thread":toneVar(chain.field)} as CSSProperties}>
    <header className="il-header"><span>Five fields of study</span><div role="tablist" aria-label="Choose a field">{IDEA_CHAINS.map((item,index)=><button key={item.field} type="button" role="tab" id={`lineage-tab-${index}`} aria-selected={index===active} aria-controls="lineage-panel" tabIndex={index===active?0:-1} onClick={()=>choose(index)} onKeyDown={event=>navigate(event,index)} style={{"--field":toneVar(item.field)} as CSSProperties}>{item.label}</button>)}</div></header>
    <div id="lineage-panel" role="tabpanel" aria-labelledby={`lineage-tab-${active}`}>
      <div className="il-intro"><div><h2>{chain.title}</h2><p>{chain.description}</p></div><span>{chain.nodes.length-1} connections <i aria-hidden="true">/</i> {chain.nodes[0].date}–{chain.nodes.at(-1)?.date}</span></div>
      <ol className="il-timeline" style={{"--steps":chain.nodes.length} as CSSProperties} aria-label={`${chain.label}: works in chronological order`}>
        {chain.nodes.map((step,index)=><li key={`${chain.field}-${index}`} className={index===selected?"il-selected":""}>
          {index<chain.nodes.length-1&&<div className="il-link" aria-hidden="true"><span>{chain.nodes[index+1].link}</span></div>}
          <button type="button" className="il-step" aria-pressed={index===selected} aria-label={`${step.date}: ${step.name}, ${step.work}`} onClick={()=>setSelected(index)} aria-controls="lineage-detail">
            <span className="il-caption"><small>{step.date}</small><strong>{step.name}</strong><em>{step.work}</em></span>
            <span className="il-mark" aria-hidden="true">{step.initials}</span>
          </button>
        </li>)}
      </ol>
      <div className="il-detail" id="lineage-detail" aria-live="polite" aria-atomic="true"><div className="il-detail-label"><small>{String(selected+1).padStart(2,"0")} / {String(chain.nodes.length).padStart(2,"0")}</small><strong>{node.link}</strong><span>{node.name}</span></div><p>{node.detail}</p><a href={node.source} target="_blank" rel="noreferrer" title={node.sourceLabel}>Read the source <ArrowUpRight size={14} aria-hidden="true"/></a></div>
    </div>
  </section>;
}
