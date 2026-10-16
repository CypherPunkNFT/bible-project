const scholars=window.mockScholars.filter(s=>Number.isFinite(s.born)&&s.born>=0&&s.born<=2026).sort((a,b)=>a.born-b.born||a.name.localeCompare(b.name));
const params=new URLSearchParams(location.search),mock=['2','3'].includes(params.get('mock'))?Number(params.get('mock')):1;
if(params.has('embed'))document.documentElement.classList.add('embedded');
document.querySelector('.example-heading>span').textContent=String(mock).padStart(2,'0');
if(mock!==1)document.querySelector('.example-heading h2').textContent=mock===2?'Compressed timeline':'Fourteen centuries, compressed';
const timelineEnd=mock===3?2000:2026;
const segments=mock===1?Array.from({length:11},(_,i)=>({start:i*200,end:i===10?2026:(i+1)*200-1})):mock===2?[{start:0,end:999},{start:1000,end:1399},{start:1400,end:1799},{start:1800,end:2026}]:[{start:0,end:1399},{start:1400,end:1599},{start:1600,end:1799},{start:1800,end:2000}];
const compressedEnd=mock===3?1400:1000;
const fraction=year=>mock===1?year/2026:year<=compressedEnd?(year/compressedEnd)*(400/2026):(400+(year-compressedEnd)/(timelineEnd-compressedEnd)*1626)/2026;
const tones={history:'var(--history)',texts:'var(--prophets)',places:'var(--poetry)',reference:'var(--epistles)',theology:'var(--gospels)',unassigned:'var(--muted)'};
const buckets=segments.map(({start,end})=>scholars.filter(s=>s.born>=start&&s.born<=end));
let selected=null,expanded=null,layout,lastWidth=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const years=s=>(s.circa?'c. ':'')+s.born+'–'+(s.died??'');
const displayName=s=>s.name.replace(/\s*\[\s*(?:c\.?\s*)?\d{1,4}\s*[-–—]\s*\d{0,4}\s*\]\s*$/i,'');
const initials=s=>{const words=displayName(s).split(/ (?:of|the) /)[0].split(' ').filter(w=>w&&!/^(von|van|de)$/i.test(w));return words[0][0]+(words.length>1?words.at(-1)[0]:'');};
function circle(s,cls='',style=''){return '<button type="button" class="circle '+cls+(s.id===selected?' chosen':'')+'" data-scholar="'+s.id+'" aria-label="'+esc(s.name+', '+years(s))+'" aria-pressed="'+(s.id===selected)+'" style="--tone:'+tones[s.field]+';'+style+'">'+initials(s)+'</button>';}
document.querySelector('#examples').innerHTML='<section class="example" id="option-'+mock+'"><div class="graph" aria-label="Scholars timeline"><header class="selection-header"><button type="button" class="selected-scholar" hidden></button><ul class="field-legend" aria-label="Scholar fields">'+Object.entries({history:'History',texts:'Languages & texts',places:'Archaeology & places',reference:'Reference works',theology:'Theology & philosophy',unassigned:'Unassigned'}).map(([field,label])=>'<li><i style="background:'+tones[field]+'"></i>'+label+'</li>').join('')+'</ul></header><div class="stage"><div class="track-scroll"><div class="periods"></div></div><div class="overlay-root"></div></div></div></section>';
const graph=document.querySelector('.graph'),periods=document.querySelector('.periods'),root=document.querySelector('.overlay-root'),header=document.querySelector('.selected-scholar'),track=document.querySelector('.track-scroll');
if(mock===3)document.querySelector('.selection-header').insertAdjacentHTML('afterbegin','<p class="teacher-caption"><span aria-hidden="true"></span>Each circle is one teacher, placed by the year they were born.</p>');
const overview=buckets.flatMap(group=>group.length<=8?group:Array.from({length:8},(_,j)=>group[Math.round(j*(group.length-1)/7)]));
let visibleScholars=[];
function renderTimeline(){
 const width=Math.max(880,track.clientWidth);
 if(width===lastWidth)return;
 lastWidth=width;
 layout=PreachersArc.layoutLandingArc(overview,width);
 const height=418,dy=(height-layout.height)/2;
 graph.style.setProperty('--r',layout.r*.85+'px');
 periods.style.width=width+'px';
 const start=layout.centuries[0].x,todayX=width-24;
 const compressedBoundary=start+(400/2026)*(layout.today.x-start)*(mock===3?.88:1);
 const sx=y=>mock===3?(y<=1400?start+(y/1400)*(compressedBoundary-start):compressedBoundary+(y-1400)/626*(todayX-compressedBoundary)):start+fraction(y)*(layout.today.x-start);
 const end=sx(timelineEnd);
 const path=layout.arcPath.replace(/([ML])([\d.]+) ([\d.]+)/g,(_,c,x,y)=>c+x+' '+(Number(y)+dy));
 // Every population entry is tried. Only circles that cannot fit become overflow.
 const radius=layout.r*.85,distance=2*radius+4,placed=[];
 const base=Number(path.match(/^M[\d.]+ ([\d.]+)/)[1]);
 const arcY=x=>base-22*Math.sin(Math.PI*x/width);
 const priority=new Set(overview.map(s=>s.id));
 const ordered=[...overview,...scholars.filter(s=>!priority.has(s.id))];
 for(const s of ordered){
  const x=sx(s.born),near=placed.filter(p=>Math.abs(p.x-x)<distance),candidates=[arcY(x)];
  for(const p of near){const h=Math.sqrt(distance**2-(p.x-x)**2);candidates.push(p.y-h,p.y+h);}
  candidates.sort((a,b)=>Math.abs(a-arcY(x))-Math.abs(b-arcY(x))||a-b);
  const y=candidates.find(y=>y-radius>=64&&y+radius<=height-54&&near.every(p=>Math.hypot(p.x-x,p.y-y)>=distance-.01));
  if(y!==undefined)placed.push({id:s.id,x,y});
 }
 const packed=new Map(placed.map(p=>[p.id,p]));
 visibleScholars=scholars.filter(s=>packed.has(s.id));
 let html='<svg class="timeline-curve" viewBox="0 0 '+width+' '+height+'" aria-hidden="true"><path d="'+path+'"/></svg>';
 html+=buckets.map((group,i)=>{
 const segment=segments[i],left=sx(segment.start),right=sx(i===segments.length-1?timelineEnd:segment.end+1);
 const hidden=group.length-visibleScholars.filter(s=>s.born>=segment.start&&s.born<=segment.end).length;
 return '<div class="period" style="left:'+left+'px;width:'+(right-left)+'px"><span class="period-year" aria-hidden="true">'+segment.start+'</span></div><button type="button" class="period-trigger" data-period="'+i+'" aria-label="Expand '+segment.start+' to '+segment.end+', '+group.length+' scholars'+(hidden?', '+hidden+' more':'')+'" aria-expanded="'+(expanded===i)+'" aria-controls="period-expansion" '+(!group.length?'disabled':'')+' style="left:'+left+'px;width:'+Math.max(22,right-left)+'px"><span aria-hidden="true">'+(hidden>0?'+'+hidden:'')+'</span></button>';
 }).join('');
 if(mock===3)html+='<div class="edge-boundary" style="left:'+end+'px" aria-hidden="true"><span>2000</span></div><svg class="today-dot" style="left:'+(todayX-3)+'px;top:'+(arcY(todayX)-3)+'px" width="6" height="6" aria-hidden="true"><circle cx="3" cy="3" r="3"/></svg><span class="today-label" style="left:'+todayX+'px">Today</span>';
 html+=visibleScholars.map(s=>{const p=packed.get(s.id);return circle(s,'sample','left:'+p.x+'px;top:'+p.y+'px;');}).join('');
 periods.innerHTML=html;
}
function select(id){
 selected=id;const s=scholars.find(s=>s.id===id);header.hidden=false;header.dataset.scholar=id;header.style.setProperty('--tone',tones[s.field]);header.innerHTML='<strong>'+esc(displayName(s))+'</strong><span>'+years(s)+'</span><span aria-hidden="true">↗</span>';
 graph.querySelectorAll('.circle').forEach(el=>{el.classList.toggle('chosen',el.dataset.scholar===id);el.setAttribute('aria-pressed',String(el.dataset.scholar===id));});
}
function closeExpansion(){
 const old=expanded;expanded=null;root.innerHTML='';graph.querySelectorAll('.period-trigger').forEach(el=>el.setAttribute('aria-expanded','false'));
 if(old!==null)graph.querySelector('[data-period="'+old+'"]').focus({preventScroll:true});
}
function open(i){
 expanded=i;const {start,end}=segments[i];
 root.innerHTML='<section class="expansion focus-view" id="period-expansion" role="region" aria-label="'+start+' to '+end+' contributors"><div class="focus-top"><span>'+start+'–'+end+' · '+buckets[i].length.toLocaleString()+'</span><input type="search" class="period-search" aria-label="Find a contributor in this period" placeholder="Find a contributor"><button type="button" class="close" aria-label="Close expanded period">↓</button></div><div class="dots">'+buckets[i].map(s=>circle(s)).join('')+'</div></section>';
 graph.querySelectorAll('.period-trigger').forEach(el=>el.setAttribute('aria-expanded',String(+el.dataset.period===i)));root.querySelector('.close').focus({preventScroll:true});
}
header.addEventListener('click',()=>{if(selected){const s=scholars.find(s=>s.id===selected);window.dispatchEvent(new CustomEvent('mock-scholar-profile',{detail:{id:s.profileId,populationId:s.id,origin:header}}));}});
graph.addEventListener('input',e=>{if(!e.target.matches('.period-search'))return;const words=e.target.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);root.querySelector('.dots').innerHTML=buckets[expanded].filter(s=>words.every(w=>s.name.toLocaleLowerCase().includes(w))).map(s=>circle(s)).join('');});
graph.addEventListener('click',e=>{const mark=e.target.closest('.circle');if(mark){select(mark.dataset.scholar);return;}const bar=e.target.closest('[data-period]');if(bar){open(+bar.dataset.period);return;}if(e.target.closest('.close'))closeExpansion();});
graph.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded!==null){e.preventDefault();closeExpansion();}});
renderTimeline();new ResizeObserver(renderTimeline).observe(track);
