import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,Maximize2,Moon,Sun,Pause,Play,X} from 'lucide-react';
import type {World} from '../worldview-art/art';
import {Composition,Legend,variants,variantFor,selectedMain,names,themes} from './compositions';
import {FireAltar} from './glyphs';
import {IslamObjectGrid} from './islam-objects';
import '../worldview-art/preview.css';
import './preview.css';

const worlds:World[]=['hinduism','buddhism','islam'];
const accent=(world:World)=>world==='islam'?'var(--poetry)':`var(--worldview-${world})`;
function App(){
 const [theme,setTheme]=useState<'dark'|'light'>(new URLSearchParams(location.search).get('theme')==='light'?'light':'dark');
 const [paused,setPaused]=useState(false),[numbers,setNumbers]=useState(false);
 const [expanded,setExpanded]=useState<{world:World;version:number}>({world:'hinduism',version:0});
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 function enlarge(world:World,version:number){setExpanded({world,version});dialog.current?.showModal();}
 return <div className={'wa-page wc-page'+(paused?' wa-paused':'')}>
  <header className="wa-top"><a href="/apologetics/worldviews"><img src="/favicon.svg" alt=""/>Bible Project</a><div><button aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Play motion':'Pause motion'}</span></button><button aria-label={`Switch to ${theme==='dark'?'light':'dark'} theme`} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}<span>{theme==='dark'?'Light':'Dark'}</span></button></div></header>
  <main><div className="wa-intro"><a className="wc-back" href="/mockups/worldview-art/#artifacts"><ArrowLeft size={13}/> Artifact collection & earlier directions</a><p className="wa-kicker">Across beliefs / Composition study</p><h1>The chosen centerpieces.<br/><em>Three ways to frame each.</em></h1><p>The temple, the eight-spoked wheel, and the mosque—with the updated Hindu and Buddhist selections and new Islamic objects.</p><nav aria-label="Collections">{worlds.map(world=><a key={world} href={'#'+world} style={{color:accent(world)}}>{names[world]} <span>A · B · C</span></a>)}</nav><label className="wc-numbers-toggle"><input type="checkbox" checked={numbers} onChange={e=>setNumbers(e.target.checked)}/>Show artifact numbers</label></div>
  {worlds.map(world=><section className="wa-section" id={world} key={world} style={{'--wa-accent':accent(world)} as CSSProperties}><header><div><p className="wa-kicker">{themes[world]}</p><h2>Christianity & {names[world]}</h2></div><p>{world==='islam'?'Mosque B ? New object directions':'Chosen centerpiece: '+selectedMain[world]}</p></header><div className="wa-grid">{variants.map((_,version)=><article className="wa-card wc-card" key={version} data-world={world} data-version={version} data-chosen={world!=='islam'&&version===0}><div className="wa-card-head"><span>{String.fromCharCode(65+version)}</span>{world!=='islam'&&version===0&&<span className="wc-chosen-label">Chosen layout</span>}<button aria-label={`Enlarge ${names[world]} ${String.fromCharCode(65+version)}`} onClick={()=>enlarge(world,version)}><Maximize2 size={15}/></button></div><Composition world={world} version={version} numbers={numbers}/><div className="wa-card-copy"><p className="wa-kicker">{themes[world]}</p><h3>{variantFor(world,version).name}</h3><p>{variantFor(world,version).detail}</p><Legend world={world} version={version}/><button className="wa-view" onClick={()=>enlarge(world,version)}>View larger <Maximize2 size={12}/></button></div></article>)}</div>
   {world==='hinduism'&&<aside className="wc-fire-detail"><svg viewBox="-65 -70 130 140" fill="none" aria-label="Fire altar with closed flames meeting at the center of the hearth" role="img"><FireAltar/></svg><div><p className="wa-kicker">26 / Fire altar detail</p><h3>Flames rise from the center.</h3><p>The three flame contours are closed at the same point inside the hearth opening.</p></div></aside>}
   {world==='islam'&&<IslamObjectGrid/>}
  </section>)}
  </main>
  <dialog ref={dialog} className="wa-dialog wc-dialog" style={{'--wa-accent':accent(expanded.world)} as CSSProperties}><header><div><p className="wa-kicker">{names[expanded.world]} / {String.fromCharCode(65+expanded.version)}</p><h2>{variantFor(expanded.world,expanded.version).name}</h2></div><button aria-label="Close enlarged artwork" onClick={()=>dialog.current?.close()}><X size={20}/></button></header><Composition world={expanded.world} version={expanded.version} numbers={numbers}/><Legend world={expanded.world} version={expanded.version}/><nav aria-label="Composition version">{[0,1,2].map(version=><button key={version} aria-pressed={expanded.version===version} onClick={()=>setExpanded({...expanded,version})}>{String.fromCharCode(65+version)}</button>)}</nav></dialog>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
