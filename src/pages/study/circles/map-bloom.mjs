const NS='http://www.w3.org/2000/svg',tones=['--accent','--level2','--level3','--muted'];
const clamp=n=>Math.max(0,Math.min(1,n)),ease=t=>(1-Math.cos(Math.PI*t))/2;
let sequence=0;
const make=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;};
export function parseMap(markup){const box=document.createElement('template');box.innerHTML=markup;return box.content.firstElementChild;}

// Draw lines first, then reveal stationary dots clockwise. One path and
// one reveal mask per ring keep animation cost independent of the work count.
function sector(radius,progress){
 if(progress<=0)return '';
 if(progress>=1)return `M500 ${500-radius}a${radius} ${radius} 0 1 1 0 ${radius*2}a${radius} ${radius} 0 1 1 0 ${-radius*2}Z`;
 const angle=progress*Math.PI*2-Math.PI/2;
 return `M500 500L500 ${500-radius}A${radius} ${radius} 0 ${progress>.5?1:0} 1 ${500+Math.cos(angle)*radius} ${500+Math.sin(angle)*radius}Z`;
}
export function createMapBloom(svg,map,rings){
 const preview=make('g',{class:'map-preview-layer'});preview.append(...svg.childNodes);
 const final=parseMap(map.markup),finalMarkup=final.innerHTML,core=make('g',{class:'map-bloom-core'}),defs=make('defs'),id=++sequence;
 for(const child of [...final.children])if(!child.matches('.orbit,.ring-label,.dense-dot-batch'))core.append(child);
 const paths=rings.map(()=>[]);
 for(const n of map.nodes)paths[n.ringIndex].push(`M${(n.x-20).toFixed(2)} ${n.y.toFixed(2)}a20 20 0 1 0 40 0a20 20 0 1 0 -40 0Z`);
 const bands=rings.map((ring,i)=>{
  const clipId=`map-reveal-${id}-${i}`,clip=make('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'}),mask=make('path'),group=make('g',{class:'map-bloom-ring','data-ring':i});
  const circle=make('circle',{class:'orbit',cx:500,cy:500,r:ring.radius,pathLength:1,transform:'rotate(-90 500 500)'}),dots=make('path',{class:'map-bloom-dots',fill:`var(${tones[ring.level]})`,d:paths[i].join(''),'clip-path':`url(#${clipId})`});
  clip.append(mask);defs.append(clip);circle.style.strokeDasharray='1';group.append(circle,dots);return {group,circle,dots,mask,radius:ring.radius+40};
 });
 svg.replaceChildren(defs,core,...bands.map(b=>b.group),preview);svg.dataset.renderMode='bloom';svg.dataset.dotCount=map.nodes.length;svg.setAttribute('aria-label',final.getAttribute('aria-label'));svg.setAttribute('aria-busy','true');
 const frame=q=>{
  svg.dataset.bloomProgress=q.toFixed(3);svg.dataset.bloomPhase=q<.52?'lines':'dots';
  preview.style.opacity=String(1-ease(clamp(q/.24)));core.style.opacity=String(ease(clamp(q/.24)));
  bands.forEach((band,i)=>{const stagger=i/Math.max(1,bands.length-1)*.08,ring=ease(clamp((q-.02-stagger)/.38)),points=ease(clamp((q-.52-stagger)/.4));
   band.circle.style.strokeDashoffset=String(1-ring);band.circle.style.opacity=String(clamp(ring*4));
   band.dots.style.opacity=String(clamp(points*12));band.mask.setAttribute('d',sector(band.radius,points));
   band.group.dataset.lineProgress=ring.toFixed(3);band.group.dataset.dotProgress=points.toFixed(3);
  });
 };
 frame(0);
 return {frame,finish(){svg.innerHTML=finalMarkup;svg.dataset.renderMode='dots';svg.dataset.bloomProgress='1';delete svg.dataset.bloomPhase;svg.removeAttribute('aria-busy');}};
}

export function animateMapCamera({from,to,duration,alive,transform}){
 // Keep the center steady in screen space throughout the zoom.
 const startCentre={x:from.x+500*from.scale,y:from.y+500*from.scale},endCentre={x:to.x+500*to.scale,y:to.y+500*to.scale};
 return new Promise(resolve=>{
  let start=null;
  const frame=time=>{
   if(!alive()){resolve();return;}
   if(start===null)start=time;const q=duration?clamp((time-start)/duration):1,t=ease(q),scale=Math.exp(Math.log(from.scale)+(Math.log(to.scale)-Math.log(from.scale))*t);
   transform({scale,x:startCentre.x+(endCentre.x-startCentre.x)*t-500*scale,y:startCentre.y+(endCentre.y-startCentre.y)*t-500*scale},q);
   if(q<1)requestAnimationFrame(frame);else resolve();
  };requestAnimationFrame(frame);
 });
}
export async function animateMapBloom({bloom,transform,...options}){
 await animateMapCamera({...options,transform:(state,q)=>{transform(state);bloom.frame(q);}});
 if(options.alive())bloom.finish();
}
