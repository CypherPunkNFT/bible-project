import { StudyTrail } from "@/components/study/StudyTrail";
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import EmpireMaps from './EmpireMaps';
import RoyalComparison from './RoyalComparison';
import { LandingArt, RestorationArt } from './EmpireArt';
import { Map, Clock3, Building2, Users, Landmark, Library } from 'lucide-react';
import { PowerRelationships, DateDesk, ArchiveLives, LandDebate, ResearchTrail, EvidenceLinks, expandedSources } from './CloseStudies';
import { periods, sources, sourceById } from './evidence';
import './empires.css';
import './atlas-design.css';
import './visual-study.css';

function Citations({ids}:{ids:string[]}) {
  return <div className="ie-citations">{ids.map(id=><a key={id} href={sourceById(id).url}>{sourceById(id).title}<ArrowUpRight size={12}/></a>)}</div>;
}
const comparisons = [
  { label:'What happened?', left:'Sennacherib reports taking Judah’s fortified towns and confining Hezekiah in Jerusalem. He does not claim to have taken Jerusalem.',right:'2 Kings 18 reports captured towns and tribute. Chapters 18–19 then narrate a threat to Jerusalem and its deliverance.', finding:'There is substantial overlap about Judah’s losses and Jerusalem’s survival. Agreement on these points does not settle every detail of the campaign.' },
  { label:'What was paid?', left:'The prism lists 30 talents of gold and 800 of silver among Hezekiah’s payments.',right:'2 Kings 18:14–16 gives 30 talents of gold and 300 of silver, including metal taken from the temple.',finding:'The gold amounts agree; the silver amounts differ. Different accounting, measures or rhetorical inflation are proposed explanations, not an established solution. Do not silently harmonize the figures.' },
  { label:'Who explains victory?',left:'The king frames the outcome as submission to his power, secured with divine support.',right:'Kings frames Jerusalem’s preservation through prayer, prophecy and divine action (19:15–37).',finding:'Political chronology asks what can be dated and corroborated. Theological interpretation asks what events mean in relation to God. A shared event does not make these explanations identical.' },
];

