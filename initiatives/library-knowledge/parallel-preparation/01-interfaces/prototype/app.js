const page = document.body.dataset.page;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const works = {
 fergusson: {author:'James Fergusson', title:'A brief exposition of Galatians and Ephesians', edition:'TCP A41197 · English', credit:'Edition dates remain outside this design fixture.', route:'/teachers/works/held-140823cc0ca835eda48a3dc99d4025ef', availability:'readable'},
 sermons: {author:'John Calvin',title:'Sermons on Ephesians',edition:'TCP A17705 · English',credit:'Translated by Arthur Golding',route:'/teachers/works/held-ec5430010801378dda5e6e5fa89e87b1',availability:'readable'},
 commentary: {author:'John Calvin',title:'Commentary on Galatians and Ephesians',edition:'Held CCEL edition · English',credit:'Translated by William Pringle',route:'/teachers/works/held-fac8c754eb4291391a28e94f9e285c40',availability:'catalogue'},
 hodge: {author:'Charles Hodge',title:'Commentary on Ephesians',edition:'Held CCEL edition · English',credit:'Edition and contributor details require reconciliation.',route:'/teachers/works/held-a25226498c8646bb3b062d0b3e58ccbe',availability:'catalogue'}
};
let selectedWork=page==='topic'?'hodge':'fergusson', chapter=1, author=null;
const stateNames={readable:'On-site readable',catalogue:'Catalogue only',candidate:'Candidate awaiting review',conflict:'Source conflict',empty:'Empty / unsupported',loading:'Loading',stale:'Stale data'};
const common = `<a class="skip" href="#main">Skip to content</a><header class="top"><a class="brand" href="index.html">Bible Project <span class="caption">/ design study</span></a><nav aria-label="Prototype navigation">${[['passage','Passage'],['topic','Topic'],['shelf','Shelves']].map(([id,label])=>`<a href="${id}.html" ${page===id?'aria-current="page"':''}>${label}</a>`).join('')}<button id="theme" aria-label="Switch to dark theme">Dark</button></nav></header>`;
document.body.insertAdjacentHTML('afterbegin',common);
$('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').textContent=dark?'Light':'Dark';$('#theme').setAttribute('aria-label',`Switch to ${dark?'light':'dark'} theme`)};
const demo=$('#demo');
if(demo) demo.innerHTML=`<p><b>Interaction prototype</b> · synthetic text · no published evidence</p><label>Preview state <select id="state">${Object.entries(stateNames).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>`;
document.body.insertAdjacentHTML('beforeend',`<dialog id="reader-dialog" aria-labelledby="dialog-title"><h2 id="dialog-title"></h2><div id="dialog-body"></div><footer><button id="close-dialog" class="primary">Return to study</button></footer></dialog>`);
const dialog=$('#reader-dialog');
$('#close-dialog').onclick=()=>dialog.close();
function showRoute(route,title,readable){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=`<p class="fixture">Offline interaction simulation</p><p>${readable?'In the site, this action opens the held edition at its whole-work reader.':'In the site, this action opens the catalogue record; it does not offer an external reading replacement.'}</p><code>${esc(route)}</code><p class="caption">No passage deep link or automatic page jump is promised. This prototype stays offline and contains no source text.</p>`;dialog.showModal();}
function renderState(){
 const state=$('#state').value,w=works[selectedWork],target=$('#state-content');
 if(page==='shelf'&&!author){target.innerHTML='';return;}
 if(state==='empty'){target.innerHTML='<section class="state-card"><span class="badge warn">No reviewed connection in this selection</span><h3>There is more to investigate.</h3><p>This selected view has no supported result. It does not establish that the library or author lacks relevant material.</p><button data-reset>Reset this view</button></section>';wire();return;}
 if(state==='loading'){target.innerHTML='<section class="state-card" aria-busy="true"><p role="status">Loading this selected collection…</p><div class="loading-lines" aria-hidden="true"><span></span><span></span><span></span></div><p class="caption">Navigation and the chapter text remain available. This is a manually controlled loading demo.</p><button data-reset>Cancel loading demo</button></section>';wire();return;}
 const warning=['candidate','conflict','stale'].includes(state);
 const notes={readable:'The held edition is readable on-site. A located section does not establish editorial or doctrinal approval.',catalogue:'We hold this edition. Its exact reading copy is not available on-site in this fixture.',candidate:'A chapter heading suggests a connection. The verse range and local author position have not been reviewed.',conflict:'The printed heading and proposed reference disagree. The disputed connection is withheld; the source is not silently corrected.',stale:'The source or collection version has changed. This connection needs reverification before reuse.'};
 const effective=state==='readable'?'readable':state==='catalogue'?'catalogue':w.availability;
 target.innerHTML=`<section class="state-card"><div class="basis"><span class="badge ${warning?'warn':''}">${stateNames[state]}</span><span>${page==='passage'?`Ephesians ${chapter} · section context`:'Selected work · design fixture'}</span></div><h3>${esc(w.title)}</h3><p class="metadata">${esc(w.author)} · ${esc(w.edition)}<br>${esc(w.credit)}</p><p>${notes[state]}</p>${warning?`<div class="callout"><p>${state==='conflict'?'Reference binding withheld. No quotation or verse link is presented.':state==='stale'?'Last-known metadata remains visible. Reading-link verification and evidence reuse are withheld.':'Candidate only. No relevance score, endorsement or reviewed answer is assigned.'}</p></div>`:`<div class="callout"><p><span class="fixture">Synthetic layout sample</span><br>A located excerpt would appear here with enough context to distinguish exposition from a quoted opposing position.</p></div>`}<details><summary>Why is this shown?</summary><p>${page==='topic'?'This is a proposed question-to-source association used to test the layout. Topic relevance has not been evaluated.':'The bounded pilot identified explicit Ephesians chapter or section structure. This fixture does not supply a new claim-specific review.'}</p><p>Basis, source availability and editorial review are separate fields. No similarity score is treated as approval.</p></details><div class="actions">${['readable','catalogue'].includes(state)?`<button class="primary" data-route="${effective==='readable'?'read':'catalogue'}">${effective==='readable'?'Read held edition':'View catalogue record'} →</button>`:`<button data-route="catalogue">Inspect catalogue identity →</button>`}${state==='stale'?'<button data-reset>Restore unchanged fixture</button>':''}</div><p class="caption">${state==='readable'?'Whole-work destination only; select a reading page inside the reader.':'No outside-site reading substitute.'}</p></section>`;
 wire();
}
function wire(){document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>showRoute(works[selectedWork].route,b.dataset.route==='read'?'Open the held edition':'Inspect the catalogue record',b.dataset.route==='read'));document.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{$('#state').value=works[selectedWork].availability;renderState();$('#state').focus()});}
if($('#state')){$('#state').value=page==='topic'?'candidate':'readable';$('#state').onchange=()=>{
 const state=$('#state').value;
 if(state==='readable'||state==='catalogue'){
   selectedWork=state==='readable'?'fergusson':'hodge';
   if(page==='shelf')selectAuthor(selectedWork,false);
   if(page==='passage')$('#work-choice').value=selectedWork;
 }
 if(page==='shelf'&&!author)selectAuthor('calvin',false);
 renderState();
 };}
