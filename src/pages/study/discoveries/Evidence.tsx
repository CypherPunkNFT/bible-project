import { ArrowUpRight } from 'lucide-react';
import dossier from '../../../../content/academic-research/06-discoveries-biblical-record.json';
const sources = new Map(dossier.sources.map(s => [s.id, s]));
export function Citations({ ids }: { ids: string[] }) {
  return <div className="dr-citations">{ids.map(id => { const s = sources.get(id); return s ? <a key={id} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a> : null; })}</div>;
}
