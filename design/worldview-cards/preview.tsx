import {useEffect,useState,type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,Pause,Play} from 'lucide-react';
import {Layout} from '@/components/Layout';
import {ApologeticsNavigationHeader} from '@/components/apologetics/ApologeticsNavigationHeader';
import {WORLDVIEWS} from '@/generated/apologetics';
import {WideArtwork} from './art';
import {ScienceArtwork} from './science';
import '@/pages/apologetics.css';
import '@/pages/worldviews.css';
import '@/components/apologetics/worldview-colors.css';
import '@/components/apologetics/navigation.css';
import './preview.css';

const identities={
 islam:{accent:'var(--poetry)',theme:'Jesus · God · the cross'},
 secular:{accent:'var(--worldview-secular)',theme:'Reason · morality · meaning'},
 buddhism:{accent:'var(--worldview-buddhism)',theme:'Suffering · Eightfold Path · release'},
 hinduism:{accent:'var(--worldview-hinduism)',theme:'Self · action · refuge'},
};
const islamSets=['Prayer & light','Reading & craft','Books & instruments'];
const scienceSets=['The laboratory','Balanced pairs','Instruments & observation'];

function VariantButtons({world,value,onChange}:{world:'islam'|'secular';value:number;onChange:(value:number)=>void}){
 const label=world==='islam'?'Islam':'Secular';
 return <div className="wc-variant-buttons" role="group" aria-label={`${label} artwork variants`}>
  {(world==='islam'?islamSets:scienceSets).map((name,index)=><button key={name} type="button" aria-pressed={value===index} aria-label={`${label} artwork ${index+1}: ${name}`} title={name} onClick={()=>onChange(index)}>{index+1}</button>)}
 </div>;
}

function App(){
 const locationState=useLocation();
 const [paused,setPaused]=useState(false),[islamVersion,setIslamVersion]=useState(0),[scienceVersion,setScienceVersion]=useState(0);
 useEffect(()=>{
  // Reused site navigation opens the corresponding real page.
  if(locationState.pathname!=='/apologetics/worldviews') window.location.assign(locationState.pathname+locationState.search+locationState.hash);
 },[locationState]);
 return <Layout><div className={'am-shell ap-live-shell wc-cards-page'+(paused?' wc-paused':'')}>
  <ApologeticsNavigationHeader/>
  <div className="am-layout"><div className="ap-page am-content"><div className="wv-page">
   <header className="wv-index-head">
    <div><p className="ap-eyebrow">Across beliefs / Four starting points</p><h1>Understand deeply.<br/><em>Witness clearly.</em></h1></div>
    <p>Start with a person, not a label.<br/>Explore the questions that matter, with each tradition’s own texts open beside Scripture.</p>
   </header>
   <div className="wv-collections" id="collections">
    {WORLDVIEWS.map((item,index)=>{
     const world=item.id as keyof typeof identities;
     const href='/apologetics/worldviews/'+world;
     return <article className="wv-collection" id={world} key={world} style={{'--wv-accent':identities[world].accent} as CSSProperties}>
      <div className="wv-collection-meta"><span>0{index+1} / A conversation in context</span><a href={href} aria-label={`Open ${item.title}`}><ArrowUpRight size={20}/></a></div>
      <div className="wc-art-stage">
       {world==='islam'||world==='secular'?[0,1,2].map(version=><div key={version} className="wc-art-layer" data-active={(world==='islam'?islamVersion:scienceVersion)===version} data-variant={version+1}>{world==='islam'?<WideArtwork world="islam" islamVersion={version}/>:<ScienceArtwork version={version}/>}</div>):<WideArtwork world={world}/>}
      </div>
      <div className="wv-collection-copy">
       <p className="ap-eyebrow">{identities[world].theme}</p><h2><a href={href}>{item.title}</a></h2><p>{item.description}</p>
       <div className="wv-collection-foot"><span>{item.rows.length} questions · {item.studies.length} connected studies</span>
        {world==='islam'?<VariantButtons world={world} value={islamVersion} onChange={setIslamVersion}/>:world==='secular'?<VariantButtons world={world} value={scienceVersion} onChange={setScienceVersion}/>:<a href={href}><strong>Enter the collection <ArrowRight size={16}/></strong></a>}
       </div>
      </div>
     </article>;
    })}
   </div>
   <div className="wc-art-controls" aria-label="Artwork controls">
    <button className="wc-motion-control" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>} {paused?'Play motion':'Pause motion'}</button>
    <a href="/mockups/worldview-compositions/">Artwork collection <ArrowUpRight size={13}/></a>
   </div>
   <div className="wv-method"><span>Before the comparison</span><p>These are focused introductions. Ask which texts, teachers and interpretations your neighbour trusts. Read in context. Let the person tell you what they believe.</p><a href="/apologetics/sources">How we use sources <ArrowUpRight size={14}/></a></div>
  </div></div></div>
 </div></Layout>;
}
const requestedTheme=new URLSearchParams(window.location.search).get('theme');
if(requestedTheme==='dark'||requestedTheme==='light') localStorage.setItem('bp-theme',requestedTheme);
else if(!localStorage.getItem('bp-theme')) localStorage.setItem('bp-theme','dark');
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/apologetics/worldviews']}><App/></MemoryRouter>);
