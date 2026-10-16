import { useEffect, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { PARABLES, PARABLE_FORMS, PARABLE_ROOMS, passageLabel, passageUrl, type Parable } from '@/data/parables';
import { ParableArt } from './ParableArt';
import './parables.css';
import './typography.css';
import { LearningToListen } from './LearningToListen';
import { ParableSelector, ParableIcon } from './ParableSelector';
import { ParableScope } from './ParableScope';
import { PARABLE_DEEP_READINGS } from '@/data/parables-deep-reading';
import { searchParables, findSearchPassage } from './search';
import { PARABLE_PAGE_COPY as copy } from '@/data/parables-page-copy';

const accountKey = (passage: Parable['passages'][number]) => `${passage.book}-${passage.chapter}-${passage.start}-${passage.end}`;

function StudyReading({ story, beat, account, setBeat, setAccount, chooseAnother }: {
  story: Parable; beat: number; account: number;
  setBeat: (value: number) => void; setAccount: (value: number) => void; chooseAnother: () => void;
}) {
  const room = PARABLE_ROOMS.find(r => r.id === story.room)!;
  const passage = story.passages[account];
  return <article className="pb-reading" id="parable-reading" aria-labelledby="parable-title" style={{ '--pb-tone': room.color } as CSSProperties}>
    <header className="pb-reading-head">
      <div><p className="pb-kicker">{room.short} · {passageLabel(passage)} · {PARABLE_FORMS[story.form]}</p><h2 id="parable-title" tabIndex={-1}>{story.title}</h2><p className="pb-reading-question">{story.question}</p></div>
      <div className="pb-reading-icon"><ParableIcon room={story.room} size={48}/></div>
    </header>
    <div className="pb-begin"><span>{copy.readFirst}</span><Link className="pb-open-passage" to={passageUrl(passage)}><BookOpen size={18} aria-hidden="true"/> Read {passageLabel(passage)} <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    <div className="pb-context"><span className="pb-number">01</span><div><h3>{story.form==='narrative'?'Before the story begins':'The setting of the teaching'}</h3><p className="pb-audience">{story.audience}</p><p>{story.context}</p></div></div>
    <section className="pb-movement" aria-labelledby="pb-movement-title"><div className="pb-section-heading"><span className="pb-number">02</span><h3 id="pb-movement-title">{story.form==='narrative'?'Follow the turn':'Look closely at the image'}</h3><span>{story.form==='narrative'?'Choose a moment':'Choose a detail'}</span></div>
      <div className="pb-beats" role="group" aria-label="Story moments">{story.beats.map(([name],i)=><button key={name} type="button" aria-pressed={beat===i} onClick={()=>setBeat(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{name}</strong></button>)}</div>
      <p className="pb-beat-copy" aria-live="polite">{story.beats[beat][1]}</p>
      <div className="pb-hinge"><span>{story.form==='narrative'?'The turning point':story.form==='comparison'?'The point of comparison':'The central emphasis'}</span><p>{story.hinge}</p></div>
    </section>
    <section className="pb-close"><div className="pb-section-heading"><span className="pb-number">03</span><h3>Read closely</h3></div><p>{story.close}</p>
      {PARABLE_DEEP_READINGS[story.id]?.map(note=><div className="pb-deep-reading" key={note.title}><h4>{note.title}</h4><p>{note.text}</p><ul className="pb-reading-sources" aria-label={`Sources for ${note.title}`}>{note.sources.map(source=><li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={12} aria-hidden="true"/></a></li>)}</ul></div>)}
      <details><summary>A detail to handle carefully</summary><p>{story.caution}</p></details></section>
    <section className="pb-accounts"><div className="pb-section-heading"><span className="pb-number">04</span><h3>{story.passages.length>1?'The Gospel voices':'Back to the passage'}</h3></div>
      {story.passages.length>1 && <><p className="pb-account-help">{copy.accountHelp}</p><div className="pb-account-tabs" role="group" aria-label="Gospel passage">{story.passages.map((v,i)=><button type="button" key={passageUrl(v)} onClick={()=>setAccount(i)} aria-pressed={account===i} aria-controls="pb-account-note">{passageLabel(v)}</button>)}</div></>}
      <div id="pb-account-note" aria-live="polite" aria-atomic="true"><h4 className="pb-account-title">{passageLabel(passage)}</h4><p>{passage.note}</p><Link className="pb-read-link" to={passageUrl(passage)}><BookOpen size={16} aria-hidden="true"/> Read {passageLabel(passage)} <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    </section>
    <div className="pb-reflect"><span className="pb-kicker">Carry the question with you</span><p>{story.reflect}</p><span>Read the passage again before you answer.</span></div>
    <button type="button" className="pb-back-top" onClick={chooseAnother}>Choose another study ↑</button>
  </article>;
}

export default function ParablesPage() {
  const [params, setParams] = useSearchParams();
  const story = PARABLES.find(p=>p.id===params.get('parable')) ?? PARABLES.find(p=>p.id==='sons')!;
  const room = PARABLE_ROOMS.some(r=>r.id===params.get('theme')) ? params.get('theme')! : 'all';
  const query = params.get('q') ?? '';
  const account = Math.max(0,story.passages.findIndex(p=>accountKey(p)===params.get('passage')));
  const requestedBeat = Number(params.get('moment') ?? 0);
  const beat = Number.isInteger(requestedBeat) && requestedBeat>=0 && requestedBeat<story.beats.length ? requestedBeat : 0;
  function updateLocation(changes: Record<string,string|null>, replace = false) {
    const next = new URLSearchParams(params);
    next.set('guide','parables');
    for(const [key,value] of Object.entries(changes)) {
      if(value===null || value==='') next.delete(key); else next.set(key,value);
    }
    setParams(next,{preventScrollReset:true,replace});
  }
  function chooseCategory(id: string) {
    const newStory = id!=='all' && story.room!==id ? PARABLES.find(p=>p.room===id)! : story;
    updateLocation({theme:id==='all'?null:id,q:null,parable:newStory.id,...(newStory.id!==story.id?{passage:null,moment:null}:{})});
  }
  function chooseAnother() {
    document.getElementById('pb-find-story')?.focus({preventScroll:true});
    document.getElementById('pb-story-browser')?.scrollIntoView({block:'start',behavior:'instant'});
  }
  const matches = searchParables(query);
  const visible = matches.filter(p=>room==='all'||p.room===room);
  const outsideCount = matches.length-visible.length;
  useEffect(()=>{ document.title='The parables of Christ · Bible Project'; },[]);
  function selectStory(id: string, scroll = true) {
    const matchedPassage = findSearchPassage(PARABLES.find(p=>p.id===id)!,query);
    updateLocation({parable:id,passage:matchedPassage?accountKey(matchedPassage):null,moment:null});
    if(scroll) requestAnimationFrame(()=>{
      document.getElementById('parable-title')?.focus({preventScroll:true});
      document.getElementById('parable-reading')?.scrollIntoView({block:'start',behavior:'instant'});
    });
  }
  return <div className="pb-page mx-auto max-w-7xl px-4 sm:px-6">
    <nav className="pb-breadcrumb" aria-label="Study breadcrumb"><Link to="/study"><ArrowLeft size={14} aria-hidden="true"/> Study</Link><span>/</span><Link to="/study/gospels">Jesus & the Gospels</Link><span>/</span><span>Parables</span></nav>
    <header className="pb-hero"><div><p className="pb-kicker">The parables of Christ</p><h1>Ordinary things.<br/><em>Extraordinary kingdom.</em></h1><p>A seed. A coin. A road. A door.<br/>Jesus begins with a world his listeners know—and tells a story that asks them to see it again.</p><a href="#parables-explore" className="pb-start">Step inside the stories <ArrowDown size={16} aria-hidden="true"/></a></div><div className="pb-hero-scene"><ParableArt room="field" hero/><span>Listen · Notice · Turn · Respond</span></div></header>
    <p className="pb-invitation">{copy.invitation} <a href="#pb-method-title">How to read a parable</a></p>
    <div className="pb-statline"><span><b>{PARABLES.length}</b> parables & comparisons</span><span><b>{PARABLE_ROOMS.length}</b> themes to explore</span><span><b>3</b> Gospel voices</span><span>Every study opens the text <BookOpen size={16} aria-hidden="true"/></span></div>
    <section className="pb-explorer" id="parables-explore" aria-labelledby="pb-explorer-title">
      <ParableSelector value={room} onChange={chooseCategory}/>
      <div className="pb-section-heading"><span className="pb-number">I</span><h2 id="pb-explorer-title">Stay with a story</h2><span>Setting → movement → meaning → response</span></div><div className="pb-explorer-grid">
      <aside id="pb-story-browser" className="pb-browser" aria-label="Choose a parable"><label className="pb-search"><Search size={17} aria-hidden="true"/><input id="pb-find-story" aria-label="Find a parable" placeholder="Story, theme or Bible reference…" aria-describedby="pb-search-help" value={query} onChange={e=>updateLocation({q:e.target.value},true)}/></label><p id="pb-search-help" className="pb-search-help">Try prodigal son or Matt 13:18.</p>{query && <button type="button" className="pb-search-clear" onClick={()=>{updateLocation({q:null},true);document.getElementById('pb-find-story')?.focus();}}>Clear search</button>}<p className="pb-result-count" role="status">{visible.length} {visible.length===1?'study':'studies'} {room==='all'?'across all categories':`in ${PARABLE_ROOMS.find(r=>r.id===room)?.title}`}</p><div className="pb-story-list">{visible.map(p=><button key={p.id} type="button" aria-pressed={p.id===story.id} onClick={()=>selectStory(p.id)}><span className="pb-story-dot" style={{background:PARABLE_ROOMS.find(r=>r.id===p.room)!.color}}/><span><strong>{p.title}</strong><small>{passageLabel(findSearchPassage(p,query) ?? p.passages[0])}</small></span><ArrowUpRight size={14} aria-hidden="true"/></button>)}</div>{!visible.length&&<div className="pb-empty"><p>{room==='all'?'No studies match this search.':'No studies match in this category.'}</p><button type="button" onClick={()=>updateLocation({q:null,theme:null})}>Show all {PARABLES.length} studies</button></div>}{room!=='all' && query.trim() && outsideCount>0 && <button type="button" className="pb-search-widen" onClick={()=>updateLocation({theme:null})}>Search all categories ({matches.length})</button>}<p className="pb-scope">{room==='all'?'All categories':PARABLE_ROOMS.find(r=>r.id===room)?.intro} <a href="#parable-count">How this collection is counted ↓</a></p></aside>
      <StudyReading key={story.id} story={story} beat={beat} account={account} setBeat={value=>updateLocation({moment:String(value)})} setAccount={value=>updateLocation({passage:accountKey(story.passages[value])})} chooseAnother={chooseAnother}/>
    </div></section>
    <LearningToListen />
    <ParableScope />
    <footer className="pb-sources"><BookOpen size={24} strokeWidth={1.2} aria-hidden="true"/><div><h2>Where this study comes from</h2><p>{copy.sourceText}</p><p>{copy.sourceInterpretation}</p><Link to="/sources">Texts, editions & source credits <ArrowUpRight size={14} aria-hidden="true"/></Link></div><Link to="/study/gospels">Return to the Gospels ↑</Link></footer>
  </div>;
}
