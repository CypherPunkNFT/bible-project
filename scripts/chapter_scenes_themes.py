"""Themes and the gallery in the Studio's Scenes pipeline: the Themes list in the side panel (each with its picture
count), the Scenes | Gallery tabs, the gallery grid and the large-picture view. The pictures are drawn outside the page
(codex_pictures.py), so there is no Make pictures button. Installed by chapter_scenes_view.py; the JS runs inside the
same closure as the scene cards and uses its helpers (el, api, mode, cache, renderScenes).
Docs: initiatives/chapter-scenes/README.md (Themes and the gallery).
"""

CSS = r"""
.theme-list{display:flex;flex-direction:column;gap:8px;margin:8px 0 14px}
.theme-row{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;align-items:center;text-align:left;border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:8px;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}
.theme-row:hover{border-color:#bdb59f}.theme-row.on{border-color:var(--green);background:#fff}
.theme-row img,.theme-row .blank{width:72px;aspect-ratio:16/9;border-radius:5px;object-fit:cover;display:block;background:linear-gradient(160deg,#f1f4ed,#e2e7dc)}
.theme-row b{display:block;font-size:13px;line-height:1.3}.theme-row small{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.theme-row,.view-tabs button,.theme-strip button,.gallery-grid button,.lb-btn,#gallery-filter button{outline:none}
.view-tabs{display:inline-flex;border:1px solid var(--line);border-radius:22px;padding:3px;background:var(--paper);margin:0 0 18px}
.view-tabs button{border:0;background:transparent;border-radius:18px;padding:7px 20px;font:inherit;font-size:12.5px;color:var(--muted);cursor:pointer}
.view-tabs button.on{background:var(--green);color:#fff;font-weight:600}
.theme-strip{display:flex;gap:6px;flex-wrap:wrap;margin:-6px 0 16px}
.theme-strip button{padding:0;border:2px solid transparent;border-radius:6px;background:none;cursor:pointer;line-height:0}
.theme-strip button.on{border-color:var(--green)}
.theme-strip img{width:76px;aspect-ratio:16/9;object-fit:cover;border-radius:4px;display:block}
.gallery-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px}
.gallery-head .writer-tabs{margin:0}.gallery-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#gallery-run{border:0;background:var(--green);color:#fff;border-radius:20px;padding:8px 18px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;outline:none}
#gallery-run:disabled{background:#cfd4ca;color:#6c756d;cursor:default}
.gallery-grid button.blank{cursor:pointer;display:flex;align-items:center;justify-content:center;border:1px dashed #cdd5c6;background:linear-gradient(160deg,#f1f4ed,#e7ebe1);color:var(--muted);font-size:11px;line-height:1.4;padding:10px;text-align:center}
.gallery-group{content-visibility:auto;contain-intrinsic-size:auto 320px;margin:0 0 28px}
.gallery-group h3{font:19px/1.3 Georgia;margin:0 0 12px;color:var(--ink)}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.gallery-grid button{display:block;padding:0;border:0;background:#eef0ea;border-radius:9px;overflow:hidden;cursor:zoom-in;aspect-ratio:16/9}
.gallery-grid img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}
.gallery-grid button:hover img{transform:scale(1.035)}
#lightbox{position:fixed;inset:0;z-index:60;background:rgba(14,21,17,.9);display:flex;align-items:center;justify-content:center;padding:56px 72px}
.lb-body{display:flex;gap:24px;align-items:center;width:100%;height:100%;min-height:0}#lightbox figure{margin:0;flex:1 1 auto;min-width:0;max-width:100%;display:flex;flex-direction:column;gap:14px;align-items:flex-start}#lb-verses{flex:0 0 min(380px,32vw);align-self:center;max-height:calc(100vh - 112px);overflow-y:auto;background:#1c2822;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:18px 20px;color:#e8eee9}#lb-ref{display:block;color:#9fb0a5;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px}#lb-text p{margin:0 0 10px;font:16px/1.7 Georgia,serif}#lb-text sup{color:#c9a85a;font:600 11px system-ui;margin-right:5px;vertical-align:2px}
#lightbox img{max-width:100%;max-height:calc(100vh - 112px);object-fit:contain;border-radius:8px;background:#fff;display:block}
#lb-count{display:block;color:#9fb0a5;font-size:11px;letter-spacing:1.2px;margin-bottom:6px}#lb-title{display:block;font:22px/1.3 Georgia,serif;color:#fff;margin-bottom:4px}#lb-caption{display:block;color:#cfd8d1;font-size:13px;margin-bottom:12px}#lb-moment{margin:0 0 16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.12);color:#dfe7e1;font-size:14.5px;line-height:1.6}
#lb-empty{width:100%;aspect-ratio:16/9;max-height:calc(100vh - 112px);border:1px dashed rgba(255,255,255,.3);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#cfd8d1;font-size:15px}
.lb-btn{position:fixed;border:0;background:rgba(255,255,255,.12);color:#fff;width:46px;height:46px;border-radius:50%;font-size:26px;line-height:1;cursor:pointer}
.lb-btn:hover{background:rgba(255,255,255,.24)}.lb-btn.close{top:16px;right:16px}
.lb-btn.prev{left:14px;top:50%;transform:translateY(-50%)}.lb-btn.next{right:14px;top:50%;transform:translateY(-50%)}
@media(max-width:650px){.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#lightbox{padding:64px 12px 24px}.lb-body{flex-direction:column;align-items:stretch;overflow-y:auto}#lightbox figure{flex:none}#lb-verses{flex:none;width:auto;max-height:none;align-self:auto}
.lb-btn.prev,.lb-btn.next{top:auto;bottom:14px;transform:none}}
"""

