import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Keep the previous grid on screen during data loading; fade between measured layouts. */
export function LongMemoryChartTransition({view,ready,children}:{view:string;ready:boolean;children:ReactNode}) {
  const reduced=useReducedMotion();
  const [shown,setShown]=useState({view,children});
  const [height,setHeight]=useState<number>();
  const measure=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{if(ready)setShown({view,children});},[view,ready,children]);
  useLayoutEffect(()=>{
    const element=measure.current;
    if(!element)return;
    const resize=()=>setHeight(element.getBoundingClientRect().height);
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  return <motion.div className="lm-chart-transition" aria-busy={!ready} initial={false}
    animate={{height:height??"auto"}} transition={{duration:reduced?0:.42,ease:[.22,1,.36,1]}}>
    <div ref={measure} className="lm-chart-measure">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div key={shown.view} className="lm-chart-view" data-chart-view={shown.view}
          initial={{opacity:reduced?1:0,y:reduced?0:12}}
          animate={{opacity:ready?1:.55,y:0,pointerEvents:ready?"auto":"none"}}
          exit={{opacity:0,y:reduced?0:-8,pointerEvents:"none"}}
          transition={{duration:reduced?0:.3,ease:[.22,1,.36,1]}}
          style={{pointerEvents:ready?"auto":"none"}}>
          {shown.children}
        </motion.div>
      </AnimatePresence>
    </div>
  </motion.div>;
}
