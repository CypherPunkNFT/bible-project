/* Same Natural Earth coastline/projection and first-journey coordinates as the site's Atlas. */
(async()=>{
  const $=id=>document.getElementById(id),arrow=()=>icon('arrowUp',15);
  const compass=()=>`<div class="atlas-compass" role="img" aria-label="Compass rose, north up"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="compass-ground" cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="38"/><circle class="compass-inner" cx="50" cy="50" r="31"/>${Array.from({length:32},(_,i)=>`<path d="M50 12v${i%4===0?7:3}" transform="rotate(${i*11.25} 50 50)"/>`).join('')}<path class="compass-diagonals" d="m50 50-19-19 19 11 19-11-11 19 11 19-19-11-19 11 11-19Z"/><path class="compass-north" d="m50 24 8 26-8-4-8 4Z"/><path class="compass-south" d="m50 76-8-26 8 4 8-4Z"/><path d="M25 50h16m18 0h16"/><circle cx="50" cy="50" r="3"/><text x="50" y="9">N</text><text x="92" y="53">E</text><text x="50" y="97">S</text><text x="8" y="53">W</text></svg></div>`;
  try{
    const response=await fetch('/mockups/study-hub-v3/map-data.json');if(!response.ok)throw new Error('Map unavailable');const d=await response.json();
    let mode='map',chosen=d.places.find(p=>p.name==='Corinth'),camera=null,frame=0,lastSize='';
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const project=([lon,lat])=>[d.translate[0]+d.scale*lon*Math.PI/180,d.translate[1]-d.scale*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
    function setCopy(){
      if(mode==='paul'){
        $('atlas-copy').innerHTML=`<h3>The road and<br>the letters.</h3><p>Follow Paul’s recorded journeys, or connect his correspondence with the places in its story.</p><a href="/study/atlas/journeys?focus=paul&lens=story">Follow Paul’s story ${arrow()}</a><br><a href="/study/atlas/journeys?focus=paul&lens=letters">Explore the letters ${arrow()}</a>`;return;
      }
      const descriptions={Corinth:'A city, a church and the questions of its letters. Enter its setting, then return to the text.',Jerusalem:'Worship, kingship and the Gospel story meet in one city. Explore its biblical connections.',Rome:'An imperial capital and the destination of a journey. Follow its connections into Scripture.',Alexandria:'A city named in Acts. Locate it in the Mediterranean world and open its biblical references.',Antioch:'A community and a point of departure. Follow its place in the story of the early church.'};
      $('atlas-copy').innerHTML=`<h3>${chosen.name}</h3><p>${descriptions[chosen.name]}</p><a href="${mode==='cities'?`/study/atlas/cities?focus=${chosen.name.toLowerCase()}&view=city`:`/study/atlas/map?place=${chosen.id}`}">${mode==='cities'?'Enter the city':'Explore this place'} ${arrow()}</a>`;
    }
    function fit(bounds,height){
      const [x0,y0]=project([bounds[0],bounds[3]]),[x1,y1]=project([bounds[1],bounds[2]]);
      const scale=Math.min(900/(x1-x0),(height-160)/(y1-y0)),tx=(1000-(x1-x0)*scale)/2-x0*scale,ty=(height-(y1-y0)*scale)/2-y0*scale;
      return {scale,tx,ty};
    }
    function interpolate(from,to,t,height){
      const ease=t*t*(3-2*t),scale=from.scale*Math.pow(to.scale/from.scale,ease);
      const cx=(500-from.tx)/from.scale,cy=(height/2-from.ty)/from.scale;
      const nx=(500-to.tx)/to.scale,ny=(height/2-to.ty)/to.scale;
      return {scale,tx:500-(cx+(nx-cx)*ease)*scale,ty:height/2-(cy+(ny-cy)*ease)*scale};
    }
    function draw(animate=false){
      cancelAnimationFrame(frame);
      setCopy();
      $('map-kicker').textContent=mode==='paul'?'FOLLOW THE JOURNEY':mode==='cities'?'ENTER AN ANCIENT CITY':'THE BIBLICAL WORLD';
      $('map-legend-text').textContent=mode==='paul'?'From Antioch, through Cyprus, into Asia Minor':'Select a place on the map';
      const host=$('atlas-map'),box=host.getBoundingClientRect(),height=box.width?Math.round(1000*box.height/box.width):600;
      lastSize=`${Math.round(box.width)}:${Math.round(box.height)}`;
      const overview=fit([8,43,29,44.3],height),target=mode==='paul'?fit([28.6,37.9,34,39.2],height):overview;
      const from=camera||overview,travel=animate&&!motion.matches;
      const regions=[['ITALY',13,43.4],['GREECE',23,40.6],['ASIA MINOR',31,40.4],['EGYPT',29.5,29.9]];
      const anchor=(lon,lat)=>`data-lon="${lon}" data-lat="${lat}"`;
      const context=regions.map(([n,lon,lat])=>`<text class="map-region" ${anchor(lon,lat)} text-anchor="middle">${n}</text>`).join('')+`<text class="map-sea" ${anchor(21.5,34.8)} text-anchor="middle">Mediterranean Sea</text>`;
      const places=mode==='cities'?d.places.filter(p=>['Corinth','Jerusalem','Rome'].includes(p.name)):d.places;
      const markers=places.map(p=>`<g class="map-point" ${anchor(p.lon,p.lat)} ${mode==='paul'?'':`data-place="${p.id}" role="button" tabindex="0" aria-label="Select ${p.name}" aria-pressed="${chosen.id===p.id}"`}><circle class="halo" r="17"/><circle class="dot" r="4"/><text x="${p.name==='Alexandria'?-14:14}" y="4" text-anchor="${p.name==='Alexandria'?'end':'start'}">${p.name}</text></g>`).join('');
      const labels=['Antioch','Salamis','Paphos','Perga','Antioch in Pisidia','','','Derbe'];
      const route=mode==='paul'?`<path class="map-route" pathLength="1"/><g class="map-route-stops">${d.journey.map(([lon,lat],i)=>`<g ${anchor(lon,lat)}><circle class="map-route-dot" r="5"/>${labels[i]?`<text class="map-route-label" x="${i===0?12:i===7?16:0}" y="${i===1||i===2?27:-18}" text-anchor="${i===0||i===7?'start':'middle'}">${labels[i]}</text>`:''}</g>`).join('')}</g>`:'';
      host.dataset.phase=travel?'zooming':'settled';
      host.innerHTML=`<svg viewBox="0 0 1000 ${height}" role="group" aria-label="${mode==='paul'?'Paul’s first journey outward, from Antioch through Cyprus to Derbe':'Select a place in the Mediterranean world'}"><path class="map-grid"/><g class="map-camera"><path class="map-land" d="${d.land}" fill-rule="evenodd" vector-effect="non-scaling-stroke"/></g><g class="map-context" ${mode==='paul'?'aria-hidden="true"':''}>${context}${markers}</g>${route}</svg>${compass()}${mode==='paul'?'<p class="map-route-credit">First journey outward · Acts 13–14<br>Schematic connections between recorded stops.</p>':''}`;
      const land=host.querySelector('.map-camera'),gridPath=host.querySelector('.map-grid'),contextLayer=host.querySelector('.map-context'),routePath=host.querySelector('.map-route');
      const anchored=[...host.querySelectorAll('[data-lon]')].map(el=>({el,xy:project([+el.dataset.lon,+el.dataset.lat])}));
      const journey=d.journey.map(project);
      function paint(view,progress=1){
        camera=view;
        const {scale,tx,ty}=view,point=([x,y])=>[x*scale+tx,y*scale+ty];
        land.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
        let grid='';for(let lon=10;lon<=45;lon+=5){const [x]=point(project([lon,0]));grid+=`M${x} 0V${height}`;}for(let lat=25;lat<=45;lat+=5){const [,y]=point(project([0,lat]));grid+=`M0 ${y}H1000`;}
        gridPath.setAttribute('d',grid);
        anchored.forEach(({el,xy})=>{const [x,y]=point(xy);el.setAttribute('transform',`translate(${x} ${y})`);});
        contextLayer.style.opacity=mode==='paul'?String(1-Math.min(1,progress/.85)):'1';
        contextLayer.style.pointerEvents=mode==='paul'?'none':'';
        if(routePath)routePath.setAttribute('d',`M${journey.map(xy=>point(xy).join(' ')).join('L')}`);
      }
      function settle(){
        paint(target);
        host.dataset.phase=mode==='paul'&&travel?'drawing':'settled';
        if(routePath&&travel)routePath.addEventListener('animationend',()=>{host.dataset.phase='settled';},{once:true});
      }
      if(travel){
        // First approach Antioch, then frame the route. The line starts only once the camera rests.
        const [ax,ay]=project(d.journey[0]),scale=target.scale*.88;
        const antioch={scale,tx:500-ax*scale,ty:height/2-ay*scale};
        const start=performance.now(),duration=mode==='paul'?2200:1400;
        paint(from,0);
        function tick(now){
          const t=Math.min(1,(now-start)/duration);
          const view=mode==='paul'?(t<.62?interpolate(from,antioch,t/.62,height):interpolate(antioch,target,(t-.62)/.38,height)):interpolate(from,target,t,height);
          paint(view,t);
          if(t<1)frame=requestAnimationFrame(tick);else settle();
        }
        frame=requestAnimationFrame(tick);
      }else settle();
      document.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===mode)));
      document.querySelectorAll('[data-place]').forEach(el=>{
        const choose=()=>{chosen=d.places.find(p=>p.id===el.dataset.place);save();document.querySelectorAll('[data-place]').forEach(other=>other.setAttribute('aria-pressed',String(other===el)));setCopy();};
        el.addEventListener('click',choose);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
      });
    }
    function save(){const url=new URL(location.href);url.searchParams.set('atlas',mode);if(mode==='paul')url.searchParams.delete('place');else url.searchParams.set('place',chosen.id);history.pushState({},'',url);}
    function restore(){const url=new URL(location.href);mode=['map','cities','paul'].includes(url.searchParams.get('atlas'))?url.searchParams.get('atlas'):'map';chosen=d.places.find(p=>p.id===url.searchParams.get('place'))||d.places.find(p=>p.name==='Corinth');if(mode==='cities'&&!['Corinth','Rome','Jerusalem'].includes(chosen.name))chosen=d.places.find(p=>p.name==='Corinth');draw(Boolean(camera)||mode==='paul');}
    document.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>{if(mode===b.dataset.map)return;const previous=mode;mode=b.dataset.map;if(mode==='cities'&&!['Corinth','Rome','Jerusalem'].includes(chosen.name))chosen=d.places.find(p=>p.name==='Corinth');save();draw(previous==='paul'||mode==='paul');}));
    window.addEventListener('popstate',restore);restore();
    new ResizeObserver(([entry])=>{const size=`${Math.round(entry.contentRect.width)}:${Math.round(entry.contentRect.height)}`;if(size!==lastSize)draw();}).observe($('atlas-map'));
    motion.addEventListener('change',()=>draw());
  }catch(error){$('atlas-map').innerHTML='<p class="atlas-map-failure">The map preview could not load. Open the full Atlas to explore.</p>';$('atlas-copy').innerHTML='<a href="/study/atlas">Open the Atlas →</a>';console.error(error);}
})();