SIDE = (
    '<div class="eyebrow">Themes</div><div class="theme-list" id="theme-list"></div>'
    '<p class="help" id="theme-desc"></p>')

TOP = (
    '<div class="view-tabs" role="tablist" aria-label="Scenes view"><button data-view="scenes" class="on">Scenes</button>'
    '<button data-view="gallery">Gallery</button></div>'
    '<section id="gallery" hidden><div class="gallery-head"><div class="gallery-tools">'
    '<div class="writer-tabs" id="gallery-filter"></div></div>'
    '<div class="gallery-tools"><span class="tiny" id="gallery-count"></span>'
    '<button id="gallery-run">▶ Speed run</button></div></div><div id="gallery-body"></div></section>'
    '<div id="lightbox" hidden><button class="lb-btn close" id="lb-close" aria-label="Close">×</button>'
    '<button class="lb-btn prev" id="lb-prev" aria-label="Previous picture">‹</button>'
    '<div class="lb-body"><figure><img id="lb-img" alt=""><div id="lb-empty" hidden>Not drawn yet</div></figure>'
    '<div id="lb-verses" role="region" aria-label="Scene and verses"><span id="lb-count"></span><b id="lb-title"></b>'
    '<span id="lb-caption"></span><p id="lb-moment" hidden></p><span id="lb-ref"></span><div id="lb-text"></div></div></div>'
    '<button class="lb-btn next" id="lb-next" aria-label="Next picture">›</button></div>')

