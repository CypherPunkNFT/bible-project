import { mountTopicSlider } from './topic-slider.js';
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
export function categoryIcon(kind) {
  const shapes = {
    prophet:'<path d="M9 17h43v66H9Z"/><path d="M18 31h25M18 43h25M18 55h17" stroke="var(--page)" stroke-width="4" stroke-linecap="round"/><path d="M48 49h25V34l22 22-22 22V63H48Z"/>',
    people:'<circle cx="48" cy="27" r="12"/><circle cx="20" cy="34" r="9" opacity=".5"/><circle cx="76" cy="34" r="9" opacity=".5"/><path d="M29 78V58a19 19 0 0 1 38 0v20Z"/><path d="M5 75V57a15 15 0 0 1 21-14l-4 32ZM91 75V57a15 15 0 0 0-21-14l4 32Z" opacity=".5"/>',
    signs:'<path d="M51 6c7 22-9 28-3 40 8-4 14-13 14-22 24 25 26 47 8 60H28C5 65 24 39 35 29c-3 20 1 23 6 26C32 33 52 26 51 6Z"/><path d="M46 87V34q0-13 12-13" fill="none" stroke="var(--page)" stroke-width="5" stroke-linecap="round"/>',
    accounts:'<path d="M8 19q20-8 36 3v61Q26 72 8 78ZM52 22q16-11 36-3v59q-18-6-36 5Z"/><path d="M18 35h16M18 47h16M18 59h16M62 35h16M62 47h16M62 59h16" fill="none" stroke="var(--page)" stroke-width="4" stroke-linecap="round"/>',
    ending:'<circle cx="73" cy="22" r="13" opacity=".5"/><path d="M3 82 39 18l40 64Z"/><path d="m39 18-12 33 13-8 10 9Z" fill="var(--page)" opacity=".7"/><path d="m61 82 17-34 17 34Z" opacity=".5"/>',
    world:'<circle cx="71" cy="23" r="14" opacity=".5"/><path d="M4 82 34 25l29 57ZM57 82V44h29v38ZM52 39l19-16 20 16Z"/><path d="M66 49v27M77 49v27" stroke="var(--page)" stroke-width="4"/>'
  };
  return `<svg class="category-icon" viewBox="0 0 96 96" aria-hidden="true"><g fill="currentColor">${shapes[kind] || shapes.world}</g></svg>`;
}
// The approved subsection controls replace only the ledger's topic blocks.
// The chapter scenes, maps and event scrollers are owned by the existing runtime.
export function mountChapterTopics(root, chapters, people, signal) {
  root.querySelectorAll('.mg-ch').forEach((chapter, act) => {
    const blocks = chapter.querySelector('.lg-blocks');
    const groups = chapterSettings[act].map(group => ({...group, sections:[]}));
    for (const section of blocks.querySelectorAll(':scope > section')) {
      const heading = section.querySelector('.lg-h');
      const title = heading.querySelector('span').textContent;
      const copy = section.cloneNode(true);
      copy.querySelector('.lg-h').remove();
      if (title === 'People of this chapter') {
        const members = chapters[act].people.map(id => people.find(person => person.id === id));
        const rows = [...copy.querySelectorAll('.lg-people > li')];
        for (const bucket of [{key:'family',title:'His family'},{key:'with',title:'Alongside him'},{key:'against',title:'Those against him'}]) {
          const items = rows.filter((_,index) => members[index]?.group === bucket.key);
          if (items.length) groups[0].sections.push({title:bucket.title,html:`<ul class="lg-people">${items.map(item => item.outerHTML).join('')}</ul>`});
        }
      } else {
        let group = ['Refused, then sent','The nation under him'].includes(title) ? 0 : ['The world stage','Outside the Bible','When? The dates, as views','Two accounts, side by side','His end','What Scripture does not say',...(act===2?['Where it went ill']:[])].includes(title) ? 2 : 1;
        if (act===1) group=title==='The message'?2:title==='Refused, then sent'?1:group;
        groups[group].sections.push({title:title==='Signs and wonders'?'The signs':title==='The world stage'?'Kingdoms & rulers':title,html:copy.innerHTML, twoColumns:act===2&&title==='What came of the word', kingdomsGrid:act===2&&title==='The world stage'});
      }
    }
    blocks.setAttribute('aria-label',`Topics of ${chapters[act].title}`);
    mountTopicControls(blocks,groups,`moses-topics-${act+1}`,signal);
  });
}

export function mountTopicControls(blocks,groups,id,signal) {
    const downIcon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-7-7 7 7 7-7"/></svg>';
    const closeIcon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    blocks.className='moses-topics';
    blocks.innerHTML=`<div class="horizontal-groups" role="group" aria-label="Chapter topics">${groups.map((group,index)=>`<button type="button" class="chapter-topic-card" id="${id}-tab-${index}" aria-controls="${id}-panel" aria-expanded="false" data-topic-group="${index}" style="--tone:${group.tone}">${categoryIcon(group.key)}<span class="horizontal-label"><strong>${group.title}</strong></span><span class="horizontal-arrow" aria-hidden="true">${downIcon}</span></button>`).join('')}</div><section class="topic-panel" id="${id}-panel" role="region" aria-labelledby="${id}-tab-0" hidden><div class="topic-subnav"></div><div class="topic-reading"></div></section>`;
    const panel=blocks.querySelector('.topic-panel');
    const nav=panel.querySelector('.topic-subnav');
    const reading=panel.querySelector('.topic-reading');
    let activeGroup=-1;
    let disposeSlider=()=>{};
    function updateCards() {
      blocks.querySelectorAll('[data-topic-group]').forEach(button=>{
        const open=Number(button.dataset.topicGroup)===activeGroup;
        button.setAttribute('aria-expanded',String(open));
        button.querySelector('.horizontal-arrow').innerHTML=open?closeIcon:downIcon;
      });
    }
    function toggleGroup(index) {
      if(index===activeGroup&&!panel.hidden) {
        activeGroup=-1;panel.hidden=true;panel.style.minHeight='';updateCards();
      } else showGroup(index);
    }
    function showGroup(index, preserveSpace=true) {
      if(preserveSpace&&!panel.hidden)panel.style.minHeight=`${panel.getBoundingClientRect().height}px`;
      activeGroup=index;
      panel.hidden=false;
      const group=groups[index];
      panel.style.setProperty('--tone',group.tone);
      panel.setAttribute('aria-labelledby',`${id}-tab-${index}`);
      updateCards();
      disposeSlider();
      disposeSlider=mountTopicSlider(reading,nav,group,index,signal);
    }
    blocks.addEventListener('click',event=>{
      const group=event.target.closest('[data-topic-group]');
      if(group)toggleGroup(Number(group.dataset.topicGroup));
    },{signal});
    blocks.addEventListener('keydown',event=>{
      const tab=event.target.closest('[data-topic-group]');
      if(!tab||!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?2:(Number(tab.dataset.topicGroup)+(event.key==='ArrowRight'?1:2))%3;
      blocks.querySelector(`[data-topic-group="${next}"]`).focus({preventScroll:true});
    },{signal});
}
