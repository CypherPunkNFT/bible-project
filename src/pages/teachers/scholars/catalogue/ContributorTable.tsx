import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ScholarsData } from '@/data/teachers/pages-types';
import type { LibraryPerson } from './library';
import { dateLabel } from '../population';
import { PopulationWorks } from './PopulationWorks';
import { usePersonDetails } from './useLibrary';

function ContributorDetails({ person, data }: { person: LibraryPerson; data: ScholarsData }) {
  const p = usePersonDetails(person);
  const [worksOpen, setWorksOpen] = useState(true);
  const pop = p.population, identity = pop?.identity, counts = pop?.counts;
  return <>
    <details className="pop-detail"><summary>Identity, roles &amp; aliases</summary><div>
      <p>Stable contributor ID: <code>{p.id}</code></p>
      <p>Source contributor IDs: {p.contributorIds.length ? p.contributorIds.map((id, i) => <span key={id}>{i > 0 && ' · '}<code>{id}</code></span>) : 'None recorded'}</p>
      <p>Identity status: {identity?.status ?? p.facts?.kind ?? 'unresolved'}. Recorded entity: {identity?.entityType ?? p.facts?.kind ?? 'unestablished'}.</p>
      {identity?.reviewRequired && <p className="pop-review">Identity review open. Similar names have not been merged.</p>}
      <p>Roles: {p.roles.join(' · ') || 'Role unrecorded'}.</p>
      <p>Verified aliases: {pop?.verifiedAliases.join('; ') || 'None recorded'}.</p>
      <p>Recorded source names: {p.aliases.join('; ') || 'None'}.</p>
      <p>Recorded tradition: {p.traditions.join(' · ') || 'Unrecorded'}.</p>
      {identity?.candidateIds?.length ? <p>Other candidate IDs (separate entries): {identity.candidateIds.join(', ')}</p> : null}
    </div></details>
    <details className="pop-detail"><summary>Dates &amp; fields</summary><div>
      <p>{dateLabel(p)}. Date status: {p.facts?.dates.status ?? 'missing'}. Date authority: {p.facts?.dates.basis ?? 'unrecorded'}.</p>
      {p.sourceLifeDates.length > 0 && <p>Original date labels: {p.sourceLifeDates.join('; ')}.</p>}
      {p.scholar && <p>Biographical date authority: content/teachers/scholars.json · {p.scholar.id}</p>}
      {p.facts?.dates.evidence?.map((e, i) => <p key={i}>{e.label} · {e.field} · record <code>{e.workId}</code>{e.sourceUrl && <> · <a href={e.sourceUrl} target="_blank" rel="noreferrer">Date source</a></>}</p>)}
      <p>{p.facts?.expertise.length ? 'Documented expertise: ' + p.facts.expertise.map(f => data.fields[f]).join(', ') : 'Expertise unestablished; recorded work subjects are shown below.'}</p>
      {Object.entries(p.fields).length ? Object.entries(p.fields).map(([f, e]) => <p key={f}>{data.fields[f as keyof typeof data.fields]}: {e?.basis}{e?.example && ` · ${e.example.id}`}</p>) : <p>Field unassigned.</p>}
    </div></details>
    <details className="pop-detail" open={worksOpen} onToggle={e => setWorksOpen(e.currentTarget.open)}><summary>Works, editions &amp; reading availability</summary><div>
      {counts ? <><p>{counts.works.toLocaleString()} canonical works · {counts.editions.toLocaleString()} edition IDs</p><p>{counts.publicRecords.toLocaleString()} packaged records · {counts.localCopies.toLocaleString()} local copies · {counts.intakeRecords.toLocaleString()} intake records · {counts.siteSources.toLocaleString()} feature sources</p><p>{counts.publicReadable.toLocaleString()} public reading records · {counts.localReadable.toLocaleString()} local reading copies</p></> : <p>{p.records.toLocaleString()} associated records</p>}
      {worksOpen && <PopulationWorks person={p} />}
    </div></details>
    <details className="pop-detail"><summary>Sources &amp; review evidence</summary><div>
      {identity?.joinBasis && <p>Identity join: {identity.joinBasis}.</p>}
      {identity?.authorities?.map(a => <div key={a.id}><p>{a.authority} · {a.id} · {a.review?.date} · {a.review?.kind}</p><p>{a.review?.scope}</p>{a.unresolved?.map((u, i) => <p key={i}>{u}</p>)}{a.evidence?.map((e, i) => <p key={i}><a href={e.url} target="_blank" rel="noreferrer">{e.locator || 'Identity evidence'}</a>{e.checkedOn && ` · checked ${e.checkedOn}`}</p>)}</div>)}
      <p>Population provenance: {pop?.provenance?.join(' · ') || 'Recorded source credit'}</p>
    </div></details>
  </>;
}

