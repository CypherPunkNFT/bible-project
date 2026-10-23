/* The question explorer. Data comes from the question bank build (scripts/question_explorer.py); flags are saved
   through /data_questions/api/flag into content/questions/flags.json. Text from the data is never set as HTML. */
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
const fmt=n=>Number(n).toLocaleString('en-US');
const API='/data_questions/api/';
try{document.body.classList.toggle('dark',localStorage.getItem('acquisition-theme')==='dark');}catch{}
$('theme').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('acquisition-theme',document.body.classList.contains('dark')?'dark':'light');}catch{}};

const KINDS={trivia:'Bible quiz',lesson:'Sunday school lesson',catechism:'Catechism'};
const VERDICTS={keep:'Kept',fix:'Fixed',hide:'Hidden',none:'Not checked'};
const SHORT_WRONG={question:'Question',answer:'Answer',choice:'Choice',reworded:'Reworded',reference:'Reference',other:'Other'};
const FAULTS={wrong_answer:'Wrong answer',choice_also_right:'A wrong choice also right',misquote:'Misquote or overstatement',other_translation:'King James or other wording',reference:'Reference',other:'Other'};
let ROWS=[],VERSES={},BOOKS={},WRONG={},filtered=[],flags={};
const state={selected:{},search:'',terms:[],sort:{key:null,dir:1}};

// Each filter: its title, the values a row has for it (several for some), and how a value reads.
const FACETS=[
 {key:'status',title:'Status',values:r=>[r.status],label:v=>({shown:'Shown',repeat:'Repeat',hidden:'Hidden'}[v])},
 {key:'verdict',title:"The check's verdict",values:r=>[r.verdict??'none'],label:v=>VERDICTS[v]},
 {key:'wrong',title:'Type of wrong',values:r=>r.wrong.length?r.wrong:['none'],label:v=>v==='none'?'Nothing found':WRONG[v]},
 {key:'doubt',title:'Doubt',values:r=>[r.doubt?'has':'none'],label:v=>v==='has'?'Has a doubt':'No doubt'},
 {key:'kind',title:'Kind',values:r=>[r.kind],label:v=>KINDS[v]??v},
 {key:'tradition',title:'Tradition',values:r=>[r.tradition??'none'],label:v=>v==='none'?'None (quiz)':v},
 {key:'basis',title:'Basis',values:r=>[r.basis??'none'],label:v=>({scripture:'Scripture',outside:'Outside the Bible',none:'Not grounded'}[v])},
 {key:'strength',title:'Strength',values:r=>[r.strength??'none'],label:v=>({stated:'Stated',taught:'Taught',none:'—'}[v])},
 {key:'flagged',title:'Your flags',values:r=>[flags[r.id]?'yes':'no'],label:v=>v==='yes'?'Flagged':'Not flagged'},
 {key:'collection',title:'Collection',values:r=>[r.collection],label:v=>v,long:true,byCount:true},
 {key:'optionsBy',title:'Who wrote the choices',values:r=>[r.optionsBy??'none'],label:v=>v==='none'?'No choices':v,long:true,byCount:true},
 {key:'book',title:'Bible book (from the reference)',values:r=>r.refBooks.length?r.refBooks:['none'],label:v=>v==='none'?'No reference':BOOKS[v]??v,long:true},
];
const COLS=[
 {key:'status',title:'Status',cell:r=>tag(r.status,r.status)},
 {key:'collection',title:'Collection',cell:r=>clip(r.collection,'muted')},
 {key:'kind',title:'Kind',cell:r=>clip(KINDS[r.kind]??r.kind,'muted')},
 {key:'question',title:'Question',cell:r=>clip(r.question)},
 {key:'answer',title:'Answer',cell:r=>clip(r.right??r.answer)},
 {key:'reference',title:'Reference',cell:r=>clip(r.reference??'—','muted')},
 {key:'basis',title:'Basis',cell:r=>clip(r.basis==='outside'?'Outside':r.basis==='scripture'?'Scripture':'—','muted')},
 {key:'verdict',title:'Check',cell:r=>r.verdict?tag(VERDICTS[r.verdict],r.verdict):clip('—','muted')},
 {key:'wrong',title:'Type of wrong',cell:r=>{const d=node('div',null,'wrong-dots');if(flags[r.id])d.append(tag('Flagged','flag'));for(const w of r.wrong)d.append(tag(SHORT_WRONG[w],''));return d;}},
];
function tag(text,cls){return node('span',text,'qtag '+(cls??''));}
function clip(text,cls){return node('span',text,'clip '+(cls??''));}

