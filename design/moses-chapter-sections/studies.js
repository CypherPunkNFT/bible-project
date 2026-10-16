/* Local comparison studies. Reuse the reviewed ledger's exact content and citations. */
const main = document.querySelector('#study');
let X, act = Math.max(0, Math.min(2, Number(new URLSearchParams(location.search).get('chapter') || 1) - 1)), activeGroup = 0;
const layouts = ['columns', 'chapters', 'gallery', 'horizontal'];
const layout = () => layouts.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'columns';
const settings = [
  { key:'people', title:'People of this chapter', short:'The people', kicker:'Lives intertwined', line:'Family, companions, and those who stood against him.', tone:'var(--egypt)' },
  { key:'signs', title:'Signs and wonders', short:'Signs & the word', kicker:'Power and promise', line:'What God did, what Moses said, and what followed.', tone:'var(--midian)' },
  { key:'world', title:'The world stage', short:'The wider world', kicker:'Beyond the scene', line:'Kingdoms, outside records, and the question of dates.', tone:'var(--wild)' },
];
const chapterSettings = [settings, [
  {...settings[0], line:'The family and companions of his years in Midian.'},
  {...settings[1], title:'The call and the signs', short:'The call & signs', kicker:'Called to return', line:'The burning bush, his questions, and the signs of his commission.'},
  {...settings[2], key:'accounts', title:'The message', short:'The message', kicker:'Sent to speak', line:'The word Moses was sent to speak and the God who sent him.'},
], [
  {...settings[0], title:'The people and the nation', short:'People & nation', kicker:'A people on the journey', line:'Family, companions, opposition, and the nation Moses led.'},
  {...settings[1], title:'Signs and the message', short:'Signs & message', kicker:'Provision and promise', line:'The wonders, the words Moses spoke, and what came of them.'},
  {...settings[2], key:'ending', title:'The wider story and his end', short:'The wider story', kicker:'At the edge of the land', line:'Rulers around Israel, where things went wrong, and the closing years of his life.'},
]];
function illustration(kind, unique) {
  const id = `light-${unique}`;
  const stars = Array.from({length:25},(_,i)=>`<circle cx="${30+(i*73)%370}" cy="${30+(i*47)%240}" r="${i%4===0?1.8:.8}" opacity="${.12+(i%3)*.09}" fill="currentColor" stroke="none"/>`).join('');
  const person = (x,y,s,accent=false)=>`<g transform="translate(${x} ${y}) scale(${s})" class="${accent?'figure-main':''}"><circle cy="-52" r="12"/><path d="M-9-39 Q-24-30-25 2 L-37 68 Q0 83 37 68 L25 2 Q24-30 9-39 M-9-36 Q0-27 9-36 M-20-13-12 63 M20-13 12 63 M-3-26 0 62"/><path class="faint" d="M-26 19 Q0 30 26 19 M-31 48 Q0 63 31 48"/></g>`;
  let drawing;
  if(kind==='people') drawing=`<circle class="faint" cx="215" cy="152" r="112"/><path class="faint" d="M72 274 Q215 211 358 274 M88 288 Q215 236 342 288 M215 23V77 M87 137 132 161 M343 137 298 161"/>${person(112,181,.65)}${person(317,181,.65)}${person(161,206,.78)}${person(271,206,.78)}${person(215,193,1,true)}<g fill="currentColor" stroke="none"><circle cx="215" cy="24" r="4"/><circle cx="86" cy="137" r="3"/><circle cx="344" cy="137" r="3"/></g><path d="M199 301H231"/>`;
  else if(kind==='signs') drawing=`<circle cx="215" cy="110" r="61" class="faint"/><path d="M210 260V75 Q210 49 230 55 Q247 63 233 81" stroke-width="2.3"/><path d="M198 139 Q174 121 181 104 Q184 122 196 116 Q198 93 191 75 Q217 94 211 113 M231 139 Q252 115 241 98 Q243 119 228 113"/><path d="M37 229 Q76 208 113 227 T184 226 M246 226 Q282 207 321 226 T394 227 M27 249 Q65 229 104 249 T181 248 M249 247 Q287 226 326 247 T403 248 M40 274 Q77 252 116 272 T179 271 M251 273 Q288 251 327 272 T390 271"/><path class="faint" d="M215 20V35 M275 44 264 56 M156 45 167 57 M306 109H286 M124 108H144 M168 158 155 171 M263 158 276 171 M164 302 215 279 266 302"/><g fill="currentColor" stroke="none"><circle cx="215" cy="28" r="2"/><circle cx="303" cy="109" r="2"/><circle cx="126" cy="108" r="2"/></g>`;
  else drawing=`<circle cx="286" cy="84" r="34"/><circle cx="286" cy="84" r="46" class="faint"/><path d="M32 243 125 110 218 243Z M125 110 147 243 M51 243H401 M201 243V158H377V243 M194 158H384L288 117Z M214 166V235 M239 166V235 M264 166V235 M289 166V235 M314 166V235 M339 166V235 M364 166V235 M210 169H368 M210 228H368"/><path class="faint" d="M31 263 Q94 250 162 264 T300 263 T405 264 M55 285H375 M105 279V291 M181 279V291 M255 279V291 M330 279V291 M62 197 94 151"/><g fill="currentColor" stroke="none"><circle cx="105" cy="285" r="3"/><circle cx="255" cy="285" r="3"/></g>`;
  if(kind==='accounts') drawing='<path d="M215 90 Q142 51 63 81V262 Q142 232 215 272 Q288 232 367 262V81 Q288 51 215 90Z M215 90V272 M83 98 Q142 78 194 104 M83 124 Q142 104 194 130 M83 150 Q142 130 194 156 M83 176 Q142 156 194 182 M83 202 Q142 182 194 208 M236 104 Q291 78 347 98 M236 130 Q291 104 347 124 M236 156 Q291 130 347 150 M236 182 Q291 156 347 176 M236 208 Q291 182 347 202"/><path class="faint" d="M47 94V283 Q139 253 215 292 Q291 253 383 283V94 M215 24V52 M180 31 190 55 M250 31 240 55"/>';
  if(kind==='ending') drawing='<circle cx="295" cy="79" r="34"/><path d="M28 264 153 91 264 264 M153 91 158 171 191 199 M87 183 118 192 153 159 M215 264 296 153 402 264 M40 278H392 M82 296H350"/><path class="faint" d="M43 217 Q134 236 215 218 T394 219 M48 240 Q130 259 220 241 T391 242 M263 41 248 27 M332 48 349 32 M344 79H364"/><path d="M157 177V229 M157 182 Q142 178 141 188 M150 229H164"/>';
  return `<svg class="category-art" viewBox="0 0 430 330" role="img" aria-label="${{people:'Interconnected figures representing family and companions',signs:'A staff, fire and divided waters',world:'Egyptian pyramids, architecture and a chronology',accounts:'An open book with two parallel accounts',ending:'A mountain overlooking the land at the close of the journey'}[kind]}"><defs><radialGradient id="${id}"><stop stop-color="currentColor" stop-opacity=".11"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><ellipse cx="215" cy="170" rx="210" ry="155" fill="url(#${id})"/>${stars}<g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
}
function content() {
  const box = document.createElement('div');
  box.innerHTML = MergedLedger.html(X.chapters[act], X);
  const groups = chapterSettings[act].map(s=>({...s, sections:[]}));
  const sections = [...box.querySelectorAll('.lg-blocks > section')];
  for (const section of sections) {
    const heading = section.querySelector('.lg-h');
    const title = heading.querySelector('span').textContent;
    heading.remove();
    if(title === 'People of this chapter') {
      const people = peopleList();
      const members = X.chapters[act].people.map(id=>people.find(p=>p.id===id)).filter(Boolean);
      const buckets = [{key:'family',title:'His family'}, {key:'with',title:'Alongside him'}, {key:'against',title:'Those against him'}];
      const rows = [...section.querySelectorAll('.lg-people > li')];
      for(const b of buckets) {
        const items = rows.filter((_,i)=>members[i].group===b.key);
        if(items.length) groups[0].sections.push({title:b.title,html:`<ul class="lg-people">${items.map(e=>e.outerHTML).join('')}</ul>`,count:items.length});
      }
    } else {
      const group = ['Refused, then sent','The nation under him'].includes(title) ? 0 : ['The world stage','Outside the Bible','When? The dates, as views','Two accounts, side by side','His end','What Scripture does not say', ...(act===2?['Where it went ill']:[])].includes(title) ? 2 : 1;
      const destination = act===1 ? (title==='The message'?2:title==='Refused, then sent'?1:group) : group;
      groups[destination].sections.push({title:title==='Signs and wonders'?'The signs':title==='The world stage'?'Kingdoms & rulers':title,html:section.innerHTML});
    }
  }
  return {groups,timeline:box.querySelector('.lg-tl').outerHTML,originalSections:sections.length};
}
const countLabel = g => `${g.sections.length} subsection${g.sections.length===1?'':'s'}`;
function sectionRows(g,i,allOpen=false) {
  return g.sections.map((s,j)=>`<details class="subsection" ${allOpen||j===0?'open':''}><summary><span class="sub-num">${String(j+1).padStart(2,'0')}</span><span>${esc(s.title)}</span>${s.count?`<small>${s.count}</small>`:''}<i>+</i></summary><div class="sub-body">${s.html}</div></details>`).join('');
}
function columns(groups) {
  return `<div class="three-columns">${groups.map((g,i)=>`<section class="supercategory" style="--tone:${g.tone}"><div class="category-cover"><span class="category-number">0${i+1}</span>${illustration(g.key,`a${i}`)}<p class="eyebrow">${g.kicker}</p><h2>${g.title}</h2><p class="category-description">${g.line}</p><span class="section-count">${countLabel(g)}</span></div><div class="subsections">${sectionRows(g,i)}</div></section>`).join('')}</div>`;
}
function chapters(groups) {
  return `<nav class="jump-nav" aria-label="Major sections">${groups.map((g,i)=>`<a href="#group-${i}" data-jump="group-${i}"><small>0${i+1}</small>${g.short}</a>`).join('')}</nav><div class="editorial">${groups.map((g,i)=>`<section id="group-${i}" class="editorial-section" style="--tone:${g.tone}"><div class="editorial-cover"><p class="eyebrow">0${i+1} / ${g.kicker}</p><h2>${g.title}</h2>${illustration(g.key,`b${i}`)}<p>${g.line}</p><span class="section-count">${countLabel(g)}</span></div><div class="editorial-content">${sectionRows(g,i,true)}</div></section>`).join('')}</div>`;
}
function gallery(groups) {
  return `<div class="gallery-doors" role="tablist" aria-label="Major sections">${groups.map((g,i)=>`<button class="gallery-door" type="button" role="tab" id="door-${i}" aria-controls="gallery-panel" aria-selected="${i===activeGroup}" tabindex="${i===activeGroup?0:-1}" data-group="${i}" style="--tone:${g.tone}"><span class="door-top"><b>0${i+1}</b><span>${countLabel(g)}</span></span>${illustration(g.key,`c${i}`)}<span class="door-title">${g.title}</span><span class="door-caption">${g.kicker}<i>↗</i></span></button>`).join('')}</div><section id="gallery-panel" role="tabpanel" aria-labelledby="door-${activeGroup}" tabindex="0"></section>`;
}
function categoryIcon(kind) {
  const shapes = {
    people:'<circle cx="48" cy="27" r="12"/><circle cx="20" cy="34" r="9" opacity=".5"/><circle cx="76" cy="34" r="9" opacity=".5"/><path d="M29 78V58a19 19 0 0 1 38 0v20Z"/><path d="M5 75V57a15 15 0 0 1 21-14l-4 32ZM91 75V57a15 15 0 0 0-21-14l4 32Z" opacity=".5"/>',
    signs:'<path d="M51 6c7 22-9 28-3 40 8-4 14-13 14-22 24 25 26 47 8 60H28C5 65 24 39 35 29c-3 20 1 23 6 26C32 33 52 26 51 6Z"/><path d="M46 87V34q0-13 12-13" fill="none" stroke="var(--page)" stroke-width="5" stroke-linecap="round"/>',
    accounts:'<path d="M8 19q20-8 36 3v61Q26 72 8 78ZM52 22q16-11 36-3v59q-18-6-36 5Z"/><path d="M18 35h16M18 47h16M18 59h16M62 35h16M62 47h16M62 59h16" fill="none" stroke="var(--page)" stroke-width="4" stroke-linecap="round"/>',
    ending:'<circle cx="73" cy="22" r="13" opacity=".5"/><path d="M3 82 39 18l40 64Z"/><path d="m39 18-12 33 13-8 10 9Z" fill="var(--page)" opacity=".7"/><path d="m61 82 17-34 17 34Z" opacity=".5"/>',
    world:'<circle cx="71" cy="23" r="14" opacity=".5"/><path d="M4 82 34 25l29 57ZM57 82V44h29v38ZM52 39l19-16 20 16Z"/><path d="M66 49v27M77 49v27" stroke="var(--page)" stroke-width="4"/>'
  };
  return `<svg class="category-icon" viewBox="0 0 96 96" aria-hidden="true"><g fill="currentColor">${shapes[kind] || shapes.world}</g></svg>`;
}
function horizontal(groups) {
  return `<div class="horizontal-groups" role="tablist" aria-label="Chapter topics">${groups.map((g,i)=>`<button type="button" role="tab" id="door-${i}" aria-controls="gallery-panel" aria-selected="${i===activeGroup}" tabindex="${i===activeGroup?0:-1}" data-group="${i}" style="--tone:${g.tone}">${categoryIcon(g.key)}<span class="horizontal-label"><strong>${g.title}</strong></span><span class="horizontal-arrow" aria-hidden="true">&#8594;</span></button>`).join('')}</div><section id="gallery-panel" role="tabpanel" aria-labelledby="door-${activeGroup}" tabindex="0"></section>`;
}
let currentGroups;
function galleryPanel(index=0) {
  const g=currentGroups[activeGroup];
  const panel=main.querySelector('#gallery-panel');
  const previousHeight=panel.getBoundingClientRect().height;
  const previousScroll={left:window.scrollX,top:window.scrollY};
  const sameGroup=panel.dataset.group===String(activeGroup);
  const existingNav=sameGroup?panel.querySelector('.gallery-subnav'):null;
  const focusedSub=existingNav?.contains(document.activeElement)?document.activeElement:null;
  // Retain reading space when switching to shorter text, preventing scroll clamping.
  if(previousHeight)panel.style.minHeight=`${previousHeight}px`;
  if(existingNav)existingNav.remove();
  panel.style.setProperty('--tone',g.tone);panel.setAttribute('aria-labelledby',`door-${activeGroup}`);
  panel.innerHTML=`<div class="gallery-subnav"><p class="eyebrow">Explore ${g.short.toLowerCase()}</p><nav aria-label="${esc(g.title)} subsections">${g.sections.map((s,j)=>`<button type="button" data-sub="${j}" aria-current="${index===j?'true':'false'}"><small>0${j+1}</small><span>${s.title}</span><b>↗</b></button>`).join('')}</nav></div><div class="gallery-reading"><span class="eyebrow">0${activeGroup+1} / 0${index+1}</span><h3>${g.sections[index].title}</h3>${g.sections[index].html}</div>`;
  if(existingNav) {
    panel.querySelector('.gallery-subnav').replaceWith(existingNav);
    existingNav.querySelectorAll('[data-sub]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.sub)===index)));
    focusedSub?.focus({preventScroll:true});
  }
  panel.dataset.group=String(activeGroup);
  if(window.scrollY!==previousScroll.top||window.scrollX!==previousScroll.left)window.scrollTo({...previousScroll,behavior:'instant'});
}
function render() {
  const mode=layout(), c=X.chapters[act]; const {groups,timeline,originalSections}=content();currentGroups=groups;
  document.body.dataset.layout=mode;
  document.querySelectorAll('[data-layout]').forEach(a=>{a.href='/mockups/moses-chapter-sections/?chapter='+(act+1)+'#'+a.dataset.layout;});
  document.querySelectorAll('[data-layout]').forEach(a=>a.setAttribute('aria-current',a.dataset.layout===mode?'page':'false'));
  const descriptions={columns:'Three illustrated groups. Smaller sections open inside each column.',chapters:'One subject at a time, with a generous illustration and an open reading column.',gallery:'Choose an illustrated group, then follow its smaller sections.'};
  main.innerHTML=`<div class="study-heading"><div><p class="eyebrow">Moses / Act ${['I','II','III'][act]} / A closer reading</p><h1>${c.title}<em>Behind the story.</em></h1><p>${descriptions[mode]}</p></div><label class="chapter-select">Chapter<select id="chapter">${X.chapters.map((ch,i)=>`<option value="${i}" ${act===i?'selected':''}>${['I','II','III'][i]} · ${ch.title}</option>`).join('')}</select></label></div><details class="events-context"><summary><span>Before these sections</span> The events, in order <small>${c.timeline.filter(e=>e.k!=='gap').length} events · horizontal scroll</small>${icon('chevronDown',16)}</summary><div class="lg">${timeline}</div></details><div class="section-intro"><span class="eyebrow">Read this chapter through three lenses</span><span>${originalSections} existing topics, grouped</span></div>${({columns,chapters,gallery,horizontal}[mode])(groups)}<footer class="study-footer">Moses · Act ${['I','II','III'][act]}<span>Scripture, citations and distinctions retained from the current chapter.</span><a href="/people/moses">Return to Moses ↗</a></footer>`;
  if(mode==='gallery'||mode==='horizontal')galleryPanel();
  if(mode==='horizontal') {
    main.querySelector('.study-heading h1').innerHTML=esc(c.title);
    main.querySelector('.study-heading>div>p:last-child').textContent='Subsections beneath the events scroller';
    main.querySelector('.section-intro').remove();
    main.querySelector('.events-context').open=true;
  }
}
main.addEventListener('change',e=>{if(e.target.id==='chapter'){act=Number(e.target.value);const url=new URL(location.href);url.searchParams.set('chapter',act+1);history.replaceState(null,'',url);render();}});
main.addEventListener('click',e=>{
  const group=e.target.closest('[data-group]');if(group){activeGroup=Number(group.dataset.group);main.querySelectorAll('[data-group]').forEach(b=>{b.setAttribute('aria-selected',String(b===group));b.tabIndex=b===group?0:-1;});galleryPanel();}
  const sub=e.target.closest('[data-sub]');if(sub)galleryPanel(Number(sub.dataset.sub));
  const jump=e.target.closest('[data-jump]');if(jump){e.preventDefault();document.getElementById(jump.dataset.jump).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
});
main.addEventListener('keydown',e=>{const tab=e.target.closest('[data-group]');if(!tab||!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(Number(tab.dataset.group)+(e.key==='ArrowRight'?1:2))%3;const button=main.querySelector(`[data-group="${next}"]`);button.click();button.focus({preventScroll:true});});
document.querySelector('#theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';});
addEventListener('hashchange',()=>{render();scrollTo({top:0});});
Promise.all([loadMoses(),fetch('data/merged.json').then(r=>{if(!r.ok)throw new Error('Chapter data unavailable');return r.json();})]).then(([,data])=>{X=data;render();}).catch(error=>{main.textContent=`Could not open the chapter: ${error.message}`;console.error(error);});
