import {useState, type CSSProperties} from 'react';
import {Check, Plus} from 'lucide-react';
import {ObjectArt, names, type World} from './art';

type Artifact={number:number;id:string;name:string;description:string;approved?:boolean};
const groups:Record<World,Artifact[]>={
 hinduism:[
  {number:1,id:'lamp',name:'Oil lamp / diya',description:'A small oil vessel with a flame; a devotional light motif.',approved:true},
  {number:3,id:'bell',name:'Temple bell',description:'A hanging bell for a temple or worship setting.',approved:true},
  {number:5,id:'kalash',name:'Kalash vessel',description:'A ceremonial pot topped with leaves and a coconut.',approved:true},
  {number:21,id:'trident',name:'Trident / trishula',description:'Three curved prongs on a slender shaft; an attribute of Shiva.'},
  {number:22,id:'damaru',name:'Hourglass drum / damaru',description:'A small double-headed drum with striking cords, associated with Shiva.'},
  {number:23,id:'veena',name:'Veena',description:'A plucked string instrument associated with Saraswati and South Indian music.'},
  {number:24,id:'peacock',name:'Peacock feather',description:'An eye-shaped feather motif associated with Krishna.'},
  {number:25,id:'garland',name:'Flower garland',description:'A curved strand of small blossoms; a floral offering motif.'},
  {number:26,id:'firealtar',name:'Ritual fire altar',description:'A stepped square hearth with a rising flame, suggesting a fire offering.'},
  {number:27,id:'tulsi',name:'Tulsi plant & pedestal',description:'A leafy holy-basil plant in a raised planter; a domestic devotional motif.'},
 ],
 buddhism:[
  {number:10,id:'bowl',name:'Alms bowl',description:'A bowl used by Buddhist monastics to receive food.',approved:true},
  {number:14,id:'lotus',name:'Lotus blossom',description:'A flower shared by Buddhist and Hindu visual traditions.',approved:true},
  {number:28,id:'knot',name:'Endless knot',description:'An interwoven auspicious motif found in Tibetan and other Buddhist art.'},
  {number:29,id:'parasol',name:'Ceremonial parasol',description:'A domed canopy with hanging tassels, one of the Buddhist auspicious emblems.'},
  {number:30,id:'banner',name:'Victory banner',description:'A tiered ceremonial banner, used as an auspicious Buddhist emblem.'},
  {number:31,id:'treasurevase',name:'Treasure vase',description:'A rounded, lidded vessel from the Buddhist auspicious-symbol tradition.'},
  {number:32,id:'fish',name:'Paired fish',description:'Two curved fish facing one another; another auspicious Buddhist emblem.'},
  {number:33,id:'vajra',name:'Vajra / dorje',description:'A double-ended ritual implement used in Esoteric Buddhist traditions.'},
  {number:34,id:'bodhitree',name:'Bodhi tree',description:'A branching tree with pointed, heart-shaped leaves; a reference to enlightenment.'},
  {number:35,id:'prayerwheel',name:'Prayer wheel',description:'A handled cylindrical wheel associated with Tibetan Buddhist practice.'},
 ],
 islam:[
  {number:19,id:'tile',name:'Geometric tile',description:'An eight-point geometric pattern inspired by architectural ornament.',approved:true},
  {number:36,id:'rosette',name:'Twelve-point rosette',description:'A twelve-point radial ornament with layered geometric outlines.'},
  {number:37,id:'interlace',name:'Interlaced star panel',description:'Overlapping star polygons framed by a square border; a geometric ornament study.'},
  {number:38,id:'palmette',name:'Palmette & winding vine',description:'A symmetrical plant ornament with curling leaves, inspired by Islamic vegetal decoration.'},
  {number:39,id:'lattice',name:'Pierced lattice screen',description:'An arched panel filled with a repeating geometric mesh, inspired by architectural screens.'},
  {number:40,id:'mihrab',name:'Mihrab niche',description:'A recessed prayer-direction niche, represented by nested pointed arches.'},
  {number:41,id:'muqarnas',name:'Muqarnas canopy',description:'A stepped, cell-like vault ornament; a simplified architectural study.'},
  {number:42,id:'minaret',name:'Minaret',description:'A slender tower with a balcony and capped top; one architectural form among many.'},
  {number:43,id:'dome',name:'Ribbed mosque dome',description:'A rounded dome with radiating ribs and a short vertical finial.'},
  {number:44,id:'qalam',name:'Reed pen / qalam & ink',description:'A cut reed writing tool beside an inkpot, suggesting calligraphy and manuscript work.'},
 ],
};