async function load(){
 const [res,flagRes]=await Promise.all([fetch(API+'questions.json',{cache:'no-store'}),fetch(API+'flags',{cache:'no-store'})]);
 if(!res.ok)throw Error((await res.json().catch(()=>({}))).error??`The questions could not be loaded (${res.status}).`);
 const data=await res.json();
 if(flagRes.ok)flags=(await flagRes.json()).flags??{};
 VERSES=data.verses;BOOKS=data.books;WRONG=data.wrongGroups;
 ROWS=data.rows.map((row,i)=>{const r=Object.fromEntries(data.columns.map((c,j)=>[c,row[j]]));r.order=i;
  r.search=[r.question,r.answer,r.right,...(r.options??[])].join(' \u0001 ').toLowerCase();return r;});
 $('built').textContent='Last built '+new Date(data.built).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})+'.';
 $('load-state').hidden=true;$('explorer').hidden=false;
 buildHead();update();
}

/* ---- filtering ---- */
function sortValue(r,key){
 if(key==='wrong')return (flags[r.id]?'0':'1')+r.wrong.join(',');
 if(key==='answer')return String(r.right??r.answer).toLowerCase();
 return String(r[key]??'￿').toLowerCase();
}
function update(keepScroll){
 const chosen=FACETS.filter(f=>state.selected[f.key]?.size);
 const counts=Object.fromEntries(FACETS.map(f=>[f.key,new Map()]));
 filtered=[];
 for(const r of ROWS){
  if(state.terms.length&&!state.terms.every(t=>r.search.includes(t)))continue;
  // A row counts towards a filter's values when it passes every OTHER filter.
  let failed=null,fails=0;
  for(const f of chosen){if(!f.values(r).some(v=>state.selected[f.key].has(v))){fails++;failed=f.key;if(fails>1)break;}}
  if(fails>1)continue;
  for(const f of FACETS){if(fails===1&&failed!==f.key)continue;const m=counts[f.key];for(const v of new Set(f.values(r)))m.set(v,(m.get(v)??0)+1);}
  if(fails===0)filtered.push(r);
 }
 const {key,dir}=state.sort;
 if(key)filtered.sort((a,b)=>{const x=sortValue(a,key),y=sortValue(b,key);return x<y?-dir:x>y?dir:a.order-b.order;});
 renderFacets(counts);
 $('match-count').textContent=fmt(filtered.length);$('match-of').textContent=`of ${fmt(ROWS.length)} match`;
 $('simulate').disabled=filtered.length===0;
 const active=chosen.length+(state.terms.length?1:0);
 $('rail-active').textContent=active?`· ${active} on`:'';$('clear').disabled=!active;
 $('table').setAttribute('aria-rowcount',String(filtered.length));
 $('sizer').style.height=filtered.length*rowHeight()+'px';
 if(!keepScroll)$('scroll').scrollTop=0;drawRows(true);
}
function renderFacets(counts){
 const host=$('facets'),scrolls={};
 for(const box of host.querySelectorAll('.chips.long'))scrolls[box.dataset.key]=box.scrollTop;
 host.replaceChildren();
 for(const f of FACETS){
  const sel=state.selected[f.key]??new Set(),m=counts[f.key];
  const values=new Set([...m.keys(),...sel]);
  let list=[...values];
  if(f.byCount)list.sort((a,b)=>(m.get(b)??0)-(m.get(a)??0)||String(f.label(a)).localeCompare(f.label(b)));
  else{const seen=ROWS.length?orderOf(f):[];list.sort((a,b)=>seen.indexOf(a)-seen.indexOf(b));}
  const box=node('div',null,'facet'),head=node('div',null,'facet-head');head.append(node('p',f.title,'eyebrow'));
  if(sel.size){const c=node('button','Clear');c.type='button';c.onclick=()=>{delete state.selected[f.key];update();};head.append(c);}
  const chips=node('div',null,'chips'+(f.long?' long':''));chips.dataset.key=f.key;
  for(const v of list){
   const n=m.get(v)??0,b=node('button',null,'chip'+(n?'':' zero'));b.type='button';b.setAttribute('aria-pressed',String(sel.has(v)));
   b.append(node('span',f.label(v)),node('b',fmt(n)));
   b.onclick=()=>{const s=state.selected[f.key]??=new Set();s.has(v)?s.delete(v):s.add(v);if(!s.size)delete state.selected[f.key];update();};
   chips.append(b);
  }
  box.append(head,chips);host.append(box);
 }
 for(const box of host.querySelectorAll('.chips.long'))box.scrollTop=scrolls[box.dataset.key]??0;
}
const orders={};
function orderOf(f){ // a filter's values in a fixed order: as listed in the labels, then as first met
 if(orders[f.key])return orders[f.key];
 const fixed={status:['shown','repeat','hidden'],verdict:['fix','keep','hide','none'],wrong:[...Object.keys(WRONG),'none'],doubt:['has','none'],
  kind:Object.keys(KINDS),basis:['scripture','outside','none'],strength:['stated','taught','none'],flagged:['yes','no'],book:[...Object.keys(BOOKS),'none']}[f.key]??[];
 const seen=[...fixed];for(const r of ROWS)for(const v of f.values(r))if(!seen.includes(v))seen.push(v);
 return orders[f.key]=seen;
}
let searchTimer;
$('search').oninput=e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.search=e.target.value;state.terms=state.search.toLowerCase().split(/\s+/).filter(Boolean);update();},140);};
$('clear').onclick=()=>{state.selected={};state.search='';state.terms=[];$('search').value='';update();};
$('rail-toggle').onclick=()=>{const rail=document.querySelector('.qx-rail');const open=rail.classList.toggle('open');$('rail-toggle').setAttribute('aria-expanded',String(open));};