if(page==='passage'){
 function setChapter(n){chapter=n;$('#chapter-number').textContent=n;$('#previous').disabled=n===1;$('#next').disabled=n===6;$('#reading-heading').textContent=`Ephesians ${n}`;renderState()}
 $('#previous').onclick=()=>setChapter(chapter-1);$('#next').onclick=()=>setChapter(chapter+1);
 $('#bible-route').onclick=()=>showRoute(`/read/kjv/EPH/${chapter}`,'Open the Bible reader',true);
 $('#work-choice').onchange=e=>{selectedWork=e.target.value;$('#state').value=works[selectedWork].availability;renderState()};renderState();
}
if(page==='topic'){
 document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-question]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#question-heading').textContent=b.dataset.question;$('#state').value='candidate';renderState()});renderState();
}
const authorWorks={fergusson:['fergusson'],calvin:['sermons','commentary'],hodge:['hodge']};
function selectAuthor(id,reset=true){author=id;selectedWork=authorWorks[id][0];$('#shelf-placeholder').hidden=true;$('#shelf-panel').hidden=false;document.querySelectorAll('[data-author]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.author===id)));$('#shelf-heading').textContent=works[selectedWork].author;$('#edition').innerHTML=authorWorks[id].map(k=>`<option value="${k}">${esc(works[k].title)} — ${esc(works[k].edition)}</option>`).join('');if(reset)$('#state').value=works[selectedWork].availability;renderState();}
if(page==='shelf'){
 document.querySelectorAll('[data-author]').forEach(b=>b.onclick=()=>selectAuthor(b.dataset.author));
 $('#edition').onchange=e=>{selectedWork=e.target.value;$('#state').value=works[selectedWork].availability;renderState()};
 $('#close-shelf').onclick=()=>{const old=author;author=null;$('#shelf-panel').hidden=true;$('#shelf-placeholder').hidden=false;document.querySelectorAll('[data-author]').forEach(b=>b.setAttribute('aria-pressed','false'));$(`[data-author="${old}"]`).focus()};
 $('#search').oninput=e=>{let count=0;document.querySelectorAll('.contributors li').forEach(li=>{li.hidden=!li.textContent.toLowerCase().includes(e.target.value.toLowerCase());if(!li.hidden)count++});$('#search-count').textContent=`${count} of 3 fixture contributors`;$('#search-empty').hidden=count>0;};
 $('#clear-search').onclick=()=>{$('#search').value='';$('#search').dispatchEvent(new Event('input'));$('#search').focus()};
}
