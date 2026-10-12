import {useEffect,useRef,type MouseEvent} from 'react';
import {flushSync} from 'react-dom';
import {useLocation,useNavigate} from 'react-router-dom';
import {preloadTeacherSide} from './page-loaders';
import {SIDE_PATHS,type Side} from './sides';
type Transition={finished:Promise<void>;skipTransition:()=>void};
type TransitionDocument=Document&{startViewTransition?:(update:()=>Promise<void>)=>Transition};
const clear=()=>{delete document.documentElement.dataset.teacherSlide;document.documentElement.style.removeProperty('--teacher-old-shift');};
export function useTeacherTransition() {
  const location=useLocation(),navigate=useNavigate(),generation=useRef(0);
  const active=useRef<{from:string;to:string;committed:boolean;transition?:Transition}|null>(null);
  useEffect(()=>{
    const pending=active.current;
    if(pending&&location.pathname!==(pending.committed?pending.to:pending.from)){generation.current++;pending.transition?.skipTransition();active.current=null;clear();}
  },[location.pathname]);
  useEffect(()=>()=>{generation.current++;active.current?.transition?.skipTransition();clear();},[]);
  return async(event:MouseEvent<HTMLDivElement>)=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('.tp-sides a[href]'):null;
    if(!link||link.target||link.hasAttribute('download'))return;
    const to=new URL(link.href),side=(Object.keys(SIDE_PATHS) as Side[]).find(side=>SIDE_PATHS[side]===to.pathname);
    if(to.origin!==window.location.origin||!side)return;
    event.preventDefault();
    const run=++generation.current;
    active.current?.transition?.skipTransition();active.current=null;clear();
    if(to.pathname===location.pathname)return;
    const pending={from:location.pathname,to:to.pathname,committed:false,transition:undefined as Transition|undefined};active.current=pending;
    try{await preloadTeacherSide(side);}catch{if(run===generation.current){active.current=null;navigate(to.pathname);}return;}
    if(run!==generation.current)return;
    const oldTop=document.querySelector('.tp-route-content')?.getBoundingClientRect().top;
    const update=async()=>{
      if(run!==generation.current)return;
      pending.committed=true;
      flushSync(()=>navigate(to.pathname));
      const start=performance.now();
      // React.lazy can commit one microtask after its preloaded module. Snapshot only ready content.
      while(run===generation.current&&!document.querySelector(`.tp-route-content .tp-${side}`)&&performance.now()-start<2000)await new Promise(resolve=>setTimeout(resolve,10));
      if(run!==generation.current)return;
      window.scrollTo({top:0,behavior:'instant'});
      const newTop=document.querySelector('.tp-route-content')?.getBoundingClientRect().top;
      if(oldTop!==undefined&&newTop!==undefined)document.documentElement.style.setProperty('--teacher-old-shift',`${oldTop-newTop}px`);
    };
    const doc=document as TransitionDocument;
    if(!doc.startViewTransition||window.matchMedia('(prefers-reduced-motion: reduce)').matches){await update();if(run===generation.current){active.current=null;clear();}return;}
    document.documentElement.dataset.teacherSlide='fade';
    pending.transition=doc.startViewTransition(update);
    void pending.transition.finished.catch(()=>undefined).then(()=>{if(run===generation.current){active.current=null;clear();}});
  };
}