/* ---- the table: only the rows on screen are drawn ---- */
let drawn=[-1,-1],openId=null;
const rowHeight=()=>parseFloat(getComputedStyle(document.body).getPropertyValue('--row'))||46;
function buildHead(){
 const head=$('table-head');head.replaceChildren();
 for(const c of COLS){const b=node('button',c.title);b.type='button';b.setAttribute('role','columnheader');b.dataset.key=c.key;
  b.onclick=()=>{state.sort=state.sort.key!==c.key?{key:c.key,dir:1}:state.sort.dir===1?{key:c.key,dir:-1}:{key:null,dir:1};
   for(const x of head.children)x.removeAttribute('aria-sort');if(state.sort.key)b.setAttribute('aria-sort',state.sort.dir===1?'ascending':'descending');update();};
  head.append(b);}
}
function drawRows(force){
 const scroll=$('scroll'),h=rowHeight(),headH=$('table-head').offsetHeight;
 const top=Math.max(0,scroll.scrollTop-headH);
 const first=Math.max(0,Math.floor(top/h)-8),last=Math.min(filtered.length,Math.ceil((top+scroll.clientHeight)/h)+8);
 if(!force&&first===drawn[0]&&last===drawn[1])return;
 drawn=[first,last];
 const rows=$('rows');rows.style.transform=`translateY(${first*h}px)`;rows.replaceChildren();
 if(!filtered.length){rows.append(node('div','No question matches these filters.','qx-empty'));return;}
 for(let i=first;i<last;i++){
  const r=filtered[i],row=node('div',null,'qx-row qx-cols'+(r.id===openId?' open':''));row.setAttribute('role','row');row.setAttribute('aria-rowindex',String(i+1));
  for(const c of COLS){const cell=node('div');cell.setAttribute('role','cell');cell.append(c.cell(r));row.append(cell);}
  row.onclick=()=>openDetail(r);rows.append(row);
 }
}
$('scroll').addEventListener('scroll',()=>requestAnimationFrame(()=>drawRows(false)),{passive:true});
addEventListener('resize',()=>drawRows(true));

