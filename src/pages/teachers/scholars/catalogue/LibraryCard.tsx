import type { Field, ScholarsData } from '@/data/teachers/pages-types';
import { Mark } from '../marks/Mark';
import { toneStyle } from '../marks/shapes';
import { FIELD_COLLECTIONS } from '../field-library';
import type { LibraryPerson } from './library';

export function LibraryCard({ person: p, data, onOpen }: { person: LibraryPerson; data: ScholarsData; onOpen: () => void }) {
  const fields = Object.keys(p.fields) as Field[], first = fields[0];
  const example = Object.values(p.fields).find(f => f?.example)?.example;
  return <article className="cat-card cat-library-card" data-id={p.id} style={first ? toneStyle(first) : { '--tone': 'var(--muted)' } as React.CSSProperties}>
    <div className="cat-card-top">{first ? <Mark scholar={{ name: p.name, field: first }} size={54} className="cat-mark" /> : <span className="cat-neutral-mark cat-mark" aria-hidden="true">{p.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('')}</span>}<span className="cat-badge">Library entry</span></div>
    <h3 className="cat-card-name">{p.name}</h3>
    <p className="cat-card-meta">{p.roles.join(' · ') || 'Recorded contributor'}</p>
    <p className="cat-card-tags">{fields.length ? fields.map(f => <span key={f} className="cat-field">{data.fields[f]}</span>) : <span className="cat-field">Field unassigned</span>}</p>
    {p.collections.length > 0 && <p className="cat-collections">{p.collections.map(id => FIELD_COLLECTIONS.find(([key]) => key === id)?.[1] ?? id).join(' · ')}</p>}
    {example && <div className="cat-card-work"><span>Associated work</span><b>{example.title}</b></div>}
    <p className="cat-held-count">{p.records.toLocaleString()} associated records · {p.readable.toLocaleString()} public reading records</p>
    <p className="cat-library-action">Browse associated works</p>
    <button type="button" className="cat-card-hit" aria-label={`Browse associated works by ${p.name}`} onClick={onOpen} />
  </article>;
}
