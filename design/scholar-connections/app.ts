import dataset from '../../content/teachers/knowledge-connections/index.json';
import {IDEA_CHAINS} from '../../src/pages/teachers/scholars/landing/idea-chains';
type Chain={id:string;field:string;title:string;workIds:string[];edgeIds:string[];note?:string};
type Work={id:string;title:string;dateLabel:string;authorIds:string[];recordKind:string;libraryMatchStatus:string};
type Edge={id:string;fromWorkId:string;toWorkId:string;relationship:string;claim:string;reviewStatus:string;caveat:string;evidenceScope:string;evidence:{sourceId:string;locator:string}[]};
type Author={id:string;name:string;profileId:string|null;populationId:string|null;identityStatus:string};
type Source={id:string;title:string;url:string;locator?:string;access:string};
const data=dataset as unknown as {fields:Record<string,string>;chains:Chain[];works:Work[];connections:Edge[];authors:Author[];sources:Source[]};
const fields=Object.entries(data.fields),tones=['#9b7040','#557b88','#927052','#768650','#8a6c92'];
const works=new Map(data.works.map(w=>[w.id,w])),edges=new Map(data.connections.map(e=>[e.id,e])),authors=new Map(data.authors.map(a=>[a.id,a])),sources=new Map(data.sources.map(s=>[s.id,s]));
const esc=(s:string='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const human=(s:string)=>s.replaceAll('-',' ').replace(/^./,c=>c.toUpperCase());
const authorName=(w:Work)=>w.authorIds.map(id=>authors.get(id)!.name).join(' · ');
const initials=(w:Work)=>{const names=w.authorIds.map(id=>authors.get(id)!.name);if(names.length>1)return names.map(n=>n.split(' ')[0][0]).join('').slice(0,3);return names[0].split(/\s+/).filter(s=>!['of','the','and','&'].includes(s.toLowerCase())).map(s=>s[0]).slice(0,3).join('');};
const relationTop=(a:{y:number},b:{y:number},fromBranches:boolean)=>a.y===b.y?a.y+23:(fromBranches?b.y<a.y:a.y<b.y)?Math.min(a.y,b.y)-120:Math.max(a.y,b.y)+23;
const params=new URLSearchParams(location.search);let active=Number(params.get('field')??4);if(!fields[active])active=4;
let selected=data.chains.find(c=>c.id===params.get('topic')&&c.field===fields[active][0])??null;
const iconPaths={book:'M4 3h6c2 0 2 2 2 2s0-2 2-2h6v16h-6c-2 0-2 2-2 2s0-2-2-2H4z M12 5v16',pen:'m4 20 4-1L20 7l-3-3L5 16z M14 7l3 3',branch:'M5 5v14 M5 12h9a5 5 0 0 0 5-5 M5 12h9a5 5 0 0 1 5 5 M2 3h6v4H2z M16 3h6v4h-6z M16 17h6v4h-6z',translation:'M3 5h11 M8 3v2 M5 8c1 4 4 7 8 9 M12 5c0 5-4 9-9 12 M14 21l4-11 4 11 M15 18h6',layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 17l10 5 10-5',archive:'M3 4h18v5H3z M5 9v12h14V9 M9 13h6',compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M16 8l-3 5-5 3 3-5z',quote:'M4 7h6v6H6c0 3 2 4 3 4 M14 7h6v6h-4c0 3 2 4 3 4',scale:'M12 3v18 M6 21h12 M3 7h18 M6 7l-4 7h8z M18 7l-4 7h8z',scroll:'M6 3h13v16c0 3-5 3-5 0H4c-3 0-3-5 0-5h2V5c0-3-4-3-4 0 M9 7h7 M9 11h7'};
function icon(chain:Chain){const title=chain.title.toLowerCase();const key=/compar|parallel|source|objection/.test(title)?'branch':/translat|latin|english|plant in jonah/.test(title)?'translation':/revis|edit|correct|rework/.test(title)?'pen':/excavat|archaeol|chronolog|radiometric/.test(title)?'compass':/preserv|quot|memori/.test(title)?'quote':/argument|reply|response|debate|freedom|grace/.test(title)?'scale':/lexic|diction|grammar|reference/.test(title)?'book':/report|archive/.test(title)?'archive':'scroll';return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[key]}"/></svg>`;}
const approvedCaptions:Record<string,string[]>={
 'history-baseline':['Uses Africanus among earlier chronological sources','Translates the chronology and extends it to 378','Abridges the account and continues to 455','Continues Prosper’s account into the sixth century','Takes up the sequence and carries it to 590'],
 'texts-baseline':['Uses Erasmus’s Greek editions to translate into English','Combines Tyndale’s translations with Coverdale’s work','Revises Matthew’s Bible for an official edition','Revises the Great Bible under Parker’s oversight','Uses the Bishops’ Bible as a base; compares earlier translations','Revises the 1611 translation with renewed textual study'],
 'places-baseline':['Returns to the same site with a new excavation','Reassesses the layers and dates the destruction earlier','Challenges Kenyon’s chronology with a later date','Disputes Wood’s reading of the archaeological evidence','Answers Bienkowski’s objections in a published reply','Adds independent radiocarbon evidence on the same question'],
 'reference-baseline':['Reworks his lexicography into a Latin manual','Translates the Latin manual for English readers','Revises and expands the English Gesenius','Rebuilds the lexicon using Gesenius, Robinson and later scholarship','Adds Strong’s lookup numbers to a later BDB edition'],
 'theology-baseline':['Challenges the move from an idea to actual existence','Answers Gaunilo and defends the original reasoning','Recasts the question through perfection and necessary existence','Criticises the proof: existence adds no property to a concept','Returns to Anselm through the idea of necessary existence','Develops a modal argument using possible worlds']
};
const iframe=document.querySelector<HTMLIFrameElement>('#preview')!;
function mount(){
 const doc=iframe.contentDocument!,win=iframe.contentWindow!;
 const original=doc.querySelector<HTMLElement>('#connections .idea-lineage');if(!original)return false;
 if(doc.querySelector('.connections-mock'))return true;
 const css=doc.createElement('link');css.rel='stylesheet';css.href='/mockups/scholar-connections/mock.css';doc.head.append(css);
 const graph=doc.createElement('section');graph.className='connections-mock';graph.setAttribute('aria-label','Connections between works');original.hidden=true;original.style.display='none';original.after(graph);
 let observer:ResizeObserver|undefined,revision=0;
 const reduced=()=>win.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const address=()=>history.replaceState(null,'',`?field=${active}${selected?`&topic=${selected.id}`:''}`);
 async function change(next:()=>void,focus?:string){
  const token=++revision,old=graph.querySelector<HTMLElement>('.mock-content');
  if(old&&!reduced()){await old.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],{duration:150,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});}
  if(token!==revision)return;next();address();render();
  if(focus)graph.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
  const content=graph.querySelector<HTMLElement>('.mock-content');
  if(content&&!reduced())content.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
 function render(){
  observer?.disconnect();const list=data.chains.filter(c=>c.field===fields[active][0]);graph.style.setProperty('--tone',tones[active]);
  graph.innerHTML=`<div class="mock-tabs" role="tablist" aria-label="Choose a field">${fields.map(([key,label],i)=>`<button role="tab" type="button" data-field="${i}" aria-selected="${active===i}" aria-controls="topic-panel" tabindex="${active===i?0:-1}">${esc(label)}<span class="tab-count">${data.chains.filter(c=>c.field===key).length}</span></button>`).join('')}</div><div class="mock-content" id="topic-panel" role="tabpanel" aria-label="${esc(fields[active][1])}"></div>`;
  graph.querySelectorAll<HTMLButtonElement>('[data-field]').forEach(b=>{const i=Number(b.dataset.field);const choose=(n:number)=>change(()=>{active=n;selected=null;},`[data-field="${n}"]`);b.onclick=()=>void choose(i);b.onkeydown=e=>{const n=e.key==='ArrowRight'?(i+1)%fields.length:e.key==='ArrowLeft'?(i+fields.length-1)%fields.length:e.key==='Home'?0:e.key==='End'?fields.length-1:-1;if(n>=0){e.preventDefault();void choose(n);}};});
  const content=graph.querySelector<HTMLElement>('.mock-content')!;
  if(!selected){
   content.innerHTML=`<div class="chooser-head"><h4>Choose a thread to follow.</h4><p>${list.length} topics · Select one to unfold its works and connections.</p></div><div class="topic-grid">${list.map((c,i)=>`<button type="button" class="topic-card" data-topic="${c.id}" aria-label="${esc(c.title)}"><span class="topic-icon">${icon(c)}</span><strong>${esc(c.title)}</strong><span class="topic-count">${c.workIds.length} works <span>·</span> ${c.edgeIds.length} ${c.edgeIds.length===1?'connection':'connections'}</span><span class="topic-open" aria-hidden="true">↗</span></button>`).join('')}</div>`;
   content.querySelectorAll<HTMLButtonElement>('[data-topic]').forEach(b=>b.onclick=()=>void change(()=>{selected=data.chains.find(c=>c.id===b.dataset.topic)!;},'[data-back]'));
   return;
  }
  const chain=selected,chainEdges=chain.edgeIds.map(id=>edges.get(id)!);
  const linear=chainEdges.length===chain.workIds.length-1&&chainEdges.every(e=>chain.workIds.indexOf(e.toWorkId)===chain.workIds.indexOf(e.fromWorkId)+1);
  content.innerHTML=`<div class="thread-head"><button type="button" data-back>${icon({title:'parallel',id:'',field:'',workIds:[],edgeIds:[]})}<span>All ${list.length} topics</span></button><div><h4>${esc(chain.title)}</h4><p>${chain.workIds.length} works · ${chain.edgeIds.length} connections${linear?'':' · Branching thread'}</p></div></div><div class="plot"><div class="viewport" tabindex="0" role="region" aria-label="Drag to explore connections sideways"><div class="canvas"><div class="drawing"></div></div></div><div class="pill-space"><div class="pill" role="scrollbar" tabindex="0" aria-label="Scroll connections" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div></div></div><div class="detail" hidden></div>`;
  content.querySelector<HTMLButtonElement>('[data-back]')!.onclick=()=>void change(()=>{selected=null;},`[data-topic="${chain.id}"]`);
  const viewport=content.querySelector<HTMLElement>('.viewport')!,canvas=content.querySelector<HTMLElement>('.canvas')!,drawing=content.querySelector<HTMLElement>('.drawing')!;
  let width:number;const positions=new Map<string,{x:number;y:number}>();
  if(linear){width=Math.max(viewport.clientWidth,760,(chain.workIds.length-1)*288+220);chain.workIds.forEach((id,i)=>positions.set(id,{x:110+i*(width-220)/(chain.workIds.length-1),y:148}));}
  else{
   const ranks=new Map(chain.workIds.map(id=>[id,0]));
   for(let pass=0;pass<chain.workIds.length;pass++)for(const e of chainEdges)ranks.set(e.toWorkId,Math.max(ranks.get(e.toWorkId)!,ranks.get(e.fromWorkId)!+1));
   const maxRank=Math.max(...ranks.values()),maxRows=Math.max(...Array.from({length:maxRank+1},(_,r)=>chain.workIds.filter(id=>ranks.get(id)===r).length));
   width=Math.max(viewport.clientWidth,maxRank*620+220);
   for(let rank=0;rank<=maxRank;rank++){const group=chain.workIds.filter(id=>ranks.get(id)===rank);group.forEach((id,i)=>positions.set(id,{x:110+rank*(width-220)/maxRank,y:148+(maxRows-1)*150+(i-(group.length-1)/2)*300}));}
  }
  canvas.style.width=width+'px';canvas.style.height=(linear?345:1000)+'px';
  const edgeMarkup=chainEdges.map((e,i)=>{
   const a=positions.get(e.fromWorkId)!,b=positions.get(e.toWorkId)!,mid=(a.x+b.x)/2;
   const path=`M${a.x+22},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x-24},${b.y}`;
   return `<path data-edge="${e.id}" d="${path}" pathLength="1" marker-end="url(#connection-arrow)" style="--delay:${i*95}ms"/>`;
  }).join('');
  drawing.innerHTML=`<svg class="edge-lines" width="${width}" height="1000" aria-hidden="true"><defs><marker id="connection-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 5 3 0 6" fill="none"/></marker></defs>${edgeMarkup}</svg>${chain.workIds.map((id,i)=>{const w=works.get(id)!,p=positions.get(id)!;return `<div class="node" data-work="${id}" style="left:${p.x}px;top:${p.y}px;--delay:${i*85}ms"><div class="identity"><small>${esc(w.dateLabel)}</small><strong>${esc(authorName(w))}</strong><em>${esc(w.title)}</em></div><button type="button" class="dot" data-node="${id}" aria-label="${esc(authorName(w)+': '+w.title)}" aria-expanded="false">${esc(initials(w))}</button></div>`;}).join('')}${chainEdges.map((e,i)=>{const a=positions.get(e.fromWorkId)!,b=positions.get(e.toWorkId)!,flat=a.y===b.y;return `<button type="button" class="relation" data-connection="${e.id}" style="left:${(a.x+b.x)/2}px;top:${relationTop(a,b,chainEdges.filter(other=>other.fromWorkId===e.fromWorkId).length>1)}px;width:${Math.min(360,b.x-a.x-54)}px;--delay:${i*95+140}ms" aria-label="${esc(human(e.relationship))}: view evidence"><strong>${esc(chain.id.endsWith('-baseline')?(IDEA_CHAINS.find(c=>c.field===chain.field)?.nodes[i+1]?.link??human(e.relationship)):human(e.relationship))}</strong><p>${esc(approvedCaptions[chain.id]?.[i]??e.claim)}</p></button>`;}).join('')}`;
  function fit(){
   drawing.style.transform='';const top=viewport.getBoundingClientRect().top;
   const first=Math.min(...Array.from(drawing.querySelectorAll('.identity')).map(n=>n.getBoundingClientRect().top-top));
   const offset=Math.max(0,20-first);drawing.style.transform=`translateY(${offset}px)`;
   const bottom=Math.max(...Array.from(drawing.querySelectorAll('.relation,.dot')).map(n=>n.getBoundingClientRect().bottom-top));
   canvas.style.height=Math.max(345,bottom+48)+'px';
  }
  fit();void doc.fonts.ready.then(()=>{if(canvas.isConnected)fit();});
  const rail=content.querySelector<HTMLElement>('.pill-space')!,pill=content.querySelector<HTMLElement>('.pill')!;
  const update=()=>{const max=viewport.scrollWidth-viewport.clientWidth,w=rail.clientWidth,thumb=Math.min(w,Math.max(44,w*viewport.clientWidth/viewport.scrollWidth));pill.style.width=thumb+'px';pill.style.left=(max>0?(w-thumb)*viewport.scrollLeft/max:0)+'px';pill.setAttribute('aria-valuenow',String(Math.round(max>0?100*viewport.scrollLeft/max:0)));rail.hidden=max<=0;};
  viewport.onscroll=update;observer=new ResizeObserver(()=>{fit();update();});observer.observe(viewport);drawing.querySelectorAll('.identity,.relation').forEach(n=>observer!.observe(n));requestAnimationFrame(()=>{fit();update();});
  const keys=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();viewport.scrollLeft+=e.key==='ArrowRight'?180:-180;}if(e.key==='Home'){e.preventDefault();viewport.scrollLeft=0;}if(e.key==='End'){e.preventDefault();viewport.scrollLeft=viewport.scrollWidth;}};
  viewport.onkeydown=e=>{if(e.target===viewport)keys(e);if(e.key==='Escape')content.querySelector<HTMLButtonElement>('[data-back]')?.click();};pill.onkeydown=keys;
  let drag:{x:number;left:number}|null=null;
  viewport.onpointerdown=e=>{if(e.button!==0||(e.target as HTMLElement).closest('button,a'))return;drag={x:e.clientX,left:viewport.scrollLeft};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');};viewport.onpointermove=e=>{if(drag)viewport.scrollLeft=drag.left+drag.x-e.clientX;};
  const end=()=>{drag=null;viewport.classList.remove('dragging');};viewport.onpointerup=end;viewport.onpointercancel=end;viewport.onlostpointercapture=end;
  let thumbStart:{x:number;left:number}|null=null;
  pill.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();thumbStart={x:e.clientX,left:viewport.scrollLeft};pill.setPointerCapture(e.pointerId);};pill.onpointermove=e=>{if(thumbStart){const travel=rail.clientWidth-pill.offsetWidth;if(travel>0)viewport.scrollLeft=thumbStart.left+(e.clientX-thumbStart.x)*(viewport.scrollWidth-viewport.clientWidth)/travel;}};
  const stop=()=>thumbStart=null;pill.onpointerup=stop;pill.onpointercancel=stop;pill.onlostpointercapture=stop;
  rail.onpointerdown=e=>{if(e.target===pill)return;const r=rail.getBoundingClientRect(),travel=rail.clientWidth-pill.offsetWidth;viewport.scrollLeft=Math.max(0,Math.min(1,(e.clientX-r.left-pill.offsetWidth/2)/travel))*(viewport.scrollWidth-viewport.clientWidth);};
  const evidence=(e:Edge)=>`<article class="evidence"><small>${esc(human(e.relationship))} · ${esc(e.reviewStatus==='carried-forward'?'Passage review pending':human(e.reviewStatus))}</small><p>${esc(e.claim)}</p>${e.evidence.map(ref=>{const s=sources.get(ref.sourceId)!;return `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.title)} ↗</a><p class="evidence-locator">${esc(ref.locator)} · ${esc(human(s.access))}</p>`;}).join('')}<p class="evidence-note">${esc(e.caveat)} ${esc(e.evidenceScope)}</p></article>`;
  function detail(title:string,html:string,origin:HTMLButtonElement){const panel=content.querySelector<HTMLElement>('.detail')!;const was=origin.getAttribute('aria-expanded')==='true';content.querySelectorAll('[aria-expanded]').forEach(n=>n.setAttribute('aria-expanded','false'));panel.hidden=was;if(was)return;origin.setAttribute('aria-expanded','true');panel.innerHTML=`<div><h4>${esc(title)}</h4>${html}</div><button type="button" aria-label="Close details">×</button>`;panel.querySelector('button')!.onclick=()=>{panel.hidden=true;origin.setAttribute('aria-expanded','false');origin.focus({preventScroll:true});};}
  content.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(b=>b.onclick=()=>{const w=works.get(b.dataset.node!)!,related=chainEdges.filter(e=>e.fromWorkId===w.id||e.toWorkId===w.id);detail(w.title,`<p>${esc(authorName(w))} · ${esc(w.dateLabel)}</p><p class="evidence-note">${esc(human(w.recordKind))} · Exact library edition not confirmed.</p>${related.map(evidence).join('')}`,b);});
  content.querySelectorAll<HTMLButtonElement>('[data-connection]').forEach(b=>b.onclick=()=>{const e=edges.get(b.dataset.connection!)!;detail(`${works.get(e.fromWorkId)!.title} → ${works.get(e.toWorkId)!.title}`,evidence(e),b);});
 }
 css.addEventListener('load',()=>render());render();doc.querySelector('#connections')?.scrollIntoView({block:'start'});
 let resizeFrame=0;win.addEventListener('resize',()=>{win.cancelAnimationFrame(resizeFrame);resizeFrame=win.requestAnimationFrame(()=>render());});
 return true;
}
iframe.addEventListener('load',()=>{const doc=iframe.contentDocument!;if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(doc,{subtree:true,childList:true});});