/* ---- detail ---- */
const byId=id=>ROWS.find(r=>r.id===id);
function section(title,...content){const s=node('div',null,'d-section');s.append(node('p',title,'eyebrow'),...content.filter(Boolean));return s;}
function para(text,cls){return text?node('p',text,cls):null;}
function list(items){const ul=node('ul');for(const i of items)ul.append(node('li',i));return ul;}
function wrongOf(q){return (q.options??[]).filter(o=>o!==q.right);}
function safeLink(url,text){if(!/^https?:\/\//i.test(url??''))return null;const a=node('a',text,'d-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function verseBlocks(r){
 const out=r.verseKeys.map(k=>{const b=node('blockquote',null,'verse');b.append(node('cite',k.replace(/^(\S+)/,c=>BOOKS[c]??c)),document.createTextNode(VERSES[k]??''));return b;});
 if(r.moreVerses)out.push(node('p',`+${r.moreVerses} more verse${r.moreVerses>1?'s':''} read (not shown here).`,'quiet'));
 return out;
}
function compare(r){
 const b=r.before,grid=node('div',null,'compare');
 grid.append(node('span','','h'),node('span','Before the check','h'),node('span','Now','h'));
 const fields=[['Question',b.question,r.question],['Answer',b.answer,r.answer],['Right choice',b.right,r.right??''],
  ['Wrong choices',wrongOf(b).join(' · '),wrongOf(r).join(' · ')],['Reference',b.reference||'—',r.reference||'—']];
 for(const [k,was,now] of fields){const changed=r.verdict==='fix'&&was!==now;
  grid.append(node('span',k,'k'),node('span',was||'—',changed?'changed':''),node('span',r.verdict==='fix'?(now||'—'):'(not changed)',changed?'changed':'same'));}
 return grid;
}
function openDetail(r){
 openId=r.id;drawRows(true);
 $('detail-eyebrow').textContent=`${r.collection} · ${KINDS[r.kind]??r.kind}`;
 $('detail-title').textContent=r.question;
 const body=$('detail-body');body.replaceChildren();
 const tags=node('div',null,'d-tags');tags.append(tag(r.status,r.status));if(r.verdict)tags.append(tag(VERDICTS[r.verdict],r.verdict));for(const w of r.wrong)tags.append(tag(WRONG[w],''));if(flags[r.id])tags.append(tag('Flagged','flag'));
 body.append(tags);
 const answer=section('Answer',para(`Right choice: ${r.right??'(no choices)'}`),r.answer!==r.right?para(`Printed answer: ${r.answer}`):null,
  r.options?list(wrongOf(r).map(o=>'Wrong: '+o)):null,para(r.reference?`Reference: ${r.reference}`:'No reference.','quiet'));
 body.append(answer);
 if(r.leadIn)body.append(section('Asked after',para(`${r.leadIn.question} — ${r.leadIn.answer}`)));
 if(r.repeatOf){const t=byId(r.repeatOf),b=node('button',t?t.question:r.repeatOf,'inline-link');b.type='button';if(t)b.onclick=()=>openDetail(t);body.append(section('A repeat of the question shown instead',b));}
 if(r.hidden)body.append(section('Why it is hidden',para(r.hidden)));
 if(r.before)body.append(section('Before and after the check',compare(r)));
 if(r.problems.length){const ul=node('ul',null,'faults');for(const [k,d] of r.problems){const li=node('li');li.append(tag(FAULTS[k]??k,''),document.createTextNode(d));ul.append(li);}body.append(section('Faults found',ul));}
 if(r.why)body.append(section('Reason for the change',para(r.why)));
 if(r.basis)body.append(section('Where the answer comes from',para(r.basis==='scripture'?`Scripture, ${r.strength??''}`.replace(/, $/,''):`Outside the Bible: ${r.outside??''}`),
  para(r.verses.length?'Verses: '+r.verses.join('; '):null,'quiet'),...verseBlocks(r),para(r.note)));
 if(r.doubt)body.append(section('Doubt',para(r.doubt)));
 const dl=node('dl',null,'models');for(const [k,v] of [['Choices written by',r.optionsBy],['Checked by',r.auditedBy],['Grounded by',r.groundedBy]])dl.append(node('dt',k),node('dd',v??'—'));
 body.append(section('Which model did each part',dl));
 const link=safeLink(r.sourceUrl,r.sourceUrl);
 body.append(section('Source',link??para('No source link.','quiet'),para(r.id,'quiet')));
 const actions=node('div',null,'d-actions');const flagHost=node('div',null,'flag-host');actions.append(flagHost);body.append(section('Flag',actions));flagControl(flagHost,r,()=>{update(true);openDetail(r);});
 $('detail').hidden=false;$('detail-close').focus();
}
function closeDetail(){$('detail').hidden=true;openId=null;drawRows(true);}
$('detail-close').onclick=closeDetail;
$('detail').onclick=e=>{if(e.target===$('detail'))closeDetail();};

/* ---- flags ---- */
async function saveFlag(id,note,remove){
 const res=await fetch(API+'flag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(remove?{id,remove:true}:{id,note})});
 const out=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(out.error??`The flag was not saved (${res.status}).`);
 if(remove)delete flags[id];else flags[id]={note:note.trim(),flagged:new Date().toISOString()};
}
function flagControl(host,r,onDone){
 host.replaceChildren();
 if(flags[r.id]){
  const p=node('p',null,'flagged');p.append(document.createTextNode('⚑ Flagged'+(flags[r.id].note?`: “${flags[r.id].note}”`:'')+' '));
  const un=node('button','Remove flag','qx-ghost');un.type='button';
  un.onclick=async()=>{un.disabled=true;try{await saveFlag(r.id,'',true);flagControl(host,r,onDone);onDone?.();}catch(e){p.textContent=e.message;un.disabled=false;}};
  host.append(p,un);return;
 }
 const open=node('button','⚑ Flag this question','qx-ghost');open.type='button';
 open.onclick=()=>{
  host.replaceChildren();const box=node('div',null,'flag-box'),ta=node('textarea');ta.maxLength=1000;ta.placeholder='What looks wrong? (a short note)';ta.dataset.typing='1';
  const row=node('div',null,'row'),save=node('button','Save flag','qx-primary'),cancel=node('button','Cancel','qx-ghost'),msg=node('span','Saved for the next chat to fix.','note');
  save.type=cancel.type='button';
  save.onclick=async()=>{save.disabled=true;msg.textContent='Saving…';try{await saveFlag(r.id,ta.value,false);flagControl(host,r,onDone);onDone?.();}catch(e){msg.textContent=e.message;save.disabled=false;}};
  cancel.onclick=()=>flagControl(host,r,onDone);
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();save.click();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel.click();}});
  row.append(save,cancel,msg);box.append(ta,row);host.append(box);ta.focus();
 };
 host.append(open);
}

