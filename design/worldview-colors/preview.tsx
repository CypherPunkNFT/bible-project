import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation,useNavigate} from 'react-router-dom';
import {Moon,Sun} from 'lucide-react';
import {WorldviewNavigation} from '@/components/apologetics/WorldviewNavigation';
import {WorldviewHeroArt} from '@/components/apologetics/WorldviewHeroArt';
import {IslamHeroArt} from 'existing-islam-art';
import {colorsFor,palettes,worldIds,worldNames} from './palettes';
import '@/components/apologetics/navigation.css';
import './preview.css';

const root='/apologetics/worldviews';
function paletteStyle(index:number,theme:'light'|'dark'){
 return Object.fromEntries(Object.entries(colorsFor(index,theme)).map(([world,color])=>['--palette-'+world,color])) as CSSProperties;
}
function LivePreview(){
 const location=useLocation(),navigate=useNavigate();
 const world=worldIds.find(id=>location.pathname.startsWith(root+'/'+id));
 return <><WorldviewNavigation/>{world?<div className="pc-live-body" style={{'--wv-accent':`var(--palette-${world})`} as CSSProperties}>
  <div><p className="pc-kicker">Across beliefs</p><h2>Christianity<br/><em>& {world==='secular'?'secular thought':worldNames[world]}</em></h2><p className="pc-lead">Open texts. Honest questions.<br/>Examine the claims, follow the sources, carry the conversation.</p><div className="pc-example-selection">{world==='islam'?'Christianity & Islam':'Overview'}</div></div>
  {world==='islam'?<IslamHeroArt/>:<WorldviewHeroArt id={world}/>}
 </div>:<div className="pc-live-index"><p>Choose an icon to see its selected menu and illustration.</p><div className="pc-all-colors">{worldIds.map(id=><button key={id} style={{color:`var(--palette-${id})`}} onClick={()=>navigate(root+'/'+id)}>{worldNames[id]}</button>)}</div></div>}</>;
}
function CardMenu(){
 const location=useLocation(),navigate=useNavigate();
 return <><WorldviewNavigation/>{location.pathname!==root&&<button className="pc-show-names" onClick={()=>navigate(root)}>Show names</button>}</>;
}
function PaletteCard({index,theme,selected,onSelect}:{index:number;theme:'light'|'dark';selected:boolean;onSelect:()=>void}){
 const colors=colorsFor(index,theme);
 return <article className="pc-card ap-live-shell" id={'palette-'+(index+1)} data-palette={index+1} data-selected={selected} style={paletteStyle(index,theme)}>
  <header><div><span className="pc-number">{String(index+1).padStart(2,'0')}</span><h3>{palettes[index].name}</h3></div><button className="pc-view" aria-pressed={selected} onClick={onSelect}>{selected?'Viewing above':'View palette'}</button></header>
  <MemoryRouter initialEntries={[root]}><CardMenu/></MemoryRouter>
  <div className="pc-hexes">{worldIds.map(id=><span key={id} style={{color:colors[id]}}><i style={{background:colors[id]}}/>{worldNames[id]} <code>{colors[id]}</code></span>)}</div>
 </article>;
}
function App(){
 const params=new URLSearchParams(location.search);
 const [selected,setSelected]=useState(()=>Math.max(0,Math.min(9,(Number(params.get('p'))||1)-1)));
 const [theme,setTheme]=useState<'dark'|'light'>(params.get('theme')==='light'?'light':'dark');
 const live=useRef<HTMLDivElement>(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;const query=new URLSearchParams({p:String(selected+1),theme});history.replaceState(null,'','?'+query);},[selected,theme]);
 function select(index:number){setSelected(index);live.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 return <><header className="pc-top"><a href="/apologetics/worldviews"><img src="/favicon.svg" alt=""/>Bible Project</a><button className="pc-theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={'Switch to '+(theme==='dark'?'light':'dark')+' theme'}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}<span>{theme==='dark'?'Light':'Dark'}</span></button></header>
  <main className="pc-page"><div className="pc-intro"><p className="pc-kicker">Across beliefs / Color directions</p><h1>Ten palettes.<br/><em>Four distinct starting points.</em></h1><p>Green for Secular. Orange for Buddhism. Blue for Hinduism.<br/>Try the icons in each row, or view a palette in the full preview.</p></div>
  <div className="pc-live ap-live-shell" ref={live} style={paletteStyle(selected,theme)}><div className="pc-live-heading"><div><p className="pc-kicker">Palette {String(selected+1).padStart(2,'0')}</p><h3>{palettes[selected].name}</h3></div><nav aria-label="Choose palette" className="pc-palette-switch">{palettes.map((_,i)=><button key={i} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{i+1}</button>)}</nav></div><MemoryRouter initialEntries={[root+'/secular']}><LivePreview/></MemoryRouter></div>
  <section aria-label="Ten color palettes" className="pc-gallery">{palettes.map((_,index)=><PaletteCard key={index} index={index} theme={theme} selected={selected===index} onSelect={()=>select(index)}/>)}</section>
  </main></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
