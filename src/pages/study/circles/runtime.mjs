import {layoutWorks,previewMarkup} from './graph-layout.mjs';
import {parseMap,createMapBloom,animateMapBloom,animateMapCamera} from './map-bloom.mjs';
import {DenseWorkMap} from './dense-map.mjs';
export async function mountCircles(root,options={}){
const cleanups=[],app=root.querySelector('.circles-app');let disposed=false;
const on=(target,event,callback,opts)=>{target.addEventListener(event,callback,opts);cleanups.push(()=>target.removeEventListener(event,callback,opts));};
const watch=(Observer,callback,opts)=>{const observer=new Observer(callback,opts);cleanups.push(()=>observer.disconnect());return observer;};
const asset=name=>'/circles/'+name;

const $=s=>root.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>/^(https?:\/\/|\/(?!\/))/.test(s??'')?esc(s):'#';
const icon=(name,cls='')=>`<svg class="${cls}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">${({book:'<path d="M4 6c5-2 9-1 12 2 3-3 7-4 12-2v20c-5-2-9-1-12 1-3-2-7-3-12-1Z"/><path d="M16 8v19M8 11l5 1m-5 5 5 1m7-6 5-1m-5 7 5-1"/>',arch:'<path d="M6 28V14a10 10 0 0 1 20 0v14M11 28V14a5 5 0 0 1 10 0v14M3 28h26M16 4v5"/>',compass:'<circle cx="16" cy="16" r="12"/><path d="m21 10-3 9-8 3 3-9Z M16 1v4m0 22v4M1 16h4m22 0h4"/>',layers:'<path d="m3 10 13-6 13 6-13 6ZM3 16l13 6 13-6M3 22l13 6 13-6M16 4v-2"/>',spark:'<circle cx="16" cy="16" r="12"/><path d="m16 7 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/>',columns:'<path d="M3 8 16 3l13 5ZM4 28h24M6 11v14m5-14v14m10-14v14m5-14v14M3 25h26"/>',orbit:'<circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="3"/><circle cx="28" cy="11" r="2" fill="currentColor"/><circle cx="10" cy="21" r="1.8" fill="currentColor"/>'})[name]||''}</svg>`;
const response=await fetch(asset('catalogue.json'),{signal:options.signal});if(!response.ok)throw new Error('The study catalogue could not load.');
const readerResponse=await fetch(asset('readers.json'),{signal:options.signal});
const readerData=readerResponse.ok?await readerResponse.json():{readers:{}};
const featured=new Set(readerData.featured||[]);
const catalogue=await response.json();if(options.signal?.aborted)return()=>{};
const data=catalogue,{categories,studies,works,leaders}=data,workById=new Map(works.map(w=>[w.id,w])),leaderById=new Map(leaders.map(p=>[p.id,p]));
for(const w of Object.values(data.leaderWorks||{}).flat())workById.set(w.id,w);
let studyId='letters',leaderId=null,selected=null,limit=24,nodes=[],mapRings=[],currentMap=null,mapOpen=false;
const workPositions=new Map();
const priorityLevel=index=>index<8?0:index<24?1:2;
const centreMap=()=>{const g=$('#graph');g.scrollLeft=(g.scrollWidth-g.clientWidth)/2;};
const study=()=>studies.find(s=>s.id===studyId),category=()=>categories.find(c=>c.id===study().category),leader=()=>leaderById.get(leaderId);
const initial=s=>s.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('');
const life=p=>p.born?`${p.born}${p.died?`–${p.died}`:''}`:'';
const year=w=>{const y=Number(w.year.match(/-?\d{1,4}/)?.[0]);const p=leaderById.get(w.leader);return y&&(w.originalDate||(!p.born||y>=p.born)&&(!p.died||y<=p.died))?y:null;};
const entry=w=>study().works.find(x=>x.id===w.id);
const collectionCache=new Map();
function collection(){
 const id=leaderId||studyId;if(collectionCache.has(id))return collectionCache.get(id);
 const items=leaderId?[...works.filter(w=>w.leader===leaderId),...(data.leaderWorks?.[leaderId]||[])].sort((a,b)=>(year(a)??9999)-(year(b)??9999)||(a.fullDate||a.year).localeCompare(b.fullDate||b.year)||a.title.localeCompare(b.title)):study().works.map(r=>workById.get(r.id));
 collectionCache.set(id,items);return items;
}
function matches(w,q){return(w.title+' '+w.author+' '+(w.number||'')+' '+(w.passages||[]).join(' ')).toLowerCase().includes(q.toLowerCase());}
function wrap(text,width=21,count=2){const words=text.split(/\s+/),lines=[''];for(const word of words){let i=lines.length-1;if(lines[i].length+word.length+1>width&&lines[i]){if(lines.length===count){lines[i]=lines[i].replace(/[.,;:]?$/,'')+'…';break;}lines.push(word);}else lines[i]+=(lines[i]?' ':'')+word;}return lines.map(l=>l.length>width+3?l.slice(0,width+1)+'…':l);}
// Dense views keep batched dots and materialize detail only near the viewport.
let denseMap=null;
function dotMap(){
 const extent=Math.max(1000,(mapRings.at(-1)?.radius||410)*2+180);
 denseMap=new DenseWorkMap(nodes,{label:leaderId?leader().name:study().label,year,wrap,escape:esc,positions:workPositions,rings:mapRings,centre:wrap(leaderId?leader().short:study().label,16,3),subtitle:leaderId?'THROUGH TIME':nodes.length+' WORKS',viewBox:mapOpen?'0 0 1000 1000':`${500-extent/2} ${500-extent/2} ${extent} ${extent}`,dated:!!leaderId});
 return denseMap.markup;
}
function urlFor(id,person=null){const p=new URLSearchParams({study:id});if(person)p.set('leader',person);return person?'/teachers/collections/'+encodeURIComponent(person)+'?'+new URLSearchParams({study:id}):'/study/circles?'+p;}
function readURL(){const q=new URLSearchParams(location.search);if(q.has('count')){const address=new URL(location.href);address.searchParams.delete('count');history.replaceState(history.state,'',address);}studyId=studies.some(s=>s.id===q.get('study'))?q.get('study'):'letters';leaderId=leaderById.has(options.leaderId||q.get('leader'))?(options.leaderId||q.get('leader')):null;selected=null;limit=24;$('#search').value='';$('#shelf-search').value='';}
function navigate(id){studyId=id;leaderId=null;selected=null;limit=24;$('#search').value='';$('#shelf-search').value='';location.assign(urlFor(studyId));}
function frame(){app.classList.toggle('leader-view',!!leaderId);const c=category(),p=leader();
 $('#breadcrumb').innerHTML=`<a href="/study">Study</a><span>/</span><a href="${urlFor(studyId)}">Circles of study</a>${p?`<span>/</span><span>${esc(p.name)}</span>`:''}`;
 $('#hero-kicker').textContent=p?p.kind.toUpperCase():'THE STUDY LIBRARY';$('#hero-title').innerHTML=p?esc(p.name):'Circles of <em>study.</em>';
 $('#hero-line').textContent=p?(p.line||'Explore the works, follow their dates, and return to the studies they shape.'):'Begin with a subject. Follow the works that deepen it.';
 document.title=(p?p.name+' · Works':'Circles of study')+' · Bible Project';
 $('#categories').innerHTML=categories.map(c=>`<button class="category-card" style="--tone:${c.tone}" data-category="${c.id}" aria-pressed="${c.id===category().id}">${icon(c.icon,'category-icon')}<span class="category-arrow">↗</span><strong>${esc(c.label)}</strong><small>${studies.filter(s=>s.category===c.id).length} subjects · ${esc(c.tag)}</small></button>`).join('');
 $('#collection-heading').innerHTML=p?`<div class="collection-mark">${icon('orbit')}</div><div><p class="eyebrow">PROMINENT WORKS &amp; SELECTED SERMONS</p><h2>A life in <em>words.</em></h2></div>`:`<div class="collection-mark">${icon(c.icon)}</div><div><p class="eyebrow">CIRCLES OF STUDY</p><h2>${esc(c.label)}</h2></div>`;
 $('#subcategories').innerHTML=studies.filter(s=>s.category===c.id).map(s=>`<button data-study="${s.id}" aria-current="${s.id===studyId}">${esc(s.label)}</button>`).join('');
}
function buildLayout(expanded){const all=collection();return layoutWorks({all,items:all.filter(w=>matches(w,$('#search').value)),dated:!!leaderId,year,featured,selected,expanded});}
function pageMarkup(layout){return previewMarkup(layout,{label:leaderId?leader().name:study().label,centre:leaderId?leader().short:study().label,dated:!!leaderId,year,escape:esc,wrap,selected});}
function useLayout(layout){nodes=layout.nodes;mapRings=layout.rings;$('#map-legend').innerHTML=layout.levels.map((label,i)=>`<span style="--tone:var(${['--accent','--level2','--level3','--muted'][i]})"><i></i>${esc(label)}</span>`).join('');}
function renderGraph(markup){
 const next=parseMap(markup),current=$('#graph svg');
 if(!current){$('#graph').append(next);return;}
 current.replaceChildren(...next.childNodes);
 for(const attr of [...current.attributes])if(attr.name!=='style')current.removeAttribute(attr.name);
 for(const attr of next.attributes)current.setAttribute(attr.name,attr.value);
 current.style.removeProperty('--dot-opacity');if(!mapOpen)current.style.removeProperty('transform');
}
function draw(){
 const all=collection(),layout=buildLayout(mapOpen);useLayout(layout);renderGraph(mapOpen?dotMap():pageMarkup(layout));
 $('#map-note').hidden=!!layout.shown.length;$('#map-note').textContent='No matching works.';
 if(mapOpen){syncMapReader();requestAnimationFrame(applyMapTransform);}
 inspect();connections();shelf(layout.shown,all);const mapKey=leaderId||studyId;if(!mapOpen&&currentMap!==mapKey){currentMap=mapKey;requestAnimationFrame(centreMap);}
}
function authorCard(p){return`<a class="author-card" href="${urlFor(studyId,p.id)}"><span class="avatar">${esc(initial(p.name))}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.kind)}${life(p)?' · '+life(p):''}</small><small>Explore their works</small></span><span class="arrow">↗</span></a>`;}
function inspect(){const el=$('#inspect'),w=workById.get(selected),p=leader();$('#right-panel').classList.toggle('map-overview',!w);if(!w){const n=collection().length;el.innerHTML=leaderId?`${icon('orbit','panel-orbit')}<p class="eyebrow">THROUGH THE YEARS</p><h3>${esc(p.name)}</h3><p>${esc(p.line||'A closer look at the works in the collection.')}</p><div class="panel-stats"><span><b>${n}</b><small>catalogued works</small></span><span><b>${collection().filter(w=>year(w)!==null).length}</b><small>dated in their lifetime</small></span></div><a class="primary-link" href="${safe(p.library)}">Browse the library <span>↗</span></a>`:`${icon('orbit','panel-orbit')}<p class="eyebrow">AT THE CENTRE</p><h3>${esc(study().label)}</h3><p>A reading path through the works behind this subject.</p><div class="panel-stats"><span><b>${mapOpen?n:Math.min(48,n)}</b><small>works in the rings</small></span><span><b>${new Set(collection().map(w=>w.leader)).size}</b><small>contributors</small></span></div><a class="primary-link" href="${safe(study().url)}">Open this study <span>↗</span></a><details><summary>How priority is arranged</summary><p>Level I: the first eight works. Level II: the next sixteen. Level III: further reading. Expand the map for the complete collection. Recorded use leads, followed by further and curated reading. Curated collections are a proposed reading order.</p></details>`;return;}
 const person=leaderById.get(w.leader),meta=entry(w),rank=collection().indexOf(w)+1;
 const refs=w.records.flatMap(r=>r.uses.map(u=>({...u,url:r.url}))),seen=new Set();const evidence=refs.filter(u=>{const k=u.address+'|'+u.locator;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,12);
 el.innerHTML=`<div class="panel-label">${leaderId?'THE WORK':`<span>${['LEVEL I','LEVEL II','LEVEL III'][priorityLevel(rank-1)]}</span> · PRIORITY ${String(rank).padStart(2,'0')}`}</div><h3>${esc(w.title)}</h3><div class="work-year">${esc(w.fullDate||w.year||'Date not recorded')}${w.dateEvent?' · '+(w.dateEvent==='delivery'?'Preached':'Published'):''}${!leaderId?' · '+esc(meta?.kind||'Related reading'):''}</div>${authorCard(person)}<p>${esc(w.author)}${w.number?` · No. ${esc(w.number)}`:''}${w.passages?.length?`<br>${esc(w.passages.join('; '))}`:''}</p>${w.dateNote?`<p>${esc(w.dateNote)}</p>`:''}<button class="primary-link" data-read="${w.id}">Read this work <span>↗</span></button>${evidence.length?`<details><summary>Where this work appears · ${evidence.length}</summary><div class="evidence slim-scroll">${evidence.map(u=>`<a href="${safe(u.address)}">${esc(u.page)} ↗</a><p>${esc(u.locator)}</p>`).join('')}</div></details>`:''}`;
}
function connections(){const ids=new Set(selected?[selected]:collection().map(w=>w.id)),related=studies.filter(s=>leaderId||s.id!==studyId).map(s=>({...s,shared:s.works.filter(w=>ids.has(w.id)).length})).filter(s=>s.shared).sort((a,b)=>b.shared-a.shared).slice(0,5);$('#connections').innerHTML=`<p class="eyebrow">FOLLOW THE CONNECTION</p><h3>Connected studies</h3>${related.map(s=>`<button class="connection" data-study="${s.id}"><span><strong>${esc(s.label)}</strong><small>${esc(categories.find(c=>c.id===s.category).label)} · ${s.shared} shared work${s.shared===1?'':'s'}</small></span><span>↗</span></button>`).join('')||'<p>No other study in this collection shares these works yet.</p>'}`;}
let shelfItems=[],shelfKey='',shelfAll=[];
function shelf(_list,all){
 const query=$('#shelf-search').value.trim(),key=(leaderId||studyId)+'|'+query.toLowerCase();
 $('#shelf-title').textContent=`All ${all.length.toLocaleString()} collected works.`;
 if(key===shelfKey)return;
 shelfKey=key;shelfAll=all;shelfItems=all.filter(w=>matches(w,query));limit=0;
 $('#results').replaceChildren();$('#shelf-scroll').scrollTop=0;
 $('#result-count').textContent=query?`${shelfItems.length.toLocaleString()} matching works`:'';
 appendShelf();
}
function appendShelf(){
 const next=shelfItems.slice(limit,limit+24);
 $('#results').insertAdjacentHTML('beforeend',next.map(w=>`<button class="result-card" data-read="${w.id}"><span class="shelf-number">${String(shelfAll.indexOf(w)+1).padStart(2,'0')}</span><span class="shelf-copy"><strong>${esc(w.title)}</strong><small>${esc(w.author)}</small><span class="shelf-rank">${esc(w.fullDate||w.year||'Date not recorded')}${w.number?' &middot; Sermon '+esc(w.number):''}</span></span><span class="read-arrow" aria-hidden="true">&nearr;</span></button>`).join(''));
 limit+=next.length;
 $('#shelf-sentinel').textContent=!shelfItems.length?'No matching works. Try another title, number or passage.':limit<shelfItems.length?'Keep scrolling to explore':'You have reached the end of the collection.';
}
watch(IntersectionObserver,entries=>{if(entries.some(e=>e.isIntersecting)&&limit<shelfItems.length)appendShelf();},{root:$('#shelf-scroll'),rootMargin:'0px 0px 280px 0px'}).observe($('#shelf-sentinel'));
$('#shelf-search').oninput=()=>shelf(null,collection());
function menu(){const q=$('#menu-search').value.toLowerCase();$('#menu-grid').innerHTML=categories.map(c=>{const subs=studies.filter(s=>s.category===c.id&&(s.label+' '+c.label).toLowerCase().includes(q));return subs.length?`<section class="menu-group" style="--tone:${c.tone}"><h3>${esc(c.label)}</h3>${subs.map(s=>`<button data-study="${s.id}">${esc(s.label)} <span>↗</span></button>`).join('')}</section>`:'';}).join('')||'<p class="empty">No subjects found.</p>';}
function render(){frame();draw();}
const dialog=$('#browse-dialog');on(dialog,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();dialog.close();}});$('#browse-open').onclick=()=>{menu();dialog.showModal();$('#menu-search').focus();};$('#browse-close').onclick=()=>dialog.close();on(dialog,'close',()=>$('#browse-open').focus());on(dialog,'click',e=>{if(e.target===dialog)dialog.close();});$('#menu-search').oninput=menu;
on(root,'click',e=>{const read=e.target.closest('[data-read]');if(read){openReader(workById.get(read.dataset.read),read);return;}const work=e.target.closest('[data-work]'),cat=e.target.closest('[data-category]'),sub=e.target.closest('[data-study]');if(!mapOpen&&!work&&e.target.closest('#graph'))return;if(work){const restore=work.closest('#graph')?work.dataset.work:null;selected=selected===work.dataset.work?null:work.dataset.work;draw();if(restore)$('#graph').querySelector(`[data-work="${restore}"]`)?.focus({preventScroll:true});if(!mapOpen&&(!restore||innerWidth<821))$('#inspect').scrollIntoView({block:'nearest'});}else if(cat){navigate(studies.find(s=>s.category===cat.dataset.category).id);}else if(sub){if(mapOpen)$('#map-dialog').close();if(dialog.open)dialog.close();navigate(sub.dataset.study);}});
$('#graph').onkeydown=e=>{if(mapOpen&&handleMapKey(e))return;if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-work]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(e.key==='Escape'){selected=null;draw();$('#graph').focus();}};
$('#search').oninput=()=>{selected=null;draw();};$('#clear-selection').onclick=()=>{selected=null;$('#search').value='';draw();};watch(ResizeObserver,()=>requestAnimationFrame(()=>{if(mapTransitioning)return;mapOpen?applyMapTransform():centreMap();})).observe($('#graph'));
on(window,'popstate',()=>{readURL();render();});readURL();render();