/* ---- simulate ---- */
const sim={deck:[],i:0,right:0,done:0,answered:false,choices:[],chosen:null};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
$('simulate').onclick=()=>{if(!filtered.length)return;Object.assign(sim,{deck:shuffle(filtered.slice()),i:0,right:0,done:0});$('sim').hidden=false;showQuestion();};
function score(){const s=$('sim-score');s.replaceChildren();const b=node('strong',`${sim.right} right`);s.append(b,document.createTextNode(` of ${sim.done}`+(sim.done?` · ${Math.round(100*sim.right/sim.done)}%`:'')));}
function showQuestion(){
 const r=sim.deck[sim.i],body=$('sim-body');sim.answered=false;sim.chosen=null;
 $('sim-counter').textContent=`${fmt(sim.i+1)} of ${fmt(sim.deck.length)}`;$('sim-bar').style.width=`${100*sim.i/sim.deck.length}%`;score();
 body.replaceChildren();
 const meta=node('div',null,'sim-meta');meta.append(tag(r.collection,''),tag(KINDS[r.kind]??r.kind,''));if(r.status!=='shown')meta.append(tag(r.status,r.status));body.append(meta);
 if(r.leadIn)body.append(node('p',`First: ${r.leadIn.question} — ${r.leadIn.answer}`,'lead-in'));
 body.append(node('h2',r.question,'sim-question'));
 const choices=node('div',null,'choices');choices.id='sim-choices';
 sim.choices=r.options?.length?shuffle(r.options.map((text,index)=>({text,right:text===r.right}))):null;
 if(sim.choices){sim.choices.forEach((c,n)=>{const b=node('button',null,'choice');b.type='button';b.append(node('kbd',String(n+1)),node('span',c.text),node('em',''));b.onclick=()=>answer(n);choices.append(b);});}
 else{const b=node('button',null,'choice');b.type='button';b.append(node('kbd','↵'),node('span','No choices. Show the answer'),node('em',''));b.onclick=()=>reveal();choices.append(b);}
 body.append(choices);
 const hint=node('div',null,'sim-actions');hint.append(node('span',sim.choices?`Press 1–${sim.choices.length} to answer · Esc closes`:'Press Enter to show the answer','hint'));body.append(hint);
 $('sim').querySelector('.qx-modal-card').scrollTop=0;$('sim').querySelector('.qx-modal-card').focus();
}
function reveal(){ // a question without choices: show the answer, then the owner says whether they knew it
 const r=sim.deck[sim.i],host=$('sim-choices');host.replaceChildren();
 const p=node('div',null,'result');p.append(node('span','Answer','k'),node('p',r.answer));host.append(p);
 [['I knew it',true],['I missed it',false]].forEach(([t,ok],n)=>{const b=node('button',null,'choice');b.type='button';b.append(node('kbd',String(n+1)),node('span',t),node('em',''));b.onclick=()=>finish(ok);host.append(b);});
 sim.choices=[{text:'knew',right:true,self:true},{text:'missed',right:false,self:true}];
}
function answer(n){
 if(sim.answered||!sim.choices?.[n])return;
 if(sim.choices[n].self){finish(sim.choices[n].right);return;}
 const buttons=[...$('sim-choices').children];
 sim.choices.forEach((c,k)=>{const b=buttons[k];b.disabled=true;if(c.right){b.classList.add('right');b.querySelector('em').textContent=k===n?'Your answer · right':'Right answer';}
  else if(k===n){b.classList.add('wrong');b.querySelector('em').textContent='Your answer';}else b.classList.add('dim');});
 finish(sim.choices[n].right);
}
function finish(ok){
 const r=sim.deck[sim.i];sim.answered=true;sim.done++;if(ok)sim.right++;score();
 $('sim-bar').style.width=`${100*(sim.i+1)/sim.deck.length}%`;
 const res=node('div',null,'result');res.append(node('h3',ok?'Right':'Wrong',ok?'good':'bad'));
 res.append(kv('Right answer',r.right??r.answer));
 if(r.right&&r.answer!==r.right)res.append(kv('Printed answer',r.answer));
 res.append(kv('Reference',r.reference??'None'));
 res.append(...verseBlocks(r));
 if(r.basis==='outside')res.append(kv('Outside the Bible',`${r.outside??''}. ${r.note??''}`));
 res.append(kv("The check's reason",r.why??(r.verdict?'Kept as it was.':'Not checked.')));
 if(r.doubt)res.append(kv('Doubt',r.doubt));
 const actions=node('div',null,'sim-actions bar'),flagHost=node('div',null,'flag-host'),spacer=node('span',null,'spacer'),hint=node('span','Enter for next','hint');
 const next=node('button',sim.i+1<sim.deck.length?'Next →':'See the score →','qx-primary');next.type='button';next.onclick=nextQuestion;
 const details=node('button','Full record','qx-ghost');details.type='button';details.onclick=()=>openDetail(r);
 actions.append(flagHost,details,spacer,hint,next);
 const body=$('sim-body');body.querySelector('.sim-actions .hint')?.parentElement.remove();body.append(res,actions);flagControl(flagHost,r);
 res.scrollIntoView({block:'nearest'});$('sim').querySelector('.qx-modal-card').focus({preventScroll:true});
}
function kv(k,v){const p=node('p');p.append(node('span',k,'k'),document.createTextNode(v));return p;}
function nextQuestion(){if(!sim.answered)return;sim.i++;if(sim.i<sim.deck.length)showQuestion();else showEnd();}
function showEnd(){
 const body=$('sim-body');body.replaceChildren();sim.answered=false;sim.choices=null;
 $('sim-counter').textContent=`Finished · ${fmt(sim.deck.length)} questions`;$('sim-bar').style.width='100%';score();
 const flagged=sim.deck.filter(r=>flags[r.id]).length;
 const end=node('div',null,'sim-end');end.append(node('p','YOUR SCORE','eyebrow'),node('div',`${sim.done?Math.round(100*sim.right/sim.done):0}%`,'big'),
  node('p',`${fmt(sim.right)} right of ${fmt(sim.done)}${flagged?` · ${flagged} flagged for fixing`:''}`));
 const actions=node('div',null,'sim-actions'),again=node('button','Run again, new order','qx-primary'),close=node('button','Close','qx-ghost');
 again.type=close.type='button';again.onclick=()=>$('simulate').click();close.onclick=closeSim;actions.append(again,close);end.append(actions);body.append(end);
}
function closeSim(){$('sim').hidden=true;update(true);}
$('sim-close').onclick=closeSim;
document.addEventListener('keydown',e=>{
 if(e.target.dataset?.typing||['INPUT','SELECT'].includes(e.target.tagName))return;
 if(!$('detail').hidden){if(e.key==='Escape')closeDetail();return;}
 if($('sim').hidden)return;
 if(e.key==='Escape'){closeSim();return;}
 if(/^[1-9]$/.test(e.key)&&!sim.answered){e.preventDefault();answer(Number(e.key)-1);return;}
 if(sim.i>=sim.deck.length)return;
 if(e.key==='Enter'){e.preventDefault();if(sim.answered)nextQuestion();else if(!sim.choices)reveal();}
});

load().catch(e=>{$('load-state').textContent=e.message;});
