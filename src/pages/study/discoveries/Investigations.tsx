import { useDiscoveryChoice } from './useDiscoveryChoice';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import dossier from '../../../../content/academic-research/06-discoveries-biblical-record.json';
import { Citations } from './Evidence';
import { SurfaceMethods, ParallelObjects, ResearchWorkbench } from './DiscoveryArt';
import { RelatedDiscoveryStudy } from './RelatedDiscoveryStudy';

export function CloseReading({ id }: { id: string }) {
  const reading = dossier.closeReadings[id as keyof typeof dossier.closeReadings];
  const [focus, setFocus] = useDiscoveryChoice('detail-'+id, reading.details.length);
  const detail = reading.details[focus];
  return <div className="dr-close-reading">
    <div className="dr-reading-evidence"><p className="dr-kicker">Inspect the evidence / {reading.locator}</p><p className="dr-evidence-extract">{reading.extract}</p><p className="dr-caption">{reading.kind}</p><Citations ids={[reading.source]}/></div>
    <div className="dr-annotation"><div className="dr-detail-choices" role="group" aria-label="Inspect a detail">{reading.details.map((item,i)=><button type="button" key={item.label} aria-pressed={focus===i} aria-controls="dr-annotation-result" onClick={()=>setFocus(i)}><span>0{i+1}</span>{item.label}</button>)}</div><div id="dr-annotation-result" className="dr-annotation-result" aria-live="polite"><h4>{detail.title}</h4><p>{detail.text}</p><Citations ids={detail.sources}/></div></div>
  </div>;
}

export function ReadingWorkshop() {
  const [restoration,setRestoration]=useDiscoveryChoice('restoration',2);
  const restored=restoration===1;
  const [issue,setIssue]=useDiscoveryChoice('mark',3);
  const [arrangement,setArrangement]=useDiscoveryChoice('arrangement',2);
  const joined=arrangement===1;
  const debate=dossier.readingDisputes.mesha,dan=dossier.readingDisputes.telDan;
  return <section className="dr-investigation" id="reading-lab" aria-labelledby="dr-lab-title">
    <div className="dr-wide-heading"><div><p className="dr-kicker">03 / Read the letters and the gaps</p><h2 id="dr-lab-title">Three different kinds<br/><em>of uncertainty.</em></h2></div><p>A missing letter, a disputed mark and a proposed join are different problems. Treating all of them as simply “uncertain” conceals how epigraphers work.</p></div>
    <div className="dr-pilate-workshop"><div><span className="dr-kicker">01 / Pilate · a secure restoration</span><h3>Brackets do not mean<br/>“anything could go here”.</h3><p>Surviving letters, Latin grammar and official terminology constrain the restoration. The name and office are more secure than the damaged dedication’s architectural purpose.</p><Citations ids={['pilate-taylor']}/></div><div className="dr-letter-desk"><div className="dr-transcription" aria-live="polite"><div><span className="dr-restored">{restored?'[PO]':'[…] '}</span>NTIUS PILATUS</div><div><span className="dr-restored">{restored?'[PRAEF]':'[…] '}</span>ECTUS IUDA<span className="dr-restored">{restored?'[EA]':'[…]'}</span>E</div></div><button type="button" className="dr-toggle" aria-pressed={restored} onClick={()=>setRestoration(restored?0:1)}>{restored?'Hide restored letters':'Reveal restored letters'}<ArrowRight size={16}/></button><p className="dr-caption">Portions of lines 2–3, in transcription. Brackets identify editorial supplements; spacing and line lengths do not reproduce the stone.</p><p className="dr-translation">Pontius Pilate · prefect of Judaea</p></div></div>
    <div className="dr-mesha-workshop"><div className="dr-workshop-intro"><p className="dr-kicker">02 / Mesha · contested marks</p><h3>{debate.question}</h3><p>{debate.intro}</p></div><SurfaceMethods/><div className="dr-dispute-issues" role="group" aria-label="Examine a disputed mark">{debate.issues.map((x,i)=><button type="button" key={x.label} aria-pressed={issue===i} aria-controls="dr-dispute-reading" onClick={()=>setIssue(i)}><span>0{i+1}</span>{x.label}</button>)}</div><div id="dr-dispute-reading" className="dr-dispute-reading" aria-live="polite"><article><small>The case for the reading</small><h4>Lemaire & Delorme</h4><p>{debate.issues[issue].pro}</p><Citations ids={['mesha-lemaire-2023']}/></article><article><small>The objection</small><h4>Richelle & Burlingame</h4><p>{debate.issues[issue].contra}</p><Citations ids={['mesha-richelle-2023']}/></article></div><p className="dr-debate-conclusion">{debate.conclusion}</p><details className="dr-details"><summary>How the 2019 alternatives fit this debate <Plus size={16}/></summary><div><p>{debate.earlier}</p><Citations ids={debate.earlierSources}/><p className="dr-caption">The linked comparative plates let you inspect the actual marks. No invented letter traces are drawn here. The 2023 response and sidebar were read; the full parent magazine articles were not.</p></div></details></div>
    <RelatedDiscoveryStudy id="mesha"/>
    <div className="dr-fragment-workshop"><div><p className="dr-kicker">03 / Tel Dan · a proposed join</p><h3>{dan.title}</h3><p>{joined?dan.traditional:dan.challenge}</p><button type="button" className="dr-toggle" aria-pressed={joined} onClick={()=>setArrangement(joined?0:1)}>{joined?'Separate the evidence again':'Show the traditional narrative link'}<ArrowRight size={16}/></button><Citations ids={dan.sources}/></div><div><div className={`dr-fragment-argument ${joined?'dr-fragments-linked':''}`} aria-live="polite"><div className="dr-fragment-a"><span>Fragment A · preserved words</span><strong>MLK YŚRʾL<br/><mark>BYTDWD</mark></strong><small>King of Israel · House of David</small></div><div className="dr-proposed-join"><i/><span>{joined?'Proposed narrative connection':'Arrangement under examination'}</span><i/></div><div className="dr-fragment-b"><span>Fragments B1 + B2</span><strong>… RM BR …<br/>… YHW BR …</strong><small>Partial names and “son of”</small></div></div><p className="dr-caption">Textual argument diagram, not shapes, spacing or placement of the real fragments. The dashed connection represents an editorial proposal.</p><p className="dr-stable-evidence">{dan.stable}</p></div></div>
  </section>;
}

