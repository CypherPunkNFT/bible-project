import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { GenealogyView } from "./GenealogyExplorer";
const Map=lazy(()=>import("@/pages/study/CircularGenealogyPage"));

export function ExpandedGenealogy({view,rect,onMinimize}:{view:GenealogyView;rect:DOMRect;onMinimize:(view:GenealogyView)=>void}) {
  const [closing,setClosing]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>>();
  const shell=useRef<HTMLDivElement>(null);
  const finish=useRef(onMinimize);finish.current=onMinimize;
  useEffect(()=>{
    const overflow=document.body.style.overflow;
    const trigger=document.activeElement as HTMLElement | null;
    const backgrounds=[...document.body.children].filter((node):node is HTMLElement=>node instanceof HTMLElement && node!==shell.current).map(node=>({node,inert:node.inert}));
    backgrounds.forEach(({node})=>{node.inert=true;});
    document.body.style.overflow="hidden";
    shell.current?.focus({preventScroll:true});
    return ()=>{document.body.style.overflow=overflow;backgrounds.forEach(({node,inert})=>{node.inert=inert;});clearTimeout(timer.current);trigger?.focus({preventScroll:true});};
  },[]);
  const minimize=(current:GenealogyView)=>{
    if(closing) return;
    setClosing(true);
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timer.current=setTimeout(()=>finish.current(current),reduced ? 0 : 300);
  };
  const style={"--genealogy-expand-inset":`${Math.max(0,rect.top)}px ${Math.max(0,window.innerWidth-rect.right)}px ${Math.max(0,window.innerHeight-rect.bottom)}px ${Math.max(0,rect.left)}px`} as CSSProperties;
  return createPortal(<div ref={shell} tabIndex={-1} className={`genealogy-expanded-shell${closing ? " is-minimizing" : ""}`} style={style} role="dialog" aria-modal="true" aria-label="Expanded genealogy" onKeyDown={event=>{
    if(event.key!=="Tab") return;
    const items=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(node=>node.getClientRects().length && !node.closest('[aria-hidden="true"]'));
    const first=items[0],last=items.at(-1);
    if(!first) {event.preventDefault();return;}
    if(event.shiftKey && (document.activeElement===first || document.activeElement===shell.current)) {event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
  }}>
    <Suspense fallback={<div className="genealogy-expansion-loading"><p>Opening genealogy...</p><button onClick={()=>minimize(view)}>Minimize</button></div>}><Map familyBands initialView={view} initialMode="tree" onMinimize={minimize} /></Suspense>
  </div>,document.body);
}
