import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';

export function Cites({ ids }: { ids: string[] }) {
  return <span className="pr-cites">{[...new Set(ids)].map(id => {
    const source = dossier.sources.find(s => s.id === id)!;
    return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title.split(' · ')[0]} <ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> — {source.title.split(' · ').slice(1).join(' · ')} (opens in a new tab)</span></a>;
  })}</span>;
}

/** A chapter head, flush left as on the Manuscripts page: number and kicker on one line, then the title. A switch can sit at the right. */
export function SectionHeading({ n, kicker, title, text, id, aside }: { n: string; kicker: string; title: ReactNode; text?: string; id?: string; aside?: ReactNode }) {
  return <header className="pr-head-row"><div className="pr-section-heading">
    <p className="pr-kicker"><span className="pr-index">{n}</span>{kicker}</p>
    <h2 id={id}>{title}</h2>
    {text && <p>{text}</p>}
  </div>{aside && <div className="pr-head-aside">{aside}</div>}</header>;
}

/** A pill switch (the Manuscripts page's sort control): one of a few views. */
export function Pills<K extends string | number>({ label, options, value, onChange }: { label: string; options: readonly (readonly [K, string])[]; value: K; onChange: (key: K) => void }) {
  return <div className="pr-pills" role="radiogroup" aria-label={label}>{options.map(([key, name]) =>
    <button key={String(key)} type="button" role="radio" aria-checked={key === value} onClick={() => onChange(key)}>{name}</button>)}</div>;
}
