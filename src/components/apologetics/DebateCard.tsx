import { Link } from 'react-router-dom';
import type { ApDebate } from '@/data/apologetics-types';
import { AP_BASE } from '@/lib/apologetics-links';
import { transcripts } from '@/lib/debate-transcripts';
import { DebateArtwork } from './DebateArtwork';
import './debate-card.css';

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
};

export function DebateCard({ debate, index, returnState }: {
  debate: ApDebate;
  index: number;
  returnState?: { debateReturn: string };
}) {
  const speakers = debate.speakers.split(' · ');
  return <Link className="dr-exchange" to={AP_BASE + '/debates/' + debate.id} state={returnState}>
    <div className="dr-exchange-art"><span className="dr-exchange-number">{String(index + 1).padStart(2, '0')}</span><DebateArtwork id={debate.id} /></div>
    <div className="dr-exchange-copy"><p className="ap-eyebrow">{debate.lens}</p><h3>{debate.title}</h3><p className="dr-exchange-description">{debate.description}</p></div>
    <div className="dr-exchange-matchup">{speakers.map((name, i) => <span className="dr-exchange-participant" key={name}>
      {i > 0 && <span className="dr-exchange-versus"><span aria-hidden="true">VS</span><span className="sr-only">versus</span></span>}
      <span className="dr-exchange-speaker"><span className="dr-exchange-initials" aria-hidden="true">{initials(name)}</span><span className="dr-exchange-name">{name}</span></span>
    </span>)}</div>
    <div className="dr-exchange-metadata"><span>{debate.setting}</span><span className="dr-exchange-resources"><span>{transcripts[debate.id] ? 'Transcript' : 'Transcript source'}</span>{debate.recording && <span>YouTube{/^\d+:\d{2}(?::\d{2})?$/.test(debate.recording.duration) && ` · ${debate.recording.duration}`}</span>}<span>Study guide</span></span></div>
  </Link>;
}