export function CyrusComparison() {
  const [row,setRow]=useDiscoveryChoice('parallel',3);
  const comparison=dossier.cyrusComparison,item=comparison.rows[row];
  return <section className="dr-investigation dr-cyrus-study" id="cyrus-reading" aria-labelledby="dr-cyrus-title"><div className="dr-wide-heading"><div><p className="dr-kicker">04 / Test a historical parallel</p><h2 id="dr-cyrus-title">A restorer of sanctuaries.<br/><em>Whose sanctuaries?</em></h2></div><p>{comparison.intro}</p></div>
    <div className="dr-cyrus-controls" role="group" aria-label="Compare Cyrus texts">{comparison.rows.map((r,i)=><button type="button" key={r.label} aria-pressed={row===i} aria-controls="dr-cyrus-texts" onClick={()=>setRow(i)}>{r.label}</button>)}</div>
    <ParallelObjects row={row}/><div id="dr-cyrus-texts" aria-live="polite"><div className="dr-cyrus-texts"><article><span className="dr-label">Babylonian Akkadian · royal inscription</span><h3>Cyrus Cylinder</h3><p>{item.cylinder}</p><Citations ids={comparison.sources}/></article><article><span className="dr-label">Hebrew narrative · proclamation presented in Ezra</span><h3>Ezra</h3><p>{item.ezra}</p><Link className="dr-link" to={row===2?'/read/kjv/EZR/6?hl=3-5':'/read/kjv/EZR/1?hl=1-4'}>Read Ezra {row===2?'6:3–5':'1:1–4'} →</Link></article></div><p className="dr-cyrus-insight">{item.insight}</p></div>
    <div className="dr-cyrus-conclusion"><h3>Context, not a duplicate decree.</h3><p>{comparison.conclusion}</p><p>{comparison.scholarship}</p><Citations ids={comparison.scholarshipSources}/></div>
    <RelatedDiscoveryStudy id="cyrus"/>
  </section>;
}

export function ScholarshipPath() {
  return <section className="dr-investigation dr-scholarship" id="scholarship-path" aria-labelledby="dr-scholarship-title"><div className="dr-wide-heading"><div><p className="dr-kicker">06 / Enter the scholarly conversation</p><h2 id="dr-scholarship-title">Follow an argument,<br/><em>not just a bibliography.</em></h2></div><p>Excavation, epigraphy and historical interpretation answer different questions. These works show how the questions themselves changed.</p></div><ResearchWorkbench/><details className="dr-details dv-all-paths"><summary>Read all six research annotations <Plus size={16}/></summary><div className="dr-reading-path">{dossier.readingPath.map((work,i)=><article key={work.title}><span className="dr-reading-index">0{i+1}</span><div><p className="dr-kicker">{work.question}</p><h3>{work.title}</h3><p>{work.contribution}</p><Citations ids={[work.source]}/><small>{work.access}</small></div></article>)}</div></details><div className="dr-field-limits"><h3>Whose history survives?</h3><p>This selection travels through Egypt, Moab, Aram, Judah, Babylonia and Roman Judaea, across Egyptian, Moabite, Aramaic, Akkadian and Latin texts. These are distinct scholarly fields and ancient perspectives. None is merely a caption to a biblical story.</p><p>Royal monuments disproportionately preserve conquest and public authority. Storage vessels, domestic contexts and regional settlement patterns ask other questions: who produced, supplied, rebuilt and endured? The survival of a king’s words is not a measure of whose life mattered most.</p><Citations ids={['porter-moab','lachish-fourth']}/></div></section>;
}
