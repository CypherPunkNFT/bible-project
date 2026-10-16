const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>/^(https?:\/\/|\/(?!\/))/.test(s??'')?esc(s):'#';
const data=await fetch('data.json').then(r=>{if(!r.ok)throw Error('Sources could not load');return r.json()});
const {features,works}=data;
let feature='letters',selected=null,included=null,limit=12,nodes=[],edges=[];
const label=id=>features.find(f=>f.id===id)?.label??id;
const records=w=>w.records.filter(r=>r.feature===feature);
const uses=w=>new Set(records(w).flatMap(r=>r.uses.map(u=>u.evidence+'|'+u.locator))).size;
const bibliography=w=>records(w).every(r=>r.kind==='bibliography');
const available=()=>works.filter(w=>records(w).length).sort((a,b)=>Number(bibliography(a))-Number(bibliography(b))||uses(b)-uses(a)||a.title.localeCompare(b.title));
const short=(s,n=25)=>s.length>n?s.slice(0,n-1)+'…':s;
$('#study').innerHTML=features.map(f=>`<option value="${esc(f.id)}">${esc(f.label)}</option>`).join('');$('#study').value=feature;
function point(radius,angle){return{x:420+radius*Math.cos(angle),y:420+radius*Math.sin(angle)}}
function draw(){
 const all=available(), shown=all.slice(0,5);if(included&&!shown.includes(included)){shown.pop();shown.push(included)}
 nodes=[];edges=[];
 const add=(id,name,kind,radius,i,total,extra={})=>{const n={id,name,kind,...point(radius,-Math.PI/2+(i+.35)*Math.PI*2/total),...extra};nodes.push(n);return n};
 shown.forEach((w,i)=>add('w'+w.id,w.title,'work',145,i,shown.length,{work:w}));
 const authors=[...new Set(shown.map(w=>w.author))];authors.forEach((a,i)=>add('a'+i,a,'author',245,i,authors.length,{author:a}));
 const related=[...new Set(shown.flatMap(w=>w.records.map(r=>r.feature)))].filter(f=>f!==feature);
 related.forEach((f,i)=>add('f'+f,label(f),'feature',340,i,related.length,{feature:f}));
 const core={id:'core',x:420,y:420};
 for(const n of nodes.filter(n=>n.kind==='work')){edges.push([core,n],[n,nodes.find(a=>a.author===n.work.author)]);for(const f of nodes.filter(n=>n.kind==='feature'))if(n.work.records.some(r=>r.feature===f.feature))edges.push([n,f]);}
 const connected=new Set(selected?[selected]:[]);for(const [a,b]of edges){if(a.id===selected)connected.add(b.id);if(b.id===selected)connected.add(a.id)}
 $('#graph').innerHTML=`<svg viewBox="0 0 840 840" role="group" aria-label="${esc(label(feature))} source map">${[145,245,340].map((r,i)=>`<circle class="orbit" cx="420" cy="420" r="${r}"/><text class="ring-label" x="420" y="${420-r-10}" text-anchor="middle">${['WORKS','SCHOLARS','CONNECTED STUDIES'][i]}</text>`).join('')}${edges.map(([a,b])=>`<line class="edge ${selected&&(a.id===selected||b.id===selected)?'active':''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`).join('')}<g class="core"><circle cx="420" cy="420" r="63" fill="var(--panel)" stroke="var(--gold)"/><text x="420" y="426" text-anchor="middle">${esc(short(label(feature).replace('People ? ',''),18))}</text></g>${nodes.map(n=>`<g class="node ${selected===n.id?'selected':''}" data-node="${n.id}" role="button" tabindex="0" aria-label="${esc(n.name)}" aria-pressed="${selected===n.id}" opacity="${selected&&!connected.has(n.id)?'.3':'1'}"><title>${esc(n.name)}</title><circle cx="${n.x}" cy="${n.y}" r="20" fill="transparent" stroke="none"/><circle cx="${n.x}" cy="${n.y}" r="${n.kind==='author'?8:5}" fill="${n.kind==='author'?'var(--bg)':n.kind==='work'?'var(--gold)':'var(--green)'}" stroke="${n.kind==='author'?'var(--blue)':n.kind==='work'?'var(--gold)':'var(--green)'}"/><text x="${n.x+(n.x>650||n.x>=180&&n.x<420?-13:13)}" y="${n.y+4}" text-anchor="${n.x>650||n.x>=180&&n.x<420?'end':'start'}">${esc(short(n.name,n.kind==='work'?23:26))}</text></g>`).join('')}</svg>`;
 $('#count').textContent=`${shown.length} of ${all.length} works · Select a point to follow its connections`;
 inspect();browse();
}
function inspect(){const n=nodes.find(n=>n.id===selected),el=$('#inspect');if(!n){el.innerHTML=`<p class="eyebrow">START AT THE CENTRE</p><h2>${esc(label(feature))}</h2><p>Five leading works, with their recorded author credits and the other studies that cite them.</p><p>Choose a gold point to read a source. Choose a scholar to explore their works, or a green point to move to another study.</p><p>Feature inputs and page citations come before bibliography entries. Connections reflect recorded source use.</p>`;return}
 if(n.kind==='feature'){el.innerHTML=`<p class="eyebrow">CONNECTED STUDY</p><h2>${esc(n.name)}</h2><p>Shares a recorded work with ${esc(label(feature))}.</p><button data-study="${esc(n.feature)}">Explore this study →</button>`;return}
 if(n.kind==='author'){el.innerHTML=`<p class="eyebrow">RECORDED AUTHOR CREDIT</p><h2>${esc(n.name)}</h2><p>Works connected to this study:</p>${available().filter(w=>w.author===n.author).slice(0,12).map(w=>`<button data-work="${w.id}">${esc(w.title)}</button>`).join('')}`;return}
 const w=n.work;el.innerHTML=`<p class="eyebrow">THE WORK</p><h2>${esc(w.title)}</h2><p class="credit">${esc(w.author)}</p><p>${esc(w.years.join(' / '))} · ${uses(w)} recorded uses in this study</p><div class="record">${records(w).map(r=>`<a href="${safe(r.url)}" target="_blank" rel="noopener">Read source ↗</a><p>${r.kind==='bibliography'?'Bibliography entry':r.kind==='data'?'Feature input':'Page citation'}</p>${r.uses.map(u=>`<p>${esc(u.locator)}<br><a href="${safe(u.address)}" target="_blank" rel="noopener">${esc(u.page)} ↗</a></p>`).join('')}`).join('')}</div>`;
}
function browse(){const q=$('#search').value.toLowerCase(),list=available().filter(w=>(w.title+' '+w.author).toLowerCase().includes(q));$('#browse-title').textContent=`${list.length} works in ${label(feature)}`;$('#results').innerHTML=list.slice(0,limit).map(w=>`<button data-work="${w.id}"><strong>${esc(w.title)}</strong><small>${esc(w.author)} · ${uses(w)} recorded uses${bibliography(w)?' · Bibliography':''}</small></button>`).join('')||'<p>No matching works. Try another title or scholar.</p>';$('#more').hidden=list.length<=limit;}
function change(id){feature=id;$('#study').value=id;selected=null;included=null;limit=12;$('#search').value='';draw()}
document.addEventListener('click',e=>{const n=e.target.closest('[data-node]'),w=e.target.closest('[data-work]'),f=e.target.closest('[data-study]');if(n){selected=selected===n.dataset.node?null:n.dataset.node;draw()}else if(w){included=works.find(x=>String(x.id)===w.dataset.work);selected='w'+included.id;draw();$('#graph').scrollIntoView({block:'center'})}else if(f)change(f.dataset.study)});
$('#graph').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-node]')){e.preventDefault();const id=e.target.dataset.node;e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));$('#graph').querySelector(`[data-node="${id}"]`)?.focus()}if(e.key==='Escape'){selected=null;draw()}});
$('#study').onchange=e=>change(e.target.value);$('#reset').onclick=()=>change(feature);$('#search').oninput=()=>{limit=12;browse()};$('#more').onclick=()=>{limit+=12;browse()};$('#theme').onclick=()=>document.body.classList.toggle('light');draw();