const paths:Record<string,string>={
 // Preserve the approved artwork exactly.
 kalash:'M-23 0q-16 25 0 43h46q16-18 0-43ZM-25 0h50m-48 7h46M0-8q-17-20 0-36 17 16 0 36ZM-4-6q-26-28-36-11 20 0 29 15M4-6q26-28 36-11-20 0-29 15M-12-2q-15-17-27-3m51 3q15-17 27-3',
 lotus:'M0 29q-26-28 0-70 26 42 0 70ZM0 29q-43-9-46-47 35 5 46 47Zm0 0q43-9 46-47-35 5-46 47ZM0 29q-41 17-57-15 33-13 57 15Zm0 0q41 17 57-15-33-13-57 15',
 tile:'M-42-42h84v84h-84ZM0-33 10-20 28-28 20-10 33 0 20 10 28 28 10 20 0 33-10 20-28 28-20 10-33 0-20-10-28-28-10-20ZM0-14l14 14L0 14-14 0ZM-34-34l10 10m58-10-10 10m-58 58 10-10m58 10-10-10',
 trident:'M0 48V-45M-25-37q-7 37 25 37t25-37M-25-37l-6 11m6-11 7 10M25-37l-7 10m7-10 6 11M0-45l-6 12m6-12 6 12M-5 3h10v9H-5Zm0 14h10M-4 42h8',
 damaru:'M-30-32h60q-22 28 0 64h-60q22-36 0-64ZM-30-32q30-8 60 0M-30 32q30 8 60 0M-23-24h46M-23 24h46M-24-26l48 52m0-52-48 52M-9-4h18v8H-9ZM-9 0q-25-10-37 7M9 0q25 10 37-7',
 veena:'M-14 17q-22-7-34 6-14 16 0 28 20 11 31-8 7-13 3-26ZM-18 18 28-35l8 7-46 54M-13 22 33-31M-8 27 38-26M28-35q1-15 13-14t10 12l-15 9M7-6q-10-12-20-5-9 8-2 19m27-25 9 8m-17 1 9 8m-17 1 9 8M40-40l7 4M-43 30l15 9',
 peacock:'M-18 52q15-38 28-75M-12 32q-40-13-27-46 7-23 31-33 28-3 42 20 14 28-12 48-12 10-34 11ZM-4 9q-18-12-7-29 11-14 24-3 13 12-1 26-8 9-16 6ZM0 2q-8-7-2-14 7-7 13 0 5 9-4 14M-26 4l18 7M-30-10l17 4M-19-29l9 8M3-38l4 10M24-22l-8 5M24-3l-9 1M-10 31l-8-14M0 21l20-2',
 firealtar:'M-32 12l32-10 32 10L0 23ZM-32 12v13L0 37l32-12V12M0 23v14M-43 24v12L0 51l43-15V24M-43 24l11-4m64 0 11 4M0 37v14M-10 5q-20-14-5-35 0 14 10 15-2-23 14-41-4 24 9 32 15 17-1 29M-4 6q-9-12 1-24 13 10 7 21',
 tulsi:'M-25 16h50v10h-50ZM-21 26v23h42V26M-29 49h58M0 16V-40M0-17q-27 4-32-15 25-6 32 15Zm0 13q-30 4-34-14 23-5 34 14Zm0-21q28 4 32-14-24-6-32 14Zm0 14q27 4 32-13-26-6-32 13ZM0-40q-11-17 0-25 11 8 0 25M-10 35h20m-14 5h8',
 knot:'M-14-42 42 14 14 42-42-14 14-42 42-14-14 42-42 14 14-42M-14-28 28 14 14 28-28-14 14-28 28-14-14 28-28 14 14-28M-14-42-28-28m70 14-14-14m-14 70 14-14m-70-14 14 14',
 parasol:'M-47-12q9-30 47-34 38 4 47 34ZM-47-12q24 9 47 0 23 9 47 0M0-46v-11M0-12v65M-28-12q3-22 28-34 25 12 28 34M-42-7v17m14-14v19m14-16v17m28-17v17m14-17v19m14-21v17M-4 49h8',
 banner:'M0-56v10M-22-38q22-15 44 0ZM-22-38v10h44v-10M-30-25q30 12 60 0v15q-30 12-60 0ZM-30-6q30 12 60 0v15q-30 12-60 0ZM-30 13q30 12 60 0v15q-30 12-60 0ZM-22 34v13m11-10v14m11-13v16m11-17v14m11-17v13M0 54v7',
 treasurevase:'M-10-25q-35 12-29 43 4 28 39 28t39-28q6-31-29-43ZM-10-25v-11h20v11M-16-36h32M-16-36q-1-13 16-16 17 3 16 16M0-52v-6M-29 9q29-9 58 0m-59 6q30-9 60 0M-18 49h36M0-5l9 9-9 9-9-9Z',
 fish:'M-7-26q-28-20-34 7-5 23 21 45 19-19 13-52ZM-20 26l-12 16 22-4-10-12M-13-13q-14 4-20-4M-16 4l-12 4m11 0-11 4M7-26q28-20 34 7 5 23-21 45-19-19-13-52ZM20 26l12 16-22-4 10-12M13-13q14 4 20-4M16 4l12 4m-11 0 11 4',
 vajra:'M-11-5h22v10h-22ZM-11-5q-6-9-10-9v28q4 0 10-9M11-5q6-9 10-9v28q-4 0-10-9M-21-14q-17-10-29 14 12 24 29 14M21-14q17-10 29 14-12 24-29 14M-21-14q-5 9-29 14 24 5 29 14M21-14q5 9 29 14-24 5-29 14M-50 0h100M-21-14q-19-27-29 14 10 41 29 14M21-14q19-27 29 14-10 41-29 14',
 prayerwheel:'M-26-25q26-10 52 0v49q-26 10-52 0ZM-26-25q26 10 52 0M-26-17q26 10 52 0m-52 32q26 10 52 0M-16-9h32v17h-32ZM0 30v27M-4 57h8M26 5q17 2 17 17M-5-34h10v5',
 palmette:'M0 43q-4-27 0-47M0 19q-25 10-40-8-14-21 5-27 19-5 21 10-1 13-13 10M0 19q25 10 40-8 14-21-5-27-19-5-21 10 1 13 13 10M0-4q-23-7-25-32 18 3 25 20 7-17 25-20-2 25-25 32ZM0-16q-11-15 0-36 11 21 0 36M-16 38q-13-2-19-13 18-1 23 9m28 4q13-2 19-13-18-1-23 9',
 mihrab:'M-43 49V-45h86v94ZM-34 41V-7q0-21 34-38 34 17 34 38v48ZM-24 41V-4q0-15 24-28 24 13 24 28v45M-30 41h60M-19 34V-2q0-11 19-22 19 11 19 22v36M-43-35h9m68 0h9M-43 27h9m68 0h9',
 muqarnas:'M-46 45V-6q0-27 46-47 46 20 46 47v51M-36 45V-4q0-19 36-37 36 18 36 37v49M-36 10l12-14 12 14L0-4l12 14L24-4l12 14M-36 10v14l12-8 12 8 12-8 12 8 12-8 12 8V10M-24-4v-13L-12-9 0-22 12-9 24-17v13M-12-9v19m24-19v19M-24 16v15m24-15v15m24-15v15M-36 38h72M-46 45h10m72 0h10',
 minaret:'M-10 47V-9h20v56M-14-9h28v-9h-28ZM-10-18v-20h20v20M-13-38q0-11 13-18 13 7 13 18ZM0-56v-7M-5-27v5m10-5v5M-10 10h20M-4 36V25a4 4 0 0 1 8 0v11M-15 47h30v7h-30M-17-9l3 7h28l3-7',
 dome:'M-46 17q-4-21 12-39 14-16 34-23 20 7 34 23 16 18 12 39ZM-35 17q-8-32 35-62 43 30 35 62M-21 17q-6-33 21-62 27 29 21 62M0-45v62M0-45v-12M-46 17h92v10h-92ZM-38 27v20h76V27M-27 37h5m12 0h5m10 0h5m12 0h5M-45 47h90',
 qalam:'M-42 32 6-45l8 5-49 77ZM-42 32l-6 11 13-6M-39 34l6-9M-4-29l8 5m-27 21 8 5M17 12h27v30H17ZM20 12V5h21v7M15 42h31M23 22h15M27 5v-8h7v8',
};

