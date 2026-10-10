/* Same Natural Earth coastline/projection and first-journey coordinates as the site's Atlas. */
(async()=>{
  const $=id=>document.getElementById(id),arrow=()=>icon('arrowUp',15);
  const compass=()=>`<div class="atlas-compass" role="img" aria-label="Compass rose, north up"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="compass-ground" cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="38"/><circle class="compass-inner" cx="50" cy="50" r="31"/>${Array.from({length:32},(_,i)=>`<path d="M50 12v${i%4===0?7:3}" transform="rotate(${i*11.25} 50 50)"/>`).join('')}<path class="compass-diagonals" d="m50 50-19-19 19 11 19-11-11 19 11 19-19-11-19 11 11-19Z"/><path class="compass-north" d="m50 24 8 26-8-4-8 4Z"/><path class="compass-south" d="m50 76-8-26 8 4 8-4Z"/><path d="M25 50h16m18 0h16"/><circle cx="50" cy="50" r="3"/><text x="50" y="9">N</text><text x="92" y="53">E</text><text x="50" y="97">S</text><text x="8" y="53">W</text></svg></div>`;
  try{
    const response=await fetch('/mockups/study-hub-v3/map-data.json');if(!response.ok)throw new Error('Map unavailable');const d=await response.json();
    let mode='map',chosen=d.places.find(p=>p.name==='Corinth');
    const project=([lon,lat])=>[d.translate[0]+d.scale*lon*Math.PI/180,d.translate[1]-d.scale*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
    function setCopy(){
      if(mode==='paul'){
        $('atlas-copy').innerHTML=`<h3>The road and<br>the letters.</h3><p>Follow Paul’s recorded journeys, or connect his correspondence with the places in its story.</p><a href="/study/atlas/journeys?focus=paul&lens=story">Follow Paul’s story ${arrow()}</a><br><a href="/study/atlas/journeys?focus=paul&lens=letters">Explore the letters ${arrow()}</a>`;return;
      }
      const descriptions={Corinth:'A city, a church and the questions of its letters. Enter its setting, then return to the text.',Jerusalem:'Worship, kingship and the Gospel story meet in one city. Explore its biblical connections.',Rome:'An imperial capital and the destination of a journey. Follow its connections into Scripture.',Alexandria:'A city named in Acts. Locate it in the Mediterranean world and open its biblical references.',Antioch:'A community and a point of departure. Follow its place in the story of the early church.'};
      $('atlas-copy').innerHTML=`<h3>${chosen.name}</h3><p>${descriptions[chosen.name]}</p><a href="${mode==='cities'?`/study/atlas/cities?focus=${chosen.name.toLowerCase()}&view=city`:`/study/atlas/map?place=${chosen.id}`}">${mode==='cities'?'Enter the city':'Explore this place'} ${arrow()}</a>`;
    }
    function draw(){
      const bounds=mode==='paul'?[28.6,37.9,34,39.2]:[8,43,29,44.3];
      const [x0,y0]=project([bounds[0],bounds[3]]),[x1,y1]=project([bounds[1],bounds[2]]);
      const box=$('atlas-map').getBoundingClientRect(),height=box.width?Math.round(1000*box.height/box.width):600;
      const scale=Math.min(900/(x1-x0),(height-160)/(y1-y0)),tx=(1000-(x1-x0)*scale)/2-x0*scale,ty=(height-(y1-y0)*scale)/2-y0*scale;
      const point=([lon,lat])=>{const [x,y]=project([lon,lat]);return [x*scale+tx,y*scale+ty];};
      let grid='';for(let lon=10;lon<=45;lon+=5){const [x]=point([lon,0]);grid+=`M${x} 0V${height}`;}for(let lat=25;lat<=45;lat+=5){const [,y]=point([0,lat]);grid+=`M0 ${y}H1000`;}
      let overlay='';
      if(mode==='paul'){
        const route=d.journey.map(point),labels=['Antioch','Salamis','Paphos','Perga','Antioch in Pisidia','','','Derbe'];
        overlay=`<path class="map-route" pathLength="1" d="M${route.map(p=>p.join(' ')).join('L')}"/>`+route.map(([x,y],i)=>`<circle class="map-route-dot" cx="${x}" cy="${y}" r="5"/>${labels[i]?`<text class="map-route-label" x="${x+(i===0?12:i===7?16:0)}" y="${y+(i===1||i===2?27:-18)}" text-anchor="${i===0||i===7?'start':'middle'}">${labels[i]}</text>`:''}`).join('');
      }else{
        const regions=[['ITALY',13,43.4],['GREECE',23,40.6],['ASIA MINOR',31,40.4],['EGYPT',29.5,29.9]];
        overlay=regions.map(([n,lon,lat])=>{const [x,y]=point([lon,lat]);return `<text class="map-region" x="${x}" y="${y}" text-anchor="middle">${n}</text>`;}).join('');
        const [sx,sy]=point([21.5,34.8]);overlay+=`<text class="map-sea" x="${sx}" y="${sy}" text-anchor="middle">Mediterranean Sea</text>`;
        const places=mode==='cities'?d.places.filter(p=>['Corinth','Jerusalem','Rome'].includes(p.name)):d.places;
        overlay+=places.map(p=>{const [x,y]=point([p.lon,p.lat]);return `<g class="map-point" data-place="${p.id}" role="button" tabindex="0" aria-label="Select ${p.name}" aria-pressed="${chosen.id===p.id}"><circle class="halo" cx="${x}" cy="${y}" r="17"/><circle class="dot" cx="${x}" cy="${y}" r="4"/><text x="${x+(p.name==='Alexandria'?-14:14)}" y="${y+4}" text-anchor="${p.name==='Alexandria'?'end':'start'}">${p.name}</text></g>`;}).join('');
      }
      $('atlas-map').innerHTML=`<svg viewBox="0 0 1000 ${height}" role="group" aria-label="${mode==='paul'?'Paul’s first journey outward, from Antioch through Cyprus to Derbe':'Select a place in the Mediterranean world'}"><path class="map-grid" d="${grid}"/><g transform="translate(${tx} ${ty}) scale(${scale})"><path class="map-land" d="${d.land}" fill-rule="evenodd" vector-effect="non-scaling-stroke"/></g>${overlay}</svg>${compass()}${mode==='paul'?'<p class="map-route-credit">First journey outward · Acts 13–14<br>Schematic connections between recorded stops.</p>':''}`;
      $('map-kicker').textContent=mode==='paul'?'FOLLOW THE JOURNEY':mode==='cities'?'ENTER AN ANCIENT CITY':'THE BIBLICAL WORLD';
      $('map-legend-text').textContent=mode==='paul'?'From Antioch, through Cyprus, into Asia Minor':'Select a place on the map';
      document.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===mode)));
      document.querySelectorAll('[data-place]').forEach(el=>{
        const choose=()=>{chosen=d.places.find(p=>p.id===el.dataset.place);save();document.querySelectorAll('[data-place]').forEach(other=>other.setAttribute('aria-pressed',String(other===el)));setCopy();};
        el.addEventListener('click',choose);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
      });setCopy();
    }
    function save(){const url=new URL(location.href);url.searchParams.set('atlas',mode);if(mode==='paul')url.searchParams.delete('place');else url.searchParams.set('place',chosen.id);history.pushState({},'',url);}
    function restore(){const url=new URL(location.href);mode=['map','cities','paul'].includes(url.searchParams.get('atlas'))?url.searchParams.get('atlas'):'map';chosen=d.places.find(p=>p.id===url.searchParams.get('place'))||d.places.find(p=>p.name==='Corinth');if(mode==='cities'&&!['Corinth','Rome','Jerusalem'].includes(chosen.name))chosen=d.places.find(p=>p.name==='Corinth');draw();}
    document.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>{if(mode===b.dataset.map)return;mode=b.dataset.map;if(mode==='cities'&&!['Corinth','Rome','Jerusalem'].includes(chosen.name))chosen=d.places.find(p=>p.name==='Corinth');save();draw();}));
    window.addEventListener('popstate',restore);restore();
    let lastSize='';new ResizeObserver(([entry])=>{const size=`${Math.round(entry.contentRect.width)}:${Math.round(entry.contentRect.height)}`;if(size!==lastSize){lastSize=size;draw();}}).observe($('atlas-map'));
  }catch(error){$('atlas-map').innerHTML='<p class="atlas-map-failure">The map preview could not load. Open the full Atlas to explore.</p>';$('atlas-copy').innerHTML='<a href="/study/atlas">Open the Atlas →</a>';console.error(error);}
})();
