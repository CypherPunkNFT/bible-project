import { useMemo } from 'react';
import type { Field } from '@/data/teachers/pages-types';
import { useScholars } from '../context';
import { Mark } from '../marks/Mark';
import { toneStyle } from '../marks/shapes';
import { openingGroups } from './library-view';

export function LibraryConstellation() {
  const { data, library, libraryError, openProfile, filterCatalogue } = useScholars();
  const groups = useMemo(() => openingGroups(library ?? [], Object.keys(data.fields) as Field[]), [library, data.fields]);
  return <figure className="lnd-library-sky">
    <figcaption><span className="kicker">Explore the library</span><h2>Many voices, <em>five subjects.</em></h2>
      <p>A selection from the full catalogue. Subject totals count contributors whose works match; people can appear in more than one subject.</p></figcaption>
    {!library ? <p role="status">{libraryError ? 'The catalogue could not load. Reload to try again.' : 'Loading the library…'}</p> : <div className="lnd-clusters">{groups.map(group => <section key={group.field} className="lnd-cluster" style={group.field === 'unassigned' ? undefined : toneStyle(group.field)}>
      <h3>{group.field === 'unassigned' ? 'Subject unassigned' : <button type="button" onClick={() => filterCatalogue({ field: [group.field as Field] }, { resetLibrary: true })}>{data.fields[group.field]}</button>}<span>{group.total.toLocaleString()}</span></h3>
      <div className="lnd-cluster-marks">{group.selected.map(p => <button key={p.id} type="button" data-entry-id={p.id}
        aria-label={p.scholar ? `View biography of ${p.name}` : `Find ${p.name} in the catalogue`}
        title={`${p.name} · ${p.scholar ? 'Documented profile' : p.roles.join(', ') || 'Library contributor'}`}
        onClick={e => p.scholar ? openProfile(p.scholar.id, e.currentTarget) : filterCatalogue({ q: p.name.toLocaleLowerCase() }, { resetLibrary: true })}>
        {group.field === 'unassigned' ? <span className="lnd-unassigned-mark" aria-hidden="true">{p.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('')}</span> : <Mark scholar={{ name: p.name, field: group.field }} size={44} />}
        <span>{p.scholar?.short ?? p.name}</span>
      </button>)}</div>
    </section>)}</div>}
    <p className="lnd-sky-note">Marks show selected profiles and library contributors. Search to find any catalogue entry.</p>
  </figure>;
}