function radialPoints(count:number,outer:number,inner:number){return Array.from({length:count*2},(_,i)=>{const a=(i*Math.PI/count)-Math.PI/2,r=i%2?inner:outer;return `${(Math.cos(a)*r).toFixed(2)},${(Math.sin(a)*r).toFixed(2)}`;}).join(' ');}
function ArtifactArt({id}:{id:string}){
 return <svg viewBox="-70 -70 140 140" fill="none" aria-hidden="true">
  {id==='rosette'?<><polygon points={radialPoints(12,49,35)}/><polygon points={radialPoints(12,35,23)}/><circle r="14"/>{Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30})`} d="M0-14V-23"/>)}</>:
   id==='interlace'?<><path d="M-47-47h94v94h-94Z"/><polygon points={radialPoints(8,43,19)}/><polygon points={radialPoints(8,35,24)}/><path d="M-16-16h32v32h-32ZM0-23l23 23L0 23-23 0Z"/></>:
   id==='lattice'?<><path d="M-43 49V-13q0-19 43-43 43 24 43 43v62ZM-35 42V-10q0-15 35-36 35 21 35 36v52Z"/><g>{[-24,-8,8,24].map(x=>[0,16,32].map(y=><path key={`${x}:${y}`} d={`M${x} ${y-8}l8 8-8 8-8-8Z`}/>))}<path d="M-16-16 0-32 16-16 0 0ZM-32-8l16-16m32 0 16 16"/></g></>:
   id==='garland'?<><path d="M-48-32q-2 68 48 81 50-13 48-81"/>{[[-47,-25],[-44,-8],[-38,9],[-28,25],[-15,38],[0,45],[15,38],[28,25],[38,9],[44,-8],[47,-25]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0-7q7-4 5 5 8 2 2 7-2 8-7 2-7 4-5-5-8-2-2-7 2-8 7-2Z"/><circle r="2"/></g>)}<path d="M-48-32v-11m96 11v-11"/></>:
   id==='bodhitree'?<><path d="M-12 49q13-24 12-57-1 33 12 57M0 16l-24-24m24 9 24-25M0-8l-8-22m8 22 9-30M-21 49h42"/>{[[-29,-14],[-13,-32],[12,-40],[31,-31],[-40,3],[38,3]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0 15q-23-12-12-24 8-7 12 2 4-9 12-2 11 12-12 24ZM0-7v22"/></g>)}</>:
   id==='damaru'?<><path d={paths[id]}/><circle cx="-47" cy="7" r="3"/><circle cx="47" cy="-7" r="3"/></>:
   id==='fish'?<><path d={paths[id]}/><circle cx="-20" cy="-18" r="2"/><circle cx="20" cy="-18" r="2"/></>:
   paths[id]?<path d={paths[id]}/>:<ObjectArt item={id as 'lamp'|'bell'|'bowl'} x={0} y={0}/>}
 </svg>;
}

const references:Record<World,{title:string;url:string}[]>={
 hinduism:[{title:'Shiva’s trident',url:'https://www.britishmuseum.org/collection/object/A_2001-1126-1'},{title:'Damaru',url:'https://www.metmuseum.org/art/collection/search/503431'},{title:'Veena',url:'https://www.metmuseum.org/art/collection/search/505819'},{title:'Krishna’s feather',url:'https://www.britishmuseum.org/collection/object/A_2003-1024-0-8'}],
 buddhism:[{title:'Auspicious Buddhist emblems',url:'https://www.britishmuseum.org/collection/image/266711001'},{title:'Vajra',url:'https://www.metmuseum.org/art/collection/search/39090'}],
 islam:[{title:'Geometric ornament',url:'https://www.metmuseum.org/ja/press-releases/the-nature-of-islamic-ornament-part-iii--geometric-patterns-1999-exhibitions'},{title:'Plant ornament',url:'https://www.metmuseum.org/es/essays/vegetal-patterns-in-islamic-art'},{title:'Muqarnas',url:'https://exhibitions.kelsey.lsa.umich.edu/pearls/muqarnas.html'}],
};

export function ArtifactGrid(){
 const [favorites,setFavorites]=useState<number[]>(()=>{try{const saved=JSON.parse(localStorage.getItem('worldview-artifact-shortlist-v2')||'[]');return Array.isArray(saved)?saved.filter((n:unknown)=>typeof n==='number'&&n>=21&&n<=44):[];}catch{return [];}});
 function toggle(number:number){const next=favorites.includes(number)?favorites.filter(n=>n!==number):[...favorites,number].sort((a,b)=>a-b);setFavorites(next);try{localStorage.setItem('worldview-artifact-shortlist-v2',JSON.stringify(next));}catch{/* Selection still works without browser storage. */}}
 return <section className="wa-section" id="artifacts"><header><div><p className="wa-kicker">30 artifacts / Ten per worldview</p><h2>The artifact collection.</h2></div><p>Your six approved drawings are marked below. Every other option is a new direction.</p></header>
  <div className="wa-approval-summary"><Check size={15}/><p>Approved: <strong>1, 3, 5, 10, 14, 19</strong><span>{favorites.length?`Your shortlist: ${favorites.join(', ')}`:'Add favorites to compare the new directions.'}</span></p></div>
  <nav className="wa-artifact-jumps" aria-label="Artifact groups">{(['hinduism','buddhism','islam'] as const).map(world=><a key={world} href={`#artifacts-${world}`}>{names[world]} <span>10</span></a>)}</nav>
  {(['hinduism','buddhism','islam'] as const).map(world=><section key={world} className="wa-artifact-group" id={`artifacts-${world}`} style={{'--wa-accent':world==='islam'?'var(--poetry)':`var(--worldview-${world})`} as CSSProperties}><header><h3>{names[world]}</h3><p>{world==='islam'?'One approved · Nine new directions':world==='hinduism'?'Three approved · Seven new directions':'Two approved · Eight new directions'}</p></header><div className="wa-artifact-grid">{groups[world].map(artifact=><article key={artifact.number} className={'wa-artifact-card'+(artifact.approved?' wa-approved':'')+(favorites.includes(artifact.number)?' wa-shortlisted':'')} data-artifact={artifact.number} data-world={world}><div className="wa-artifact-heading"><span className="wa-kicker">{String(artifact.number).padStart(2,'0')}</span>{artifact.approved?<span className="wa-approved-badge"><Check size={12}/>Approved</span>:<span className="wa-new-badge">New</span>}</div><ArtifactArt id={artifact.id}/><h4>{artifact.name}</h4><p>{artifact.description}</p>{!artifact.approved&&<button className="wa-shortlist-button" aria-pressed={favorites.includes(artifact.number)} onClick={()=>toggle(artifact.number)}>{favorites.includes(artifact.number)?<Check size={13}/>:<Plus size={13}/>}<span>{favorites.includes(artifact.number)?'Shortlisted':'Add to shortlist'}</span></button>}</article>)}</div><details className="wa-artifact-references"><summary>Object references</summary><p>{references[world].map(ref=><a key={ref.url} href={ref.url} target="_blank" rel="noreferrer">{ref.title} ↗</a>)}</p></details></section>)}
  <p className="wa-notes">Original approval numbers are preserved. New options use 21–44. These drawings are visual studies; specific objects belong to particular traditions and regions, and some motifs are shared.</p>
 </section>;
}
