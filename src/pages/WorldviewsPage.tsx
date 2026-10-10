import {WorldviewCardArt} from '@/components/apologetics/WorldviewCardArt';
import {WorldviewHeroArt} from '@/components/apologetics/WorldviewHeroArt';
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, Compass, Cross, HeartHandshake, Network, Pause, Play, ScrollText, Sprout, Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { WORLDVIEWS, sourceById, studyById, studyMinutes } from '@/data/apologetics-library';
import { ApBack, ApCitations, ApNote, ApSectionHeading } from '@/components/ApologeticsParts';
import { AP_BASE as base, studyUrl } from '@/lib/apologetics-links';
import type { ApNotebook } from '@/lib/apologetics-notebook';
import MuslimWorldExplorer from '@/components/apologetics/MuslimWorldExplorer';
import BasisReader from '@/components/apologetics/BasisReader';
import './worldviews.css';
import './islam-guide.css';
import '@/components/apologetics/worldview-card-art/cards.css';

const identities: Record<string, { accent: string; theme: string; name: string }> = {
  islam: { accent: 'var(--poetry)', theme: 'Jesus · God · the cross', name: 'Islam' },
  secular: { accent: 'var(--worldview-secular)', theme: 'Reason · morality · meaning', name: 'Secular thought' },
  buddhism: { accent: 'var(--worldview-buddhism)', theme: 'Suffering · Eightfold Path · release', name: 'Buddhism' },
  hinduism: { accent: 'var(--worldview-hinduism)', theme: 'Self · action · refuge', name: 'Hinduism' },
};
// Compact illustration used by the Islam guide and earlier design previews.
function CollectionArt({ id }: { id: string }) {
  if (id !== 'islam') return <WorldviewHeroArt id={id} card />;
  return <svg className={'wv-art wv-art-' + id} viewBox="0 0 420 290" fill="none" aria-hidden="true">
    <circle className="wv-orbit-dots" cx="210" cy="138" r="110" strokeDasharray="1 9" opacity=".4" />
    <path d="M115 239V121a95 95 0 0 1 190 0v118M135 239V121a75 75 0 0 1 150 0v118M155 239V126q0-43 55-74 55 31 55 74v113" />
    <path d="M155 214q27-12 55 0 28-12 55 0v-54q-28-12-55 0-28-12-55 0ZM210 160v54M166 177q18-5 33 0m-33 12q18-5 33 0m21-12q18-5 33 0m-33 12q18-5 33 0M85 239h250" />
    <circle cx="210" cy="120" r="14" /><path d="m210 102 0 36m-18-18h36M96 153H77m246 0h20" />
  </svg>;
}
function IslamHeroArt() {
  return <svg className="wv-hero-illustration wv-islam-illustration" viewBox="0 0 540 400" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="270" cy="350" rx="155" ry="13" opacity=".24" /><circle className="wv-orbit-dots" cx="270" cy="190" r="132" strokeDasharray="1 8" opacity=".42" /><circle cx="270" cy="190" r="115" opacity=".18" />
    <path d="M174 320V173a96 96 0 0 1 192 0v147M194 320V173a76 76 0 0 1 152 0v147M214 320V183q0-43 56-79 56 36 56 79v137" />
    <path d="M214 288v-60q28-13 56 0 28-13 56 0v60q-28-13-56 0-28-13-56 0ZM270 228v60m-43-41q16-5 30 0m-30 12q16-5 30 0m26-12q16-5 30 0m-30 12q16-5 30 0M151 320h238m-212 8h186" />
    <circle cx="270" cy="182" r="17" /><path d="M270 158v48m-24-24h48" opacity=".8" />
    <g opacity=".82"><circle cx="106" cy="122" r="32" /><ellipse cx="106" cy="122" rx="13" ry="32" /><path d="M74 122h64m-57-17h50m-50 34h50m-25 15v13m-23 0h46" /><path d="M148 122h12m-20 26 19 18" strokeDasharray="3 5" /></g>
    <g className="wv-scroll-artifact" transform="translate(390 146) rotate(10 28 42)" opacity=".88">
      <path d="M8 18v56q0 10 10 10M50 18v48" />
      <path d="M8 0h42a6 9 0 0 1 0 18H8a6 9 0 0 1 0-18ZM18 66h32a6 9 0 0 1 0 18H18a6 9 0 0 1 0-18Z" />
      <ellipse cx="50" cy="9" rx="6" ry="9" /><ellipse cx="50" cy="75" rx="6" ry="9" />
      <path d="M18 32h22m-22 10h22m-22 10h15" />
    </g>
    <g className="wv-quill-artifact" opacity=".82">
      <path d="M95 299C83 269 105 219 138 202C136 237 122 272 95 299ZM89 310l44-97M104 276l-9-9m18-10-11-6m20-12-10-5m-9 36 12-6m-3-13 10-4" />
      <path d="M74 310q17-7 35 0v14q-17 6-35 0ZM80 304h23v6M81 317h21" />
      <path d="M145 256h14" strokeDasharray="3 5" opacity=".5" />
    </g>
    <g className="wv-book-artifact" opacity=".82" transform="translate(386 276) rotate(-16 25 28)">
      <path d="M0 0h50v56H0ZM7 0v56M7 56v5h48V5h-5M12 59h37" />
      <path d="M31 0v15l5-4 5 4V0M15 25h26m-26 10h26m-26 10h19" />
    </g>
    <g opacity=".62"><path d="m270 32 8 13-8 13-8-13Zm0-10v8m0 29v8m-23-22h12m22 0h12M380 85l6 6-6 6-6-6ZM71 210l5 8-5 8-5-8ZM442 98v16m-8-8h16M159 53v10m-5-5h10M456 278v12m-6-6h12M170 350h12m176 0h12" /><circle cx="397" cy="128" r="3" /><circle cx="148" cy="205" r="3" /><circle cx="332" cy="47" r="2" /></g>
    <path d="M192 63q-24 11-38 30m230 176 17 5m-270 54 18 7" strokeDasharray="2 6" opacity=".42" />
  </svg>;
}
function identity(id: string) { return identities[id] ?? { accent: 'var(--epistles)', theme: 'Texts · questions · conversation', name: id }; }
export function WorldviewIndex() {
  const [paused,setPaused]=useState(false);
  return <div className={'wv-page wc-cards-page'+(paused?' wc-paused':'')}>
    <ApBack />
    <header className="wv-index-head"><div><p className="ap-eyebrow">Across beliefs / Four starting points</p><h1>Understand deeply.<br /><em>Witness clearly.</em></h1></div><p>Start with a person, not a label.<br />Explore the questions that matter, with each tradition’s own texts open beside Scripture.</p></header>
    <div className="wv-collections">{WORLDVIEWS.map((item,index)=><Link className="wv-collection" key={item.id} to={base+'/worldviews/'+item.id} style={{'--wv-accent':identity(item.id).accent} as React.CSSProperties}>
      <div className="wv-collection-meta"><span>0{index+1} / A conversation in context</span><ArrowUpRight size={20}/></div>
      <WorldviewCardArt id={item.id}/>
      <div className="wv-collection-copy"><p className="ap-eyebrow">{identity(item.id).theme}</p><h2>{item.title}</h2><p>{item.description}</p>
        <div className="wv-collection-foot"><span>{item.rows.length} questions · {item.studies.length} connected studies</span><strong>Enter the collection <ArrowRight size={16}/></strong></div>
      </div>
    </Link>)}</div>
    <div className="wc-art-controls"><button type="button" className="wc-motion-control" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>} {paused?'Play motion':'Pause motion'}</button></div>
    <div className="wv-method"><span>Before the comparison</span><p>These are focused introductions. Ask which texts, teachers and interpretations your neighbour trusts. Read in context. Let the person tell you what they believe.</p><Link to={base+'/sources'}>How we use sources <ArrowUpRight size={14}/></Link></div>
  </div>;
}
export function WorldviewPage({ book }: { book: ApNotebook }) {
  const { id = '' } = useParams();
  const item = WORLDVIEWS.find((worldview) => worldview.id === id);
  if (!item) return <div className="ap-empty"><h1>Collection not found.</h1><Link to={base + '/worldviews'}>Explore worldviews</Link></div>;
  return <Collection key={id} item={item} book={book} />;
}
function IslamGuideDoors(){return <div className="concept-two-paths wv-islam-paths"><Link to="/apologetics/worldviews/islam/guide/understanding" className="concept-door"><div className="concept-door-top"><p className="ap-eyebrow">01 / Understand the tradition</p><ArrowUpRight size={20}/></div><div className="concept-door-main"><div><h2>Understanding<br/><em>Islam.</em></h2><p>Beliefs, texts, worship and history. Begin with the sources and make room for the differences within a living tradition.</p></div><CollectionArt id="islam"/></div><div className="concept-door-topics"><span>Beliefs & worship</span><span>Texts & authority</span><span>History & diversity</span></div><span className="concept-door-foot">Find your bearings <ArrowRight size={18}/></span></Link><Link to="/apologetics/worldviews/islam/guide/ministry" className="concept-door"><div className="concept-door-top"><p className="ap-eyebrow">02 / Carry the conversation</p><ArrowUpRight size={20}/></div><div className="concept-door-main"><div><h2>Ministering to<br/><em>Muslim friends.</em></h2><p>Listen well, explain Christian faith clearly, and read together. Follow the questions with conviction, patience and care.</p></div><StudyArtwork kind={5}/></div><div className="concept-door-topics"><span>Friendship & witness</span><span>Christian faith & questions</span><span>Reading together</span></div><span className="concept-door-foot">Prepare for a conversation <ArrowRight size={18}/></span></Link></div>;}
function Collection({ item, book }: { item: typeof WORLDVIEWS[number]; book: ApNotebook }) {
  const [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState(false);
  const requested = params.get('question');
  const exact = item.rows.findIndex((row) => row.id === requested);
  const selected = Math.max(0, exact >= 0 ? exact : item.rows.findIndex((row) => row.study === requested));
  const row = item.rows[selected], theme = identity(item.id);
  const choose = (index: number) => { const next = new URLSearchParams(params); next.set('question', item.rows[index].id); setParams(next, { replace: true, preventScrollReset: true }); };
  return <div className="wv-page" style={{ '--wv-accent': theme.accent } as React.CSSProperties}><ApBack to={base + '/worldviews'}>All worldviews</ApBack><header className={'wv-hero wv-collection-hero' + (item.id === 'islam' ? ' wv-islam-hero' : '')}><div><p className="ap-eyebrow">Across beliefs / {theme.theme}</p><h1>{item.title.split(' & ')[0]}<br /><em> & {item.title.split(' & ')[1] ?? theme.name}</em></h1><p>{item.description}</p>{item.id === 'islam' ? <nav className="wv-hero-steps" aria-label="Collection sections"><a href="#comparison"><span>01</span>Examine the claims</a><a href="#reading-sources"><span>02</span>Follow the sources</a><a href="#conversation-studies"><span>03</span>Carry the conversation</a></nav> : <a className="wv-start" href="#comparison">Begin with a question <ArrowRight size={17} /></a>}</div><div className="wv-hero-art">{item.id === 'islam' ? <IslamHeroArt /> : <WorldviewHeroArt id={item.id} />}<span>Open texts. Honest questions.</span></div></header>{item.id === 'islam' && <IslamGuideDoors/>}{item.id !== 'islam' && <div className="wv-reading-bar"><span><strong>01</strong> Examine the claims</span><span><strong>02</strong> Follow the sources</span><span><strong>03</strong> Carry the conversation</span></div>}
    {item.id === 'islam' ? <IslamClaimsDesk item={item} selected={selected} choose={choose} /> : <section id="comparison" className={'wv-desk' + (item.id === 'islam' ? ' wv-islam-desk' : '')}>
      <div className="wv-section-title"><p className="ap-eyebrow">01 / Begin with the claims</p><h2>{item.subtitle}</h2><p>{item.id === 'islam' ? 'Choose a question. Examine the Christian truth and the Islamic perspective, each with its own explanation and sources.' : 'Choose a question. Read both starting points. Then follow the study.'}</p></div>
      <div className="wv-desk-layout">
        <nav className="wv-question-nav" aria-label="Comparison questions">{item.rows.map((entry, i) => <button key={entry.id} type="button" aria-pressed={selected === i} aria-controls="wv-comparison-content" onClick={() => choose(i)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{entry.question}</strong>{item.id !== 'islam' && <ArrowRight size={16} />}</button>)}</nav>
        <div id="wv-comparison-content" className="wv-comparison-content">
          <div className="wv-current-question"><span>Question {String(selected + 1).padStart(2, '0')} / {String(item.rows.length).padStart(2, '0')}</span><h3>{row.question}</h3></div>
          <div className="wv-positions">
            <article className="wv-truth" aria-label={item.id === 'islam' ? 'Christian truth' : 'Christian starting point'}><h4 className="ap-eyebrow"><BookOpen size={16} />{item.id === 'islam' ? 'Christian truth' : 'Christian starting point'}</h4><div className="wv-position-copy">{row.christian.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><ApCitations citations={row.christianBasis} label="Scripture & Christian witness" /></article>
            <article className="wv-perspective" aria-label={item.otherLabel}><h4 className="ap-eyebrow"><BookOpen size={16} />{item.otherLabel}</h4><div className="wv-position-copy">{row.other.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><ApCitations citations={row.otherBasis} label="Primary sources" /></article>
          </div>
          <Link className="wv-study-link" state={{ worldviewReturn: { id: item.id, question: row.id } }} to={studyUrl(row.study)}><div><span>Continue with a connected study</span><strong>{studyById(row.study)!.title}</strong></div><ArrowUpRight size={23} /></Link>
        </div>
      </div>
    </section>}
    {item.id === 'islam' && <MuslimWorldExplorer />}
    <ContextSources item={item} />
    <section id="conversation-studies" className="wv-next"><ApSectionHeading eyebrow="03 / Carry the conversation" title="Make the comparison a study." /><div className="wv-study-cards">{item.studies.map((id, i) => <IllustratedStudy key={id} id={id} index={i} book={book} origin={{ id: item.id, question: row.id }} />)}</div><div className="wv-conversation"><div><p className="ap-eyebrow">Listen before you answer</p><h3>What would you want to ask next?</h3><p>Start with the selected question: {row.question} Ask how your neighbour understands it before offering your answer.</p><button type="button" onClick={() => setNotes(!notes)} aria-expanded={notes}>{notes ? 'Close reflection' : 'Write a reflection'} <ArrowRight size={15} /></button></div>{item.id === 'islam' ? <Link className="wv-guided" to={base + '/paths/muslim-neighbour'}><RouteIcon size={24} /><span><strong>A route through the questions</strong>Follow the Muslim neighbour learning path.</span><ArrowRight size={18} /></Link> : <Link className="wv-guided" to={base + '/practice'}><RouteIcon size={24} /><span><strong>From study to conversation</strong>Practise listening and explaining your faith.</span><ArrowRight size={18} /></Link>}</div>{notes && <ApNote id={'worldview-' + item.id} prompt="Which claim or passage would you examine with your neighbour?" book={book} />}</section>
  </div>;
}

const claimFamilies = [
  { title: 'God & identity', icon: Network, ids: ['comparison-2', 'sonship', 'created-jesus'] },
  { title: 'Jesus & the cross', icon: Cross, ids: ['comparison-1', 'comparison-3'] },
  { title: 'Sin & salvation', icon: Sprout, ids: ['sin', 'forgiveness', 'salvation'] },
  { title: 'Revelation & authority', icon: ScrollText, ids: ['revelation', 'muhammad', 'scripture', 'preservation'] },
];
function ClaimsDiagram() {
  return <svg className="wv-claims-diagram" viewBox="0 0 460 190" fill="none" aria-hidden="true">
    <circle cx="202" cy="88" r="76" /><circle cx="258" cy="88" r="76" />
    <g className="wv-claims-book"><path d="M198 118V62q16-9 32 0 16-9 32 0v56q-16-9-32 0-16-9-32 0ZM230 62v56M207 78h15m-15 11h15m16-11h15m-15 11h15" /></g>
    <g opacity=".65"><path d="M94 88h32m208 0h36M154 167h152M230 2v8m-15 14-7-7m45 7 7-7" /><circle cx="94" cy="88" r="3" /><circle cx="370" cy="88" r="3" /></g>
    <g className="wv-scroll-artifact" transform="translate(35 47) scale(.62) rotate(-8 28 42)" opacity=".8">
      <path d="M8 18v56q0 10 10 10M50 18v48M8 0h42a6 9 0 0 1 0 18H8a6 9 0 0 1 0-18ZM18 66h32a6 9 0 0 1 0 18H18a6 9 0 0 1 0-18Z" />
      <ellipse cx="50" cy="9" rx="6" ry="9" /><ellipse cx="50" cy="75" rx="6" ry="9" /><path d="M18 32h22m-22 10h22m-22 10h15" />
    </g>
    <g opacity=".8"><circle cx="408" cy="70" r="23" /><ellipse cx="408" cy="70" rx="9" ry="23" /><path d="M385 70h46m-42-11h38m-38 22h38M408 93v9m-15 0h30" /></g>
    <g className="wv-claims-quill" opacity=".75"><path d="M91 161q-9-28 24-50-1 31-24 50ZM88 170l23-51M80 169h22v10H80Z" /></g>
    <g className="wv-book-artifact" transform="translate(376 137) rotate(12 17 20)" opacity=".75"><path d="M0 0h34v39H0ZM5 0v39m0 0v4h33V4h-4M11 13h16m-16 8h16m-16 8h11" /></g>
    <g opacity=".45"><path d="m98 28 4 6-4 6-4-6ZM357 35v10m-5-5h10M425 128v10m-5-5h10" /><circle cx="140" cy="144" r="2" /><circle cx="321" cy="151" r="2" /><path d="M76 107l8 7m274 9 9-7" strokeDasharray="2 5" /></g>
  </svg>;
}
function QuestionPattern() {
  return <svg className="wv-question-pattern" viewBox="0 0 170 44" fill="none" aria-hidden="true"><path d="M0 22h55l15-12 15 12-15 12-15-12h70l15-12 15 12-15 12-15-12h45M0 14h37m-37 16h37" /><circle cx="100" cy="22" r="3" /></svg>;
}
function IslamClaimsDesk({ item, selected, choose }: { item: typeof WORLDVIEWS[number]; selected: number; choose: (index: number) => void }) {
  const row = item.rows[selected];
  const primarySource = row.otherBasis.find(citation => citation.kind === 'source');
  return <section id="comparison" className="wv-desk wv-islam-desk wv-claims-room">
    <div className="wv-claims-connected"><header className="wv-claims-heading"><div><p className="ap-eyebrow">01 / Begin with the claims</p><h2>Shared questions.<br /><em>Distinct answers.</em></h2><p>Choose a question. Compare the claims, then examine the texts that support them.</p></div><div className="wv-claims-motif"><ClaimsDiagram /><span>One question <span>·</span> Two accounts <span>·</span> Open texts</span></div></header>
    <nav className="wv-question-nav wv-claim-map" aria-label="Comparison questions">{claimFamilies.map(group => { const Icon = group.icon; return <div className="wv-claim-family" key={group.title}><h3><Icon size={17} />{group.title}<small>{group.ids.length}</small></h3>{group.ids.map(id => { const index = item.rows.findIndex(entry => entry.id === id); const entry = item.rows[index]; return <button type="button" key={id} aria-label={entry.question} aria-pressed={selected === index} aria-controls="wv-comparison-content" onClick={() => choose(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{entry.question}</strong></button>; })}</div>; })}</nav>
    <div id="wv-comparison-content" className="wv-comparison-content wv-claim-comparison" key={row.id}>
      <header className="wv-current-question wv-pattern-question"><QuestionPattern /><h3>{row.question}</h3><QuestionPattern /></header>
      <div className="wv-positions">{(['christian', 'other'] as const).map(side => { const christian = side === 'christian'; const paragraphs = row[side].split(/\n\s*\n/); return <article key={side} className={christian ? 'wv-truth' : 'wv-perspective'} aria-label={christian ? 'Christian truth' : item.otherLabel}>
        <header className="wv-position-heading"><span className="wv-position-mark">{christian ? <Cross size={23} /> : <ScrollText size={23} />}</span><div><p className="ap-eyebrow">{christian ? 'Christian truth' : item.otherLabel}</p><span>{christian ? 'Scripture & Christian witness' : 'The Qur’anic account'}</span></div><span className="wv-position-number">{christian ? 'A' : 'B'}</span></header>
        <div className="wv-position-copy"><p>{paragraphs[0]}</p>{paragraphs.length > 1 && <div className="wv-claim-explanation"><div className="wv-claim-explanation-label">Unpack this claim <ChevronDown size={17} aria-hidden="true" /></div>{paragraphs.slice(1).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>}</div>

      </article>; })}</div>
      <BasisReader christian={row.christianBasis} islamic={row.otherBasis} />
      <div className="wv-claim-follow"><div><RouteIcon size={20} /><span className="ap-eyebrow">Follow the question</span></div><Link className="wv-study-link" state={{ worldviewReturn: { id: item.id, question: row.id } }} to={studyUrl(row.study)}><div><span>Understand the argument</span><strong>{studyById(row.study)!.title}</strong></div><ArrowUpRight size={19} /></Link><Link className="wv-claim-context-link" preventScrollReset to={'?question=' + row.id + '&reading=' + (primarySource?.kind === 'source' ? primarySource.source : 'q112') + '#reading-sources'} onClick={() => document.getElementById('reading-sources')?.scrollIntoView({ behavior: 'smooth' })}><BookOpen size={18} /><span>Read the passages in context</span><ArrowRight size={16} /></Link></div>
    </div></div>
  </section>;
}

const readingTasks: Record<string, string> = {
  q112: 'Read all four verses together. List the statements about God, then consider how each statement relates to the question of oneness.',
  q4171: 'Start with the address at the beginning. Read every description of Jesus together with the qualifications that follow. Compare translations before examining John 1.',
  q4157: 'Continue through verse 158. Separate the wording of the passage from explanations supplied by a translator or tafsir. Ask which interpretation your neighbour follows.',
  creed: 'Read the statements about Father, Son and Holy Spirit together. Identify the confession Christians are explaining, then follow the biblical references in the comparison.',
};
function ContextSources({ item }: { item: typeof WORLDVIEWS[number] }) {
  const [params] = useSearchParams();
  if (item.readingPlan) return <ReadingPlanRoom key={params.get('reading') ?? 'default'} item={item} initialSource={params.get('reading')} />;
  return <section className="wv-context-room" aria-labelledby="wv-context-heading"><div className="wv-section-title"><p className="ap-eyebrow">02 / Read in context</p><h2 id="wv-context-heading">The texts behind <em>the conversation.</em></h2><p>The comparison above identifies a difference. Here, return to the document: follow its wording, understand its setting and distinguish the text from an interpretation of it.</p></div><div className="wv-reading-aim"><Compass size={23} /><div><strong>Your aim: understand the passage before using it.</strong><p>Read the whole passage and what surrounds it. Identify who is speaking and who is addressed. Note what is affirmed, what is denied and what the text leaves unexplained.</p></div></div><div className="wv-context-grid ap-source-grid">{item.sources.map((id, index) => { const source = sourceById(id); const questions = item.rows.filter((entry) => [...entry.otherBasis, ...entry.christianBasis].some((citation) => citation.kind === 'source' && citation.source === id)); return <article className="wv-context-card" key={id}><div className="wv-context-meta"><BookOpen size={18} /><span>Source {String(index + 1).padStart(2, '0')} / {source.kind}</span></div><h3>{source.title}</h3><p className="wv-edition">{source.author}</p><div className="wv-source-purpose"><span>Context & purpose</span><p>{source.note}</p></div><div className="wv-reading-task"><span>What to examine</span><p>{readingTasks[id] ?? 'Read the passage in full, including the surrounding argument. Compare the wording with the claim in the reading desk and note where interpretation begins.'}</p></div>{questions.length > 0 && <div className="wv-reading-connections"><span>Return to the question</span>{questions.map((question) => <Link key={question.question} to={'?question=' + question.id + '#comparison'}>{question.question}<ArrowRight size={13} /></Link>)}</div>}<a className="wv-open-source" href={source.url} target="_blank" rel="noreferrer">Open the full text <ArrowUpRight size={15} /></a><small className="wv-source-role">{source.role}</small></article>; })}</div></section>;
}
function ReadingPlanRoom({ item, initialSource }: { item: typeof WORLDVIEWS[number]; initialSource: string | null }) {
  const plan = item.readingPlan!;
  const initialStage = Math.max(0, plan.stages.findIndex(stage => stage.readings.some(reading => reading.source === initialSource)));
  const [selected, setSelected] = useState(initialStage);
  const [passage, setPassage] = useState(Math.max(0, plan.stages[initialStage].readings.findIndex(reading => reading.source === initialSource)));
  const stage = plan.stages[selected];
  const reading = stage.readings[passage];
  const source = sourceById(reading.source);
  const questions = item.rows.filter(row => row.otherBasis.some(citation => citation.kind === 'source' && citation.source === reading.source));
  const motifs = [1, 0, 2, 3];
  return <section id="reading-sources" className="wv-context-room wv-reading-plan wv-relationship-room" aria-labelledby="wv-context-heading">
    <div className="wv-reading-heading"><p className="ap-eyebrow">02 / Read in context</p><h2 id="wv-context-heading">The texts behind <em>the conversation.</em></h2><div className="wv-reading-aim"><p>{plan.introduction}</p></div></div>
    <nav className="wv-source-roadmap" aria-label="Reading roadmap">{plan.stages.map((entry, i) => <button type="button" key={entry.title} aria-pressed={i === selected} aria-controls="wv-stage-readings" onClick={() => { setSelected(i); setPassage(0); }}><div className="wv-route-art"><StudyArtwork kind={motifs[i]} /><span>0{i + 1}</span></div><strong>{entry.title}</strong><small>{entry.readings.map(r => sourceById(r.source).title.replace('Qur’an ', '')).join(' · ')}</small><span className="wv-route-arrow"><ArrowRight size={16} /></span></button>)}</nav>
    <div id="wv-stage-readings" className="wv-source-workbench"><aside className="wv-passage-rail"><p className="ap-eyebrow">Stage 0{selected + 1} / Reading aim</p><p className="wv-stage-aim">{stage.aim}</p><nav aria-label="Passages in this stage">{stage.readings.map((entry, i) => <button type="button" key={entry.source} aria-pressed={passage === i} aria-controls="wv-passage-analysis" onClick={() => setPassage(i)}><span>0{i + 1}<ScrollText size={15} /></span><strong>{sourceById(entry.source).title}</strong><small>{entry.title}</small><ArrowRight size={14} /></button>)}</nav><div className="wv-rail-key"><span /><p>Primary text</p><span /><p>Question to examine</p><span /><p>Christian counterpart</p></div></aside>
    <div className="wv-context-grid ap-source-grid" aria-live="polite"><article id="wv-passage-analysis" className="wv-context-card wv-analysis-card" key={reading.source}>
      <header className="wv-analysis-heading"><p className="ap-eyebrow">Passage 0{passage + 1} / {source.title}</p><h3>{reading.title}</h3></header>
      <div className="wv-text-relationship"><div><span>01 / Primary text</span><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14} /></a></div><ArrowRight className="wv-relationship-arrow" size={20} /><div><span>02 / Examine the claim</span><strong>{stage.title}</strong></div><ArrowRight className="wv-relationship-arrow" size={20} /><div><span>03 / Read alongside</span><ApCitations citations={reading.christian.citations} label="Christian Scripture" /></div></div>
      <div className="wv-passage-context"><h4><ScrollText size={16} />Passage in context</h4><p>{reading.context.text}</p></div>
      <div className="wv-analysis-pair"><div className="wv-source-purpose"><h4><Compass size={18} />Why this passage is here</h4><p>{reading.purpose.text}</p></div><div className="wv-reading-task"><h4><BookOpen size={18} />What to examine</h4><p>{reading.examine.text}</p></div></div>
      <div className="wv-gospel-connection"><h4><RouteIcon size={18} />How this advances the conversation</h4><p>{reading.connection.text}</p></div>
      <div className="wv-christian-counterpart"><div><p className="ap-eyebrow">The biblical counterpart</p><h4><Cross size={18} />Read the Christian claim</h4><ApCitations citations={reading.christian.citations} label="Read alongside" /></div><p>{reading.christian.text}</p></div>
      <footer className="wv-analysis-footer"><a className="wv-open-source" href={source.url} target="_blank" rel="noreferrer">Open the full text <ArrowUpRight size={15} /></a>{questions.length > 0 && <div className="wv-reading-connections"><span>Related questions</span>{questions.map(question => <Link key={question.id} to={'?question=' + question.id + '#comparison'}>{question.question}<ArrowRight size={12} /></Link>)}</div>}</footer>
    </article></div></div>
  </section>;
}

function StudyArtwork({ kind }: { kind: number }) {
  return <svg className="wv-study-art" viewBox="0 0 360 150" fill="none" aria-hidden="true" focusable="false"><path d="M36 132h288" opacity=".2" />
    {kind === 0 && <><path d="M103 125V60q0-39 77-49 77 10 77 49v65M120 125V63q0-24 60-34 60 10 60 34v62" opacity=".35" /><path d="M137 114V62q22-10 43 0 21-10 43 0v52q-21-10-43 0-21-10-43 0ZM180 62v52M147 77h23m-23 12h23m20-12h23m-23 12h23" /><path d="m100 43-19-6m179 6 19-6M180 8v12" opacity=".45" /></>}
    {kind === 1 && <><path d="M94 123V69q0-46 35-46t35 46v54M164 123V69q0-46 35-46t35 46v54M234 123V69q0-46 35-46t35 46v54" opacity=".35" /><path d="M70 123h258M139 104h82M180 82v42" /><path d="M180 46v20m-45-28 14 14m76-14-14 14" /><circle cx="180" cy="73" r="7" /></>}
    {kind === 2 && <><path d="M180 121V24m-29 29h58" strokeWidth="2" /><path d="M57 123q65-43 123-16 59-27 123 16M83 123q43-22 82-7m30 0q39-15 82 7" opacity=".4" /><path d="M180 12V4m-54 21-9-9m126 9 9-9M108 60H93m174 0h-15" opacity=".4" /></>}
    {kind === 3 && <><path d="M108 28h129q19 0 19 17t-19 17H108m0-34q-19 0-19 17t19 17v43q0 16 16 16h113q19 0 19-17t-19-17H124m113 34V62M89 45h38" /><path d="M137 45h81M131 76h89m-89 13h65M80 129h202" opacity=".4" /><path d="m193 110 0 27 8-6 8 6v-27" /></>}
    {kind === 4 && <><path d="M180 125V72m0 18q-49 2-53-38 43-3 53 38Zm0-6q46 0 48-37-39 0-48 37ZM113 124q67-16 134 0" /><path d="M180 71q-24-28 0-51 24 23 0 51Z" /><path d="M91 101q-14-36 7-67m173 67q14-36-7-67" opacity=".3" /><circle cx="96" cy="27" r="3" /><circle cx="264" cy="27" r="3" /></>}
    {kind === 5 && <><path d="M86 121V70q0-40 39-40t39 40v51M196 121V70q0-40 39-40t39 40v51" opacity=".35" /><path d="M146 95q34-38 68 0m-53-1 19-20 19 20M70 123h220" /><circle cx="125" cy="72" r="12" /><circle cx="235" cy="72" r="12" /><path d="M106 113q0-22 19-22t19 22m72 0q0-22 19-22t19 22" /></>}
  </svg>;
}
function IllustratedStudy({ id, index, book, origin }: { id: string; index: number; book: ApNotebook; origin: { id: string; question: string } }) {
  const study = studyById(id)!;
  const art = id.includes('jesus') ? 0 : id.includes('trinity') || id === 'god' ? 1 : id.includes('cross') || id === 'resurrection' ? 2 : ['manuscripts','scripture','canon'].includes(id) ? 3 : id === 'grace' ? 4 : 5;
  const Icon = [BookOpen, Network, Cross, ScrollText, Sprout, HeartHandshake][art];
  return <article className="wv-study-card"><div className="wv-study-card-top"><span><Icon size={15} />Study {String(index + 1).padStart(2, '0')} · {studyMinutes(study)} min</span><button type="button" aria-label={(book.notebook.saved.includes(id) ? 'Unsave: ' : 'Save: ') + study.title} aria-pressed={book.notebook.saved.includes(id)} onClick={() => book.toggle('saved', id)}><Bookmark size={17} fill={book.notebook.saved.includes(id) ? 'currentColor' : 'none'} /></button></div><Link state={{ worldviewReturn: origin }} to={studyUrl(id)}><StudyArtwork kind={art} /><h3>{study.title}</h3><p>{study.summary}</p><span className="wv-study-card-footer">{book.notebook.read.includes(id) ? <><Check size={15} /> Revisit study</> : 'Explore the study'}<ArrowRight size={16} /></span></Link></article>;
}

export {IslamHeroArt,CollectionArt,StudyArtwork,ClaimsDiagram,IllustratedStudy};
