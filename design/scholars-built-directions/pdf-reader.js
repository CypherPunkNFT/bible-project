import {getDocument,GlobalWorkerOptions,TextLayer} from './vendor/pdf.js';
GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.js',import.meta.url).href;

export async function renderPdf(bytes,body,{page=1,signal}){
 const loading=getDocument({data:bytes,useWasm:false,isEvalSupported:false});
 let observer,zoom,resizeObserver,resizeTimer,disposed=false;const jobs=new Map();
 const dispose=()=>{disposed=true;observer?.disconnect();resizeObserver?.disconnect();clearTimeout(resizeTimer);for(const job of jobs.values())job.task?.cancel();jobs.clear();zoom?.remove();loading.destroy();};
 signal.addEventListener('abort',dispose,{once:true});
 const pdf=await loading.promise;if(disposed)return;
 const first=await pdf.getPage(1),ratio=first.getViewport({scale:1});
 body.innerHTML='<div class="pdf-pages"></div>';
 const host=body.firstElementChild;let enlarged=false;
 zoom=document.createElement('button');zoom.className='pdf-zoom';zoom.textContent='Enlarge pages';zoom.setAttribute('aria-pressed','false');document.querySelector('#reader-meta').after(zoom);
 function layout(startPage){
  observer?.disconnect();for(const job of jobs.values())job.task?.cancel();jobs.clear();host.replaceChildren();
  const width=enlarged?1000:Math.min(900,body.clientWidth-32);host.style.width=width+'px';
  const boxes=[];
  for(let i=1;i<=pdf.numPages;i++){const box=document.createElement('section');box.className='pdf-page';box.dataset.page=String(i);box.setAttribute('aria-label',`Page ${i} of ${pdf.numPages}`);box.style.height=width*ratio.height/ratio.width+'px';boxes.push(box);host.append(box);}
  observer=new IntersectionObserver(entries=>entries.forEach(async entry=>{
   const box=entry.target;
   if(!entry.isIntersecting){const old=jobs.get(box);old?.task?.cancel();jobs.delete(box);box.replaceChildren();delete box.dataset.rendered;return;}
   if(jobs.has(box))return;const job={task:null};jobs.set(box,job);
   try{
    const pdfPage=await pdf.getPage(Number(box.dataset.page));if(disposed||jobs.get(box)!==job)return;
    const viewport=pdfPage.getViewport({scale:width/pdfPage.getViewport({scale:1}).width});
    const canvas=document.createElement('canvas'),factor=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(viewport.width*factor);canvas.height=Math.ceil(viewport.height*factor);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';canvas.setAttribute('aria-hidden','true');box.style.height=viewport.height+'px';box.append(canvas);
    job.task=pdfPage.render({canvasContext:canvas.getContext('2d'),viewport,transform:factor===1?null:[factor,0,0,factor,0,0]});await job.task.promise;
    if(disposed||jobs.get(box)!==job)return;
    const layer=document.createElement('div');layer.className='textLayer';layer.style.setProperty('--total-scale-factor',String(viewport.scale));box.append(layer);await new TextLayer({textContentSource:pdfPage.streamTextContent(),container:layer,viewport}).render();
    box.dataset.rendered='true';
   }catch(error){if(disposed||jobs.get(box)!==job||error.name==='RenderingCancelledException')return;box.innerHTML='<p class="reader-message">This page could not be displayed. Use the original source below.</p>';}
  }),{root:body,rootMargin:'600px 0px'});
  boxes.forEach(box=>observer.observe(box));body.scrollTop=boxes[Math.min(Math.max(startPage-1,0),boxes.length-1)]?.offsetTop-host.offsetTop||0;
 }
 zoom.onclick=()=>{const active=[...host.children].find(box=>box.offsetTop+box.offsetHeight>body.scrollTop+host.offsetTop);enlarged=!enlarged;zoom.textContent=enlarged?'Fit pages':'Enlarge pages';zoom.setAttribute('aria-pressed',String(enlarged));layout(Number(active?.dataset.page)||1);};
 layout(page);
 let lastWidth=body.clientWidth;
 resizeObserver=new ResizeObserver(()=>{
  if(disposed||enlarged||Math.abs(body.clientWidth-lastWidth)<2)return;
  lastWidth=body.clientWidth;clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{if(disposed)return;const active=[...host.children].find(box=>box.offsetTop+box.offsetHeight>body.scrollTop+host.offsetTop);layout(Number(active?.dataset.page)||1);},120);
 });resizeObserver.observe(body);
}
