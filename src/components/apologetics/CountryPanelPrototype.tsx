import { useRef, useState } from 'react';
import { CircleCheck, Compass, RadioTower, Search, Sprout, UsersRound } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import { groupLabels, type GroupStatus } from '@/lib/mission-groups';
import CountryPeopleGroups from './CountryPeopleGroups';
import PillScroll from './PillScroll';
import './country-panel-prototype.css';

type Country = typeof snapshot.countries[number];
type Design = 'a' | 'b' | 'c' | 'd';
const keys = Object.keys(groupLabels) as GroupStatus[];
const icons = { unengaged: Compass, engagedUnreached: Sprout, noLongerUnreached: CircleCheck };
const compact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function CountryPanelPrototype({ country, design, panel, choose, setDesign, setPanel }: {
  country: Country; design: Design; panel: 'gospel' | 'groups'; choose(code: string): void;
  setDesign(value: Design): void; setPanel(value: 'gospel' | 'groups'): void;
}) {
  const [search, setSearch] = useState(''), [open, setOpen] = useState(false);
  const tabs = useRef<HTMLDivElement>(null), results = useRef<HTMLDivElement>(null);
  const filtered = snapshot.countries.filter(entry => entry.name.toLowerCase().includes(search.trim().toLowerCase()));
  const select = (code: string) => { choose(code); setSearch(''); setOpen(false); };
  const religions = Object.entries(country.religions2020).filter(([name, share]) => name !== 'Muslims' && share >= .1).sort((a, b) => b[1] - a[1]).map(([name, share]) => `${name === 'Christians' ? 'Christian' : name} ${share.toFixed(1)}%`).join(' · ');
  const rows = <dl className="mw-prototype-stats">{keys.map(key => {
    const Icon = icons[key];
    return <div key={key} className={`mw-status-${key}`}><dt><Icon size={17} strokeWidth={1.5} aria-hidden="true" /><span>{groupLabels[key]}</span></dt><dd><strong>{country.imb[key].groups}</strong><span>{compact(country.imb[key].population)} people</span></dd></div>;
  })}</dl>;
  let offset = 0;
  const circumference = 2 * Math.PI * 46;
  return <div className={`mw-country-panel mw-prototype mw-design-${design}`}>
    <div className="mw-design-toggle" role="group" aria-label="Country panel mock-up"><span>Panel</span>{(['a', 'b', 'c', 'd'] as const).map(value => <button key={value} type="button" aria-label={`Design ${value.toUpperCase()}`} aria-pressed={design === value} onClick={() => setDesign(value)}>{value.toUpperCase()}</button>)}</div>
    <div className="mw-prototype-toolbar">
      <div className="mw-prototype-finder"><label htmlFor="mw-prototype-search"><Search size={13} aria-hidden="true" /> Find a country</label><input id="mw-prototype-search" type="search" aria-label="Find a country" aria-expanded={open && !!search} aria-controls="mw-prototype-results" placeholder="Search all 53 countries" value={search} onChange={event => { setSearch(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={event => {
        if (event.key === 'Escape') setOpen(false);
        if (event.key === 'Enter' && search.trim() && filtered[0]) select(filtered[0].code);
        if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
      }} />
        {open && !!search && <div id="mw-prototype-results" className="mw-prototype-results" ref={results} onKeyDown={event => {
          if (event.key === 'Escape') { setOpen(false); document.getElementById('mw-prototype-search')?.focus(); }
          if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); const buttons = [...results.current!.querySelectorAll<HTMLButtonElement>('button')]; const index = buttons.indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
        }}><PillScroll className="mw-prototype-results-list" label="Country search results"><div>{filtered.map(entry => <button key={entry.code} type="button" onClick={() => select(entry.code)}>{entry.name}</button>)}{!filtered.length && <p role="status">No matching countries.</p>}</div></PillScroll></div>}
      </div>
      <div className="mw-prototype-country" aria-label={`${country.name} country summary`}>
        <div className="mw-prototype-identity"><div><p>{country.region}</p><h3>{country.name}</h3></div><img src={`/assets/muslim-world/flags/${country.code}.svg`} alt={country.code === 'MYT' ? 'French flag for Mayotte' : `${country.name} flag`} width={32} height={24} /></div>
        <div className="mw-prototype-demographics"><div><strong>{compact(country.population2020)}</strong><span>Population · 2020</span></div><div><strong>{country.muslimShare2020.toFixed(1)}<small>%</small></strong><span>Muslim · 2020</span></div></div>
        <p className="mw-prototype-religions">{religions || 'Other categories below 0.1%'}</p>
      </div>
    </div>
    <article className="mw-prototype-card" aria-label={`${country.name} country profile`}>
      <div className="mw-prototype-tabs" role="tablist" aria-label="Country information" ref={tabs}>{(['gospel', 'groups'] as const).map(value => {
        const Icon = value === 'gospel' ? RadioTower : UsersRound;
        return <button key={value} type="button" role="tab" id={`mw-${value}-tab`} aria-controls={`mw-${value}-panel`} aria-selected={panel === value} tabIndex={panel === value ? 0 : -1} onClick={() => setPanel(value)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault(); const next = event.key === 'Home' ? 'gospel' : event.key === 'End' ? 'groups' : panel === 'gospel' ? 'groups' : 'gospel'; setPanel(next); tabs.current?.querySelector<HTMLButtonElement>(`#mw-${next}-tab`)?.focus();
        }}><Icon size={17} strokeWidth={1.5} aria-hidden="true" />{value === 'gospel' ? 'Gospel Presence' : 'People Groups'}{value === 'groups' && <span>{country.imb.totalGroups}</span>}</button>;
      })}</div>
      <div className="mw-prototype-body" role="tabpanel" id="mw-gospel-panel" aria-labelledby="mw-gospel-tab" hidden={panel !== 'gospel'}>
        <div className="mw-prototype-overview"><span>Engagement / IMB</span><span>{country.imb.totalGroups} groups</span></div>
        {design !== 'd' && <div className="mw-status-bar" aria-hidden="true">{keys.map(key => <span key={key} className={`mw-status-${key}`} style={{ width: `${country.imb[key].groups / country.imb.totalGroups * 100}%` }} />)}</div>}
        {design === 'c' ? <div className="mw-prototype-tiles">{keys.map(key => { const Icon = icons[key]; return <div key={key} className={`mw-status-${key}`}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><strong>{country.imb[key].groups}</strong><h4>{groupLabels[key]}</h4><span>{compact(country.imb[key].population)} people</span></div>; })}</div> : design === 'd' ? <div className="mw-prototype-ring-ledger"><div className="mw-prototype-ring"><svg viewBox="0 0 120 120" aria-hidden="true">{keys.map(key => { const length = country.imb[key].groups / country.imb.totalGroups * circumference; const start = offset; offset += length; return <circle key={key} className={`mw-status-${key}`} cx={60} cy={60} r={46} strokeDasharray={`${Math.max(0, length - 1.5)} ${circumference}`} strokeDashoffset={-start} />; })}</svg><div><strong>{country.imb.totalGroups}</strong><span>groups</span></div></div>{rows}</div> : rows}
        <p className="mw-prototype-note">All recorded groups, including non-Muslim groups. IMB: {snapshot.snapshotDate}.</p>
      </div>
      <div className="mw-prototype-body" role="tabpanel" id="mw-groups-panel" aria-labelledby="mw-groups-tab" hidden={panel !== 'groups'}>{panel === 'groups' && <CountryPeopleGroups key={country.code} code={country.code} name={country.name} count={country.imb.totalGroups} snapshotDate={snapshot.snapshotDate} sourceHash={snapshot.sources.imb.sha256} />}</div>
      <div className="mw-prototype-sources"><a href={`https://peoplegroups.org/country/${country.code}/`} target="_blank" rel="noreferrer">IMB profile ↗</a><a href={snapshot.sources.pew.url} target="_blank" rel="noreferrer">Pew demographics ↗</a></div>
    </article>
  </div>;
}