export function ContributorTable({ people, data, expanded, onExpand, onOpen }: { people: LibraryPerson[]; data: ScholarsData; expanded: string | null; onExpand: (id: string | null) => void; onOpen: (id: string, origin: Element) => void }) {
  return <div className="pop-contributors" role="list" aria-label="Complete contributor population">
    {people.map(p => {
      const open = expanded === p.id;
      const pop = p.population, identity = pop?.identity, counts = pop?.counts;
      const fields = Object.keys(p.fields).map(f => data.fields[f as keyof typeof data.fields]);
      return <article className="pop-contributor" role="listitem" key={p.id} data-id={p.id} data-open={open}>
        <div className="pop-contributor-summary">
          <div className="pop-contributor-name" data-column="contributor"><span className="pop-column-label">Contributor / stable IDs</span><h3>{p.name}</h3><code>{p.id}</code>{p.contributorIds.filter(id => id !== p.id).map(id => <code key={id}>{id}</code>)}<small>{pop?.verifiedAliases.length ? `Verified aliases: ${pop.verifiedAliases.join('; ')}` : 'No additional verified alias'}</small></div>
          <div data-column="identity"><span className="pop-column-label">Identity &amp; roles</span><b>{identity?.status ?? p.facts?.kind ?? 'unresolved'}</b><small>{identity?.entityType ? `Recorded entity: ${identity.entityType}` : p.facts?.kind ?? 'Entity unestablished'}{identity?.reviewRequired ? ' · identity review open' : ''}</small><span>{p.roles.join(' · ') || 'Role unrecorded'}</span></div>
          <div data-column="dates"><span className="pop-column-label">Dates &amp; fields</span><span>{dateLabel(p)}</span><small>{fields.join(' · ') || 'Field unassigned'}</small><small>{p.facts?.expertise.length ? 'Documented expertise: ' + p.facts.expertise.map(f => data.fields[f]).join(', ') : 'Work subjects; expertise unestablished'}</small></div>
          <div data-column="works"><span className="pop-column-label">Work associations</span>{counts ? <><b>{counts.works.toLocaleString()} canonical works · {counts.editions.toLocaleString()} edition IDs</b><small>{counts.publicRecords.toLocaleString()} packaged records · {counts.localCopies.toLocaleString()} local copies · {counts.intakeRecords.toLocaleString()} intake records · {counts.siteSources.toLocaleString()} feature sources</small><small>{counts.publicReadable.toLocaleString()} public reading records · {counts.localReadable.toLocaleString()} local reading copies</small></> : <span>{p.records.toLocaleString()} associated records</span>}</div>
          <div className="pop-contributor-actions" data-column="explore"><span className="pop-column-label">Explore</span><button type="button" className="pop-contributor-toggle" aria-expanded={open} aria-controls={`population-${p.id}`} onClick={() => onExpand(open ? null : p.id)}>{open ? 'Close works' : 'Works & evidence'}<ChevronDown size={14} aria-hidden="true" /></button>{p.scholar ? <button type="button" className="pop-profile-link" onClick={e => onOpen(p.scholar!.id, e.currentTarget)}>Open profile</button> : pop?.profileAvailability.teacherId ? <Link to={`/teachers/collections/${pop.profileAvailability.teacherId}`}>Teacher profile &amp; collection available</Link> : <small>No curated profile</small>}</div>
        </div>
        {open && <div className="pop-contributor-body" id={`population-${p.id}`}><ContributorDetails person={p} data={data} /></div>}
      </article>;
    })}
  </div>;
}
