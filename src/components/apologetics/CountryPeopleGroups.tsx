import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { groupLabels, type GroupStatus } from '@/lib/mission-groups';
import PillScroll from './PillScroll';
interface PeopleGroup { id: string; name: string; language: string | null; religion: string; population: number; status: GroupStatus }
interface CountryGroups { country: string; snapshotDate: string; sourceSha256: string; groups: PeopleGroup[] }
const cache = new Map<string, CountryGroups>();
const format = (value: number) => new Intl.NumberFormat('en').format(value);

export default function CountryPeopleGroups({ code, name, count, snapshotDate, sourceHash }: { code: string; name: string; count: number; snapshotDate: string; sourceHash: string }) {
  const [data, setData] = useState<CountryGroups | undefined>(() => cache.get(code));
  const [error, setError] = useState(false), [search, setSearch] = useState(''), [status, setStatus] = useState('all');
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
    return data?.groups.filter(group => (status === 'all' || group.status === status) && `${group.name} ${group.language} ${group.religion}`.toLowerCase().includes(query)) ?? [];
  }, [data, search, status]);
  if (error) return <p className="mw-groups-message" role="status">The people-group list could not be loaded. <a href={`https://peoplegroups.org/country/${code}/`} target="_blank" rel="noreferrer">Read IMB’s country profile <ArrowUpRight size={13} /></a></p>;
  if (!data) return <p className="mw-groups-message" role="status">Opening the people groups…</p>;
  return <div className="mw-people-groups">
    <div className="mw-group-filters"><label><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search people groups" placeholder="Name, language or religion…" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filter people groups by engagement" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All engagement statuses</option>{Object.entries(groupLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    <p className="mw-group-count" role="status">{groups.length === count ? `All ${count} recorded groups` : `${groups.length} of ${count} recorded groups`}</p>
    <PillScroll className="mw-groups-scroll" label={`${name} people groups table`}>
      <table className="mw-groups-table"><caption className="sr-only">{name}: IMB people groups, ordered by population</caption><thead><tr><th scope="col">People group</th><th scope="col">Population</th><th scope="col">Engagement</th></tr></thead><tbody>{groups.map(group => <tr key={group.id}><td><a href={`https://peoplegroups.org/people_groups/${group.id.toLowerCase()}/`} target="_blank" rel="noreferrer">{group.name}<ArrowUpRight size={12} aria-hidden="true" /></a><span>{group.language || 'Language not reported'} · {group.religion.replace('Islam - ', '')}</span></td><td>{format(group.population)}</td><td><span className={'mw-group-status mw-status-' + group.status}><i aria-hidden="true" />{groupLabels[group.status]}</span></td></tr>)}</tbody></table>
      {groups.length === 0 && <p className="mw-groups-message">No people groups match these filters.</p>}
    </PillScroll>
    <p className="mw-stat-note">All IMB-recorded groups in {name}, including non-Muslim groups. Population and engagement use the {snapshotDate} snapshot.</p>
  </div>;
}
