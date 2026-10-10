/* Four symbolic writer still lifes; scholar sample retained from direction 2. */
(()=>{const $=id=>document.getElementById(id);const arrow=()=>window.icon("arrowUp",14);
  const writers = [
    {name:'Paul',id:'paul',role:'Apostle & letter writer',books:['Romans','Philippians','Philemon'],caption:'Letters to churches and a fellow believer.'},
    {name:'Luke',id:'luke-2co-13-13',role:'Gospel writer & companion',books:['Luke','Acts'],caption:'A Gospel account and the story of the early church.'},
    {name:'Moses',id:'moses-exo-2-10',role:'Prophet & leader',books:['Genesis','Exodus','Leviticus','Numbers','Deuteronomy'],caption:'Traditionally associated with the five books of the Torah.'},
    {name:'David',id:'david-rut-4-17',role:'King & psalmist',books:['Psalms'],caption:'Prayer and praise among the psalms attributed to David.'},
  ];
  const ruled=(x,y,count,width,step=7)=>Array.from({length:count},(_,i)=>`<path d="M${x} ${y+i*step}h${width-(i%3)*5}" opacity="${i%3===2?.25:.4}"/>`).join('');
  const stillLifes=[
    // Paul: a writing surface with a letter, reed pen, ink and seal. One ground line.
    `<path class="writer-ground" d="M30 196H251" opacity=".24"/><g transform="rotate(-7 128 117)"><path d="M81 48h93l-4 130H76Z" fill="currentColor" fill-opacity=".035"/><path d="m81 48 7 7h79m7-7-7 7 3 123M76 178l9-6h85" opacity=".35"/>${ruled(94,72,10,59)}<path d="m94 155 8-3 7 4 14-3" opacity=".6"/></g><path d="m191 157 35-111 4-4-1 7-35 111Zm11-37 7 2M205 111l7 2"/><path d="M184 179v-15q0-5 6-5h15q6 0 6 5v15q-14 9-27 0Zm7-20v-6h12v6M185 165q13 6 25 0"/><ellipse cx="224" cy="188" rx="15" ry="5" opacity=".55"/><path d="m213 187 4-6h16l4 6m-18-6 1-7h8l2 7" opacity=".6"/>`,
    // Luke: a scroll and paired writing tablets, held inside a single faint oval.
    `<ellipse class="writer-orbit" cx="139" cy="124" rx="112" ry="84" opacity=".12"/><g transform="rotate(-8 126 112)"><path d="M69 65q-13-4-13 9v95q0 13 13 9h117V77q0-13-13-12Z"/><path d="M69 65v113m104-113q13 1 13 12H69M58 166q5-5 11 0m-7-94v80" opacity=".5"/>${ruled(83,90,10,75)}<path d="M84 162h35m8 0h26" opacity=".6"/></g><g transform="rotate(10 206 148)"><path d="M177 107h37v75h-37Zm39 0h31v75h-31Z" fill="var(--surface)"/><path d="M182 112h27v65h-27Zm39 0h21v65h-21Z" opacity=".4"/><path d="M211 119h9m-9 48h9"/>${ruled(185,123,6,19)}${ruled(223,123,6,17)}</g><path d="m103 201 111-11-10 6-101 7Z" opacity=".6"/>`,
    // Moses: staff and tablets; open composition, no enclosing ellipse or baseline.
    `<path d="M57 201 74 59q1-18-10-19-11 0-13 14m10 148L78 60q2-23-13-25-17-1-19 18"/><path d="m53 141 9 2m-9 3 8 2m-9 3 9 2" opacity=".5"/><g transform="rotate(-5 157 121)"><path d="M99 184V82a26 26 0 0 1 52 0v102Zm58 0V82a26 26 0 0 1 52 0v102Z" fill="currentColor" fill-opacity=".025"/><path d="M105 178V84a20 20 0 0 1 40 0v94Zm58 0V84a20 20 0 0 1 40 0v94Z" opacity=".24"/>${ruled(114,91,9,24,9)}${ruled(172,91,9,24,9)}<path d="m110 172 7-9-4-8m83-72-5 7 3 9" opacity=".4"/></g><path d="m108 201 27-5 13 2 21-3 22 4-6 6h-71Z" opacity=".35"/>`,
    // David: lyre and rolled psalm, without a geometric frame.
    `<path d="M71 59q-7 48 16 81l-6 20q-4 35 42 35t43-35l-7-20q24-34 17-81l-13-7q6 55-22 70h-36Q78 108 85 52Z" fill="currentColor" fill-opacity=".03"/><path d="M78 68h92M83 81h81M98 151h51M87 166q36 25 73 0m-74 11q36 27 73 0" opacity=".65"/>${Array.from({length:7},(_,i)=>`<path d="M${91+i*11} 82 ${102+i*7} 151" opacity=".5"/><circle cx="${91+i*11}" cy="75" r="1.5"/>`).join('')}<g transform="rotate(12 211 160)"><path d="M185 122h48v74h-48q-9 0-9-8t9-8h48m-48-58q-9 0-9 8t9 8h48m-48-16v58" fill="var(--surface)"/>${ruled(193,145,5,30)}<path d="m187 189 40 0" opacity=".4"/></g>`,
  ];
  function drawWriter(index) {
    const w=writers[index], books=w.books;
    $('writers-art').innerHTML=`<svg viewBox="0 0 510 250" aria-hidden="true"><text x="139" y="23" text-anchor="middle" class="writer-name">${w.name}</text><g class="writer-still-life">${stillLifes[index]}</g>${books.map((book,i)=>{const step=books.length===5?37:books.length===3?57:66,y=121+(i-(books.length-1)/2)*step;return `<path d="M255 121C278 121 269 ${y} 294 ${y}" class="writer-ink" opacity=".3"/><circle cx="294" cy="${y}" r="2" fill="currentColor"/><g class="writer-ink" opacity=".7"><path d="M309 ${y-14}q10-4 20 0q10-4 20 0v26q-10-3-20 1q-10-4-20-1zM329 ${y-14}v27"/><path d="M313 ${y-6}l12 1m-12 4 12 1m-12 4 12 1m8-11 12-1m-12 6 12-1m-12 6 12-1" opacity=".4"/></g><text x="362" y="${y+5}" class="writer-book">${book}</text>`;}).join('')}<text x="139" y="231" text-anchor="middle" class="writer-label">${['LETTERS & CORRESPONDENCE','AN ACCOUNT, CAREFULLY ORDERED','THE FIVE BOOKS OF THE TORAH','PRAYER, POETRY & PRAISE'][index]}</text></svg>`;
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
