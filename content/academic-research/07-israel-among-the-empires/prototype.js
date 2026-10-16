const {periods,sources,geography,close}=window.studyData;
const $=id=>document.getElementById(id);
const safe=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const names={delta:'Nile Delta',megiddo:'Megiddo',samaria:'Samaria',jerusalem:'Jerusalem',lachish:'Lachish',ekron:'Ekron',mizpah:'Mizpah*',dibon:'Dibon',damascus:'Damascus',qarqar:'Qarqar',carchemish:'Carchemish',kalhu:'Kalhu',nineveh:'Nineveh',babylon:'Babylon',gozan:'Gozan region'};
const palette={force:'#f2a27d',tribute:'#efd18a',movement:'#a5d5f2',alliance:'#b9e3bb'};
const dash={force:'',tribute:'9 5',movement:'2 6',alliance:'12 4 2 4'};
let selected=new URLSearchParams(location.hash.slice(1)).get('period')||'siege';
if(!periods.some(p=>p.id===selected))selected='siege';
let witness=0;
function sourceHTML(ids){return ids.map(id=>{const s=sources.find(s=>s.id===id);return `<div><a href="${s.url}">${safe(s.title)} ↗</a><p>${safe(s.read)}</p></div>`}).join('')}
function map(p,local){const m=local?geography.local:geography.regional;const ids=local?p.places:[...new Set(['jerusalem',...p.edges.flatMap(e=>[e.from,e.to]),...(p.id==='communities'?['babylon']:[])])];
let out=`<svg viewBox="0 0 ${m.width} ${m.height}" role="img" aria-label="${local?'Local':'Regional'} map, ${safe(p.date)}. ${safe(local?p.localNote:p.edges.map(e=>e.label).join('. '))}"><defs>${Object.keys(palette).map(k=>`<marker id="${local?'l':'r'}-${k}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6" fill="none" stroke="${palette[k]}"/></marker>`).join('')}</defs><path class="land" fill-rule="evenodd" d="${m.land}"/><path class="grid" d="${m.grid}"/>`;
out+=local?'<text class="sea-label" x="26" y="220" transform="rotate(-90 26 220)">Mediterranean Sea</text>':'<text class="sea-label" x="80" y="150" transform="rotate(-25 80 150)">Mediterranean Sea</text><text x="460" y="335" opacity=".65">ARABIAN DESERT</text><rect class="inset" x="245" y="228" width="74" height="88"/>';
if(!local)for(const e of p.edges){const [x,y]=m.points[e.from],[xx,yy]=m.points[e.to],len=Math.hypot(xx-x,yy-y),bend=Math.min(len*.2,70);out+=`<path d="M${x} ${y}Q${(x+xx)/2-(yy-y)/len*bend} ${(y+yy)/2+(xx-x)/len*bend} ${xx} ${yy}" stroke="${palette[e.kind]}" stroke-width="2.2" stroke-dasharray="${dash[e.kind]}" fill="none" marker-end="url(#r-${e.kind})"/>`}
for(const id of ids){const [x,y]=m.points[id];if(x<0||x>m.width||y<0||y>m.height)continue;let dx=12,dy=-12,anchor='start';if(['lachish','ekron','qarqar'].includes(id)){dx=-12;anchor='end'}if(id==='jerusalem')dy=18;if(id==='ekron')dy=-4;if(id==='mizpah')dy=-14;if(id==='kalhu')dy=20;
out+=`<circle class="halo" cx="${x}" cy="${y}" r="${local?12:9}"/><circle class="dot" cx="${x}" cy="${y}" r="4"/><text x="${x+dx}" y="${y+dy}" text-anchor="${anchor}">${names[id]}</text>`}
out+=`<text x="${m.width-24}" y="28" text-anchor="middle">↑ N</text></svg>`;return out}
function setPeriod(id){selected=id;const p=periods.find(p=>p.id===id);history.replaceState(null,'','#period='+id);document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.period===id));$('regional').innerHTML=map(p,false);$('local').innerHTML=map(p,true);
const x=n=>30+(950-n)/500*940;
$('time').innerHTML=`<svg viewBox="0 0 1000 40" role="img" aria-label="Proportional timeline, 950 to 450 BCE. Selected ${p.date}. ${safe(p.anchor)}"><line x1="30" y1="12" x2="970" y2="12" stroke="#a3ab9b"/><rect x="${x(p.start)}" y="5" width="${Math.max(3,x(p.end)-x(p.start))}" height="14" fill="#355b4d" opacity="${p.id==='egypt'?.35:.8}"/>${[950,850,750,650,550,450].map(n=>`<line x1="${x(n)}" x2="${x(n)}" y1="8" y2="17" stroke="#536454"/><text x="${x(n)}" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#435345">${n}</text>`).join('')}</svg>`;
$('date-note').textContent='BCE · '+p.anchor;$('deck').textContent=p.date+' / '+p.deck;$('headline').textContent=p.title;
$('statuses').innerHTML=`<p><b>Israel / later Samaria</b>${p.north}</p><p><b>Judah / later Yehud</b>${p.south}</p>`;
$('local-note').textContent=p.localNote+(p.id==='exile'?' *Mizpah is conventionally identified with Tell en-Nasbeh.':'');
$('relationships').innerHTML=p.edges.length?p.edges.map(e=>`<p>${safe(e.label)}</p>`).join(''):'<p>No migration route is plotted. Yāhūdu’s precise location is uncertain.</p>';
for(const key of ['political','people','limit'])$(key).textContent=p[key];
$('passages').innerHTML=p.passages.map(p=>`<p><a href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(p.label.replaceAll('–','-'))}&version=NRSVUE">${safe(p.label)} →</a><small>${safe(p.note)}</small></p>`).join('');
$('sources').innerHTML=sourceHTML(p.sourceIds);$('announcement').textContent=p.date+'. '+p.title;
}
$('periods').innerHTML=periods.map(p=>`<button data-period="${p.id}" aria-pressed="false"><strong>${p.date}</strong>${p.short}</button>`).join('');
document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>setPeriod(b.dataset.period)));
function toggleEvidence(open){$('evidence').hidden=!open;$('evidence-toggle').setAttribute('aria-expanded',open);$('evidence-toggle').textContent=open?'Retract evidence ×':'Inspect the evidence ↓';if(!open){$('evidence-toggle').focus({preventScroll:true});const r=$('evidence-toggle').getBoundingClientRect();if(r.top<80||r.bottom>innerHeight)$('evidence-toggle').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}
$('evidence-toggle').onclick=()=>toggleEvidence($('evidence').hidden);$('close-evidence').onclick=()=>toggleEvidence(false);
$('witnesses').innerHTML=close.siege.witnesses.map((w,i)=>`<button data-witness="${i}" aria-pressed="false">${w.name}<small>${w.subtitle}</small></button>`).join('');
function setWitness(i){witness=i;const w=close.siege.witnesses[i];document.querySelectorAll('[data-witness]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.witness===i));$('witness-detail').innerHTML=`<div><p class="eyebrow">${w.subtitle}</p><h3>${w.title}</h3><div class="sources">${sourceHTML(w.sources)}</div></div><div><h4>Observation</h4><p>${w.observation}</p><h4>Interpretation</h4><p>${w.inference}</p><h4>Limit</h4><p>${w.limit}</p></div>`;sessionStorage.setItem('empires-design-witness',i)}
document.querySelectorAll('[data-witness]').forEach(b=>b.onclick=()=>setWitness(+b.dataset.witness));
addEventListener('hashchange',()=>{const id=new URLSearchParams(location.hash.slice(1)).get('period');if(periods.some(p=>p.id===id))setPeriod(id)});
setPeriod(selected);setWitness(Math.min(2,Math.max(0,Number(sessionStorage.getItem('empires-design-witness'))||0)));