JS = r"""
let themes=[],theme='',view='scenes',gallery=[],galleryFilter='all',galleryBook='',galleryAt='',lbItems=[],lbIndex=0;
try{galleryFilter=localStorage.getItem('studio-gallery-filter')==='finished'?'finished':'all';theme=localStorage.getItem('studio-theme')||'';view=localStorage.getItem('studio-scenes-view')==='gallery'?'gallery':'scenes'}catch(e){}
const themeName=id=>(themes.find(t=>t.id===id)||{}).name||id;
const bookName=code=>(BOOT.books.find(b=>b.code===code)||{}).name||code;
const chapterLabel=k=>{const [c,n]=k.split(':');return bookName(c)+' '+n};
const versesLabel=(a,b)=>a===b?String(a):a+'–'+b;
function renderThemes(){const box=$('theme-list');box.replaceChildren();
 themes.forEach(t=>{const b=el('button','theme-row'+(t.id===theme?' on':''));b.setAttribute('aria-pressed',t.id===theme?'true':'false');
  if(t.sample){const i=new Image();i.alt='';i.src=t.sample;b.append(i)}else b.append(el('span','blank'));
  const words=el('span');words.append(el('b',null,t.name),el('small',null,t.made.toLocaleString()+' / '+t.total.toLocaleString()+' pictures'));b.append(words);
  b.onclick=()=>setTheme(t.id);box.append(b)});
 const t=themes.find(x=>x.id===theme);$('theme-desc').textContent=t?t.description:''}
function setThemes(list){const before=theme;themes=list||[];if(!themes.some(t=>t.id===theme))theme=themes[0]?themes[0].id:'';renderThemes();
 if(theme!==before&&mode==='scenes'&&view==='gallery')loadGallery()}
function setTheme(id){if(!themes.some(t=>t.id===id)||id===theme)return;theme=id;try{localStorage.setItem('studio-theme',id)}catch(e){}renderThemes();
 if(mode==='scenes'){if(view==='gallery')loadGallery();else renderScenes()}}
async function refreshSummary(){const d=await api('/api/scenes');sceneKeys=d.keys;setThemes(d.themes);counts();renderTiles()}
const largeItem=i=>({full:i[6],key:i[0],writer:i[1],scene:i[2],vs:i[4],ve:i[5],title:i[3],caption:chapterLabel(i[0])+':'+versesLabel(i[4],i[5])+' · '+themeName(theme)});
async function galleryItems(){return (await api('/api/gallery?theme='+encodeURIComponent(theme))).items}  // fresh: runs keep importing
function framePicture(frame,s,n){const pics=s.pictures||{},cur=pics[theme];if(!cur)return;
 const img=new Image();img.loading='lazy';img.alt=s.title;img.src=cur.full;img.title='Open large';
 img.onclick=async()=>{const k=key(),single=[{full:cur.full,key:k,writer:'haiku',scene:n,vs:s.verse_start,ve:s.verse_end,title:s.title,caption:chapterLabel(k)+':'+versesLabel(s.verse_start,s.verse_end)+' · '+themeName(theme)}];
  // Open inside every drawn picture of the theme, so → carries on past this chapter and book.
  try{const drawn=(await galleryItems()).filter(i=>i[6]),at=drawn.findIndex(i=>i[0]===k&&i[2]===n&&i[3]===s.title);openLightbox(at<0?single:drawn.map(largeItem),Math.max(at,0))}
  catch(e){openLightbox(single,0)}};
 img.onerror=()=>{frame.classList.remove('has-picture');img.remove()};frame.classList.add('has-picture');frame.append(img)}
function themeStrip(s){const pics=s.pictures||{},have=themes.filter(t=>pics[t.id]);if(have.length<2)return null;
 const strip=el('div','theme-strip');have.forEach(t=>{const b=el('button',t.id===theme?'on':'');b.title=t.name;const i=new Image();i.alt=t.name;i.loading='lazy';i.src=pics[t.id].thumb;b.append(i);b.onclick=()=>setTheme(t.id);strip.append(b)});return strip}
async function loadGallery(){const body=$('gallery-body'),wanted=theme;body.replaceChildren(el('p','scenes-empty','Loading pictures…'));if(!wanted)return;
 try{const d=await api('/api/gallery?theme='+encodeURIComponent(wanted));if(wanted!==theme)return;gallery=d.items;renderGallery()}
 catch(e){body.replaceChildren(el('p','scenes-empty',e.message))}}
// The page shows only the chosen book; the large view and the speed run step through every book.
function renderGallery(){const body=$('gallery-body'),filter=$('gallery-filter'),book=code;body.replaceChildren();filter.replaceChildren();galleryBook=book;galleryAt=key();
 [['all','All'],['finished','Finished']].forEach(([f,label])=>{const b=el('button',f===galleryFilter?'on':'',label);b.onclick=()=>{galleryFilter=f;try{localStorage.setItem('studio-gallery-filter',f)}catch(e){}renderGallery()};filter.append(b)});
 const all=galleryFilter==='finished'?gallery.filter(i=>i[6]):gallery,large=all.map(largeItem),inBook=[];
 all.forEach((it,n)=>{if(it[0].split(':')[0]===book)inBook.push(n)});
 const drawn=inBook.filter(n=>all[n][6]).length;
 $('gallery-count').textContent=bookName(book)+' · '+(galleryFilter==='finished'?drawn.toLocaleString()+' pictures':inBook.length.toLocaleString()+' scenes · '+drawn.toLocaleString()+' drawn')+' · '+themeName(theme);
 $('gallery-run').disabled=!large.length;$('gallery-run').onclick=()=>openLightbox(large,inBook.length?inBook[0]:0);
 if(!inBook.length){body.append(el('p','scenes-empty',gallery.length?'No pictures in '+bookName(book)+' yet.':'No scenes yet.'));return}
 const groups=[];inBook.forEach(n=>{const g=groups[groups.length-1];if(g&&g.key===all[n][0])g.items.push(n);else groups.push({key:all[n][0],items:[n]})});
 groups.forEach(g=>{const sec=el('section','gallery-group'),grid=el('div','gallery-grid');sec.dataset.galleryKey=g.key;sec.append(el('h3',null,chapterLabel(g.key)));
  g.items.forEach(n=>{const it=all[n],b=el('button',it[6]?'':'blank');b.title=it[3];b.onclick=()=>openLightbox(large,n);
   if(it[6]){const img=new Image();img.loading='lazy';img.decoding='async';img.alt=it[3];img.src=it[7];b.append(img)}else b.textContent='Not drawn yet · '+it[3];grid.append(b)});
  sec.append(grid);body.append(sec)})}
// Called after a book or chapter click: a new book redraws the page, a new chapter scrolls to it.
function galleryFollow(){const k=key();if(k===galleryAt||!gallery.length)return;if(code!==galleryBook)renderGallery();galleryAt=k;
 document.querySelector('[data-gallery-key="'+k+'"]')?.scrollIntoView({block:'start',behavior:'smooth'})}
const chapterText={};let verseRequest=0;
const chapterScenes={};
function sceneMoment(it){if(!chapterScenes[it.key])chapterScenes[it.key]=api('/api/scenes?key='+encodeURIComponent(it.key)).then(d=>d.writers).catch(e=>{delete chapterScenes[it.key];throw e});
 return chapterScenes[it.key].then(w=>w[it.writer]?.scenes?.[it.scene]?.moment||'')}
async function showMoment(it,request){const box=$('lb-moment');box.hidden=true;try{const text=await sceneMoment(it);if(request===verseRequest&&text){box.textContent=text;box.hidden=false}}catch(e){}}
function chapterVerses(k){if(!chapterText[k]){const [c,n]=k.split(':');chapterText[k]=api('/api/chapter?code='+c+'&chapter='+n+'&translation=bsb').then(d=>d.verses).catch(e=>{delete chapterText[k];throw e})}return chapterText[k]}
async function showVersesPanel(it){const request=++verseRequest,box=$('lb-text');$('lb-ref').textContent=chapterLabel(it.key)+':'+versesLabel(it.vs,it.ve)+' · BSB';box.replaceChildren(el('p',null,'Loading verses…'));$('lb-verses').scrollTop=0;showMoment(it,request);
 try{const verses=await chapterVerses(it.key);if(request!==verseRequest)return;box.replaceChildren();
  verses.forEach(v=>{const nums=String(v.number).split(/[-–]/).map(Number);if(!v.text||nums[0]>it.ve||nums.at(-1)<it.vs)return;const p=el('p');p.append(el('sup',null,String(v.number)),v.text);box.append(p)});
  if(!box.childElementCount)box.append(el('p',null,'No verse text found for this range.'))}
 catch(e){if(request===verseRequest)box.replaceChildren(el('p',null,'Could not load the verses: '+e.message))}}
function openLightbox(items,n){lbItems=items;lbIndex=n;$('lightbox').hidden=false;showLarge()}
function showLarge(){const it=lbItems[lbIndex],img=$('lb-img');if(it.full)img.src=it.full;else img.removeAttribute('src');img.hidden=!it.full;$('lb-empty').hidden=!!it.full;
 img.alt=it.title;$('lb-title').textContent=it.title;$('lb-caption').textContent=it.caption;$('lb-count').textContent=lbItems.length>1?(lbIndex+1).toLocaleString()+' / '+lbItems.length.toLocaleString():'';
 $('lb-prev').hidden=$('lb-next').hidden=lbItems.length<2;showVersesPanel(it);[lbIndex-1,lbIndex+1].forEach(j=>{if(lbItems[j]?.full)new Image().src=lbItems[j].full})}
function step(d){if(lbItems.length<2)return;lbIndex=(lbIndex+d+lbItems.length)%lbItems.length;showLarge()}
function closeLightbox(){$('lightbox').hidden=true;$('lb-img').removeAttribute('src')}
$('lb-prev').onclick=e=>{e.stopPropagation();step(-1)};$('lb-next').onclick=e=>{e.stopPropagation();step(1)};$('lb-close').onclick=closeLightbox;
$('lightbox').onclick=e=>{if(e.target.id==='lightbox'||e.target.classList.contains('lb-body'))closeLightbox()};
document.addEventListener('keydown',e=>{if($('lightbox').hidden)return;if(e.key==='Escape')closeLightbox();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1)});
function setView(v){view=v;try{localStorage.setItem('studio-scenes-view',v)}catch(e){}applyMode()}
document.querySelectorAll('.view-tabs [data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
"""
