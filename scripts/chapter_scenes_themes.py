"""Themes and the gallery in the Studio's Scenes pipeline: the Themes list in the side panel (with Make pictures), the
Scenes | Gallery tabs, the gallery grid and the large-picture view. Installed by chapter_scenes_view.py; the JS runs
inside the same closure as the scene cards and uses its helpers (el, api, mode, cache, renderScenes, WRITERS).
Docs: initiatives/chapter-scenes/README.md (Themes and the gallery).
"""

CSS = r"""
.theme-list{display:flex;flex-direction:column;gap:8px;margin:8px 0 14px}
.theme-row{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:8px;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}
.theme-row:hover{border-color:#bdb59f}.theme-row.on{border-color:var(--green);background:#fff}
.theme-row img,.theme-row .blank{width:72px;aspect-ratio:16/9;border-radius:5px;object-fit:cover;display:block;background:linear-gradient(160deg,#f1f4ed,#e2e7dc)}
.theme-row b{display:block;font-size:13px;line-height:1.3}.theme-row small{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.theme-run{display:flex;flex-direction:column;gap:8px;margin:12px 0 4px}
.theme-run button{border:0;background:var(--green);color:#fff;border-radius:8px;padding:11px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.theme-run button.stop{background:#8a3b30}.theme-run button:disabled{background:#cfd4ca;color:#6c756d;cursor:default}
#theme-progress{font-size:11.5px;color:var(--muted);line-height:1.55;white-space:pre-line}
.theme-row,.theme-run button,.view-tabs button,.theme-strip button,.gallery-grid button,.lb-btn,#gallery-writers button{outline:none}
.view-tabs{display:inline-flex;border:1px solid var(--line);border-radius:22px;padding:3px;background:var(--paper);margin:0 0 18px}
.view-tabs button{border:0;background:transparent;border-radius:18px;padding:7px 20px;font:inherit;font-size:12.5px;color:var(--muted);cursor:pointer}
.view-tabs button.on{background:var(--green);color:#fff;font-weight:600}
.theme-strip{display:flex;gap:6px;flex-wrap:wrap;margin:-6px 0 16px}
.theme-strip button{padding:0;border:2px solid transparent;border-radius:6px;background:none;cursor:pointer;line-height:0}
.theme-strip button.on{border-color:var(--green)}
.theme-strip img{width:76px;aspect-ratio:16/9;object-fit:cover;border-radius:4px;display:block}
.gallery-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px}
.gallery-head .writer-tabs{margin:0}
.gallery-group{content-visibility:auto;contain-intrinsic-size:auto 320px;margin:0 0 28px}
.gallery-group h3{font:19px/1.3 Georgia;margin:0 0 12px;color:var(--ink)}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.gallery-grid button{display:block;padding:0;border:0;background:#eef0ea;border-radius:9px;overflow:hidden;cursor:zoom-in;aspect-ratio:16/9}
.gallery-grid img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}
.gallery-grid button:hover img{transform:scale(1.035)}
#lightbox{position:fixed;inset:0;z-index:60;background:rgba(14,21,17,.9);display:flex;align-items:center;justify-content:center;padding:56px 72px}
#lightbox figure{margin:0;max-width:100%;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
#lightbox img{max-width:100%;max-height:calc(100vh - 170px);object-fit:contain;border-radius:8px;background:#fff;display:block}
#lightbox figcaption{color:#cfd8d1;font-size:13px;line-height:1.6}#lightbox figcaption b{display:block;font:20px/1.3 Georgia;color:#fff}
.lb-btn{position:fixed;border:0;background:rgba(255,255,255,.12);color:#fff;width:46px;height:46px;border-radius:50%;font-size:26px;line-height:1;cursor:pointer}
.lb-btn:hover{background:rgba(255,255,255,.24)}.lb-btn.close{top:16px;right:16px}
.lb-btn.prev{left:14px;top:50%;transform:translateY(-50%)}.lb-btn.next{right:14px;top:50%;transform:translateY(-50%)}
@media(max-width:650px){.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#lightbox{padding:64px 12px 24px}
.lb-btn.prev,.lb-btn.next{top:auto;bottom:14px;transform:none}}
"""

SIDE = (
    '<div class="eyebrow">Themes</div><div class="theme-list" id="theme-list"></div>'
    '<p class="help" id="theme-desc"></p><div class="theme-run"><button id="theme-make" disabled>Make pictures</button>'
    '<span id="theme-progress"></span></div>')

