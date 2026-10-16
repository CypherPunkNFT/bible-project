import { ArrowUpRight } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';

export function Cites({ ids }: { ids: string[] }) {
  return <span className="pr-cites">{[...new Set(ids)].map(id => {
    const source = dossier.sources.find(s => s.id === id)!;
    return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title.split(' · ')[0]} <ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> — {source.title.split(' · ').slice(1).join(' · ')} (opens in a new tab)</span></a>;
  })}</span>;
}

export function SectionHeading({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="pr-section-heading"><span className="pr-index">{n}</span><div><h2>{title}</h2><p>{text}</p></div></div>;
}
