/* Connected local design review. Production routes and content remain the destination authorities. */
(() => {
  const $=id=>document.getElementById(id), base=window.STUDY_ROOT, page=document.body.dataset.page;
  window.ICONS.arrow='<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';
  const arrow=()=>window.icon('arrowUp',16);
  const main=window.Frame.mount();main.append($('page-content').content.cloneNode(true));
  document.querySelector('.logo img').src='/mockups/letters-shared/favicon.svg';
  document.querySelectorAll('.nav a').forEach(a=>{
    const href=a.getAttribute('href');
    if(href==='/study/atlas'){a.remove();return;}
    a.classList.toggle('active',href==='/study');
    if(href==='/study'){a.href=base;a.setAttribute('aria-current','page');}
  });
  const icons=()=>document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=window.icon(el.dataset.icon,18));
  const link=([title,href])=>`<a href="${href}">${title}${arrow()}</a>`;
  const badge=e=>`${e.kind}${e.preview?' <span class="preview-tag">Preview</span>':''}`;

  if(page==='hub'){
    const draw=(id,d)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);$(id).append(p);};
    for(let i=0;i<9;i++){draw('verse-lines',`M180 ${106+i*7}Q223 ${98+i*7} 264 ${118+i*7}`);draw('verse-lines',`M306 ${109+i*7}Q348 ${91+i*7} 391 ${105+i*7}`);}
    for(let col=0;col<3;col++)for(let i=0;i<12;i++)draw('manuscript-lines',`M${134+col*23} ${88+i*5}l18 1`);
    for(let row=0;row<10;row++)for(let col=0;col<4;col++){draw('inscription-lines',`M${242+col*8} ${88+row*9+col*7}l4 2-2 1m-2-3 1 5`);draw('inscription-lines',`M${283+col*9} ${110+row*9-col*3}l5-2-3 4m-2-2 1 4`);}
    const entries=Object.entries(STUDY_BRANCHES).flatMap(([id,b])=>b.areas.flatMap(a=>[
      {title:a.title,text:a.hint,kind:b.label,href:`${base}${id}/?area=${a.id}`},
      ...[a.featured,...a.items].map(e=>({...e,kind:`${b.label} · ${e.kind}`})),
    ]));
    entries.push({title:'Writers of Scripture',text:'Paul Luke Isaiah David Moses John',kind:'People',href:`${base}theology/?area=people#writer-preview`},{title:'Scholars',text:'Historians translators archaeology theologians Josephus Tacitus',kind:'People',href:'/teachers/scholars'},{title:'Atlas',text:'Places journeys maps ancient cities geography Paul',kind:'Shared collection',href:'/study/atlas'});
    function search(){
      const words=$('study-search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);$('clear-search').hidden=!words.length;$('search-results').hidden=!words.length;
      const seen=new Set();const found=words.length?entries.filter(e=>{if(seen.has(e.href)||!words.every(w=>`${e.title} ${e.text} ${e.kind}`.toLowerCase().includes(w)))return false;seen.add(e.href);return true;}):[];
      $('result-status').textContent=`${found.length} ${found.length===1?'result':'results'}`;
      $('result-list').innerHTML=found.map(e=>`<a href="${e.href}"><span><small>${e.kind}${e.preview?' · Preview':''}</small><strong>${e.title}</strong><p>${e.text}</p></span>${arrow()}</a>`).join('')||(words.length?'<p class="empty-result">No match yet. Try a broader subject, such as prayer, history or manuscripts.</p>':'');
    }
    $('study-search').addEventListener('input',search);
    $('clear-search').addEventListener('click',()=>{$('study-search').value='';search();$('study-search').focus();});
    $('study-search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('study-search').value='';search();}});
    document.querySelectorAll('[data-search]').forEach(b=>b.addEventListener('click',()=>{$('study-search').value=b.dataset.search;search();$('study-search').focus();}));
  } else {
    const b=STUDY_BRANCHES[page];document.body.style.setProperty('--branch-tone',`var(--${b.tone})`);
    $('branch-root').innerHTML=`<nav class="branch-nav" aria-label="Study navigation"><a href="${base}">${window.icon('arrowLeft',15)} Study hub</a><span>/</span><span>${b.label}</span><a class="other-branch" href="${base}${b.other}/">${STUDY_BRANCHES[b.other].label} ${arrow()}</a></nav>
      <header class="branch-intro"><p class="eyebrow">${b.label} · ${b.kicker}</p><h1>${b.heading}</h1><p>${b.lead}</p></header>
      <section class="subject-landing" aria-labelledby="subject-title"><div class="subject-rule"><h2 id="subject-title">Choose a subject</h2><span>Open a collection. Find your next study.</span></div><div class="subject-doors" role="group" aria-label="Study subjects">${b.areas.map((a,i)=>`<a class="subject-door" id="door-${a.id}" href="?area=${a.id}" data-area="${a.id}" style="--tone:var(--${a.tone})" aria-expanded="false" aria-controls="subject-collection"><span class="subject-number">0${i+1}</span>${subjectArt(a.art)}<strong>${a.title}</strong><small>${a.short}</small><span class="door-indicator" aria-hidden="true">↓</span></a>`).join('')}</div>
      <div class="subject-hint" aria-live="polite">${b.areas.map(a=>`<p data-hint="${a.id}">${a.hint}</p>`).join('')}</div></section>
      <div id="selection-notice" role="status" hidden></div><section class="subject-collection" id="subject-collection" aria-labelledby="collection-title"></section>
      ${page==='academic'?`<section class="reading-room" id="reading-guide"><div><p class="eyebrow">Before you follow a source</p><h2>Know what<br><em>you’re reading.</em></h2><p>A surviving text, a modern edition and an interpretation each answer a different question.</p></div><div class="reading-steps"><article><span>01</span><div><h3>Identify the witness</h3><p>Who made it, when, and for what purpose? Distinguish the ancient work from the copy or edition before you.</p></div></article><article><span>02</span><div><h3>Read the context</h3><p>Follow the passage, its genre and the source’s own perspective. A royal inscription speaks with a royal purpose.</p></div></article><article><span>03</span><div><h3>Consider the limits</h3><p>Separate what survives from the conclusions drawn from it. Compare interpretations and their supporting evidence.</p></div></article><a href="/review/research/works">Inspect the example sources ${arrow()}</a></div></section>`:''}
      <div class="branch-bridge"><div><p class="eyebrow">Continue through Study</p><h2>${b.otherLine}</h2></div><a href="${base}${b.other}/">Explore ${STUDY_BRANCHES[b.other].label} ${arrow()}</a></div>`;

    let selected=b.areas[0].id;
    const writers=[['Paul','paul','Romans · Philippians · Philemon'],['Luke','luke-2co-13-13','Luke · Acts'],['Isaiah','isaiah-2ki-19-2','Isaiah'],['David','david-rut-4-17','Psalms attributed to David'],['Moses','moses-exo-2-10','Genesis–Deuteronomy'],['John','john-son-of-zebedee','John · Letters · Revelation']];
    function hint(id){document.querySelectorAll('[data-hint]').forEach(p=>p.classList.toggle('visible',p.dataset.hint===id));}
    function render(fromHistory=false){
      const asked=new URL(location.href).searchParams.get('area'),a=b.areas.find(a=>a.id===asked)||b.areas[0];selected=a.id;
      $('selection-notice').hidden=!asked||asked===a.id;$('selection-notice').textContent='That subject is not in this collection. Showing '+a.title+'.';
      document.querySelectorAll('[data-area]').forEach(el=>{const active=el.dataset.area===a.id;el.setAttribute('aria-expanded',String(active));el.classList.toggle('selected',active);});hint(a.id);
      const e=a.featured;
      $('subject-collection').style.setProperty('--tone',`var(--${a.tone})`);
      $('subject-collection').innerHTML=`<div class="collection-intro"><p class="eyebrow">${a.title}</p><h2 id="collection-title">${a.heading}</h2><p>${a.intro}</p><div class="collection-method"><span>Begin</span><i></i><span>Explore</span><i></i><span>Connect</span></div></div><div class="collection-readings"><p class="reading-label">A place to begin</p><a class="featured-reading" href="${e.href}"><div class="featured-art">${subjectArt(e.art,true)}</div><div><small>${badge(e)}</small><h3>${e.title}</h3><p>${e.text}</p><span class="reading-meta">${e.meta}</span><span class="reading-action">${e.preview?'Open the preview':e.kind==='Collection'?'Explore the collection':'Open the guide'} ${arrow()}</span></div></a><div class="reading-list"><h3>${a.group}</h3>${a.items.map((e,i)=>`<a class="reading-row" href="${e.href}"><span class="reading-n">0${i+1}</span><div><small>${badge(e)}</small><h4>${e.title}</h4><p>${e.text}</p></div>${arrow()}</a>`).join('')}</div><div class="support-links"><span>Useful connections</span><div>${a.support.map(link).join('')}</div></div></div>
      ${a.writers?`<section class="writer-preview" id="writer-preview" aria-labelledby="writers-title"><div><p class="eyebrow">Writers of Scripture · Collection preview</p><h3 id="writers-title">Begin with a life.<br><em>Follow it into a book.</em></h3><p>These links open existing person pages. Book associations follow traditional attribution; individual books may be anonymous, disputed or associated with more than one contributor.</p></div><div class="writer-preview-list">${writers.map(([name,id,books])=>`<a href="/people/${id}"><span class="writer-monogram">${name.slice(0,1)}</span><span><strong>${name}</strong><small>${books}</small></span>${arrow()}</a>`).join('')}</div></section>`:''}
      ${a.planned?`<div class="planned-note"><span class="eyebrow">Studies taking shape</span><p>${a.planned.join(' · ')}</p><small>These subjects have outlines; full studies are still to come.</small></div>`:''}`;
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('subject-collection').animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:'ease-out'});
      if(fromHistory)document.querySelector(`[data-area="${a.id}"]`).focus({preventScroll:true});
    }
    document.querySelectorAll('[data-area]').forEach(el=>{
      el.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();const url=new URL(location.href);url.searchParams.set('area',el.dataset.area);url.hash='';if(url.href!==location.href)history.pushState({},'',url);render();});
      el.addEventListener('pointerenter',()=>hint(el.dataset.area));el.addEventListener('pointerleave',()=>hint(selected));el.addEventListener('focus',()=>hint(el.dataset.area));el.addEventListener('blur',()=>hint(selected));
      el.addEventListener('keydown',e=>{const index=b.areas.findIndex(a=>a.id===el.dataset.area);let next;if(e.key==='ArrowRight')next=(index+1)%b.areas.length;if(e.key==='ArrowLeft')next=(index+b.areas.length-1)%b.areas.length;if(e.key==='Home')next=0;if(e.key==='End')next=b.areas.length-1;if(next!==undefined){e.preventDefault();document.querySelectorAll('[data-area]')[next].focus();}});
    });
    window.addEventListener('popstate',()=>render(true));render();
    if(location.hash==='#writer-preview')requestAnimationFrame(()=>$('writer-preview')?.scrollIntoView({block:'start'}));
  }
  icons();
})();
