import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, Compass, Cross, HeartHandshake, Network, ScrollText, Sprout, Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { WORLDVIEWS, sourceById, studyById, studyMinutes } from '@/data/apologetics-library';
import { ApBack, ApCitations, ApNote, ApSectionHeading } from '@/components/ApologeticsParts';
import { AP_BASE as base, studyUrl } from '@/lib/apologetics-links';
import type { ApNotebook } from '@/lib/apologetics-notebook';
import './worldviews.css';

const identities: Record<string, { accent: string; theme: string; name: string }> = {
  islam: { accent: 'var(--poetry)', theme: 'Jesus · God · the cross', name: 'Islam' },
  secular: { accent: 'var(--epistles)', theme: 'Reason · morality · meaning', name: 'Secular thought' },
  buddhism: { accent: 'var(--accent)', theme: 'Suffering · self · release', name: 'Buddhism' },
  hinduism: { accent: 'var(--history)', theme: 'Self · action · refuge', name: 'Hinduism' },
};
// Decorative book/geometry motifs; these are not diagrams of a tradition's doctrine.
function CollectionArt({ id }: { id: string }) {
  return <svg className={'wv-art wv-art-' + id} viewBox="0 0 420 290" fill="none" aria-hidden="true">
    <circle cx="210" cy="138" r="110" strokeDasharray="1 9" opacity=".4" />
    {id === 'islam' ? <><path d="M115 239V121a95 95 0 0 1 190 0v118M135 239V121a75 75 0 0 1 150 0v118M155 239V126q0-43 55-74 55 31 55 74v113" /><path d="M155 214q27-12 55 0 28-12 55 0v-54q-28-12-55 0-28-12-55 0ZM210 160v54M166 177q18-5 33 0m-33 12q18-5 33 0m21-12q18-5 33 0m-33 12q18-5 33 0M85 239h250" /><circle cx="210" cy="120" r="14" /><path d="m210 102 0 36m-18-18h36M96 153H77m246 0h20" /></> : id === 'buddhism' ? <><circle cx="210" cy="138" r="82" /><circle cx="210" cy="138" r="65" /><circle cx="210" cy="138" r="19" />{Array.from({ length: 8 }, (_, i) => <g key={i} transform={`rotate(${i * 45} 210 138)`}><path d="M210 119V56m-7 20 7-7 7 7" /><circle cx="210" cy="56" r="4" /></g>)}<path d="M127 241q83 16 166 0M152 258h116" /></> : id === 'hinduism' ? <><path d="M210 222q-54-32 0-137 54 105 0 137ZM210 222q-89-9-93-91 75 19 93 91ZM210 222q89-9 93-91-75 19-93 91ZM210 222q-104 35-127-25 65-25 127 25ZM210 222q104 35 127-25-65-25-127 25Z" /><circle cx="210" cy="105" r="64" strokeDasharray="3 8" /><path d="M210 28v24M92 248h236M149 266h122" /></> : <><circle cx="210" cy="138" r="80" /><ellipse cx="210" cy="138" rx="34" ry="80" /><path d="M130 138h160m-148-40h136m-136 80h136M95 228h230" /><path d="m210 32 5 12-5 12-5-12ZM90 125h24m192 0h24" /><circle cx="210" cy="138" r="7" /></>}
  </svg>;
}
function identity(id: string) { return identities[id] ?? { accent: 'var(--epistles)', theme: 'Texts · questions · conversation', name: id }; }
export function WorldviewIndex() {
  return <div className="wv-page"><ApBack /><header className="wv-index-head"><div><p className="ap-eyebrow">Across beliefs / Four starting points</p><h1>Understand deeply.<br /><em>Witness clearly.</em></h1></div><p>Start with a person, not a label.<br />Explore the questions that matter, with each tradition’s own texts open beside Scripture.</p></header><div className="wv-collections">{WORLDVIEWS.map((item, index) => <Link className="wv-collection" key={item.id} to={base + '/worldviews/' + item.id} style={{ '--wv-accent': identity(item.id).accent } as React.CSSProperties}><div className="wv-collection-meta"><span>0{index + 1} / A conversation in context</span><ArrowUpRight size={20} /></div><CollectionArt id={item.id} /><div className="wv-collection-copy"><p className="ap-eyebrow">{identity(item.id).theme}</p><h2>{item.title}</h2><p>{item.description}</p><div className="wv-collection-foot"><span>{item.rows.length} questions · {item.studies.length} connected studies</span><strong>Enter the collection <ArrowRight size={16} /></strong></div></div></Link>)}</div><div className="wv-method"><span>Before the comparison</span><p>These are focused introductions. Ask which texts, teachers and interpretations your neighbour trusts. Read in context. Let the person tell you what they believe.</p><Link to={base + '/sources'}>How we use sources <ArrowUpRight size={14} /></Link></div></div>;
}
export function WorldviewPage({ book }: { book: ApNotebook }) {
  const { id = '' } = useParams();
  const item = WORLDVIEWS.find((worldview) => worldview.id === id);
  if (!item) return <div className="ap-empty"><h1>Collection not found.</h1><Link to={base + '/worldviews'}>Explore worldviews</Link></div>;
  return <Collection key={id} item={item} book={book} />;
}
function Collection({ item, book }: { item: typeof WORLDVIEWS[number]; book: ApNotebook }) {
  const [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState(false);
  const requested = params.get('question');
  const exact = item.rows.findIndex((row) => row.id === requested);
  const selected = Math.max(0, exact >= 0 ? exact : item.rows.findIndex((row) => row.study === requested));
  const row = item.rows[selected], theme = identity(item.id);
  const choose = (index: number) => { const next = new URLSearchParams(params); next.set('question', item.rows[index].id); setParams(next, { replace: true, preventScrollReset: true }); };
  return <div className="wv-page" style={{ '--wv-accent': theme.accent } as React.CSSProperties}><ApBack to={base + '/worldviews'}>All worldviews</ApBack><header className="wv-hero"><div><p className="ap-eyebrow">Across beliefs / {theme.theme}</p><h1>{item.title.split(' & ')[0]}<br /><em> & {item.title.split(' & ')[1] ?? theme.name}</em></h1><p>{item.description}</p><a className="wv-start" href="#comparison">Begin with a question <ArrowRight size={17} /></a></div><div className="wv-hero-art"><CollectionArt id={item.id} /><span>Open texts. Honest questions.</span></div></header><div className="wv-reading-bar"><span><strong>01</strong> Examine the claims</span><span><strong>02</strong> Follow the sources</span><span><strong>03</strong> Carry the conversation</span></div>
    <section id="comparison" className={'wv-desk' + (item.id === 'islam' ? ' wv-islam-desk' : '')}>
      <div className="wv-section-title"><p className="ap-eyebrow">01 / Begin with the claims</p><h2>{item.subtitle}</h2><p>{item.id === 'islam' ? 'Choose a question. Examine the Christian truth and the Islamic perspective, each with its own explanation and sources.' : 'Choose a question. Read both starting points. Then follow the study.'}</p></div>
      <div className="wv-desk-layout">
        <nav className="wv-question-nav" aria-label="Comparison questions">{item.rows.map((entry, i) => <button key={entry.id} type="button" aria-pressed={selected === i} aria-controls="wv-comparison-content" onClick={() => choose(i)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{entry.question}</strong>{item.id !== 'islam' && <ArrowRight size={16} />}</button>)}</nav>
        <div id="wv-comparison-content" className="wv-comparison-content">
          <div className="wv-current-question"><span>Question {String(selected + 1).padStart(2, '0')} / {String(item.rows.length).padStart(2, '0')}</span><h3>{row.question}</h3></div>
          <div className="wv-positions">
            <article className="wv-truth" aria-label={item.id === 'islam' ? 'Christian truth' : 'Christian starting point'}><h4 className="ap-eyebrow"><BookOpen size={16} />{item.id === 'islam' ? 'Christian truth' : 'Christian starting point'}</h4><div className="wv-position-copy">{row.christian.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><ApCitations citations={row.christianBasis} label="Scripture & Christian witness" /></article>
            <article className="wv-perspective" aria-label={item.otherLabel}><h4 className="ap-eyebrow"><BookOpen size={16} />{item.otherLabel}</h4><div className="wv-position-copy">{row.other.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><ApCitations citations={row.otherBasis} label="Primary sources" /></article>
          </div>
          <Link className="wv-study-link" to={studyUrl(row.study)}><div><span>Continue with a connected study</span><strong>{studyById(row.study)!.title}</strong></div><ArrowUpRight size={23} /></Link>
        </div>
      </div>
    </section>
    <ContextSources item={item} />
    <section className="wv-next"><ApSectionHeading eyebrow="03 / Carry the conversation" title="Make the comparison a study." /><div className="wv-study-cards">{item.studies.map((id, i) => <IllustratedStudy key={id} id={id} index={i} book={book} />)}</div><div className="wv-conversation"><div><p className="ap-eyebrow">Listen before you answer</p><h3>What would you want to ask next?</h3><p>Start with the selected question: {row.question} Ask how your neighbour understands it before offering your answer.</p><button type="button" onClick={() => setNotes(!notes)} aria-expanded={notes}>{notes ? 'Close reflection' : 'Write a reflection'} <ArrowRight size={15} /></button></div>{item.id === 'islam' ? <Link className="wv-guided" to={base + '/paths/muslim-neighbour'}><RouteIcon size={24} /><span><strong>A route through the questions</strong>Follow the Muslim neighbour learning path.</span><ArrowRight size={18} /></Link> : <Link className="wv-guided" to={base + '/practice'}><RouteIcon size={24} /><span><strong>From study to conversation</strong>Practise listening and explaining your faith.</span><ArrowRight size={18} /></Link>}</div>{notes && <ApNote id={'worldview-' + item.id} prompt="Which claim or passage would you examine with your neighbour?" book={book} />}</section>
  </div>;
}

const readingTasks: Record<string, string> = {
  q112: 'Read all four verses together. List the statements about God, then consider how each statement relates to the question of oneness.',
  q4171: 'Start with the address at the beginning. Read every description of Jesus together with the qualifications that follow. Compare translations before examining John 1.',
  q4157: 'Continue through verse 158. Separate the wording of the passage from explanations supplied by a translator or tafsir. Ask which interpretation your neighbour follows.',
  creed: 'Read the statements about Father, Son and Holy Spirit together. Identify the confession Christians are explaining, then follow the biblical references in the comparison.',
};
function ContextSources({ item }: { item: typeof WORLDVIEWS[number] }) {
  return <section className="wv-context-room" aria-labelledby="wv-context-heading"><div className="wv-section-title"><p className="ap-eyebrow">02 / Read in context</p><h2 id="wv-context-heading">The texts behind <em>the conversation.</em></h2><p>The comparison above identifies a difference. Here, return to the document: follow its wording, understand its setting and distinguish the text from an interpretation of it.</p></div><div className="wv-reading-aim"><Compass size={23} /><div><strong>Your aim: understand the passage before using it.</strong><p>Read the whole passage and what surrounds it. Identify who is speaking and who is addressed. Note what is affirmed, what is denied and what the text leaves unexplained.</p></div></div><div className="wv-context-grid ap-source-grid">{item.sources.map((id, index) => { const source = sourceById(id); const questions = item.rows.filter((entry) => [...entry.otherBasis, ...entry.christianBasis].some((citation) => citation.kind === 'source' && citation.source === id)); return <article className="wv-context-card" key={id}><div className="wv-context-meta"><BookOpen size={18} /><span>Source {String(index + 1).padStart(2, '0')} / {source.kind}</span></div><h3>{source.title}</h3><p className="wv-edition">{source.author}</p><div className="wv-source-purpose"><span>Context & purpose</span><p>{source.note}</p></div><div className="wv-reading-task"><span>What to examine</span><p>{readingTasks[id] ?? 'Read the passage in full, including the surrounding argument. Compare the wording with the claim in the reading desk and note where interpretation begins.'}</p></div>{questions.length > 0 && <div className="wv-reading-connections"><span>Return to the question</span>{questions.map((question) => <Link key={question.question} to={'?question=' + question.id + '#comparison'}>{question.question}<ArrowRight size={13} /></Link>)}</div>}<a className="wv-open-source" href={source.url} target="_blank" rel="noreferrer">Open the full text <ArrowUpRight size={15} /></a><small className="wv-source-role">{source.role}</small></article>; })}</div></section>;
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
function IllustratedStudy({ id, index, book }: { id: string; index: number; book: ApNotebook }) {
  const study = studyById(id)!;
  const art = id.includes('jesus') ? 0 : id.includes('trinity') || id === 'god' ? 1 : id.includes('cross') || id === 'resurrection' ? 2 : ['manuscripts','scripture','canon'].includes(id) ? 3 : id === 'grace' ? 4 : 5;
  const Icon = [BookOpen, Network, Cross, ScrollText, Sprout, HeartHandshake][art];
  return <article className="wv-study-card"><div className="wv-study-card-top"><span><Icon size={15} />Study {String(index + 1).padStart(2, '0')} · {studyMinutes(study)} min</span><button type="button" aria-label={(book.notebook.saved.includes(id) ? 'Unsave: ' : 'Save: ') + study.title} aria-pressed={book.notebook.saved.includes(id)} onClick={() => book.toggle('saved', id)}><Bookmark size={17} fill={book.notebook.saved.includes(id) ? 'currentColor' : 'none'} /></button></div><Link to={studyUrl(id)}><StudyArtwork kind={art} /><h3>{study.title}</h3><p>{study.summary}</p><span className="wv-study-card-footer">{book.notebook.read.includes(id) ? <><Check size={15} /> Revisit study</> : 'Explore the study'}<ArrowRight size={16} /></span></Link></article>;
}
