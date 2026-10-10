import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, CircleCheck, Compass, Search, Sprout } from 'lucide-react';
import { groupLabels, type GroupStatus } from '@/lib/mission-groups';
import type { CountryPanelDesign } from '@/lib/country-panel-designs';
import PillScroll from './PillScroll';
import './country-people-groups.css';

interface PeopleGroup { id: string; name: string; language: string | null; religion: string; population: number; status: GroupStatus }
interface CountryGroups { country: string; snapshotDate: string; sourceSha256: string; groups: PeopleGroup[] }
const cache = new Map<string, CountryGroups>();
const format = (value: number) => new Intl.NumberFormat('en').format(value);
const keys = Object.keys(groupLabels) as GroupStatus[];
const icons = { unengaged: Compass, engagedUnreached: Sprout, noLongerUnreached: CircleCheck };
const groupLink = (group: PeopleGroup) => <strong>{group.name}</strong>;
const badge = (group: PeopleGroup) => { const Icon = icons[group.status]; return <span className={`mw-pg-badge mw-pg-${group.status}`}><Icon size={14} aria-hidden="true" />{groupLabels[group.status]}</span>; };
const language = (group: PeopleGroup) => group.language || 'Language not reported';
const religion = (group: PeopleGroup) => group.religion.replace('Islam - ', '');

