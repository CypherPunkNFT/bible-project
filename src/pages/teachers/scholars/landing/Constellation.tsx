import type { ScholarsData } from "@/data/teachers/pages-types";
import {FocusTimeline} from './FocusTimeline';
import {useEffect} from 'react';
import {reducedMotion} from '../marks/dom';
interface SkyProps { data: ScholarsData; matches: ReadonlySet<string>; searching: boolean; onOpen: (id: string, origin: Element | null) => void }
export function Constellation(props: SkyProps) {
  useEffect(()=>{
    if(window.location.hash!=='#connections')return;
    const scroll=()=>document.getElementById('connections')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
    if(document.getElementById('connections')){scroll();return;}
    const sourceSection=document.getElementById('built');if(!sourceSection)return;
    // Sources mounts near the viewport; wait for its subsection before jumping.
    const observer=new MutationObserver(()=>{if(document.getElementById('connections')){observer.disconnect();window.clearTimeout(timer);scroll();}});
    const timer=window.setTimeout(()=>observer.disconnect(),10000);
    observer.observe(sourceSection,{childList:true,subtree:true});
    sourceSection.scrollIntoView({behavior:'auto',block:'start'});
    return()=>{observer.disconnect();window.clearTimeout(timer);};
  },[]);
  return <FocusTimeline {...props}/>;
}
