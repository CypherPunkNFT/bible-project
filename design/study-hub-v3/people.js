/* Writer associations and scholar sample retained from direction 2. */
(()=>{const $=id=>document.getElementById(id);const arrow=()=>window.icon("arrowUp",14);
  const writers = [
    {name:'Paul',id:'paul',role:'Apostle & letter writer',books:['Romans','Philippians','Philemon'],caption:'Letters to churches and a fellow believer.'},
    {name:'Luke',id:'luke-2co-13-13',role:'Gospel writer & companion',books:['Luke','Acts'],caption:'A Gospel account and the story of the early church.'},
    {name:'Isaiah',id:'isaiah-2ki-19-2',role:'Prophet in Judah',books:['Isaiah'],caption:'Prophetic words of judgment, hope and restoration.'},
    {name:'David',id:'david-rut-4-17',role:'King & psalmist',books:['Psalms'],caption:'Prayer and praise among the psalms attributed to David.'},
    {name:'Moses',id:'moses-exo-2-10',role:'Prophet & leader',books:['Genesis–Deuteronomy'],caption:'Traditionally associated with the five books of the Torah.'},
    {name:'John',id:'john-son-of-zebedee',role:'Apostle',books:['John','1–3 John','Revelation'],caption:'Traditional associations; authorship is considered work by work.'},
  ];
  function drawWriter(index) {
    const w=writers[index], books=w.books;
    $('writers-art').innerHTML=`<svg viewBox="0 0 510 220" aria-hidden="true"><ellipse cx="255" cy="110" rx="210" ry="86" class="writer-ink" opacity=".07"/><path d="M46 176H464" class="writer-ink" opacity=".16"/><circle cx="100" cy="108" r="42" class="writer-ink" opacity=".5"/><circle cx="100" cy="108" r="36" class="writer-ink" opacity=".18"/><text x="100" y="116" text-anchor="middle" class="writer-name">${w.name}</text><text x="100" y="172" text-anchor="middle" class="writer-sub">THE WRITER</text>${books.map((book,i)=>{const y=books.length===1?108:books.length===2?77+i*60:57+i*50;return `<path d="M142 108C206 108 208 ${y} 268 ${y}" class="writer-ink" opacity=".4"/><circle cx="269" cy="${y}" r="2.3" fill="currentColor"/><path d="M288 ${y-17}q14-5 27 1q14-6 27-1v30q-14-4-27 2q-13-6-27-2zM315 ${y-16}v31" class="writer-ink" opacity=".55"/><text x="356" y="${y+5}" class="writer-book">${book}</text>`;}).join('')}<text x="330" y="205" text-anchor="middle" class="writer-label">FOLLOW THE WORDS INTO SCRIPTURE</text></svg>`;
    $('writer-caption').innerHTML=`<span><strong>${w.role}</strong><br>${w.caption}</span><a href="/people/${w.id}">Meet ${w.name}${arrow()}</a>`;
    document.querySelectorAll('[data-writer]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.writer)===index)));
  }
  const writerTabs=document.createElement('div');writerTabs.className='writer-tabs';writerTabs.setAttribute('aria-label','Choose a writer');
  writerTabs.innerHTML=writers.slice(0,4).map((w,i)=>`<button data-writer="${i}" aria-pressed="${i===0}">${w.name}</button>`).join('');
  $('writers-art').after(writerTabs);writerTabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>drawWriter(Number(b.dataset.writer))));drawWriter(0);

  const fields=[
    {label:'History',tone:'history',names:'Josephus · Tacitus · Eusebius',nodes:[['FJ',318,82],['T',395,48],['E',440,120]]},
    {label:'Languages',tone:'prophets',names:'Westcott · Lightfoot · A. T. Robertson',nodes:[['BW',65,67],['JL',138,40],['AR',123,125]]},
    {label:'Archaeology',tone:'poetry',names:'Ramsay · Robinson · Albright',nodes:[['WR',205,169],['ER',270,133],['WA',277,206]]},
    {label:'Reference',tone:'epistles',names:'Strong · Easton · Torrey',nodes:[['JS',407,187],['ME',344,214],['RT',460,212]]},
    {label:'Theology',tone:'gospels',names:'Augustine · Anselm · Aquinas',nodes:[['A',213,39],['AN',263,75],['TA',202,105]]},
  ];
  $('scholar-art').innerHTML=`<svg viewBox="0 0 520 250" aria-hidden="true">${fields.map((f,i)=>`<g class="scholar-group" data-field-art="${i}" style="color:var(--${f.tone})"><path d="M${f.nodes.map(n=>`${n[1]} ${n[2]}`).join('L')}" stroke="currentColor" fill="none" opacity=".25"/>${f.nodes.map(([name,x,y])=>`<g transform="translate(${x} ${y})">${i===0?'<circle r="23" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".5"/><circle r="19" fill="none" stroke="currentColor" stroke-opacity=".18"/>':i===2?'<path d="M0-25 22-12v25L0 26-22 13v-25Z" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".5"/>':'<rect x="-23" y="-23" width="46" height="46" rx="7" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".5"/><rect x="-19" y="-19" width="38" height="38" rx="4" fill="none" stroke="currentColor" stroke-opacity=".18"/>'}<text text-anchor="middle" y="5">${name}</text></g>`).join('')}</g>`).join('')}</svg>`;
  $('scholar-fields').innerHTML='<button data-field="-1" style="--field-tone:var(--history)" aria-pressed="true">All fields</button>'+fields.map((f,i)=>`<button data-field="${i}" style="--field-tone:var(--${f.tone})" aria-pressed="false">${f.label}</button>`).join('');
  function fieldSelect(index){document.querySelectorAll('[data-field]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.field)===index)));document.querySelectorAll('[data-field-art]').forEach(g=>g.classList.toggle('dim',index!==-1&&Number(g.dataset.fieldArt)!==index));$('scholar-caption').innerHTML=index===-1?'<span><strong>Explore across the fields</strong><br>Meet the people. Discover their works.</span><span>Select a field above</span>':`<span><strong>${fields[index].label}</strong><br>${fields[index].names}</span>`;}
  $('scholar-fields').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>fieldSelect(Number(b.dataset.field))));fieldSelect(-1);
})();
