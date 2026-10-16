import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { transcripts, transcriptTurns } from '@/lib/debate-transcripts';
import './debate-transcript.css';

const bodies = import.meta.glob<string>('/content/apologetics/transcripts/*.txt', { query: '?raw', import: 'default' });
const files = import.meta.glob<string>('/content/apologetics/transcripts/*.txt', { query: '?url', import: 'default', eager: true });

export function DebateTranscript({ id }: { id: string }) {
  const record = transcripts[id];
  const [text, setText] = useState(''), [error, setError] = useState(false);
  const [query, setQuery] = useState(''), [jump, setJump] = useState<number | null>(null);
  const reader = useRef<HTMLDivElement>(null);
  const file = record ? `/content/apologetics/transcripts/${record.file}` : '';
  useEffect(() => {
    let active = true;
    setText(''); setError(false); setQuery('');
    if (file && bodies[file]) bodies[file]().then(value => { if (active) setText(value); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [file]);
  const turns = useMemo(() => transcriptTurns(text, record), [text, record]);
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = turns.filter(turn => words.every(word => `${turn.speaker} ${turn.paragraphs.join(' ')}`.toLocaleLowerCase().includes(word)));
  useEffect(() => {
    if (jump === null) return;
    const target = reader.current?.querySelector<HTMLElement>(`[data-turn="${jump}"]`);
    if (target && reader.current) {
      reader.current.scrollTop += target.getBoundingClientRect().top - reader.current.getBoundingClientRect().top - 20;
      target.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
    }
    setJump(null);
  }, [jump]);
  if (!record) return null;
  return <section id="transcript" className="dt-transcript" aria-labelledby="dt-title">
    <header><div><p className="ap-eyebrow">Read the exchange</p><h2 id="dt-title">The transcript.</h2><p>{record.words.toLocaleString()} words · {record.turns} speaker turns</p></div>
      <a className="ap-button" href={files[file]} download={record.file}><Download size={15} /> Download text</a></header>
    <div className="dt-controls">
      <label><span>Jump to a section</span><select disabled={!text} aria-label="Jump to transcript section" value="" onChange={e => { setQuery(''); setJump(Number(e.target.value)); }}><option value="" disabled>Choose a section</option>{record.sections.map(section => <option key={section.turn} value={section.turn}>{section.title}</option>)}</select></label>
      <label><span>Search the transcript</span><span className="dt-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} placeholder="Find a phrase or speaker…" onChange={e => { setQuery(e.target.value); reader.current?.scrollTo({ top: 0 }); }} /></span></label>
    </div>
    <div className="dt-status" role="status">{query ? `${visible.length} of ${turns.length} speaker turns match` : 'Complete supplied text, in speaking order.'}{query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}</div>
    <div className="dt-reader" ref={reader} tabIndex={0} role="region" aria-label="Debate transcript">
      {!text && <p role={error ? 'alert' : 'status'}>{error ? 'The transcript could not load. You can download the text above.' : 'Loading the transcript…'}</p>}
      {text && !visible.length && <p>No matching passages. Try another phrase or clear the search.</p>}
      {visible.map(turn => <article key={turn.number} data-turn={turn.number} className={turn.speaker.includes('Lennox') ? 'dt-lennox' : turn.speaker === 'Richard Dawkins' ? 'dt-dawkins' : 'dt-host'}>
        {record.sections.find(section => section.turn === turn.number) && <p className="dt-section-label">{record.sections.find(section => section.turn === turn.number)!.title}</p>}
        <h3 tabIndex={-1}>{turn.speaker}<span aria-hidden="true">{String(turn.number).padStart(2, '0')}</span></h3>
        {turn.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </article>)}
    </div>
    <p className="dt-provenance">{record.provenance}</p>
  </section>;
}
