import { useRef } from 'react';
import { CircleCheck, Compass, RadioTower, Sprout, UsersRound } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import { groupLabels, type GroupStatus } from '@/lib/mission-groups';
import type { CountryPanelDesign } from '@/lib/country-panel-designs';
import CountryPeopleGroups from './CountryPeopleGroups';
import CountryFinder from './CountryFinder';
import CountryPanelHeader from './CountryPanelHeader';
import './country-panel-prototype.css';

type Country = typeof snapshot.countries[number];
const keys = Object.keys(groupLabels) as GroupStatus[];
const icons = { unengaged: Compass, engagedUnreached: Sprout, noLongerUnreached: CircleCheck };
const compact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function CountryPanelPrototype({ country, design, panel, choose, setPanel, adopted = false, filter, setFilter, openGroups }: {
  country: Country; design: CountryPanelDesign; panel: 'gospel' | 'groups'; choose(code: string): void;
  setPanel(value: 'gospel' | 'groups'): void;
  adopted?: boolean; filter?: GroupStatus | 'all'; setFilter?(value: GroupStatus | 'all'): void; openGroups?(value: GroupStatus): void;
}) {
  const tabs = useRef<HTMLDivElement>(null);
  const rows = <dl className="mw-prototype-stats">{keys.map(key => {
    const Icon = icons[key];
    return <div key={key} className={`mw-status-${key}`}><dt><Icon size={17} strokeWidth={1.5} aria-hidden="true" /><span>{groupLabels[key]}</span></dt><dd><strong>{country.imb[key].groups}</strong><span>{compact(country.imb[key].population)} people</span></dd></div>;
  })}</dl>;
  let offset = 0;
  const circumference = 2 * Math.PI * 46;
  return <div className={`mw-country-panel mw-prototype mw-design-${design}${adopted ? ' mw-adopted-panel' : ''}`}>
    <CountryPanelHeader country={country} design={adopted ? 'b' : design} adopted={adopted} finder={adopted ? null : <CountryFinder choose={choose} />} />
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
        {design === 'c' ? <div className="mw-prototype-tiles">{keys.map(key => { const Icon = icons[key]; return adopted ? <button type="button" key={key} className={`mw-status-${key}`} aria-label={`View ${groupLabels[key]} people groups`} onClick={() => { openGroups?.(key); requestAnimationFrame(() => tabs.current?.querySelector<HTMLButtonElement>('#mw-groups-tab')?.focus()); }}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><strong>{country.imb[key].groups}</strong><span className="mw-presence-title">{groupLabels[key]}</span><span>{compact(country.imb[key].population)} people</span></button> : <div key={key} className={`mw-status-${key}`}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><strong>{country.imb[key].groups}</strong><h4>{groupLabels[key]}</h4><span>{compact(country.imb[key].population)} people</span></div>; })}</div> : design === 'd' ? <div className="mw-prototype-ring-ledger"><div className="mw-prototype-ring"><svg viewBox="0 0 120 120" aria-hidden="true">{keys.map(key => { const length = country.imb[key].groups / country.imb.totalGroups * circumference; const start = offset; offset += length; return <circle key={key} className={`mw-status-${key}`} cx={60} cy={60} r={46} strokeDasharray={`${Math.max(0, length - 1.5)} ${circumference}`} strokeDashoffset={-start} />; })}</svg><div><strong>{country.imb.totalGroups}</strong><span>groups</span></div></div>{rows}</div> : ['e', 'f', 'g', 'h'].includes(design) ? <div className={`mw-presence-${design}`}>{keys.map(key => {
          const Icon = icons[key], share = country.imb[key].groups / country.imb.totalGroups * 100;
          return <div key={key} className={`mw-presence-entry mw-status-${key}`}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><h4>{groupLabels[key]}</h4><strong>{country.imb[key].groups}<small>groups</small></strong><span>{compact(country.imb[key].population)} people</span>{['e', 'h'].includes(design) && <div className="mw-presence-meter" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>}{design === 'h' && <b>{share.toFixed(1)}% of groups</b>}</div>;
        })}</div> : rows}
        <p className="mw-prototype-note">All recorded groups, including non-Muslim groups. IMB: {snapshot.snapshotDate}.</p>
      </div>
      <div className="mw-prototype-body" role="tabpanel" id="mw-groups-panel" aria-labelledby="mw-groups-tab" hidden={panel !== 'groups'}>{panel === 'groups' && <CountryPeopleGroups layout={adopted ? 'b' : design} filter={filter} onFilterChange={setFilter} key={country.code} code={country.code} name={country.name} count={country.imb.totalGroups} snapshotDate={snapshot.snapshotDate} sourceHash={snapshot.sources.imb.sha256} />}</div>
      <div className="mw-prototype-sources"><a href={`https://peoplegroups.org/country/${country.code}/`} target="_blank" rel="noreferrer">IMB profile ↗</a><a href={snapshot.sources.pew.url} target="_blank" rel="noreferrer">Pew demographics ↗</a></div>
    </article>
  </div>;
}