export default function IsraelEmpiresPage() {
  const [params,setParams]=useSearchParams();
  const index=Math.max(0,periods.findIndex(p=>p.id===(params.get('period')||'siege')));
  const period=periods[index];
  const [lens,setLens]=useState<'political'|'people'>('political');
  const [showMovement,setShowMovement]=useState(true);
  const [answer,setAnswer]=useState<number|null>(null);
  const [showReading,setShowReading]=useState(false);
  const [showEvidence,setShowEvidence]=useState(false);
  const evidenceOrigin=useRef<HTMLButtonElement>(null);
  function closeEvidence(){setShowEvidence(false);requestAnimationFrame(()=>{const el=evidenceOrigin.current;if(!el)return;el.focus({preventScroll:true});const r=el.getBoundingClientRect();if(r.top<85||r.bottom>innerHeight)el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}
  useEffect(()=>{const old=document.title;document.title='Israel among the empires · Bible Project';return()=>{document.title=old;};},[]);
  function select(i:number){const next=new URLSearchParams(params);next.set('period',periods[i].id);setParams(next,{replace:true,preventScrollReset:true});}
  const x=(date:number)=>(950-date)/500*100;
  return <div className="ie-study study-frame">
    <header className="ev-landing">
      <div><StudyTrail area="history" n="07"/><p className="ie-eyebrow">c. 925–450 BCE</p><h1>Israel among<br/>the <em>empires.</em></h1><p className="ev-landing-question">Great powers wrote their victories.<br/>Communities lived the consequences.</p><p className="ev-landing-intro">The Bible’s kings, prophets and returning exiles lived in a world shaped by Egypt, Assyria, Babylon and Persia. Understanding that world helps us distinguish tribute from conquest, a capital’s survival from its people’s safety, and return from restored independence. Explore the places and surviving records—and see where the evidence ends and interpretation begins.</p><a className="ev-enter" href="#empire-atlas">Explore the historical atlas <ArrowDown size={17}/></a></div>
      <LandingArt/>
    </header>
    <nav className="ev-contents ie-study-route" aria-label="Inside this study">{[[Map,'01','empire-atlas','Power & place'],[Clock3,'02','empire-dates','Dating the evidence'],[Building2,'03','empire-siege','Two cities in 701'],[Users,'04','empire-lives','Lives after conquest'],[Landmark,'05','empire-return','Return under empire'],[Library,'06','empire-sources','Research & sources']].map(([Icon,number,id,label])=>{const Mark=Icon as typeof Map;return <a key={String(id)} href={'#'+id}><Mark size={22} strokeWidth={1.3}/><span>{String(number)}</span><strong>{String(label)}</strong><ArrowDown size={13}/></a>})}</nav>
    <section id="empire-atlas" aria-labelledby="ie-atlas-title" className="ie-atlas">
      <div className="ie-section-head"><div><p className="ie-eyebrow">01 / Follow the changing relationship</p><h2 id="ie-atlas-title">A land between <em>powers.</em></h2></div><p>Choose a window in time.<br/>Both maps and the evidence change together.</p></div>
      <div className="ie-periods" role="group" aria-label="Historical period">{periods.map((p,i)=><button key={p.id} type="button" aria-pressed={index===i} aria-controls="ie-period-content" onClick={()=>select(i)}><strong>{p.date}</strong><span>{p.short}</span></button>)}</div>
      <div className="ie-time-scale" aria-label={`Time window: ${period.date}. ${period.anchor}`} role="img"><div className="ie-time-track"><span className={`ie-time-window ${period.id==='egypt'?'ie-time-uncertain':''}`} style={{left:`${x(period.start)}%`,width:`${Math.max(.5,(period.start-period.end)/5)}%`}}/>{[950,850,750,650,550,450].map(year=><span className="ie-time-tick" key={year} style={{left:`${x(year)}%`}}><i/>{year}</span>)}</div><span className="ie-scale-label">BCE · proportional scale</span></div>
      <p className="ie-date-caption">{period.anchor}</p>
      <div id="ie-period-content">
        <p className="sr-only" role="status">Selected {period.date}: {period.title}</p>
        <EmpireMaps period={period} showMovement={showMovement}/>
        <div className="ie-map-toolbar"><div className="ie-legend"><span><i className="ie-key-force"/>Military action</span><span><i className="ie-key-tribute"/>Tribute</span><span><i className="ie-key-alliance"/>Coalition</span><span><i className="ie-key-movement"/>Displacement / return</span></div><label><input type="checkbox" checked={showMovement} onChange={e=>setShowMovement(e.target.checked)}/> Show movement arrows</label></div>
        <div className="ie-map-reading"><strong>Read the relationships</strong><ul>{period.edges.length?period.edges.map(e=><li key={e.label}>{e.label}{e.kind==='movement'&&!showMovement&&<small> · arrow hidden</small>}</li>):<li>Yehud and Judean communities in Babylonia coexist; no single migration is mapped.</li>}</ul></div>
        <div className="ie-current"><div><span className="ie-eyebrow">{period.date} <span aria-hidden="true">/</span> {period.deck}</span><h3>{period.title}</h3></div><div className="ie-step-buttons"><button type="button" onClick={()=>select(index-1)} disabled={index===0} aria-label="Previous period"><ArrowLeft size={18}/></button><span>{index+1} / {periods.length}</span><button type="button" onClick={()=>select(index+1)} disabled={index===periods.length-1} aria-label="Next period"><ArrowRight size={18}/></button></div></div>
        <div className="ie-status-pair"><div><span>Northern kingdom / Samaria</span><strong>{period.north}</strong></div><div><span>Southern kingdom / Judah</span><strong>{period.south}</strong></div></div>
        <div className="ie-evidence-action"><button ref={evidenceOrigin} type="button" aria-expanded={showEvidence} aria-controls="ie-expanded-evidence" onClick={()=>showEvidence?closeEvidence():setShowEvidence(true)}>{showEvidence?'Retract evidence ×':'Inspect the evidence ↓'}</button><span>Political reconstruction, people, passages and limits</span></div>
        <div id="ie-expanded-evidence" hidden={!showEvidence}>
        <div className="ie-evidence-grid">
          <article className="ie-narrative"><div className="ie-lenses" role="group" aria-label="Historical perspective"><button type="button" aria-pressed={lens==='political'} onClick={()=>setLens('political')}>At the level of power</button><button type="button" aria-pressed={lens==='people'} onClick={()=>setLens('people')}>At the level of people</button></div><p key={period.id+lens} className="ie-story">{period[lens]}</p><Citations ids={period.sourceIds}/></article>
          <aside className="ie-limits"><span className="ie-eyebrow">What we can—and cannot—say</span><p>{period.limit}</p><details><summary>Why these dates?</summary><p>{period.anchor}</p></details></aside>
        </div>
        <div className="ie-passages"><h4>Read alongside the evidence</h4>{period.passages.map(p=><a key={p.label} href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(p.label.replace(/–/g,'-'))}&version=NRSVUE`}><strong>{p.label}<ArrowUpRight size={13}/></strong><span>{p.note}</span></a>)}</div>
        <button type="button" className="ie-evidence-close" onClick={closeEvidence}>Close evidence ×</button>
        </div>
      </div>
    </section>
    <div className="ie-orientation"><p><strong>Two kingdoms, different histories.</strong> Israel here means the northern kingdom centred on Samaria; Judah is the southern kingdom centred on Jerusalem. Later, Yehud is the provincial name associated with Judah.</p><a href="#empire-method">How to read the maps <ArrowDown size={14}/></a></div>


    <PowerRelationships onSelect={id=>{const i=periods.findIndex(p=>p.id===id);if(i>=0)select(i);document.getElementById('empire-atlas')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}/>

    <section className="ie-method" id="empire-method"><div><p className="ie-eyebrow">A map is an argument</p><h2>Keep the edges<br/><em>honest.</em></h2></div><div><p>These are maps of relationships, not territorial reconstructions. A tribute payment does not prove annexation; a captured town does not define a stable frontier. No ancient political border is drawn.</p><p>The physical base uses modern, generalized coastlines from <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth (public domain)</a>. Place positions are approximate. Arrows show connections, not roads, troop counts or exact deportation routes. The regional box locates the closer view approximately.</p><p>The timeline uses BCE: numbers decrease as time moves forward. Windows may overlap. A range can describe several events, an extended condition or uncertainty; each period explains which.</p></div></section>

    <DateDesk/>
    <RoyalComparison accounts={comparisons}/>

    <ArchiveLives/>
    <LandDebate/>
    <section id="empire-return" className="ie-test" aria-labelledby="ie-test-title"><div><p className="ie-eyebrow">05 / Return under imperial authority</p><h2 id="ie-test-title">Cyrus restores cults.<br/><em>What follows?</em></h2><RestorationArt/><p>The cylinder describes restoration in a Babylonian royal idiom after Cyrus’s conquest. Ezra attributes Jerusalem’s rebuilding to his authorization. How far does the comparison take us?</p><Citations ids={['cyrus']}/><p className="ie-return-context">Restoration was a way to claim legitimate rule. R. J. van der Spek places Cyrus’s actions beside older royal practices; the contrast between empires is more complicated than cruelty followed by tolerance. The cylinder is not a modern charter of universal rights.</p><EvidenceLinks ids={['cyrus-comparison']}/><a className="ie-close-passage" href="https://www.biblegateway.com/passage/?search=Ezra+1%3A1-4%3BEzra+6%3A1-15%3BIsaiah+45%3A1-7&version=NRSVUE">Compare Ezra 1; Ezra 6; Isaiah 45:1–7 ↗</a></div><div><fieldset><legend>Which conclusion is warranted?</legend>{['The cylinder independently records the Jerusalem decree in Ezra.','It supplies comparative context; Ezra is the source here for Jerusalem’s authorization.','Every deported Judean returned home in 539 BCE.'].map((a,i)=><label key={a} className={answer===i?'ie-answer-selected':''}><input type="radio" name="cyrus-inference" value={i} checked={answer===i} onChange={()=>setAnswer(i)}/><span>{a}</span></label>)}</fieldset>{answer!==null&&<div className="ie-answer" role="status"><strong>{answer===1?'That keeps the sources distinct.':'That goes further than the evidence.'}</strong><p>{answer===0?'The cylinder does not name Judah or Jerusalem. Similar restoration language cannot turn it into Ezra’s decree.':answer===2?'539 dates the conquest of Babylon. Administrative records document enduring Judean life in Babylonia, and return cannot be reduced to a single universal departure.':'The texts use different divine and political frames. A parallel policy claim is useful context, but is not direct attestation of every act attributed to Cyrus.'}</p><a href="https://www.biblegateway.com/passage/?search=Ezra+1%3A1-4&version=NRSVUE">Read Ezra 1:1–4 ↗</a>{answer===2&&<Citations ids={['alstola']}/>}</div>}</div></section>

    <section className="ie-sources" id="empire-sources"><div className="ie-section-head"><div><p className="ie-eyebrow">06 / Follow the scholarship</p><h2>Behind the map,<br/><em>a record you can inspect.</em></h2></div><button type="button" className="ie-reading-toggle" aria-expanded={showReading} aria-controls="ie-source-register" onClick={()=>setShowReading(!showReading)}>{showReading?'Close':'Open'} the source register <span aria-hidden="true">{showReading?'−':'+'}</span></button></div><ResearchTrail/><div id="ie-source-register" hidden={!showReading}>{[...sources,...expandedSources].map(s=><article key={s.id}><span>{s.kind}</span><a href={s.url}>{s.title}<ArrowUpRight size={14}/></a><p>{s.scope}</p><small>Consultation: {s.read}</small></article>)}</div><p className="ie-footnote">Research expanded 14 October 2026. Some museum catalogue text was available through indexed records while direct requests were blocked. No object images are reproduced. Maps are original explanatory diagrams using public-domain physical geography; they are not ancient maps.</p></section>
    <footer className="ie-end"><p>A change of empire is a date.<br/><em>Living through it is a history.</em></p><Link to="/study/academic?area=history">History & archaeology <ArrowRight size={17}/></Link></footer>
  </div>;
}
