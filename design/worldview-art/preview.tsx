import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {Moon,Sun,Pause,Play,Maximize2,X} from 'lucide-react';
import {Artwork,directions,themes,names,type World} from './art';
import './preview.css';
import {ArtifactGrid} from './artifacts-v2';
const worlds:World[]=['hinduism','buddhism','islam'];
const accent=(world:World)=>world==='islam'?'var(--poetry)':`var(--worldview-${world})`;
function App(){
 const [theme,setTheme]=useState<'dark'|'light'>(new URLSearchParams(location.search).get('theme')==='light'?'light':'dark');
 const [paused,setPaused]=useState(false);
 const [expanded,setExpanded]=useState<{world:World;version:number}>({world:'hinduism',version:0});
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 function enlarge(world:World,version:number){setExpanded({world,version});dialog.current?.showModal();}
 return <div className={'wa-page'+(paused?' wa-paused':'')}><header className="wa-top"><a href="/apologetics/worldviews"><img src="/favicon.svg" alt=""/>Bible Project</a><div><button aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Play motion':'Pause motion'}</span></button><button aria-label={'Switch to '+(theme==='dark'?'light':'dark')+' theme'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}<span>{theme==='dark'?'Light':'Dark'}</span></button></div></header>
  <main><div className="wa-intro"><p className="wa-kicker">Across beliefs / Illustration directions</p><h1>Thirty artifacts.<br/><em>Ten for each worldview.</em></h1><p>Six approved drawings. Twenty-four new directions. Choose the details for each collection.</p><nav aria-label="Collections"><a href="#artifacts">30 artifacts</a>{worlds.map(world=><a key={world} href={'#'+world} style={{color:accent(world)}}>{names[world]} <span>A · B · C</span></a>)}</nav></div>
  <ArtifactGrid/>
  {worlds.map(world=><section className="wa-section" id={world} key={world} style={{'--wa-accent':accent(world)} as CSSProperties}><header><div><p className="wa-kicker">{themes[world]}</p><h2>Christianity & {names[world]}</h2></div><p>{world==='hinduism'?'Lamp, temple or text as the central motif.':world==='buddhism'?'The eight-spoked wheel stays central in every direction.':'Arch, mosque or open text as the central motif.'}</p></header><div className="wa-grid">{directions[world].map((direction,version)=><article className="wa-card" key={version} data-world={world} data-version={version}><div className="wa-card-head"><span>{String.fromCharCode(65+version)}</span><button aria-label={`Enlarge ${names[world]} ${String.fromCharCode(65+version)}`} onClick={()=>enlarge(world,version)}><Maximize2 size={15}/></button></div><Artwork world={world} version={version}/><div className="wa-card-copy"><p className="wa-kicker">{themes[world]}</p><h3>{direction.name}</h3><p>{direction.detail}</p><button className="wa-view" onClick={()=>enlarge(world,version)}>View larger <Maximize2 size={12}/></button></div></article>)}</div></section>)}
  <p className="wa-notes">The lotus appears in both Hindu and Buddhist art. These Hindu directions use other central motifs to distinguish the collections. The Buddhist wheel’s eight spokes refer to the Noble Eightfold Path. <a href="https://www.britishmuseum.org/collection/object/A_1872-0701-100" target="_blank" rel="noreferrer">Hindu lotus reference ↗</a> <a href="https://www.metmuseum.org/art/collection/search/53183" target="_blank" rel="noreferrer">Eightfold Path reference ↗</a></p>
  </main><dialog ref={dialog} className="wa-dialog" style={{'--wa-accent':accent(expanded.world)} as CSSProperties}><header><div><p className="wa-kicker">{names[expanded.world]} / Direction {String.fromCharCode(65+expanded.version)}</p><h2>{directions[expanded.world][expanded.version].name}</h2></div><button aria-label="Close enlarged artwork" onClick={()=>dialog.current?.close()}><X size={20}/></button></header><Artwork world={expanded.world} version={expanded.version}/><p>{directions[expanded.world][expanded.version].detail}</p><nav aria-label="Illustration version">{[0,1,2].map(version=><button key={version} aria-pressed={expanded.version===version} onClick={()=>setExpanded({...expanded,version})}>{String.fromCharCode(65+version)}</button>)}</nav></dialog>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