export default function CountryPeopleGroups({ code, name, count, snapshotDate, sourceHash, layout = 'a', filter, onFilterChange }: {
  code: string; name: string; count: number; snapshotDate: string; sourceHash: string; layout?: CountryPanelDesign;
  filter?: GroupStatus | 'all'; onFilterChange?(value: GroupStatus | 'all'): void;
}) {
  const [data, setData] = useState<CountryGroups | undefined>(() => cache.get(code));
  const [error, setError] = useState(false), [search, setSearch] = useState(''), [localStatus, setLocalStatus] = useState<GroupStatus | 'all'>('all');
  const status = filter ?? localStatus;
  const setStatus = (value: GroupStatus | 'all') => onFilterChange ? onFilterChange(value) : setLocalStatus(value);
  const [focused, setFocused] = useState<string>();
  useEffect(() => {
    if (cache.has(code)) return;
    const abort = new AbortController();
    void fetch(`/assets/muslim-world/people-groups/${code}.json`, { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('People groups are unavailable.');
      const result = await response.json() as CountryGroups;
      if (result.country !== code || result.snapshotDate !== snapshotDate || result.sourceSha256 !== sourceHash || result.groups.length !== count || new Set(result.groups.map(group => group.id)).size !== count) throw new Error('People-group snapshot does not match the country summary.');
      if (!abort.signal.aborted) { cache.set(code, result); setData(result); }
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => abort.abort();
  }, [code, count, snapshotDate, sourceHash]);
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data?.groups.filter(group => (status === 'all' || group.status === status) && `${group.name} ${group.language ?? ''} ${group.religion}`.toLowerCase().includes(query)) ?? [];
  }, [data, search, status]);
  if (error) return <p className="mw-groups-message" role="status">The people-group list could not be loaded. Reload this page to load the local snapshot.</p>;
  if (!data) return <p className="mw-groups-message" role="status">Opening the people groups…</p>;
  const current = groups.find(group => group.id === focused) ?? groups[0];
  const facts = (group: PeopleGroup) => <dl className="mw-pg-facts"><div><dt>Population</dt><dd>{format(group.population)} <small>people</small></dd></div><div><dt>Language</dt><dd>{language(group)}</dd></div><div><dt>Religion</dt><dd>{religion(group)}</dd></div></dl>;
  const languages = [...new Set(groups.map(language))].sort((a, b) => a.localeCompare(b));
  return <div className={`mw-people-groups mw-pg-layout-${layout}`}>
    <div className="mw-group-filters"><label><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search people groups" placeholder="Name, language or religion…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    <div className="mw-pg-filters" role="group" aria-label="Filter people groups by engagement">
      <button type="button" aria-pressed={status === 'all'} onClick={() => setStatus('all')}><span>All groups</span><b>{count}</b></button>
      {keys.map(key => { const Icon = icons[key]; return <button key={key} type="button" className={`mw-pg-${key}`} aria-pressed={status === key} onClick={() => setStatus(key)}><Icon size={15} aria-hidden="true" /><span>{groupLabels[key]}</span><b>{data.groups.filter(group => group.status === key).length}</b></button>; })}
    </div>
    <p className="mw-group-count" role="status">{groups.length === count ? `All ${count} recorded groups` : `${groups.length} of ${count} recorded groups`}</p>
    <PillScroll className="mw-groups-scroll" label={`${name} people groups table`}>
      {layout === 'a' && <table className="mw-groups-table mw-pg-ledger"><caption className="sr-only">{name}: IMB people groups, ordered by population</caption><thead><tr><th scope="col">People group</th><th scope="col">Population</th><th scope="col">Engagement</th></tr></thead><tbody>{groups.map(group => <tr key={group.id} data-people-group={group.id}><td>{groupLink(group)}<span>{language(group)} · {religion(group)}</span></td><td>{format(group.population)}</td><td>{badge(group)}</td></tr>)}</tbody></table>}
      {layout === 'b' && <div className="mw-pg-editorial">{groups.map(group => <article key={group.id} data-people-group={group.id} className={`mw-pg-row mw-pg-${group.status}`}>
        <div><h4>{groupLink(group)}</h4><p>{language(group)} · {religion(group)}</p>{badge(group)}</div><strong>{format(group.population)}<small>people</small></strong>
      </article>)}</div>}
      {layout === 'c' && <div className="mw-pg-sections">{keys.map(key => {
        const matches = groups.filter(group => group.status === key); if (!matches.length) return null;
        const Icon = icons[key];
        return <section key={key} className={`mw-pg-section mw-pg-${key}`}><h4><Icon size={17} aria-hidden="true" /><span>{groupLabels[key]}</span><b>{matches.length}</b></h4><p className="mw-pg-chapter-total">{format(matches.reduce((sum, group) => sum + group.population, 0))} people across {matches.length} groups</p><ul>{matches.map(group => <li key={group.id} data-people-group={group.id}><div>{groupLink(group)}<strong>{format(group.population)}</strong></div><p>{language(group)} · {religion(group)}</p></li>)}</ul></section>;
      })}</div>}
      {layout === 'd' && <div className="mw-pg-directory">{groups.map(group => <details key={group.id} data-people-group={group.id} className={`mw-pg-entry mw-pg-${group.status}`}><summary><span className="mw-pg-entry-title"><strong>{group.name}</strong>{badge(group)}</span><span className="mw-pg-entry-population">{format(group.population)}<small>people</small></span><ChevronDown size={15} aria-hidden="true" /></summary><div className="mw-pg-entry-details">{facts(group)}{groupLink(group)}</div></details>)}</div>}
      {layout === 'e' && <div className="mw-pg-focus"><div className="mw-pg-focus-index" role="group" aria-label="Choose a people group">{groups.map(group => <button type="button" key={group.id} data-people-group={group.id} aria-pressed={current?.id === group.id} onClick={() => setFocused(group.id)}><span>{group.name}</span><small>{format(group.population)} people</small></button>)}</div>{current && <article className={`mw-pg-focus-detail mw-pg-${current.status}`}><p className="mw-pg-kicker">People group profile</p><h4>{groupLink(current)}</h4>{badge(current)}{facts(current)}</article>}</div>}
      {layout === 'f' && <div className="mw-pg-languages">{languages.map(value => { const matches = groups.filter(group => language(group) === value); return <section key={value}><h4>{value}<span>{matches.length} groups</span></h4>{matches.map(group => <article key={group.id} data-people-group={group.id} className={`mw-pg-language-row mw-pg-${group.status}`}><div>{groupLink(group)}<p>{religion(group)} · {format(group.population)} people</p></div>{badge(group)}</article>)}</section>; })}</div>}
      {layout === 'g' && <table className="mw-pg-matrix"><caption className="sr-only">{name}: engagement comparison. U: unengaged and unreached, E: engaged yet unreached, R: no longer unreached.</caption><thead><tr><th scope="col">People group / population</th>{keys.map((key, index) => <th scope="col" key={key} title={groupLabels[key]} aria-label={groupLabels[key]}>{['U', 'E', 'R'][index]}</th>)}</tr></thead><tbody>{groups.map(group => <tr key={group.id} data-people-group={group.id}><th scope="row">{groupLink(group)}<span>{format(group.population)} people</span><small>{language(group)} · {religion(group)}</small></th>{keys.map(key => { const Icon = icons[key]; return <td key={key} className={`mw-pg-${key}`}>{key === group.status && <><Icon size={17} aria-hidden="true" /><span className="sr-only">{groupLabels[key]}</span></>}</td>; })}</tr>)}</tbody></table>}
      {layout === 'h' && <div className="mw-pg-sheets">{groups.map(group => <article key={group.id} data-people-group={group.id} className={`mw-pg-sheet mw-pg-${group.status}`}><header><h4>{groupLink(group)}</h4>{badge(group)}</header>{facts(group)}</article>)}</div>}
      {groups.length === 0 && <p className="mw-groups-message">No people groups match these filters.</p>}
    </PillScroll>
    <footer className="mw-pg-source-records"><details><summary>Original records and credits</summary><p>IMB Global Research. Snapshot: {snapshotDate}. Source links refer to the provider’s current records; their figures may differ from this dated local snapshot.</p><ul>{groups.map(group => <li key={group.id}><a href={`https://peoplegroups.org/people_groups/${group.id.toLowerCase()}/`} target="_blank" rel="noreferrer">{group.name} <ArrowUpRight size={12} aria-hidden="true" /></a></li>)}</ul></details></footer>
    <p className="mw-stat-note">All IMB-recorded groups in {name}, including non-Muslim groups. Population and engagement use the {snapshotDate} snapshot.</p>
  </div>;
}