const reader=$('#reader-dialog');let readerAbort=null,readerBlob=null,readerTrigger=null,textObserver=null,inlineReader=null,inlineReaderWork=null;
function mountMapReader(){
 if(inlineReader)return;
 inlineReader=document.createElement('section');inlineReader.className='map-inline-reader';inlineReader.setAttribute('aria-label','Read selected work');
 inlineReader.append(...reader.childNodes);$('#right-panel').append(inlineReader);
 $('#reader-close').setAttribute('aria-label','Back to work overview');
 $('#map-dialog').classList.add('map-reading','map-panel-open');
 $('#right-panel').scrollTop=0;
}
function closeInlineReader(){
 if(!inlineReader)return;
 clearReader();reader.append(...inlineReader.childNodes);inlineReader.remove();inlineReader=null;inlineReaderWork=null;
 $('#reader-close').setAttribute('aria-label','Close reader');$('#map-dialog').classList.remove('map-reading');
}
function syncMapReader(){
 if(!selected){closeInlineReader();return;}
 if(selected!==inlineReaderWork)openReader(workById.get(selected),$('#graph'));
}
function clearReader(){readerAbort?.abort();textObserver?.disconnect();$('#reader-body').replaceChildren();if(readerBlob)URL.revokeObjectURL(readerBlob);readerBlob=null;}
on(reader,'close',()=>{clearReader();app.classList.remove('reader-open');readerTrigger?.focus({preventScroll:true});});
$('#reader-close').onclick=()=>{if(inlineReader){selected=null;closeInlineReader();inspect();connections();applyMapTransform();$('#graph').focus({preventScroll:true});}else reader.close();};
on(reader,'click',e=>{if(e.target===reader)reader.close();});
async function openReader(w,trigger,part=0){
 if(!w)return;
 if(mapOpen){mountMapReader();inlineReaderWork=w.id;}
 else closeInlineReader();
 clearReader();readerTrigger=trigger;const controller=new AbortController();readerAbort=controller;
 const sourceRecord=readerData.readers[w.id],record=sourceRecord?.parts?.[part]||sourceRecord,body=$('#reader-body');
 $('#reader-title').textContent=w.title;
 $('#reader-kicker').textContent=record?.edition||'FROM THE READING SHELF';
 $('#reader-meta').textContent=[w.author,w.fullDate||w.year,w.number?'Sermon '+w.number:''].filter(Boolean).join(' · ');
 $('#reader-editions')?.remove();
 if(sourceRecord?.parts){const select=document.createElement('select');select.id='reader-editions';select.setAttribute('aria-label','Choose a volume');select.innerHTML=sourceRecord.parts.map((p,i)=>`<option value="${i}">${esc(p.edition)}</option>`).join('');select.value=String(part);select.onchange=()=>openReader(w,trigger,Number(select.value));$('#reader-meta').after(select);}
 $('#reader-credit').textContent=record?.credit||w.author;
 const source=record?.source||w.url;
 $('#reader-source').hidden=!source;$('#reader-source').href=source||'#';
 body.innerHTML='<p class="reader-message" role="status">Opening the work…</p>';
 if(!mapOpen){app.classList.add('reader-open');if(!reader.open)reader.showModal();}body.scrollTop=0;
 if(!record){
  body.innerHTML=`<div class="reader-message"><h3>Read at the source</h3><p>This work has a catalogue entry here; its reading copy is available through the source library.</p><a class="primary-link" href="${safe(source||'/apologetics/texts?q='+encodeURIComponent(w.title))}" target="_blank" rel="noopener">${source?'Open the original work':'Find this work in the library'} ↗</a></div>`;
  return;
 }
 try{
  const response=await fetch(record.file,{signal:controller.signal,headers:{Range:`bytes=${record.offset}-${record.offset+record.length-1}`}});if(!response.ok)throw new Error('The reading copy could not be loaded.');
  const buffer=await response.arrayBuffer();if(controller.signal.aborted)return;
  const payload={mime:record.mime};
  const bytes=new Uint8Array(response.status===206?buffer:buffer.slice(record.offset,record.offset+record.length));
  if(payload.mime==='application/pdf'){
   const {renderPdf}=await import(/* @vite-ignore */ asset('pdf-reader.js'));if(controller.signal.aborted)return;
   await renderPdf(bytes,body,{page:record.page,signal:controller.signal,controls:$('#reader-meta')});
  }else{
   const text=new TextDecoder().decode(bytes);let blocks=[];
   if(payload.mime==='text/plain')blocks=text.split(/\n\s*\n/).filter(t=>t.trim()).map(t=>({tag:'p',text:t}));
   else{
    const doc=new DOMParser().parseFromString(text,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('This edition could not be displayed. Open the original source below.');
    const content=doc.getElementsByTagName('ThML.body')[0]||doc.documentElement;
    blocks=[...content.querySelectorAll('h1,h2,h3,h4,p,pre,li')].filter(el=>!el.parentElement?.closest('p,pre,li')).map(el=>({tag:/^h[1-4]$/.test(el.tagName)?'h3':'p',text:el.textContent}));
   }
   body.innerHTML='<article class="reader-text"></article><div class="reader-sentinel" role="status"></div>';
   const article=body.querySelector('article'),sentinel=body.querySelector('.reader-sentinel');let position=0;
   const append=()=>{for(const block of blocks.slice(position,position+60)){const el=document.createElement(block.tag);el.textContent=block.text;article.append(el);}position=Math.min(position+60,blocks.length);sentinel.textContent=position<blocks.length?'Continue reading':'End of this edition';};
   append();textObserver=watch(IntersectionObserver,entries=>{if(entries.some(e=>e.isIntersecting)&&position<blocks.length)append();},{root:body,rootMargin:'500px'});textObserver.observe(sentinel);
  }
 }catch(error){if(!controller.signal.aborted)body.innerHTML=`<p class="reader-message" role="alert">${esc(error.message)} Use “Open original source” below to continue reading.</p>`;}
}

// The page keeps a prominent-work preview; expansion blooms into the full collection.
const mapDialog=$('#map-dialog'),workspace=$('.workspace'),mapHome=document.createComment('map-home'),graph=$('#graph');
workspace.before(mapHome);
let mapScale=1,mapX=0,mapY=0,drag=null,pinch=null,ignoreMapClick=false,mapTransitioning=false,inlineMapState=null,mapPlaceholder=null;
const mapPointers=new Map();
on(mapDialog,'close',closeInlineReader);
let hoveredWork=null,mapDetailFrame=0;
function applyMapTransform(){if(!mapOpen||mapDetailFrame)return;mapDetailFrame=requestAnimationFrame(()=>{mapDetailFrame=0;renderMapDetails();});}
function renderMapDetails(){
 if(!mapOpen)return;const svg=graph.querySelector('svg');if(!svg)return;
 svg.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;$('#map-fit').textContent=Math.round(mapScale*100)+'%';
 denseMap.render(svg,{scale:mapScale,x:mapX,y:mapY,width:graph.clientWidth,height:graph.clientHeight,selected,hovered:hoveredWork});
}
function fitMap(){
 if(!mapOpen)return;const extent=Math.max(1000,(mapRings.at(-1)?.radius||410)*2+180);
 mapScale=Math.max(.005,Math.min(graph.clientWidth/extent,graph.clientHeight/extent)*.94);
 mapX=(graph.clientWidth-1000*mapScale)/2;mapY=(graph.clientHeight-1000*mapScale)/2;applyMapTransform();
}
function ensureInteractiveMap(){if(mapOpen&&!graph.querySelector('[data-render-mode="dots"]'))draw();}
function zoomMap(factor,x=graph.clientWidth/2,y=graph.clientHeight/2){
 ensureInteractiveMap();
 const next=Math.max(.005,Math.min(16,mapScale*factor)),ratio=next/mapScale;
 mapX=x-(x-mapX)*ratio;mapY=y-(y-mapY)*ratio;mapScale=next;applyMapTransform();
}
const transitionDuration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:620;
const transitionEase='cubic-bezier(.22,1,.36,1)';
$('#zoom').onclick=async()=>{
 if(mapOpen||mapTransitioning)return;
 const svg=graph.querySelector('svg'),matrix=svg.getScreenCTM(),card=$('.explorer').getBoundingClientRect(),panel=$('#right-panel').getBoundingClientRect();
 inlineMapState={svg,matrix,card,panel,cardStyles:[...root.querySelectorAll('#right-panel .panel')].map(el=>({padding:getComputedStyle(el).padding,titleSize:el.querySelector('h3')?getComputedStyle(el.querySelector('h3')).fontSize:null})),viewBox:svg.getAttribute('viewBox'),scrollLeft:graph.scrollLeft,pageX:scrollX,pageY:scrollY};
 mapPlaceholder=document.createElement('div');mapPlaceholder.style.height=workspace.getBoundingClientRect().height+'px';mapPlaceholder.setAttribute('aria-hidden','true');mapHome.after(mapPlaceholder);
 mapTransitioning=true;mapOpen=true;mapDialog.classList.remove('map-panel-open');mapDialog.classList.add('map-transitioning');$('#map-details').setAttribute('aria-pressed','false');$('#map-title').textContent=leaderId?leader().name:study().label;
 $('#map-host').append(workspace);app.classList.add('map-open');mapDialog.showModal();graph.scrollLeft=0;graph.scrollTop=0;
 svg.setAttribute('viewBox','0 0 1000 1000');const target=graph.getBoundingClientRect();mapScale=matrix.a;mapX=matrix.e-target.left;mapY=matrix.f-target.top;
 svg.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;$('#map-fit').textContent=Math.round(mapScale*100)+'%';
 const duration=transitionDuration(),options={duration,easing:transitionEase,fill:'both'};
 const clip=`inset(${Math.max(0,card.top)}px ${Math.max(0,innerWidth-card.right)}px ${Math.max(0,innerHeight-card.bottom)}px ${Math.max(0,card.left)}px round 18px)`;
 const animations=[mapDialog.animate([{clipPath:clip},{clipPath:'inset(0px 0px 0px 0px round 0px)'}],options)];
 for(const el of [$('.map-header'),$('#map-legend')])animations.push(el.animate([{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{...options,delay:duration*.18,duration:duration*.65}));
 const sidebar=$('#right-panel'),next=sidebar.getBoundingClientRect();animations.push(sidebar.animate([{transform:`translate(${panel.left-next.left}px,${panel.top-next.top}px) scale(${panel.width/next.width},${panel.height/next.height})`,opacity:.65},{transform:'none',opacity:1}],options));
 useLayout(buildLayout(true));dotMap();inspect();
 const bloom=createMapBloom(svg,denseMap,mapRings),extent=Math.max(1000,(mapRings.at(-1)?.radius||410)*2+180);
 const targetScale=Math.min(mapScale,Math.max(.005,Math.min(graph.clientWidth/extent,graph.clientHeight/extent)*.94));
 const reveal=animateMapBloom({bloom,from:{scale:mapScale,x:mapX,y:mapY},to:{scale:targetScale,x:(graph.clientWidth-1000*targetScale)/2,y:(graph.clientHeight-1000*targetScale)/2},duration:duration?3600:0,alive:()=>!disposed&&mapOpen,transform:state=>{mapScale=state.scale;mapX=state.x;mapY=state.y;svg.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;$('#map-fit').textContent=Math.round(mapScale*100)+'%';}});
 await Promise.all([...animations.map(a=>a.finished.catch(()=>{})),reveal]);if(disposed)return;animations.forEach(a=>a.cancel());mapDialog.classList.remove('map-transitioning');mapTransitioning=false;applyMapTransform();
};
function measurePageReturn(){
 const probe=workspace.cloneNode(true);probe.style.visibility='hidden';probe.inert=true;probe.setAttribute('aria-hidden','true');
 probe.querySelector('.map-inline-reader')?.remove();
 const probeGraph=probe.querySelector('#graph'),preview=pageMarkup(buildLayout(false)),svg=parseMap(preview);
 probeGraph.replaceChildren(svg);
 mapPlaceholder.replaceWith(probe);probeGraph.scrollLeft=inlineMapState.scrollLeft;
 const panel=probe.querySelector('#right-panel'),styles=getComputedStyle(panel);
 const properties=['fontSize','lineHeight','letterSpacing','marginTop','marginBottom','paddingTop','paddingRight','paddingBottom','paddingLeft','gap'];
 const parts=[...panel.querySelectorAll('.panel, .panel *')].map(el=>{
  const computed=getComputedStyle(el),target={};for(const property of properties)target[property]=computed[property];
  if(el.matches('.panel-orbit')){target.width=computed.width;target.height=computed.height;}
  return target;
 });
 const target={preview,card:$('.explorer').getBoundingClientRect(),panel:panel.getBoundingClientRect(),matrix:svg.getScreenCTM(),gap:styles.gap,parts};
 const height=probe.getBoundingClientRect().height;probe.replaceWith(mapPlaceholder);mapPlaceholder.style.height=height+'px';
 return target;
}
async function closeExpandedMap(){
 if(mapTransitioning||!mapOpen)return;
 mapTransitioning=true;mapDialog.classList.add('map-transitioning');mapDialog.dataset.returnPhase='recenter';
 mapDialog.style.gridTemplateColumns=getComputedStyle(mapDialog).gridTemplateColumns;
 if(mapDetailFrame){cancelAnimationFrame(mapDetailFrame);mapDetailFrame=0;}
 const destination=measurePageReturn();
 const svg=graph.querySelector('svg'),duration=transitionDuration();
 // Restore the opening 48-work scene while the expanded UI stays in place.
 // Only after the camera settles do the header, sidebar and page shell fold back.
 if(svg){
  const full=document.createElementNS('http://www.w3.org/2000/svg','g'),preview=document.createElementNS('http://www.w3.org/2000/svg','g');
  full.classList.add('map-full-return');preview.classList.add('map-preview-return');full.append(...svg.childNodes);preview.append(...parseMap(destination.preview).childNodes);svg.append(full,preview);
  const cameraDuration=duration?1500:0,fadeOptions={duration:cameraDuration,easing:'ease-in-out',fill:'both'};
  const fades=[full.animate([{opacity:1},{opacity:0,offset:.7},{opacity:0}],fadeOptions),preview.animate([{opacity:0},{opacity:0,offset:.12},{opacity:1,offset:.85},{opacity:1}],fadeOptions)];
  const scale=Math.min(graph.clientWidth/1000,graph.clientHeight/1000)*.94;
  await Promise.all([...fades.map(a=>a.finished.catch(()=>{})),animateMapCamera({from:{scale:mapScale,x:mapX,y:mapY},to:{scale,x:(graph.clientWidth-1000*scale)/2,y:(graph.clientHeight-1000*scale)/2},duration:cameraDuration,alive:()=>!disposed&&mapOpen,transform:state=>{mapScale=state.scale;mapX=state.x;mapY=state.y;svg.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;$('#map-fit').textContent=Math.round(mapScale*100)+'%';}})]);
  if(disposed||!mapOpen)return;
  svg.replaceChildren(...preview.childNodes);fades.forEach(a=>a.cancel());
 }
 mapDialog.dataset.returnPhase='interface';
 const options={duration,easing:transitionEase,fill:'both'},card=destination.card;
 const cardStyle=getComputedStyle($('.explorer'));
 const sidebar=$('#right-panel'),current=sidebar.getBoundingClientRect(),home=destination.panel;
 // Give the opaque shell its real starting geometry before changing the
 // dialog surface. WAAPI may not paint its first keyframe until the next frame.
 const shell=document.createElement('div');shell.className='map-return-shell';shell.setAttribute('aria-hidden','true');
 Object.assign(shell.style,{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',borderRadius:'0px',borderColor:'transparent'});
 const shellFill=document.createElement('div');shellFill.className='map-return-shell-fill';shellFill.style.background=getComputedStyle(app).backgroundColor;shell.append(shellFill);mapDialog.prepend(shell);
 shellFill.style.opacity='1';
 // Keep the reading copy in exactly the same box when it leaves flex flow.
 if(inlineReader){const box=inlineReader.getBoundingClientRect();Object.assign(inlineReader.style,{position:'absolute',inset:'auto',left:box.left-current.left-sidebar.clientLeft+'px',top:box.top-current.top-sidebar.clientTop+'px',width:box.width+'px',height:box.height+'px'});}
 // Hold the current columns during the handoff; only the sidebar's own bounds morph.
 mapTransitioning=true;mapDialog.classList.add('map-transitioning','map-returning');
 const clip=`inset(${Math.max(0,card.top)}px ${Math.max(0,innerWidth-card.right)}px ${Math.max(0,innerHeight-card.bottom)}px ${Math.max(0,card.left)}px round 18px)`;
 const animations=[mapDialog.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)'},{clipPath:clip}],options)];
 // Form the actual page container during the return, revealing its surface underneath.
 animations.push(shell.animate([{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',borderRadius:'0px',borderColor:'transparent'},{left:card.left+'px',top:card.top+'px',width:card.width+'px',height:card.height+'px',borderRadius:cardStyle.borderRadius,borderColor:cardStyle.borderColor}],options));
 animations.push(shellFill.animate([{opacity:1},{opacity:1,offset:.3},{opacity:0,offset:.9},{opacity:0}],options));
 if(inlineReader)animations.push(inlineReader.animate([{opacity:1},{opacity:0}],{...options,duration:duration*.25}));
 for(const el of [$('.map-header'),$('#map-legend')])animations.push(el.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{...options,duration:duration*.42}));
 if(home&&current.width&&current.height){
  animations.push(sidebar.animate([{transform:'none',width:current.width+'px',height:current.height+'px',padding:getComputedStyle(sidebar).padding,gap:getComputedStyle(sidebar).gap,borderLeftWidth:getComputedStyle(sidebar).borderLeftWidth,backgroundColor:getComputedStyle(sidebar).backgroundColor,borderLeftColor:getComputedStyle(sidebar).borderLeftColor,opacity:1},{transform:`translate(${home.left-current.left}px,${home.top-current.top}px)`,width:home.width+'px',height:home.height+'px',padding:'0px',gap:destination.gap,borderLeftWidth:'0px',backgroundColor:'transparent',borderLeftColor:'transparent',opacity:1}],options));
  sidebar.querySelectorAll('.panel, .panel *').forEach((el,i)=>{const target=destination.parts[i];if(!target)return;const computed=getComputedStyle(el),from={},to={};for(const [property,value] of Object.entries(target))if(computed[property]!==value){from[property]=computed[property];to[property]=value;}if(Object.keys(to).length)animations.push(el.animate([from,to],options));});
 }
 const matrix=destination.matrix,box=graph.getBoundingClientRect(),sameGraph=svg===inlineMapState?.svg;
 if(svg&&matrix){
  const target=`translate(${matrix.e-box.left}px,${matrix.f-box.top}px) scale(${matrix.a})`;
  animations.push(svg.animate([{transform:svg.style.transform,opacity:1},{transform:target,opacity:sameGraph?1:0}],options));
 }
 const pageParts=[$('.site-header'),$('.page-heading'),$('.explorer-head'),$('.work-shelf')];
 pageParts.forEach((el,i)=>{if(el)animations.push(el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{...options,delay:duration*(.16+i*.06),duration:duration*.5}));});
 await Promise.all(animations.map(a=>a.finished.catch(()=>{})));if(disposed)return;
 restoreMapPage();animations.forEach(a=>a.cancel());mapDialog.close();shell.remove();
 // The sidebar is already in place: do not restart its opacity or position animation.
 requestAnimationFrame(()=>{
  if(!sameGraph)graph.querySelector('svg')?.animate([{opacity:0},{opacity:1}],{duration:duration*.42,easing:transitionEase});
 });
}
$('#map-close').onclick=closeExpandedMap;
on(mapDialog,'cancel',e=>{e.preventDefault();closeExpandedMap();});
function restoreMapPage(){
 if(!mapOpen)return;
 closeInlineReader();
 mapDialog.style.removeProperty('grid-template-columns');
 delete mapDialog.dataset.returnPhase;
 mapOpen=false;drag=null;pinch=null;mapPointers.clear();graph.classList.remove('dragging');mapDialog.classList.remove('map-transitioning','map-returning');
 mapHome.after(workspace);mapPlaceholder?.remove();mapPlaceholder=null;app.classList.remove('map-open');
 draw();
 graph.scrollLeft=inlineMapState?.scrollLeft||0;window.scrollTo(inlineMapState?.pageX||0,inlineMapState?.pageY||0);$('#zoom').focus({preventScroll:true});
 requestAnimationFrame(()=>{graph.scrollLeft=inlineMapState?.scrollLeft||0;mapTransitioning=false;});
}
on(mapDialog,'close',restoreMapPage);

$('#map-fit').onclick=()=>{const rebuild=workPositions.size&&graph.querySelector('svg')?.dataset.renderMode==='dots';workPositions.clear();if(rebuild)draw();graph.querySelectorAll('[data-work]').forEach(el=>el.removeAttribute('transform'));fitMap();};

on(graph,'wheel',e=>{if(!mapOpen||mapTransitioning)return;e.preventDefault();const box=graph.getBoundingClientRect();zoomMap(Math.exp(-e.deltaY*.0015),e.clientX-box.left,e.clientY-box.top);},{passive:false});
on(graph,'pointerdown',e=>{
 if(!mapOpen||mapTransitioning||e.button>0)return;
 ensureInteractiveMap();
 const box=graph.getBoundingClientRect(),point={x:e.clientX-box.left,y:e.clientY-box.top};mapPointers.set(e.pointerId,point);graph.setPointerCapture(e.pointerId);
 if(mapPointers.size===2){const [a,b]=[...mapPointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2};drag=null;return;}
 const work=e.target.closest('[data-work]'),workId=work?.dataset.work||denseMap.hit((point.x-mapX)/mapScale,(point.y-mapY)/mapScale,Math.max(20,7/mapScale))?.work.id,pos=workPositions.get(workId)||{x:0,y:0};
 drag={id:e.pointerId,x:point.x,y:point.y,mapX,mapY,work:workId,pos:{...pos},dense:graph.querySelector('svg')?.dataset.renderMode==='dots',moved:false};
});
on(graph,'pointermove',e=>{
 if(!mapOpen||!mapPointers.has(e.pointerId))return;
 const box=graph.getBoundingClientRect(),point={x:e.clientX-box.left,y:e.clientY-box.top};mapPointers.set(e.pointerId,point);
 if(pinch&&mapPointers.size===2){const [a,b]=[...mapPointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y),x=(a.x+b.x)/2,y=(a.y+b.y)/2;zoomMap(distance/Math.max(pinch.distance,1),pinch.x,pinch.y);mapX+=x-pinch.x;mapY+=y-pinch.y;pinch={distance,x,y};ignoreMapClick=true;applyMapTransform();return;}
 if(!drag||drag.id!==e.pointerId)return;const dx=point.x-drag.x,dy=point.y-drag.y;
 if(Math.hypot(dx,dy)>4)drag.moved=true;if(!drag.moved)return;
 graph.classList.add('dragging');
 if(drag.work){const offset={x:drag.pos.x+dx/mapScale,y:drag.pos.y+dy/mapScale};workPositions.set(drag.work,offset);if(drag.dense)denseMap.move(drag.work,offset);}else{mapX=drag.mapX+dx;mapY=drag.mapY+dy;}
 applyMapTransform();
});
function endMapPointer(e){
 if(!mapOpen)return;mapPointers.delete(e.pointerId);if(graph.hasPointerCapture(e.pointerId))graph.releasePointerCapture(e.pointerId);
 if(drag?.id===e.pointerId){ignoreMapClick=true;if(!drag.moved&&drag.work&&e.type==='pointerup'){selected=selected===drag.work?null:drag.work;mapDialog.classList.add('map-panel-open');draw();}else if(drag.moved&&drag.work&&drag.dense)draw();drag=null;}
 if(mapPointers.size<2)pinch=null;graph.classList.remove('dragging');
}
on(graph,'pointerup',endMapPointer);on(graph,'pointercancel',endMapPointer);
on(graph,'click',e=>{if(mapOpen&&ignoreMapClick){ignoreMapClick=false;e.stopImmediatePropagation();e.preventDefault();}},true);
function handleMapKey(e){
 if(e.key==='Escape'){e.preventDefault();closeExpandedMap();return true;}
 if(e.key==='+'||e.key==='='){e.preventDefault();zoomMap(1.3);return true;}
 if(e.key==='-'){e.preventDefault();zoomMap(1/1.3);return true;}
 if(e.key==='0'){e.preventDefault();fitMap();return true;}
 const direction={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]}[e.key];
 if(direction){e.preventDefault();mapX+=direction[0];mapY+=direction[1];applyMapTransform();return true;}
 return false;
}

$('#map-details').onclick=()=>{const open=mapDialog.classList.toggle('map-panel-open');$('#map-details').setAttribute('aria-pressed',String(open));};

on(graph,'pointerover',e=>{if(!mapOpen||drag?.moved)return;const el=e.target.closest('[data-work]');if(el&&hoveredWork!==el.dataset.work){hoveredWork=el.dataset.work;applyMapTransform();}});
on(graph,'pointerout',e=>{if(!mapOpen)return;const next=e.relatedTarget instanceof Element?e.relatedTarget.closest('[data-work]'):null;if(next?.dataset.work!==hoveredWork){hoveredWork=next?.dataset.work||null;applyMapTransform();}});
on(graph,'focusin',e=>{if(mapOpen&&e.target.matches('[data-work]')){hoveredWork=e.target.dataset.work;applyMapTransform();}});

return()=>{disposed=true;readerAbort?.abort();textObserver?.disconnect();cleanups.forEach(fn=>fn());cancelAnimationFrame(mapDetailFrame);root.querySelectorAll("*").forEach(el=>el.getAnimations().forEach(a=>a.cancel()));for(const dialog of root.querySelectorAll("dialog[open]"))dialog.close();};
}
