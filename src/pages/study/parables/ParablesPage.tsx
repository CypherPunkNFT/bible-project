import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { PARABLES, PARABLE_ROOMS, PARABLE_GUIDE_URL, gospelName, passageLabel, passageUrl, type Parable } from '@/data/parables';
import { ParableArt } from './ParableArt';
import './parables.css';
import { LearningToListen } from './LearningToListen';
import { ParableSelector, ParableIcon } from './ParableSelector';
import { ParableScope } from './ParableScope';

function StudyReading({ story }: { story: Parable }) {
  const [beat, setBeat] = useState(0);
  const [account, setAccount] = useState(0);
  const room = PARABLE_ROOMS.find(r => r.id === story.room)!;
  const passage = story.passages[account];
  return <article className="pb-reading" id="parable-reading" aria-labelledby="parable-title" style={{ '--pb-tone': room.color } as CSSProperties}>
    <header className="pb-reading-head">
      <div><p className="pb-kicker">{room.short} · {passageLabel(story.passages[0])}{story.brief ? ' · Brief comparison' : ''}</p><h2 id="parable-title">{story.title}</h2><p className="pb-reading-question">{story.question}</p></div>
      <div className="pb-reading-icon"><ParableIcon room={story.room} size={48}/></div>
    </header>
    <div className="pb-context"><span className="pb-number">01</span><div><h3>Before the story begins</h3><p className="pb-audience">{story.audience}</p><p>{story.context}</p></div></div>
    <section className="pb-movement" aria-labelledby="pb-movement-title"><div className="pb-section-heading"><span className="pb-number">02</span><h3 id="pb-movement-title">Follow the turn</h3><span>Choose a moment</span></div>
      <div className="pb-beats" role="group" aria-label="Story moments">{story.beats.map(([name],i)=><button key={name} type="button" aria-pressed={beat===i} onClick={()=>setBeat(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{name}</strong></button>)}</div>
      <p className="pb-beat-copy" aria-live="polite">{story.beats[beat][1]}</p>
      <div className="pb-hinge"><span>The turning point</span><p>{story.hinge}</p></div>
    </section>
    <section className="pb-close"><div className="pb-section-heading"><span className="pb-number">03</span><h3>Read closely</h3></div><p>{story.close}</p><details><summary>A detail to handle carefully</summary><p>{story.caution}</p></details></section>
    <section className="pb-accounts"><div className="pb-section-heading"><span className="pb-number">04</span><h3>{story.passages.length>1?'The Gospel voices':'Back to the passage'}</h3></div>
      {story.passages.length>1 && <div className="pb-account-tabs" role="group" aria-label="Gospel account">{story.passages.map((v,i)=><button type="button" key={v.book} onClick={()=>setAccount(i)} aria-pressed={account===i}>{gospelName(v.book)}</button>)}</div>}
      <div aria-live="polite"><p>{passage.note}</p><Link className="pb-read-link" to={passageUrl(passage)}><BookOpen size={16} aria-hidden="true"/> Read {passageLabel(passage)} <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    </section>
    <div className="pb-reflect"><span className="pb-kicker">Carry the question with you</span><p>{story.reflect}</p><span>Read the passage again before you answer.</span></div>
    <Link className="pb-back-top" to={`${PARABLE_GUIDE_URL}&parable=${story.id}#parables-explore`}>Choose another story ↑</Link>
  </article>;
}

export default function ParablesPage() {
  const [params, setParams] = useSearchParams();
  const story = PARABLES.find(p=>p.id===params.get('parable')) ?? PARABLES.find(p=>p.id==='sons')!;
  const [room, setRoom] = useState('all');
  const [query, setQuery] = useState('');
  const visible = PARABLES.filter(p=>(room==='all'||p.room===room)&&`${p.title} ${p.aliases ?? ''} ${p.question} ${p.image} ${p.passages.map(passageLabel).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  useEffect(()=>{ document.title='The parables of Christ · Bible Project'; },[]);
  function selectStory(id: string, scroll = true) {
    const next = new URLSearchParams(params); next.set('guide','parables'); next.set('parable',id);
    setParams(next, {preventScrollReset:true});
    if(scroll) requestAnimationFrame(()=>document.getElementById('parable-reading')?.scrollIntoView({block:'start',behavior:'instant'}));
  }
  return <div className="pb-page mx-auto max-w-7xl px-4 sm:px-6">
    <nav className="pb-breadcrumb" aria-label="Study breadcrumb"><Link to="/study"><ArrowLeft size={14} aria-hidden="true"/> Study</Link><span>/</span><Link to="/study/gospels">Jesus & the Gospels</Link><span>/</span><span>Parables</span></nav>
    <header className="pb-hero"><div><p className="pb-kicker">The parables of Christ</p><h1>Ordinary things.<br/><em>Extraordinary kingdom.</em></h1><p>A seed. A coin. A road. A door.<br/>Jesus begins with a world his listeners know—and tells a story that asks them to see it again.</p><a href="#parables-explore" className="pb-start">Step inside the stories <ArrowDown size={16} aria-hidden="true"/></a></div><div className="pb-hero-scene"><ParableArt room="field" hero/><span>Listen · Notice · Turn · Respond</span></div></header>
    <div className="pb-statline"><span><b>{PARABLES.length}</b> parables & comparisons</span><span><b>{PARABLE_ROOMS.length}</b> themes to explore</span><span><b>3</b> Gospel voices</span><span>Every study opens the text <BookOpen size={16} aria-hidden="true"/></span></div>
    <section className="pb-explorer" id="parables-explore" aria-labelledby="pb-explorer-title">
      <ParableSelector value={room} onChange={id=>{setRoom(id);setQuery('');if(id!=='all'&&story.room!==id)selectStory(PARABLES.find(p=>p.room===id)!.id,false);}}/>
      <div className="pb-section-heading"><span className="pb-number">I</span><h2 id="pb-explorer-title">Stay with a story</h2><span>Setting → movement → meaning → response</span></div><div className="pb-explorer-grid">
      <aside className="pb-browser" aria-label="Choose a parable"><label className="pb-search"><Search size={17} aria-hidden="true"/><input aria-label="Find a parable" placeholder="Find a story or passage…" value={query} onChange={e=>setQuery(e.target.value)}/></label><p className="pb-result-count" role="status">{visible.length} {visible.length===1?'study':'studies'} to explore</p><div className="pb-story-list">{visible.map(p=><button key={p.id} type="button" aria-pressed={p.id===story.id} onClick={()=>selectStory(p.id)}><span className="pb-story-dot" style={{background:PARABLE_ROOMS.find(r=>r.id===p.room)!.color}}/><span><strong>{p.title}</strong><small>{passageLabel(p.passages[0])}</small></span><ArrowUpRight size={14} aria-hidden="true"/></button>)}</div>{!visible.length&&<div className="pb-empty"><p>No stories match this search.</p><button type="button" onClick={()=>{setQuery('');setRoom('all');}}>Show all {PARABLES.length} studies</button></div>}<p className="pb-scope">{room==='all'?'All categories':PARABLE_ROOMS.find(r=>r.id===room)?.intro} <a href="#parable-count">How this collection is counted ↓</a></p></aside>
      <StudyReading key={story.id} story={story}/>
    </div></section>
    <ParableScope />
    <LearningToListen />
    <footer className="pb-sources"><BookOpen size={24} strokeWidth={1.2} aria-hidden="true"/><div><h2>Where this study comes from</h2><p>Original reading notes checked against the site’s King James Version text in Matthew, Mark and Luke. The seven themes and story movements are editorial reading aids. The inventory includes short comparisons as well as longer stories; the counting note explains the scope and research sources. Passage links include the story’s setting or explanation where indicated. No historical reconstruction or scholarly consensus is implied.</p><Link to="/sources">Texts, editions & source credits <ArrowUpRight size={14} aria-hidden="true"/></Link></div><Link to="/study/gospels">Return to the Gospels ↑</Link></footer>
  </div>;
}
