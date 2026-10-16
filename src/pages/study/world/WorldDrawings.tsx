// Original explanatory artwork. No image, archaeological plan or inscription is reproduced.
function House({ x, y, w = 74, h = 55 }: { x: number; y: number; w?: number; h?: number }) {
  return <g transform={`translate(${x} ${y})`}><path d={`M0 0l22 -14h${w}l-22 14Z`} className="wj-roof"/><path d={`M${w} 0l22 -14v${h}l-22 14Z`} className="wj-side"/><path d={`M0 0h${w}v${h}H0Z`} className="wj-wall"/><path d={`M${w * .36} ${h}v-27h18v27M8 14h14v12H8Z`} fill="var(--wj-shadow)" stroke="none"/><path d={`M3 ${h - 6}h19m26 -10h20M4 6h${w - 8}`} className="wj-detail"/></g>;
}
function Person({ x, y }: { x: number; y: number }) { return <g transform={`translate(${x} ${y})`}><circle cy="-10" r="4" fill="currentColor" stroke="none"/><path d="M0 -3v17m-6-9 6-8 6 8m-6 9-5 7m5-7 5 7" fill="none" stroke="currentColor" strokeWidth="2"/></g>; }
function Jar({ x, y }: { x: number; y: number }) { return <path transform={`translate(${x} ${y})`} d="M-5-20h10l-1 8q14 10 2 25h-12q-12-15 2-25Z M-6-9q-12-7-10 4t10 11m12-15q12-7 10 4T6 6" className="wj-pot"/>; }
function Boat({ x = 0, y = 0 }: { x?: number; y?: number }) { return <g transform={`translate(${x} ${y})`}><path d="M-92 14q25 65 148 15l29-32q-76 40-177 17Z" className="wj-hull"/><path d="M-5 18v-137m-67 10h133" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M-65-106Q-86-45-50-17Q5-32 57-20Q78-55 61-106Z" className="wj-sail"/><path d="M-64-103-91 14M61-106 77 2M-5-118 55 30" className="wj-rig"/><path d="M-30-98q-15 35-2 64M15-98q-10 35-2 64" className="wj-detail"/></g>; }

export function WorldHero() {
  return <svg viewBox="0 0 620 370" aria-hidden="true" className="wj-hero-svg">
    <path d="M-20 270Q90 208 173 249T353 213 650 175V390H-20Z" className="wj-land"/>
    <path d="M-30 310Q120 220 258 298T630 242V390H-30Z" className="wj-water"/>
    <g className="wj-contours"><path d="M-10 168q89-105 197-65t150-34M-10 180q89-105 197-65t150-34M-10 192q89-105 197-65t150-34M-10 204q89-105 197-65t150-34"/></g>
    <circle cx="477" cy="97" r="51" className="wj-sun"/>
    <House x={61} y={181} w={59}/><House x={131} y={150} w={63}/><House x={162} y={204} w={80}/>
    <g transform="translate(332 83)"><path d="M0 57h129v84H0Z" className="wj-wall"/><path d="M-7 57 63 21l78 36Z" className="wj-roof"/>{[15,43,71,99].map(x => <path key={x} d={`M${x} 65v66m-6 0h15m-15-66h15`} stroke="currentColor" strokeWidth="5"/>)}<path d="M-12 143h156m-165 8h174" className="wj-rig"/></g>
    <path d="M217 235Q310 295 337 225T437 241" className="wj-route-line"/>
    <Boat x={484} y={294}/>
    <path d="M15 336q33-10 66 0m200 8q33-10 66 0m127 12q42-10 84 0" className="wj-wave"/>
    <text x="66" y="91">HOUSEHOLDS</text><text x="337" y="34">CITIES</text><text x="386" y="365">CROSSINGS</text>
  </svg>;
}

export function SceneDrawing({ scene, view }: { scene: string; view: number }) {
  return <svg viewBox="0 0 600 380" className={`wj-scene-svg wj-drawing-${scene}`} role="img" aria-label={scene === 'sea' ? 'Selected Acts route: Myra, Crete, Malta, Syracuse, Rhegium, Puteoli, then Rome by land. Not to scale.' : `${scene} schematic; highlighted setting corresponds to the selected evidence below. Not to scale.`}>
    {scene === 'village' && <>
      <path d="M0 45Q159 20 230 62T600 60V380H0Z" className="wj-land"/><path d="M0 298q150-74 295 0t305 13v69H0Z" className="wj-water"/>
      <path d="M-15 253q130-101 260-79t350-74" className="wj-path"/>
      <g className={view === 0 ? 'wj-highlight' : 'wj-quiet'}><House x={71} y={163}/><House x={155} y={123}/><House x={207} y={192}/><Person x={178} y={213}/><Jar x={114} y={232}/><text x="76" y="96">01 / HOUSEHOLD</text></g>
      <g className={view === 1 ? 'wj-highlight' : 'wj-quiet'}><path d="M270 292q55 35 112 0l-15 23h-70Z" className="wj-hull"/><path d="m292 306 60-53m-35 47 60-53" className="wj-rig"/><path d="M407 242h95v65h-95Zm0 13h95m-95 13h95m-95 13h95m-95 13h95m-80-52v65m16-65v65m16-65v65m16-65v65m16-65v65" className="wj-net"/><text x="280" y="355">02 / WORKING SHORE</text></g>
      <g className={view === 2 ? 'wj-highlight' : 'wj-quiet'}><House x={364} y={95} w={112} h={78}/><path d="M384 97v72m25-72v72m25-72v72m25-72v72" className="wj-detail"/><text x="330" y="60">03 / LOCAL GATHERING</text></g>
    </>}
    {scene === 'pilgrimage' && <>
      <path d="M25 330Q180 265 274 180T555 65" className="wj-path"/>
      <g className={view === 0 ? 'wj-highlight' : 'wj-quiet'}><rect x="298" y="52" width="261" height="184" rx="3" className="wj-land"/><path d="M325 76h207v106H325Z" className="wj-boundary"/><rect x="376" y="91" width="96" height="68" className="wj-wall"/><path d="M386 91v68m19-68v68m19-68v68m19-68v68m19-68v68" className="wj-rig"/><text x="377" y="213">TEMPLE</text><text x="339" y="35">INNER BOUNDARY</text><path d="M409 41v28" className="wj-rig"/></g>
      <g className={view === 1 ? 'wj-highlight' : 'wj-quiet'}><House x={82} y={126} w={114} h={77}/><House x={36} y={193} w={81} h={52}/><Person x={182} y={235}/><text x="34" y="94">SYNAGOGUE & LODGING</text></g>
      <g className={view === 2 ? 'wj-highlight' : 'wj-quiet'}><path d="m286 344 85-102 100 102Z" className="wj-land"/><path d="m335 319 38-50 53 65" className="wj-contour"/><text x="245" y="369">SAMARIA / A DIFFERENT SACRED CENTRE</text><Person x={225} y={294}/></g>
      <text x="38" y="348">A JOURNEY TO WORSHIP</text>
    </>}
    {scene === 'household' && <>
      <g className={view === 1 ? 'wj-highlight' : 'wj-quiet'}><path d="M37 38h526v304H37Zm0 108h177m173 0h176M214 38v304m173-304v304" className="wj-hypothesis"/><text x="51" y="64">{view === 1 ? 'POSSIBLE ROOMS · NOT RECOVERED' : 'NO KNOWN FLOOR PLAN'}</text></g>
      <ellipse cx="300" cy="213" rx="135" ry="75" className="wj-table"/>
      {[[-75,-87],[0,-108],[76,-87],[-167,0],[167,0],[-76,91],[0,112],[76,91]].map(([x,y],i) => <g key={i} className={view === 2 || i < 3 ? 'wj-fed' : 'wj-hungry'}><circle cx={300+x} cy={200+y} r="14"/><path d={`M${288+x} ${228+y}q12-16 24 0`} fill="none" stroke="currentColor" strokeWidth="2"/></g>)}
      {[0,1,2].map(i=><g key={i}><ellipse cx={244+i*54} cy="184" rx="16" ry="7" className="wj-bread"/>{view === 2 && <ellipse cx={244+i*54} cy="240" rx="16" ry="7" className="wj-bread"/>}</g>)}
      <text x="242" y="214">{view === 2 ? 'WAIT FOR' : 'ONE GATHERING'}</text>{view === 2 && <text x="249" y="234">ONE ANOTHER</text>}
      <text x="40" y="369">{view === 2 ? 'PAUL’S INSTRUCTION · NOT A RECORDED OUTCOME' : 'FILLED / EMPTY SYMBOLS = UNEQUAL ACCESS, NOT A CENSUS'}</text>
    </>}
    {scene === 'street' && <>
      <path d="M0 287 600 267v113H0Z" className="wj-land"/><path d="m0 316 600-22M0 349l600-21m-490-33-43 85m190-90-24 90m182-97 22 97" className="wj-detail"/>
      <g className={view === 0 ? 'wj-highlight' : 'wj-quiet'}><House x={27} y={139} w={124} h={122}/><path d="M21 214h141v48H21Z" className="wj-wall"/>{[45,84,125].map(x=><ellipse key={x} cx={x} cy="217" rx="12" ry="5" className="wj-pot"/>)}<text x="28" y="99">MARKET</text><Person x={121} y={286}/></g>
      <g className={view === 1 ? 'wj-highlight' : 'wj-quiet'}><House x={229} y={110} w={119} h={144}/><path d="M260 254v-67q27-30 54 0v67" className="wj-doorway"/><Person x={281} y={267}/><text x="229" y="73">INVITATION</text></g>
      <g className={view === 2 ? 'wj-highlight' : 'wj-quiet'}><path d="M404 152h159v107H404ZM394 152l89-58 90 58Z" className="wj-wall"/>{[419,460,503,546].map(x=><path key={x} d={`M${x} 161v89m-7 0h14m-14-89h14`} stroke="currentColor" strokeWidth="5"/>)}<text x="424" y="71">CULT MEAL</text><Jar x={466} y={292}/></g>
      <text x="88" y="361">THREE SITUATIONS / THREE DISTINCT INSTRUCTIONS</text>
    </>}
    {scene === 'sea' && <>
      <path d="M0 50q120-35 244 14t356-9v325H0Z" className="wj-water"/>
      <g transform="translate(115 188) scale(.78)"><Boat/></g>
      <g className={view === 0 ? 'wj-highlight' : 'wj-quiet'}><path d="M24 80h101q30 0 25-20m-119 33h145q27 0 20-19m-159 32h94" className="wj-wave"/><text x="242" y="82">{view === 0 ? 'CONTRARY WINDS · WINTERING' : view === 1 ? 'CENTURION · MASTER · OWNER' : 'WHEAT · SHIPS · HOSPITALITY'}</text></g>
      {view === 1 ? <g className="wj-highlight"><Person x={280} y={146}/><Person x={332} y={146}/><Person x={383} y={146}/><path d="M285 180h95" className="wj-rig"/><text x="240" y="217">UNEQUAL CHOICES</text></g> : view === 2 ? <g className="wj-highlight"><Jar x={284} y={149}/><Jar x={324} y={153}/><Jar x={364} y={149}/><text x="245" y="217">CARGO & COMMUNITY</text></g> : <g className="wj-highlight"><path d="M263 134q27-29 56 0t56 0 56 0m-168 24q27-29 56 0t56 0 56 0" className="wj-wave"/><text x="261" y="217">A ROUTE INTERRUPTED</text></g>}
      <path d="M37 280H470" className="wj-route-line"/><path d="M470 280h91" className="wj-overland"/>
      {['Myra','Crete','Malta','Syracuse','Rhegium','Puteoli','Rome'].map((s,i)=><g key={s}><circle cx={37+i*87} cy="280" r="5" className="wj-stop"/><text x={37+i*87} y={i%2 ? 321 : 306} textAnchor="middle">{s}</text></g>)}
      <text x="37" y="362">SELECTED SEA STOPS</text><text x="441" y="362">— LAND →</text>
    </>}
  </svg>;
}
