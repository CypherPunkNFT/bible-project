import React,{useEffect,useState,useCallback,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {Profile} from '../../src/pages/teachers/scholars/Profile';
import {ScholarsContext, type ScholarsContextValue, type ProfileTarget} from '../../src/pages/teachers/scholars/context';
import data from '../../src/data/teachers/scholars.json';
import {useLibrary} from '../../src/pages/teachers/scholars/catalogue/useLibrary';
import {PopulationWorks} from '../../src/pages/teachers/scholars/catalogue/PopulationWorks';
import type {LibraryPerson} from '../../src/pages/teachers/scholars/catalogue/library';
interface EntryTarget {populationId:string;origin:Element|null}
function EntryDrawer({target,person,error,onClose}:{target:EntryTarget;person:LibraryPerson|undefined;error:string;onClose:()=>void}){
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const before=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){const nodes=[...panel.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',key);(target.origin as HTMLElement|null)?.focus({preventScroll:true});};
 },[target,onClose]);
 const dates=person?.facts?.dates;
 return <div className="prf prf-open entry-drawer"><div className="prf-scrim" onClick={onClose}/><div className="prf-panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby="entry-name"><div className="prf-bar"><span>Contributor record</span><button type="button" className="prf-btn prf-close" aria-label="Close contributor details" onClick={onClose}>×</button></div><div className="prf-body"><h2 id="entry-name">{person?.name??'Loading contributor…'}</h2>{error&&<p role="alert">{error}</p>}{person&&<><p>{dates?.approximate?'c. ':''}{dates?.born}–{dates?.died??''}</p><p>{person.roles.join(' · ')}</p><p>{person.facts?.kind?.replaceAll('-',' ')} · {dates?.status?.replaceAll('-',' ')}</p><h3>Associated works</h3><PopulationWorks person={person}/>{dates?.evidence?.length>0&&<details><summary>Recorded date evidence</summary>{dates.evidence.map((e,i)=><p key={i}>{e.label}</p>)}</details>}</>}</div></div></div>;
}
function Bridge(){
 const [profile,setProfile]=useState<ProfileTarget|null>(null);
 const [entry,setEntry]=useState<EntryTarget|null>(null);
 const {library,libraryError}=useLibrary(data as unknown as ScholarsContextValue['data']);
 const closeProfile=useCallback(()=>setProfile(null),[]);
 const closeEntry=useCallback(()=>setEntry(null),[]);
 useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail.id){setEntry(null);setProfile({id:detail.id,origin:detail.origin});}else{setProfile(null);setEntry({populationId:detail.populationId,origin:detail.origin});}};window.addEventListener('mock-scholar-profile',handler);return()=>window.removeEventListener('mock-scholar-profile',handler);},[]);
 const value={data,library,profile,closeProfile,shownIds:library?.map(p=>p.id)??[]} as unknown as ScholarsContextValue;
 return <BrowserRouter><ScholarsContext.Provider value={value}><div className="tp-page tp-scholars" onClickCapture={event=>{const link=(event.target as Element).closest('a');if(link&&link.origin===location.origin&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();event.stopPropagation();location.assign(link.href);}}}><Profile/>{entry&&<EntryDrawer target={entry} person={library?.find(p=>p.id===entry.populationId)} error={libraryError} onClose={closeEntry}/>}</div></ScholarsContext.Provider></BrowserRouter>;
}
const mount=document.createElement('div');document.body.append(mount);createRoot(mount).render(<Bridge/>);
