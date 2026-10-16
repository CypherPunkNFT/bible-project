import {useEffect,useRef,useId} from 'react';
import {X} from 'lucide-react';
import type {LibraryPerson} from './library';
import {PopulationWorks} from './PopulationWorks';
import {dateLabel} from '../population';
import {lockPage} from '../profile/motion';
import '../Profile.css';
import './population.css';

export function ContributorDetails({person,origin,onClose}:{person:LibraryPerson;origin:HTMLElement|null;onClose:()=>void}){
 const panel=useRef<HTMLDivElement>(null),title=useId();
 const evidence=person.facts?.dates.evidence??[];
 useEffect(()=>{
  const unlock=lockPage();panel.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();}
   if(event.key==='Tab'){
    const nodes=[...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,summary,[tabindex="0"]')??[])].filter(el=>el.getClientRects().length);
    const first=nodes[0],last=nodes.at(-1);
    if(event.shiftKey&&(document.activeElement===first||!panel.current?.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{unlock();document.removeEventListener('keydown',key);origin?.focus({preventScroll:true});};
 },[onClose,origin]);
 return <div className="prf prf-open ft-entry-drawer"><div className="prf-scrim" onClick={onClose}/><div ref={panel} className="prf-panel" role="dialog" aria-modal="true" aria-labelledby={title}><div className="prf-bar"><span>Contributor record</span><button type="button" className="prf-btn prf-close" aria-label="Close contributor details" onClick={onClose}><X size={16}/></button></div><div className="prf-body"><h2 id={title}>{person.name}</h2><p>{dateLabel(person)}</p><p>{person.roles.join(' · ')}</p><h3>Associated works</h3><PopulationWorks person={person}/>{evidence.length>0&&<details><summary>Recorded date evidence</summary>{evidence.map((e,i)=><p key={i}>{e.label}</p>)}</details>}</div></div></div>;
}
