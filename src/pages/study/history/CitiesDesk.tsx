import { useEffect, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, X } from 'lucide-react';
import { cities } from './evidence';
import { investigations, research } from './cities-research';
import { Passages, SourceLinks } from './HistoryShared';
import { CitiesSectionArt, FindIllustration, horizonLabels } from './CitiesSectionArt';

function Reveal({open,id,children}:{open:boolean;id:string;children:ReactNode}) {
  const reduced=useReducedMotion();
  return <AnimatePresence initial={false}>{open&&<motion.div id={id} key={id} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{height:{duration:reduced?0:.24},opacity:{duration:reduced?0:.16}}} style={{overflow:'hidden'}}>{children}</motion.div>}</AnimatePresence>;
}
export function CitiesDesk() {
  const [params,setParams]=useSearchParams();
  const city=cities.find(c=>c.id===params.get('city'))??cities[1];
  const layer=city.layers.find(l=>l.id===params.get('layer'))??city.layers[city.id==='lachish'?1:0];
  const index=city.layers.indexOf(layer),rawFind=Number(params.get('find')??0);
  const find=Number.isInteger(rawFind)&&rawFind>=0&&rawFind<layer.finds.length?rawFind:0;
  const object=layer.finds[find],compare=params.get('compare')==='1',record=params.get('record')==='1',overlay=params.get('restore')==='1';
  const other=city.layers.find(l=>l.id!==layer.id)!;
  const investigation=investigations[city.id],source=research.find(s=>s.id===investigation.source)!;
  const compareRef=useRef<HTMLButtonElement>(null),recordRef=useRef<HTMLButtonElement>(null);
  const reduced=useReducedMotion();
  const update=(values:Record<string,string|null>)=>{const next=new URLSearchParams(params);for(const [key,value] of Object.entries(values))if(value===null)next.delete(key);else next.set(key,value);setParams(next,{replace:true,preventScrollReset:true});};
  const close=(kind:'compare'|'record')=>{
    const button=(kind==='compare'?compareRef:recordRef).current;
    button?.focus({preventScroll:true});
    if(button){const bounds=button.getBoundingClientRect();if(bounds.top<85||bounds.bottom>innerHeight)button.scrollIntoView({block:'center',behavior:reduced?'instant':'smooth'});}
    update({[kind]:null});
  };
  useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(record)close('record');else if(compare)close('compare');}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);});
  const selectLayer=(i:number)=>update({city:city.id,layer:city.layers[i].id,find:null});
  const caveat=city.id==='jerusalem'?'Separate excavation locations, arranged for comparison. These buildings were not found stacked above one another. Invented geometry; no depth or time scale.':city.id==='jericho'?'Composite teaching section. Urban growth summarizes several periods, not one sealed layer below the destruction. Geometry and spacing are illustrative.':'Composite teaching section. Depth, thickness and architecture are illustrative; the spaces between blocks do not measure time.';
  return <section className="ct-desk" id="section-explorer" aria-labelledby="ct-desk-title">
    <header className="ct-desk-heading"><div><p className="ha-kicker">01 / The section & the evidence</p><h2 id="ct-desk-title">One place. <em>Several histories.</em></h2></div><p>Choose a city, then a horizon.<br/>Selected contexts, not complete histories.</p></header>
    <div className="ct-cities" role="group" aria-label="Choose a city">{cities.map((c,i)=><button key={c.id} type="button" aria-pressed={c.id===city.id} onClick={()=>update({city:c.id,layer:null,find:null})}><small>0{i+1}</small>{c.name}</button>)}</div>
    <div className="ct-workbench"><div className="ct-section-side"><div className="ct-section-title"><div><h3>{city.name}</h3><p>{city.region}</p></div><span>Younger ↑<br/>Older ↓</span></div>
      <CitiesSectionArt city={city} index={index} overlay={overlay} onSelect={selectLayer}/>
      <p className="ct-art-key">Number = selected context · dark earth = destruction context · brighter block = your selection</p>
      <div className="ct-layers" role="group" aria-label="Select a horizon, youngest first">{city.layers.map((l,i)=><button key={l.id} type="button" aria-pressed={l.id===layer.id} aria-controls="ct-record" onClick={()=>selectLayer(i)}><span>{i+1}</span><span><strong>{horizonLabels[city.id][i]}</strong><small>{l.date}</small></span></button>)}</div>
      <p className="ct-caption">{caveat}</p><label className="ct-restoration"><input type="checkbox" checked={overlay} onChange={e=>update({restore:e.target.checked?'1':null})}/> Show a hypothetical reconstruction <span aria-hidden="true">┄</span></label>{overlay&&<p className="ct-caption">Dashed lines suggest a possible completed volume, not a recovered building plan.</p>}
    </div><article className="ct-record" id="ct-record" aria-labelledby="ct-record-title"><p className="ha-kicker">{layer.date}</p><h3 id="ct-record-title">{layer.name}</h3><span className="ct-label">What was found</span><p>{layer.feature}</p><span className="ct-label">How it is dated</span><p>{layer.dating}</p><div className="ct-limit"><span className="ct-label">Where the evidence stops</span><p>{layer.association}</p></div><SourceLinks ids={layer.sources}/><button ref={compareRef} className="ct-disclosure" type="button" aria-expanded={compare} aria-controls="ct-comparison" onClick={()=>compare?close('compare'):update({compare:'1'})}>{compare?'Close comparison':`Compare with ${horizonLabels[city.id][city.layers.indexOf(other)]}`}{compare?<X size={18}/>:<ArrowDown size={18}/>}</button></article></div>
    <Reveal open={compare} id="ct-comparison"><section className="ct-comparison" aria-labelledby="ct-comparison-title"><div className="ct-comparison-heading"><div><p className="ha-kicker">Keep the contexts separate</p><h3 id="ct-comparison-title">{city.id==='lachish'&&[layer.id,other.id].includes('ii')&&[layer.id,other.id].includes('iii')?'Rebuilding separates the two crises.':'Two contexts, held apart.'}</h3></div><button type="button" aria-label="Close comparison" onClick={()=>close('compare')}><X/></button></div><div className="ct-comparison-columns">{[layer,other].map(l=><article key={l.id}><p className="ha-kicker">{l.date}</p><h4>{l.name}</h4><span className="ct-label">Excavated feature</span><p>{l.feature}</p><span className="ct-label">Historical association</span><p>{l.association}</p><SourceLinks ids={l.sources}/></article>)}</div><p className="ct-caption">Side by side does not mean contemporary. Read each date and source in its own context.</p></section></Reveal>
    <section className="ct-finds" aria-labelledby="ct-finds-title"><div><p className="ha-kicker">The finds tray</p><h3 id="ct-finds-title">Small things.<br/><em>Specific questions.</em></h3>{layer.finds.length>1&&<div className="ct-find-buttons" role="group" aria-label="Inspect a find">{layer.finds.map((f,i)=><button key={f.label} type="button" aria-pressed={find===i} onClick={()=>update({find:String(i)})}>{f.label}</button>)}</div>}</div><FindIllustration grain={/grain|charcoal/i.test(object.label)}/><div className="ct-find-detail"><h4>{object.label}</h4><p>{object.evidence}</p><p className="ct-inference">{object.inference}</p><SourceLinks ids={object.sources}/></div></section>
    <div className="ct-life"><div><span className="ct-label">Life within this horizon</span><p>{layer.daily}</p></div>{layer.passage?<Passages items={[layer.passage]}/>:<div><span className="ct-label">No direct biblical association</span><p>This horizon matters without assigning it a biblical event.</p></div>}</div>
    <button ref={recordRef} className="ct-disclosure ct-record-control" type="button" aria-expanded={record} aria-controls="ct-full-record" onClick={()=>record?close('record'):update({record:'1'})}>{record?'Close the excavation record':'Open the excavation record & argument'}{record?<X size={18}/>:<ArrowDown size={18}/>}</button>
    <Reveal open={record} id="ct-full-record"><div className="ct-full-record"><header><p className="ha-kicker">Close investigation / {city.name}</p><h3>{investigation.question}</h3><p>{city.intro}</p></header><div className="ct-argument-columns"><div><h4>Inspect the evidence</h4><p>{investigation.observation}</p><ol className="ct-object-life">{investigation.stages.map(s=><li key={s}>{s}</li>)}</ol><p className="ct-caption">Conceptual sequence · spacing does not encode duration.</p><h4>From observation to inference</h4><p>{investigation.reasoning}</p></div><div><h4>What remains uncertain</h4><p>{investigation.limit}</p><p className="ct-takeaway">{investigation.implication}</p><h4>Excavation context</h4><p>{city.excavation}</p><h4>Reconstruction</h4><p>{layer.reconstruction}</p></div></div><a className="cl-reference" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗<span className="sr-only"> (opens in a new tab)</span></a><p className="ct-caption">Access record: {source.access}</p><button className="ct-disclosure" type="button" onClick={()=>close('record')}>Close record & return to its opening <X size={18}/></button></div></Reveal>
    <p className="sr-only" role="status">{city.name}: {layer.name}. Evidence is in the record beside the section.</p>
  </section>;
}
