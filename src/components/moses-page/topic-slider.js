export function mountTopicSlider(viewport, controls, group, groupIndex, signal) {
  const abort=new AbortController();
  const stop=()=>abort.abort();
  signal.addEventListener('abort',stop,{once:true});
  const sections=group.sections;
  viewport.className='topic-slider';
  viewport.tabIndex=0;
  viewport.setAttribute('aria-label',`${group.title}: scroll subsections sideways`);
  viewport.innerHTML=sections.map((section,index)=>{
    const copy=section.kingdomsGrid?`<div class="topic-kingdoms">${section.html}</div>`:section.title==='The nation under him'?`<div class="topic-nation">${section.html}</div>`:section.twoColumns?`<div class="topic-outcomes">${section.html}</div>`:section.html;
    return `<article class="topic-reading topic-slide" aria-label="${section.title}">${sections.length===1?'':`<span class="topic-index">0${groupIndex+1} / 0${index+1}</span><h3>${section.title}</h3>`}${copy}</article>`;
  }).join('');
  controls.className='topic-scrollbar';
  controls.hidden=sections.length<2;
  const arrow='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  controls.innerHTML=`<button type="button" data-topic-step="-1" aria-label="Previous subsection">${arrow}</button><input type="range" min="0" max="1000" value="0" aria-label="Subsection position"><output aria-live="polite"></output><button type="button" data-topic-step="1" aria-label="Next subsection">${arrow}</button>`;
  controls.style.setProperty('--topic-thumb',`${100/sections.length}%`);
  const range=controls.querySelector('input');
  const output=controls.querySelector('output');
  const slides=[...viewport.children];
  let current=-1;
  const update=()=>{
    const max=viewport.scrollWidth-viewport.clientWidth;
    range.value=String(max>0?Math.round(viewport.scrollLeft/max*1000):0);
    const index=Math.max(0,Math.min(sections.length-1,Math.round(viewport.scrollLeft/Math.max(1,viewport.clientWidth))));
    if(index!==current){current=index;output.textContent=`${index+1} / ${sections.length}`;range.setAttribute('aria-valuetext',`${sections[index].title}, ${index+1} of ${sections.length}`);slides.forEach((slide,i)=>slide.inert=i!==index);}
    controls.querySelector('[data-topic-step="-1"]').disabled=viewport.scrollLeft<1;
    controls.querySelector('[data-topic-step="1"]').disabled=viewport.scrollLeft>=max-1;
  };
  const go=index=>viewport.scrollTo({left:Math.max(0,Math.min(sections.length-1,index))*viewport.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  controls.addEventListener('click',event=>{const button=event.target.closest('[data-topic-step]');if(button)go(current+Number(button.dataset.topicStep));},{signal:abort.signal});
  range.addEventListener('input',()=>viewport.scrollTo({left:Number(range.value)/1000*(viewport.scrollWidth-viewport.clientWidth),behavior:'instant'}),{signal:abort.signal});
  viewport.addEventListener('scroll',update,{passive:true,signal:abort.signal});
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();go(event.key==='Home'?0:event.key==='End'?sections.length-1:current+(event.key==='ArrowRight'?1:-1));
  },{signal:abort.signal});
  const resize=new ResizeObserver(()=>{viewport.scrollTo({left:Math.max(current,0)*viewport.clientWidth,behavior:'instant'});update();});
  resize.observe(viewport);
  abort.signal.addEventListener('abort',()=>resize.disconnect(),{once:true});
  viewport.scrollLeft=0;update();
  return ()=>{signal.removeEventListener('abort',stop);stop();};
}
