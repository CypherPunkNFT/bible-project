/* Local Study hub direction. All destination links use existing pages. */
(() => {
  const $ = id => document.getElementById(id);
  const arrow = () => window.icon('arrowUp',14);
  const link = ([label,href]) => `<a href="${href}">${label}${arrow()}</a>`;
  const subjects = {
    theology: [
      ['Jesus & the Gospels','Follow the life, teaching and encounters of Jesus. Read each Gospel in its own voice, then compare the accounts.',[['Explore the Gospels','/study/gospels'],['Miracles & encounters','/study/miracles']]],
      ['God’s character & the life of faith','Explore the names and descriptions of God, and the passages that speak of faith, hope, prayer and Christian life.',[['Names of God','/study/names'],['Browse biblical themes','/topics']]],
      ['Books, letters & their message','See the shape of a book, who it addresses and how its message unfolds. Begin with the biblical library or the New Testament letters.',[['The shape of the Bible','/study/structure'],['Letters & their message','/study/letters']]],
      ['Doctrine & biblical themes','Trace a subject through Scripture, bringing its passages together and reading each in context.',[['Explore Topics','/topics'],['Connections in Scripture','/study/references']]],
      ['People & the unfolding story','Follow lives, families and relationships through the biblical narrative. Meet the prophets, rulers, apostles and the people around them.',[['People & genealogies','/study/people'],['Meet the prophets','/study/prophets']]],
    ],
    academic: [
      ['History & archaeology','Enter the world of ancient cities, kingdoms and surviving records. Explore the setting of Scripture and how historical evidence is interpreted.',[['Explore the biblical world','/study/atlas'],['Historical studies','/review/research/cases']]],
      ['Manuscripts & transmission','Explore the witnesses through which biblical texts have reached us. Compare editions, examine a manuscript and follow a textual question.',[['Versions & languages','/study/versions'],['Examine a manuscript','/review/research/cases/sinaiticus-mark-ending']]],
      ['Languages & translation','Discover the languages behind the Bible and the work of translators and reference scholars who help readers understand its words.',[['Explore editions','/study/versions'],['Meet the scholars','/teachers/scholars']]],
      ['Ancient lives & societies','People lived in cities, traded, travelled and wrote to one another. Explore the places and social settings behind the biblical narratives.',[['Places & journeys','/study/atlas'],['People in Scripture','/study/people']]],
      ['Theologians & their works','Follow Christian teaching through the people who studied, preached and wrote about Scripture. Discover their books and the questions they addressed.',[['Preachers & authors','/teachers/preachers-and-authors'],['Scholars & their works','/teachers/scholars']]],
    ],
  };
  for (const [branch,rows] of Object.entries(subjects)) {
    const target = $(branch==='theology'?'theology-subjects':'academic-subjects');
    target.innerHTML = rows.map(([title,description,links],i)=>`<div class="subject-row"><button class="subject-toggle" aria-expanded="${i===0}" aria-controls="${branch}-detail-${i}"><small>0${i+1}</small><strong>${title}</strong><span class="plus" aria-hidden="true">${i===0?'−':'+'}</span></button><div class="subject-detail" id="${branch}-detail-${i}" ${i===0?'':'hidden'}><p>${description}</p><div class="subject-links">${links.map(link).join('')}</div></div></div>`).join('');
    target.querySelectorAll('.subject-toggle').forEach(button=>button.addEventListener('click',()=>{
      const opening=button.getAttribute('aria-expanded')!=='true';
      target.querySelectorAll('.subject-toggle').forEach(other=>{const active=other===button&&opening;other.setAttribute('aria-expanded',String(active));other.querySelector('.plus').textContent=active?'−':'+';$(other.getAttribute('aria-controls')).hidden=!active;});
    }));
  }

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
  $('writer-list').innerHTML=writers.map(w=>`<a href="/people/${w.id}"><span><strong>${w.name}</strong><small>${w.role}<br>${w.books.join(' · ')}</small></span>${arrow()}</a>`).join('');
  $('writers-open').addEventListener('click',()=>{const opening=$('writer-directory').hidden;$('writer-directory').hidden=!opening;$('writers-open').setAttribute('aria-expanded',String(opening));if(opening){$('writer-directory-title').focus({preventScroll:true});$('writer-directory').scrollIntoView({block:'start',behavior:'instant'});}});
  $('writers-close').addEventListener('click',()=>{$('writer-directory').hidden=true;$('writers-open').setAttribute('aria-expanded','false');$('writers-open').focus();});

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

  const eras=[
    {title:'Patriarchs & Exodus',kicker:'Families, covenant & deliverance',copy:'Follow the families of Genesis and the movement from Egypt into the wilderness. Explore the people, relationships and places named in the story.',links:[['People & genealogies','/study/people'],['Books of the Bible','/study/structure']],places:[['Hebron',35.10,31.53,'A place associated with Abraham and the patriarchal narratives.'],['Egypt',31.23,30.04,'The land from which the Exodus narrative begins. The marker indicates the Nile region.']]},
    {title:'Kings & Prophets',kicker:'Kingdoms, voices & exile',copy:'Explore Israel and Judah among their neighbours. Follow kings and prophets, discover the cities in their stories, and examine historical sources.',links:[['Meet the prophets','/study/prophets'],['Historical studies','/review/research/cases']],places:[['Jerusalem',35.23,31.78,'A royal city in Judah and a central setting of the biblical narratives.'],['Nineveh',43.15,36.36,'An Assyrian royal centre and the city at the heart of Jonah’s story.'],['Babylon',44.42,32.54,'The city associated with the exile of Judah in the biblical accounts.']]},
    {title:'Jesus & the Gospels',kicker:'The life & teaching of Jesus',copy:'Read the four Gospel accounts in their settings. Follow the people Jesus meets, his teaching and the events that unfold from Galilee to Jerusalem.',links:[['Compare the Gospels','/study/gospels'],['Miracles & encounters','/study/miracles']],places:[['Galilee',35.51,32.83,'A region central to Jesus’ ministry. Explore its encounters through the Gospel studies.'],['Jerusalem',35.23,31.78,'The setting of Jesus’ final week, crucifixion and resurrection in the Gospel accounts.']]},
    {title:'The Early Church',kicker:'Journeys, communities & letters',copy:'Follow the spread of the Gospel through Acts and the letters written to early Christian communities. Meet the apostles and explore the places they knew.',links:[['Letters & their message','/study/letters'],['Meet the apostles','/study/apostles']],places:[['Jerusalem',35.23,31.78,'The opening chapters of Acts follow the first believers in Jerusalem.'],['Antioch',36.16,36.20,'A centre of early Christian mission in the book of Acts.'],['Corinth',22.93,37.91,'A city and Christian community addressed in Paul’s letters.'],['Rome',12.50,41.90,'The destination of Paul’s letter to the Romans and the closing setting of Acts.']]},
  ];
  let activeEra=2;
  $('era-selector').innerHTML=eras.map((era,i)=>`<button data-era="${i}" aria-pressed="${i===activeEra}" aria-controls="era-detail world-svg"><small>0${i+1} / THE STORY</small>${era.title}</button>`).join('');
  function selectPlace(index){document.querySelectorAll('.place-dot').forEach(g=>g.setAttribute('aria-pressed',String(Number(g.dataset.place)===index)));const p=eras[activeEra].places[index];$('place-note').innerHTML=`<strong>${p[0]}</strong><br>${p[3]}`;}
  function drawEra(index){
    activeEra=index;const era=eras[index];
    document.querySelectorAll('[data-era]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.era)===index)));
    $('era-detail').innerHTML=`<small>${era.kicker}</small><h3>${era.title}</h3><p>${era.copy}</p><div class="era-links">${era.links.map(link).join('')}</div><div class="place-note" id="place-note"></div>`;
    $('world-svg').setAttribute('viewBox',index===2?'445 225 175 130':'330 190 355 190');
    $('world-svg').setAttribute('aria-label',`Map of places connected with ${era.title}`);
    $('map-places').innerHTML=era.places.map(([name,lon,lat],i)=>{
      const x=277.1178256001067+456.07885435045165*lon*Math.PI/180,y=583.0080114110789-456.07885435045165*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
      return `<g class="place-dot" data-place="${i}" tabindex="0" role="button" aria-label="${name}" aria-pressed="${i===0}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle class="halo" r="6"/><circle class="core" r="1.7"/><text x="5" y="-3">${name}</text></g>`;
    }).join('');
    $('map-places').querySelectorAll('.place-dot').forEach(g=>{g.addEventListener('click',()=>selectPlace(Number(g.dataset.place)));g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectPlace(Number(g.dataset.place));}});});selectPlace(0);
  }
  $('era-selector').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>drawEra(Number(b.dataset.era))));drawEra(activeEra);

  // Schematic drawings identify material types; they do not reproduce historical artifacts.
  const bookArt=(label,variant=0)=>`<svg viewBox="0 0 180 160" fill="none" aria-hidden="true"><path d="M28 143H157" stroke="currentColor" opacity=".18"/>${variant===0?'<path d="M45 35 126 22 138 132 56 144Z" fill="currentColor" fill-opacity=".06" stroke="currentColor"/><path d="M53 34 63 140M59 144 138 133 138 139 61 150 49 139 39 43 44 36" stroke="currentColor" opacity=".4"/><path d="M78 63 112 58M94 53 101 105" stroke="currentColor" opacity=".55"/>':variant===1?'<path d="M44 30H131V139H44Z" stroke="currentColor" fill="currentColor" fill-opacity=".04"/><path d="M37 25H123V134H37Z" stroke="currentColor" fill="var(--surface)"/><path d="M52 40H108M52 49H107M52 58H108M52 68H108M52 78H108M52 88H106M52 98H108M52 108H108M52 118H96" stroke="currentColor" opacity=".3"/>':variant===2?'<path d="M51 46 93 31 133 50 130 125 90 144 49 126Z" fill="currentColor" fill-opacity=".08" stroke="currentColor"/><path d="M51 46 91 63 133 50M91 63 90 144M61 64 79 72M60 77 79 85M60 91 79 99M60 104 79 113M103 74 122 66M103 87 121 79M103 101 121 93M103 115 122 107" stroke="currentColor" opacity=".45"/>':variant===3?'<path d="M39 30 119 34 128 138 47 132Z" fill="currentColor" fill-opacity=".05" stroke="currentColor"/><path d="M49 28 128 25 132 133 53 137Z" fill="var(--surface)" stroke="currentColor"/><path d="M63 43v76M85 42v77M107 41v76" stroke="currentColor" stroke-width="11" stroke-dasharray="1 5" opacity=".4"/>':'<path d="M34 53 65 48 74 139 42 142Z M75 34 110 31 115 138 78 141Z M118 47 145 52 138 140 118 137Z" fill="currentColor" fill-opacity=".05" stroke="currentColor"/><path d="M40 68 64 64M41 73 65 69M82 51 104 49M82 57 104 55M124 65 139 69M124 70 139 74M45 126 70 123M83 123 110 122M122 125 136 128" stroke="currentColor" opacity=".45"/>'}<text x="90" y="156" text-anchor="middle" fill="currentColor" font-size="5" letter-spacing="1.5">${label}</text></svg>`;
  const sources=[
    {label:'Scripture & translations',sub:'Read & compare',tone:'epistles',art:'THE BIBLICAL TEXT',title:'Read the text. Compare the editions.',copy:'Begin with the Bible, then explore the languages and editions available in the collection. Follow a passage into its wider setting.',links:[['Open the Bible','/bible'],['Versions & languages','/study/versions']]},
    {label:'Ancient histories',sub:'People & their accounts',tone:'history',art:'HISTORICAL WRITINGS',title:'Meet the voices of the ancient world.',copy:'Discover historical writers such as Josephus, Tacitus and Eusebius through the Scholars catalogue, their works and the settings in which they wrote.',links:[['Meet historical writers','/teachers/scholars'],['Explore historical studies','/review/research/cases']]},
    {label:'Inscriptions & records',sub:'Words from the past',tone:'poetry',art:'INSCRIBED RECORDS',title:'Examine a record in its own setting.',copy:'An inscription has a speaker, an audience and a purpose. Begin with an Assyrian royal account, its named edition and the historical question it helps us examine.',links:[['Read the source record','/review/research/works/sennacherib-022'],['Explore its historical study','/review/research/cases/hezekiah-assyria']]},
    {label:'Manuscripts & witnesses',sub:'The surviving texts',tone:'prophets',art:'MANUSCRIPT WITNESSES',title:'Follow the evidence in a surviving text.',copy:'Begin with Mark in Codex Sinaiticus. Explore this manuscript witness through its description, source links and a study of the Gospel’s ending.',links:[['Explore the manuscript witness','/review/research/works/sinaiticus-mark'],['Read the connected study','/review/research/cases/sinaiticus-mark-ending']]},
    {label:'Theology & reference',sub:'Centuries of study',tone:'gospels',art:'BOOKS & THEIR AUTHORS',title:'Discover the work behind the learning.',copy:'Explore preachers, theologians and the makers of reference books. Follow the people behind the commentaries, dictionaries, sermons and studies.',links:[['Preachers & authors','/teachers/preachers-and-authors'],['Reference scholars','/teachers/scholars']]},
  ];
  $('source-shelf').innerHTML=sources.map((s,i)=>`<button data-source="${i}" aria-pressed="${i===0}" aria-controls="source-detail" style="--tone:var(--${s.tone})"><span class="shelf-art">${bookArt(s.art,i)}</span><strong>${s.label}</strong><small>${s.sub}</small></button>`).join('');
  function sourceSelect(index){const s=sources[index];document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.source)===index)));$('source-detail').innerHTML=`<div><small>${s.label}</small><h3>${s.title}</h3></div><div><p>${s.copy}</p><div class="source-links">${s.links.map(link).join('')}</div></div>`;}
  $('source-shelf').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>sourceSelect(Number(b.dataset.source))));sourceSelect(0);
  // Add the new local writers entrance to the existing, deliberately small search index.
  entries.push(['Scripture & Theology','Writers of Scripture','Meet the people associated with the biblical books.','#voices','authors paul luke isaiah david moses john']);
})();
