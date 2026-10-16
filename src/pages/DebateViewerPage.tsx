import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApDebate } from '@/data/apologetics-types';
import { studyById } from '@/data/apologetics-library';
import type { ApNotebook } from '@/lib/apologetics-notebook';
import { transcripts, transcriptTurns } from '@/lib/debate-transcripts';
import { apSourceUrl } from '@/lib/reading-sources';
import { OutsideScroll } from '@/components/OutsideScroll';
import { ApNote, StudyCard } from '@/components/ApologeticsParts';
const bodies = import.meta.glob<string>('/content/apologetics/transcripts/*.txt', { query: '?raw', import: 'default' });
const files = import.meta.glob<string>('/content/apologetics/transcripts/*.txt', { query: '?url', import: 'default', eager: true });
import './lennox-dawkins.css';

export function DebateViewerPage({ debate, book, returnTo }: { debate: ApDebate; book: ApNotebook; returnTo: string }) {
  const record = transcripts[debate.id];
  const file = record ? `/content/apologetics/transcripts/${record.file}` : '';
  const people = debate.id === 'lennox-dawkins' ? ['Richard Dawkins', 'John Lennox'] : debate.speakers.split(' · ');
  const initials = (name: string) => { const parts = name.trim().split(/\s+/); return (parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? ''); };
  const videoId = debate.recording ? new URL(debate.recording.url).searchParams.get('v') : null;
  const [text, setText] = useState(''), [error, setError] = useState(false);
  const [active, setActive] = useState(0), [query, setQuery] = useState('');
  useEffect(() => {
    let live = true;
    setText(''); setError(false); setActive(0); setQuery('');
    if (file && bodies[file]) bodies[file]().then(body => { if (live) setText(body); }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [file]);
  const turns = useMemo(() => text ? transcriptTurns(text, record) : [], [text, record]);
  const section = record?.sections[active], searching = Boolean(query.trim());
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = searching ? turns.filter(turn => words.every(word => `${turn.speaker} ${turn.paragraphs.join(' ')}`.toLocaleLowerCase().includes(word))) :
    section ? turns.slice(section.turn - 1, record.sections[active + 1] ? record.sections[active + 1].turn - 1 : turns.length) : [];
  function choose(index: number) { setActive(index); setQuery(''); }
  return <div className="ld-page">
    <div className="ld-breadcrumb"><Link to={returnTo}><ArrowLeft size={12} /> Back to the debate room</Link><span>{debate.lens}{debate.setting.match(/\b(?:19|20)\d{2}\b/) && ` / ${debate.setting.match(/\b(?:19|20)\d{2}\b/)![0]}`}</span></div>
    <header className="ld-title"><div><p className="ap-eyebrow">The debate viewer</p><h1>{debate.id === 'lennox-dawkins' ? <>The God Delusion <em>debate.</em></> : debate.title}</h1><p className="ld-argument">{debate.claim}</p></div><div className="ld-participants"><span><b className="ld-avatar">{initials(people[0])}</b>{people[0]}</span><small>VS</small><span><b className="ld-avatar ld-lennox">{initials(people[1])}</b>{people[1]}</span><p>{debate.setting}</p></div></header>
    <section className="ld-video-layout" aria-label="Watch the debate"><div><div className="ld-video-heading"><p className="ap-eyebrow">{debate.id === 'lennox-dawkins' ? 'Complete original recording' : 'Debate recording'}</p><a href={debate.recording!.url} target="_blank" rel="noopener noreferrer">{debate.recording!.label} <ArrowUpRight size={12} /></a></div><iframe title={debate.title + " recording"} src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><aside><p className="ap-eyebrow">Keep the question in view</p><h2>{debate.hinge}</h2><p>Compare the assertion, its supporting reason and the response.</p>{record && <a className="ld-download" href={files[file]} download={record.file}><Download size={14} /> Download text</a>}</aside></section>
    {record && section ? <section id="transcript" className="ld-desk" aria-label="Read the debate transcript">
      <aside className="ld-outline"><p className="ap-eyebrow">In this exchange</p><nav aria-label="Debate sections">{record.sections.map((item, index) => <button type="button" key={item.turn} className="ld-chapter" aria-current={!searching && active === index ? 'true' : undefined} onClick={() => choose(index)}><span>{String(index + 1).padStart(2, '0')}</span><span>{item.title}<small>{(record.sections[index + 1]?.turn ?? record.turns + 1) - item.turn} {record.unit ?? 'speaker turns'}</small></span></button>)}</nav><p>{record.sections.length} sections · {record.turns} {record.unit ?? 'speaker turns'}.</p></aside>
      <div className="ld-reading"><div className="ld-search"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search the whole transcript" placeholder="Search the whole transcript" value={query} onChange={e => setQuery(e.target.value)} />{searching && <button type="button" aria-label="Clear transcript search" onClick={() => setQuery('')}><X size={15} aria-hidden="true" /></button>}</div><span className="sr-only" role="status">{searching ? `${visible.length} matching passages` : ''}</span>
        <OutsideScroll className="ld-scroll" viewportClassName="ld-reader" label="Debate transcript" resetKey={`${active}:${query}`}>
          <p className="ap-eyebrow">{searching ? 'All transcript sections' : `Section ${active + 1}`}</p><h2>{searching ? 'Search results' : section.title}</h2><p className="ld-text-note">{record.segments ? 'Supplied text · Original source order' : 'Supplied transcript · Original speaking order'}</p>
          {!text && <p role={error ? 'alert' : 'status'}>{error ? 'The transcript could not load. Use Download text beside the video.' : 'Loading the transcript…'}</p>}
          {text && !visible.length && <p>No matching passages. Clear the search to return to the transcript.</p>}
          {visible.map(turn => <article key={turn.number} data-turn={turn.number} data-kind={turn.kind} className={turn.speaker.includes('Lennox') ? 'ld-turn ld-lennox' : 'ld-turn'}><header><b className="ld-avatar">{initials(turn.speaker)}</b><span className="ld-speaker">{turn.speaker}</span><small>{turn.kind === 'reflection' ? 'Written reflection' : turn.kind === 'source' ? 'Source material' : record.unit ? `Passage ${turn.number}` : `Turn ${turn.number}`}</small></header>{turn.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>)}
        </OutsideScroll>
        <div className="ld-reading-footer"><button type="button" disabled={searching || active === 0} onClick={() => choose(active - 1)}><ArrowLeft size={12} /> Last segment</button><span aria-live="polite">{searching ? 'Search results' : `Segment ${active + 1} of ${record.sections.length}`}</span><button type="button" disabled={searching || active === record.sections.length - 1} onClick={() => choose(active + 1)}>Next segment <ArrowRight size={12} /></button></div>
      </div>
      <aside className="ld-margin"><p className="ap-eyebrow">The question underneath</p><h2>{section.title}</h2><p>Identify the claim, the reason and the reply.</p><details><summary>Source beside the claim</summary>{record.coverage && <p>{record.coverage}</p>}<p>{record?.provenance ?? 'The on-site transcript has not been supplied yet.'}</p><Link to={apSourceUrl(debate.source)}>Open the source record <ArrowRight size={12} /></Link></details><ApNote id={`debate-${debate.id}`} prompt="Which premise would you check?" book={book} /></aside>
    </section> : <section id="transcript" className="ld-awaiting" aria-label="Transcript availability"><div><p className="ap-eyebrow">The transcript</p><h2>Transcript coming next.</h2><p>The video is ready to watch. The transcript will appear here once it has been supplied.</p><Link to={apSourceUrl(debate.source)}>View the publisher’s transcript source <ArrowRight size={12} /></Link></div><ApNote id={`debate-${debate.id}`} prompt="Your notes from the debate" book={book} /></section>}
    <section className="ap-section"><p className="ap-eyebrow">Prepare before you debate</p><h2>Study the questions underneath.</h2><div className="ap-study-grid">{debate.studies.map(id => <StudyCard key={id} study={studyById(id)!} book={book} />)}</div></section>
  </div>;
}