TOP = (
    '<div class="view-tabs" role="tablist" aria-label="Scenes view"><button data-view="scenes" class="on">Scenes</button>'
    '<button data-view="gallery">Gallery</button></div>'
    '<section id="gallery" hidden><div class="gallery-head"><div class="writer-tabs" id="gallery-writers"></div>'
    '<span class="tiny" id="gallery-count"></span></div><div id="gallery-body"></div></section>'
    '<div id="lightbox" hidden><button class="lb-btn close" id="lb-close" aria-label="Close">×</button>'
    '<button class="lb-btn prev" id="lb-prev" aria-label="Previous picture">‹</button>'
    '<figure><img id="lb-img" alt=""><figcaption><b id="lb-title"></b><span id="lb-caption"></span></figcaption></figure>'
    '<button class="lb-btn next" id="lb-next" aria-label="Next picture">›</button></div>')

JS = r"""
let themes=[],theme='',view='scenes',gallery=[],galleryPick='both',galleryObserver=null,runTimer=null,polls=0,lastRun={running:false},lbItems=[],lbIndex=0;
try{theme=localStorage.getItem('studio-theme')||'';view=localStorage.getItem('studio-scenes-view')==='gallery'?'gallery':'scenes'}catch(e){}
const themeName=id=>(themes.find(t=>t.id===id)||{}).name||id;
const bookName=code=>(BOOT.books.find(b=>b.code===code)||{}).name||code;
const chapterLabel=k=>{const [c,n]=k.split(':');return bookName(c)+' '+n};
const versesLabel=(a,b)=>a===b?String(a):a+'–'+b;
function renderThemes(){const box=$('theme-list');box.replaceChildren();
 themes.forEach(t=>{const b=el('button','theme-row'+(t.id===theme?' on':''));b.setAttribute('aria-pressed',t.id===theme?'true':'false');
  if(t.sample){const i=new Image();i.alt='';i.src=t.sample;b.append(i)}else b.append(el('span','blank'));
  const words=el('span');words.append(el('b',null,t.name),el('small',null,t.made.toLocaleString()+' / '+t.total.toLocaleString()+' pictures'));b.append(words);
  b.onclick=()=>setTheme(t.id);box.append(b)});
 const t=themes.find(x=>x.id===theme);$('theme-desc').textContent=t?t.description:'';showRun(lastRun)}
function setThemes(list){themes=list||[];if(!themes.some(t=>t.id===theme))theme=themes[0]?themes[0].id:'';renderThemes()}
function setTheme(id){if(!themes.some(t=>t.id===id)||id===theme)return;theme=id;try{localStorage.setItem('studio-theme',id)}catch(e){}renderThemes();
 if(mode==='scenes'){if(view==='gallery')loadGallery();else renderScenes()}}
function showRun(r){lastRun=r||{running:false};const b=$('theme-make'),p=$('theme-progress'),t=themes.find(x=>x.id===theme);
 if(lastRun.running){b.className='stop';b.disabled=false;b.textContent='Stop';
  const names=(lastRun.theme_names||lastRun.themes||[]).join(', ');
  p.textContent=(lastRun.state==='starting'?'Starting':(lastRun.done||0).toLocaleString()+' of '+(lastRun.total||0).toLocaleString()+' drawn')+(names?' · '+names:'')+(lastRun.message?'\n'+lastRun.message:'');return}
 const left=t?t.total-t.made:0;b.className='';b.disabled=!t||left<=0;
 b.textContent=!t?'Make pictures':left<=0?'All '+t.total.toLocaleString()+' made':'Make '+left.toLocaleString()+' pictures';
 p.textContent=lastRun.message||''}
async function refreshSummary(){const d=await api('/api/scenes');sceneKeys=d.keys;setThemes(d.themes);counts();renderTiles()}
async function poll(){clearTimeout(runTimer);if(mode!=='scenes')return;
 try{const was=lastRun.running,r=await api('/api/pictures/state');showRun(r);polls++;
  if((was&&!r.running)||(r.running&&polls%10===0)){await refreshSummary();cache={};if(view==='gallery')loadGallery();else loadScenes()}}catch(e){}
 runTimer=setTimeout(poll,lastRun.running?2000:15000)}
$('theme-make').onclick=async()=>{const b=$('theme-make');b.disabled=true;
 try{showRun(lastRun.running?await api('/api/pictures/stop',{}):await api('/api/pictures/start',{theme}));poll()}
 catch(e){$('theme-progress').textContent=e.message;b.disabled=false}};
function framePicture(frame,s){const pics=s.pictures||{},cur=pics[theme];if(!cur)return;
 const img=new Image();img.loading='lazy';img.alt=s.title;img.src=cur.full;img.title='Open large';
 img.onclick=()=>openLightbox([{full:cur.full,title:s.title,caption:chapterLabel(key())+':'+versesLabel(s.verse_start,s.verse_end)+' · '+themeName(theme)}],0);
 img.onerror=()=>{frame.classList.remove('has-picture');img.remove()};frame.classList.add('has-picture');frame.append(img)}
function themeStrip(s){const pics=s.pictures||{},have=themes.filter(t=>pics[t.id]);if(have.length<2)return null;
 const strip=el('div','theme-strip');have.forEach(t=>{const b=el('button',t.id===theme?'on':'');b.title=t.name;const i=new Image();i.alt=t.name;i.loading='lazy';i.src=pics[t.id].thumb;b.append(i);b.onclick=()=>setTheme(t.id);strip.append(b)});return strip}
async function loadGallery(){const body=$('gallery-body'),wanted=theme;galleryObserver?.disconnect();body.replaceChildren(el('p','scenes-empty','Loading pictures…'));
 try{const d=await api('/api/gallery?theme='+encodeURIComponent(wanted));if(wanted!==theme)return;gallery=d.items;renderGallery()}
 catch(e){body.replaceChildren(el('p','scenes-empty',e.message))}}
function renderGallery(){const body=$('gallery-body'),tabs=$('gallery-writers');galleryObserver?.disconnect();body.replaceChildren();tabs.replaceChildren();
 const writers=[...new Set(gallery.map(i=>i[1]))].sort(),choices=writers.length>1?['both',...writers]:writers;
 if(!choices.includes(galleryPick))galleryPick=choices[0]||'both';
 choices.forEach(w=>{const b=el('button',w===galleryPick?'on':'',w==='both'?'Both writers':WRITERS[w]||w);b.onclick=()=>{galleryPick=w;renderGallery()};tabs.append(b)});
 const items=gallery.filter(i=>galleryPick==='both'||i[1]===galleryPick);
 $('gallery-count').textContent=items.length.toLocaleString()+' pictures · '+themeName(theme);
 if(!items.length){body.append(el('p','scenes-empty','No pictures in this theme yet. Press Make pictures in the side panel.'));return}
 const large=items.map(i=>({full:i[6],title:i[3],caption:chapterLabel(i[0])+':'+versesLabel(i[4],i[5])+' · '+(WRITERS[i[1]]||i[1])+' · '+themeName(theme)}));
 const groups=[];items.forEach((it,n)=>{const g=groups[groups.length-1];if(g&&g.key===it[0])g.items.push(n);else groups.push({key:it[0],items:[n]})});
 const sentinel=el('div');body.append(sentinel);let shown=0;
 const more=()=>{const end=Math.min(groups.length,shown+30);for(;shown<end;shown++){const g=groups[shown],sec=el('section','gallery-group'),grid=el('div','gallery-grid');
   sec.append(el('h3',null,chapterLabel(g.key)));
   g.items.forEach(n=>{const it=items[n],b=el('button'),img=new Image();b.title=it[3];img.loading='lazy';img.decoding='async';img.alt=it[3];img.src=it[7];b.append(img);b.onclick=()=>openLightbox(large,n);grid.append(b)});
   sec.append(grid);body.insertBefore(sec,sentinel)}
  if(shown>=groups.length){galleryObserver.disconnect();sentinel.remove()}};
 galleryObserver=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting))more()},{rootMargin:'900px'});more();if(sentinel.isConnected)galleryObserver.observe(sentinel)}
function openLightbox(items,n){lbItems=items;lbIndex=n;$('lightbox').hidden=false;showLarge()}
function showLarge(){const it=lbItems[lbIndex];$('lb-img').src=it.full;$('lb-img').alt=it.title;$('lb-title').textContent=it.title;$('lb-caption').textContent=it.caption;
 $('lb-prev').hidden=$('lb-next').hidden=lbItems.length<2;[lbIndex-1,lbIndex+1].forEach(j=>{if(lbItems[j])new Image().src=lbItems[j].full})}
function step(d){if(lbItems.length<2)return;lbIndex=(lbIndex+d+lbItems.length)%lbItems.length;showLarge()}
function closeLightbox(){$('lightbox').hidden=true;$('lb-img').removeAttribute('src')}
$('lb-prev').onclick=e=>{e.stopPropagation();step(-1)};$('lb-next').onclick=e=>{e.stopPropagation();step(1)};$('lb-close').onclick=closeLightbox;
$('lightbox').onclick=e=>{if(e.target.id==='lightbox')closeLightbox()};
document.addEventListener('keydown',e=>{if($('lightbox').hidden)return;if(e.key==='Escape')closeLightbox();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1)});
function setView(v){view=v;try{localStorage.setItem('studio-scenes-view',v)}catch(e){}applyMode()}
document.querySelectorAll('.view-tabs [data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
"""
