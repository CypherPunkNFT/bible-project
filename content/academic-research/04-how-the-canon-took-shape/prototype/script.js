/* Design-only prototype. Data is a local snapshot of the existing dossier; no fetching or account state. */
const {boundaries,records,sources}=window.CANON_DATA;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceLink=id=>{const s=sources.find(s=>s.id===id);return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.title)} (opens in a new tab)">${esc(s.title)} ↗</a>`;};
const query=new URLSearchParams(location.search);
let writing=[0,1,2].includes(Number(query.get('writing')))?Number(query.get('writing')):0;
let witness=query.has('witness')&&[0,1,2].includes(Number(query.get('witness')))?Number(query.get('witness')):null;
let recordId=records.some(r=>r.id===query.get('record'))?query.get('record'):'athanasius';
const recordNames={sirach:'Sirach’s prologue',qumran:'Qumran collections',jude:'Jude',justin:'Justin',irenaeus:'Irenaeus',muratorian:'Muratorian fragment',mishnah:'Mishnah Yadayim',eusebius:'Eusebius',sinaiticus:'Codex Sinaiticus',athanasius:'Athanasius',augustine:'Augustine',jerome:'Jerome',peshitta:'Peshitta',carthage:'African Code',alexandrinus:'Codex Alexandrinus',bava:'Bava Batra',trent:'Trent',westminster:'Westminster'};
const findings=['Wisdom and Sirach enter Augustine’s canon. Athanasius recommends them for instruction outside his canon; Jerome distinguishes their edifying use from doctrinal authority.','Esther is canonical in Augustine’s enumeration and instructional in Athanasius’s letter. Jerome’s selected prologue does not discuss it: silence here cannot establish exclusion.','Hermas is recommended outside Athanasius’s canon. It is not enumerated by Augustine and not addressed in Jerome’s selected prologue. Those last two claims are not interchangeable.'];
function save(){const q=new URLSearchParams({writing:String(writing),record:recordId});if(witness!==null)q.set('witness',String(witness));history.replaceState(null,'','?'+q+location.hash);}
function statusClass(label){return label==='Canonical'?'canon':label.startsWith('Instruction')||label.startsWith('Edifying')?'instruction':'silence';}
$('#writing-controls').innerHTML=boundaries.books.map((b,i)=>`<button data-writing="${i}" aria-pressed="false">${esc(b)}</button>`).join('');
$('#folios').innerHTML=boundaries.witnesses.map((w,i)=>`<article class="folio"><header><p class="folio-number"><span>Selected witness</span><span>${['A','B','C'][i]}</span></p><h3>${esc(w.name)}</h3><p class="date">${esc(w.date)}</p></header><div class="entries">${w.states.map((s,j)=>`<button id="entry-${i}-${j}" class="entry" data-witness="${i}" data-book="${j}" aria-controls="inspection" aria-expanded="false" aria-label="${esc(w.name+': '+boundaries.books[j]+'. '+s.label+'. Inspect passage')} "><span class="status-mark ${statusClass(s.label)}" aria-hidden="true"></span><span><strong>${esc(boundaries.books[j])}</strong><small>${esc(s.label)}</small></span><span class="down" aria-hidden="true">↓</span></button>`).join('')}</div><footer>${esc(w.passage)}</footer></article>`).join('');
function render(){
 document.querySelectorAll('[data-writing]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.writing)===writing));
 document.querySelectorAll('.entry').forEach(b=>{b.classList.toggle('match',Number(b.dataset.book)===writing);b.setAttribute('aria-expanded',Number(b.dataset.witness)===witness&&Number(b.dataset.book)===writing);});
 $('#finding').textContent=findings[writing];$('#inspection').hidden=witness===null;
 if(witness!==null){const w=boundaries.witnesses[witness],s=w.states[writing];$('#inspection-location').textContent=w.date+' · '+w.passage;$('#inspection-title').textContent=w.name+' / '+boundaries.books[writing];$('#inspection-evidence').textContent=s.text;$('#inspection-quote').textContent='“'+w.excerpt+'”';$('#inspection-translation').textContent=w.translation+' · excerpt from this passage’s general criterion';$('#inspection-limit').textContent=w.principle+' '+records.find(r=>r.id===['athanasius','augustine','jerome'][witness]).limit;$('#inspection-links').innerHTML=w.sourceIds.map(sourceLink).join('');}
 save();
}
document.querySelectorAll('[data-writing]').forEach(b=>b.addEventListener('click',()=>{writing=Number(b.dataset.writing);render();}));
document.querySelectorAll('.entry').forEach(b=>b.addEventListener('click',()=>{witness=Number(b.dataset.witness);writing=Number(b.dataset.book);render();}));
function closeInspection(){const previous=witness;witness=null;render();if(previous!==null){const origin=$(`#entry-${previous}-${writing}`);origin.focus({preventScroll:true});const box=origin.getBoundingClientRect();if(box.bottom<65||box.top>innerHeight)origin.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
$('#close').addEventListener('click',closeInspection);
$('#inspection').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeInspection();}});
$('#reset').addEventListener('click',()=>{writing=0;witness=null;render();});
$('#record').innerHTML=records.map(r=>`<option value="${r.id}">${esc(recordNames[r.id]+' · '+r.date)}</option>`).join('');$('#record').value=recordId;
function showRecord(){const r=records.find(r=>r.id===recordId);$('#historical-record').innerHTML=`<p class="eyebrow">${esc(r.kind)} · ${esc(r.date)}</p><h3>${esc(r.title)}</h3><p class="place">${esc(r.place)}</p><dl><dt>Evidence</dt><dd>${esc(r.evidence)}</dd><dt>Interpretation</dt><dd>${esc(r.interpretation)}</dd><dt>The limit</dt><dd>${esc(r.limit)}</dd></dl><div class="source-links">${r.sourceIds.map(sourceLink).join('')}</div>`;save();}
$('#record').addEventListener('change',e=>{recordId=e.target.value;showRecord();});
render();showRecord();
