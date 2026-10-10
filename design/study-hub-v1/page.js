/* This direction reuses the site's shared design frame; only the Study parent is new. */
window.ICONS.arrow = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';
const main = window.Frame.mount();
main.append(document.getElementById('study-home').content.cloneNode(true));
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = window.icon(el.dataset.icon, 18); });
document.querySelectorAll('.nav a').forEach(link => {
  const isStudy = link.getAttribute('href') === '/study';
  link.classList.toggle('active', isStudy);
  link.setAttribute('aria-label', link.textContent.trim());
  if (isStudy) { link.setAttribute('aria-current', 'page'); link.setAttribute('href', './'); }
});

const svgNS = 'http://www.w3.org/2000/svg';
function line(group, d, opacity) {
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d);
  if (opacity) path.setAttribute('opacity', opacity);
  document.getElementById(group).append(path);
}
for (let i=0; i<9; i++) {
  line('verse-lines', `M180 ${106+i*7}Q223 ${98+i*7} 264 ${118+i*7}`);
  line('verse-lines', `M306 ${109+i*7}Q348 ${91+i*7} 391 ${105+i*7}`);
}
for (let column=0; column<3; column++) for (let i=0; i<12; i++) {
  const x=134+column*23, y=88+i*5;
  line('manuscript-lines', `M${x} ${y}l${i%3===0?15:18} 1`);
}
for (let row=0; row<10; row++) {
  for (let column=0; column<3; column++) {
    const x=242+column*8, y=88+row*9+column*7;
    line('inscription-lines', `M${x} ${y}l4 2-2 1m-2-3 1 5`, '.65');
  }
  for (let column=0; column<4; column++) {
    const x=283+column*9, y=110+row*9-column*3;
    line('inscription-lines', `M${x} ${y}l5-2-3 4m-2-2 1 4`, '.8');
  }
}

// Search is deliberately limited to existing destinations, including the three reviewed examples.
const entries = [
  ['Scripture & Theology','Topics','Explore biblical themes and their passages.','/topics','doctrine god faith hope love prayer grace'],
  ['Scripture & Theology','Names & descriptions of God','Father, Son and Holy Spirit.','/study/names','attributes character trinity'],
  ['Scripture & Theology','Jesus & the Gospels','Read and compare the Gospel accounts.','/study/gospels','matthew mark luke john christ harmony'],
  ['Scripture & Theology','Miracles & encounters','Events and the passages that describe them.','/study/miracles','wonders signs healing jesus'],
  ['Scripture & Theology','Connections in Scripture','Follow references between biblical passages.','/study/references','cross references'],
  ['Scripture & Theology','The shape of the Bible','Books, literary forms and structure.','/study/structure','canon chapters poetry'],
  ['Scripture & Theology','People & genealogies','People, families, prophets and rulers.','/study/people','kings apostles hezekiah'],
  ['Scripture & Theology','Letters & their message','Read the New Testament letters in context.','/study/letters','paul romans grace epistles theology'],
  ['Shared resource','Places & journeys','Explore the biblical world in the Atlas.','/study/atlas','geography history maps jerusalem judah'],
  ['Shared resource','Versions & languages','Compare the Bible’s editions and languages.','/study/versions','translations greek hebrew manuscripts'],
  ['Academic Studies','Hezekiah under siege','Sennacherib’s account alongside the biblical narrative.','/review/research/cases/hezekiah-assyria','history archaeology assyria jerusalem 2 kings 19 inscription'],
  ['Academic Studies','Where does Mark end?','A named witness: Mark in Codex Sinaiticus.','/review/research/cases/sinaiticus-mark-ending','manuscripts textual transmission mark 16 history bible'],
  ['Scripture & Theology','Bring the threat before the Lord','A study of prayer in 2 Kings 19:14–19.','/review/research/study/prayer-under-pressure','hezekiah prayer providence fear assyria'],
  ['Scholars','The scholars catalogue','Meet the people behind the works and sources.','/teachers/scholars','academics josephus theologians translators archaeology historians'],
];
const search = document.getElementById('study-search');
const clear = document.getElementById('clear-search');
const results = document.getElementById('search-results');
const resultList = document.getElementById('result-list');
const status = document.getElementById('result-status');
function updateSearch() {
  const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  clear.hidden = !words.length;
  results.hidden = !words.length;
  resultList.replaceChildren();
  if (!words.length) { status.textContent=''; return; }
  const found = entries.filter(entry => words.every(word => [...entry.slice(0,3),entry[4]].join(' ').toLocaleLowerCase().includes(word)));
  status.textContent = `${found.length} ${found.length===1?'result':'results'}`;
  for (const [branch,title,description,href] of found) {
    const link = document.createElement('a'); link.href=href;
    const text=document.createElement('span');
    const tag=document.createElement('small'); tag.textContent=branch;
    const heading=document.createElement('strong'); heading.textContent=title;
    const paragraph=document.createElement('p'); paragraph.textContent=description;
    text.append(tag,heading,paragraph); link.append(text);
    const arrow=document.createElement('span'); arrow.innerHTML=window.icon('arrowUp',17); link.append(arrow);
    resultList.append(link);
  }
  if (!found.length) {
    const empty=document.createElement('p'); empty.className='empty-result'; empty.textContent='No study matches that search. Try a broader subject, such as prayer, history or manuscripts.'; resultList.append(empty);
  }
}
search.addEventListener('input',updateSearch);
search.addEventListener('keydown',event=>{if(event.key==='Escape'){search.value='';updateSearch();}});
clear.addEventListener('click',()=>{search.value='';updateSearch();search.focus();});
document.querySelectorAll('[data-search]').forEach(button=>button.addEventListener('click',()=>{search.value=button.dataset.search;updateSearch();search.focus();}));
