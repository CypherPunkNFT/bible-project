import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Globe2, Search } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import type { MissionGlobe } from '@/lib/mission-globe';
import './muslim-world.css';

const countries = snapshot.countries;
const labels = { unengaged: 'Unengaged and unreached', engagedUnreached: 'Engaged yet unreached', noLongerUnreached: 'No longer unreached' };
const compact = (number: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
const number = (value: number) => new Intl.NumberFormat('en').format(value);
const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(snapshot.snapshotDate + 'T12:00:00Z'));

function CountryGlobe({ code, spinning, onSelect, onPause }: { code: string; spinning: boolean; onSelect(code: string): void; onPause(): void }) {
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<MissionGlobe>();
  const latest = useRef({ code, spinning, onSelect, onPause });
  const [active, setActive] = useState(() => window.location.hash === '#muslim-world'), [ready, setReady] = useState(false), [error, setError] = useState(false), [hover, setHover] = useState('');
  useEffect(() => { latest.current = { code, spinning, onSelect, onPause }; }, [code, spinning, onSelect, onPause]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } }, { rootMargin: '250px' });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active || !stage.current || !canvas.current) return;
    const abort = new AbortController();
    let globe: MissionGlobe | undefined;
    const host = stage.current, map = canvas.current;
    void import('@/lib/mission-globe').then(({ createMissionGlobe }) => {
      if (abort.signal.aborted) return undefined;
      return createMissionGlobe(host, map, countries, {
        selected: latest.current.code, spinning: latest.current.spinning,
        onSelect: value => latest.current.onSelect(value), onPause: () => latest.current.onPause(),
        onHover: value => { if (!abort.signal.aborted) setHover(value); },
      }, abort.signal);
    }).then(result => {
      if (!result) return;
      globe = result;
      if (abort.signal.aborted) { result.destroy(); return; }
      controller.current = result; result.select(latest.current.code, !latest.current.spinning); result.rotate(latest.current.spinning); setReady(true);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { abort.abort(); globe?.destroy(); controller.current = undefined; };
  }, [active]);
  useEffect(() => { controller.current?.select(code); }, [code]);
  useEffect(() => { controller.current?.rotate(spinning); }, [spinning]);
  return <figure className="mw-globe">
    <div className="mw-globe-stage" ref={stage} tabIndex={0} role="group" aria-busy={!ready && !error} aria-label="Interactive globe. Scroll to zoom; arrow keys turn; plus and minus zoom; Space pauses or starts rotation; Home resets. Use the country selector to choose a country.">
      <canvas ref={canvas} aria-hidden="true" />
      {!ready && <div className="mw-globe-loading" role="status"><Globe2 size={90} strokeWidth={.5} /><p>{error ? 'The map is unavailable. Choose a country from the selector.' : 'Opening the atlas…'}</p></div>}
      {hover && <span className="mw-map-hover" aria-hidden="true">{hover} <ArrowUpRight size={12} /></span>}
    </div>
  </figure>;
}

export default function MuslimWorldExplorer() {
  const section = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const requested = params.get('country');
  const country = countries.find(entry => entry.code === requested) ?? countries.find(entry => entry.code === 'PAK')!;
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [spinning, setSpinning] = useState(() => !requested && !matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(pointer: coarse), (max-width: 760px)').matches);
  const [showGroups, setShowGroups] = useState(false);
  useEffect(() => {
    if (window.location.hash !== '#muslim-world') return;
    const frame = requestAnimationFrame(() => section.current?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const choose = useCallback((code: string) => {
    const next = new URLSearchParams(params); next.set('country', code);
    setParams(next, { replace: true, preventScrollReset: true }); setSpinning(false);
  }, [params, setParams]);
  const pause = useCallback(() => setSpinning(false), []);
  const filtered = countries.filter(entry => entry.name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (region === 'all' || (region === 'africa' ? entry.region.includes('Africa') : region === 'europe' ? entry.region.includes('Europe') : entry.region.includes('Asia'))));
  return <section ref={section} id="muslim-world" className="mw-explorer" aria-labelledby="mw-heading">
    <header className="mw-introduction"><div><p className="ap-eyebrow"><Globe2 size={15} aria-hidden="true" /> An atlas for understanding the Muslim world</p><h2 id="mw-heading">A world of people.<br /><em>Learn the place.</em></h2></div><p>A neighbour’s faith has a context. Explore 53 Muslim-majority countries and territories, meet some of their people groups, and understand where a gospel witness is present.</p></header>
    <div className="mw-explorer-layout">
      <CountryGlobe code={country.code} spinning={spinning} onSelect={choose} onPause={pause} />
      <div className="mw-country-panel">
        <div className="mw-country-picker"><label className="mw-search-label" htmlFor="mw-search"><Search size={14} /> Find a country</label><input id="mw-search" type="search" placeholder="Search all 53 places…" value={search} onChange={event => setSearch(event.target.value)} />
          <div className="mw-select-row"><label><span className="sr-only">Filter by region</span><select aria-label="Filter countries by region" value={region} onChange={event => setRegion(event.target.value)}><option value="all">All regions</option><option value="africa">Africa</option><option value="asia">Asia</option><option value="europe">Europe</option></select></label><label><span className="sr-only">Choose a country</span><select aria-label="Choose a country" value={filtered.some(entry => entry.code === country.code) ? country.code : ''} onChange={event => choose(event.target.value)}><option value="" disabled>{filtered.length ? `${filtered.length} matching places` : 'No matching countries'}</option>{filtered.map(entry => <option value={entry.code} key={entry.code}>{entry.name}</option>)}</select></label></div>
          {filtered.length === 0 && <p role="status">No matches. <button type="button" onClick={() => { setSearch(''); setRegion('all'); }}>Clear filters</button></p>}
        </div>
        <article className="mw-country-detail" aria-label={`${country.name} country profile`}>
          <div className="mw-country-heading"><div><p className="ap-eyebrow">{country.region}</p><h3>{country.name}</h3></div><span>{country.code === 'KOS' ? 'XK' : country.code}</span></div>
          <div className="mw-demographics"><div><strong>{compact(country.population2020)}</strong><span>Population · 2020 estimate</span></div><div><strong>{country.muslimShare2020.toFixed(1)}<small>%</small></strong><span>Identify as Muslim · 2020</span></div></div>
          <div className="mw-religion-bar" aria-hidden="true"><span style={{ width: country.muslimShare2020 + '%' }} /></div>
          <p className="mw-other-religions">{Object.entries(country.religions2020).filter(([name, share]) => name !== 'Muslims' && share >= .1).sort((a, b) => b[1] - a[1]).map(([name, share]) => `${name === 'Christians' ? 'Christian' : name === 'Hindus' ? 'Hindu' : name === 'Buddhists' ? 'Buddhist' : name} ${share.toFixed(1)}%`).join(' · ') || 'Each other religious category is below 0.1%.'}</p>
          <div className="mw-mission-heading"><span>Gospel presence / IMB</span><span>{country.imb.totalGroups} people groups</span></div>
          <div className="mw-status-bar" aria-hidden="true">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <span key={key} className={'mw-status-' + key} style={{ width: country.imb[key].groups / country.imb.totalGroups * 100 + '%' }} />)}</div>
          <dl className="mw-mission-stats">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <div key={key} className={'mw-status-' + key}><dt><i />{labels[key]}</dt><dd><strong>{country.imb[key].groups}</strong><span>{compact(country.imb[key].population)} people</span></dd></div>)}</dl>
          <p className="mw-stat-note">All recorded people groups in this country, including non-Muslim groups. IMB snapshot: {date}.</p>
          <button type="button" className="mw-meet-groups" onClick={() => setShowGroups(!showGroups)} aria-expanded={showGroups} aria-controls="mw-group-examples">{showGroups ? 'Close people-group examples' : 'Meet three of the people groups'} <ArrowUpRight size={15} /></button>
          {showGroups && <div id="mw-group-examples" className="mw-group-examples"><p>Three largest groups in IMB’s country records</p>{country.examples.map(group => <a key={group.id} href={`https://peoplegroups.org/people_groups/${group.id.toLowerCase()}/`} target="_blank" rel="noreferrer"><div><strong>{group.name}</strong><span>{group.language} · {group.religion.replace('Islam - ', '')}</span><small>{labels[group.status as keyof typeof labels]} · {number(group.population)} people</small></div><ArrowUpRight size={15} /></a>)}</div>}
          <div className="mw-country-sources"><a href={`https://peoplegroups.org/country/${country.code}/`} target="_blank" rel="noreferrer">Read the full IMB profile <ArrowUpRight size={13} /></a><a href={snapshot.sources.pew.url} target="_blank" rel="noreferrer">Pew demographics <ArrowUpRight size={13} /></a></div>
        </article>
      </div>
    </div>
    <details className="mw-method"><summary>What do “unreached” and “engaged” mean?</summary><div><p>IMB describes a people group as a community within which the gospel can spread without substantial barriers of understanding or acceptance. An unreached group has less than 2% evangelical Christians. “Unengaged” indicates no known effort focused on establishing self-sustaining evangelical churches; engagement describes sustained work toward that goal.</p><p>“No longer unreached” means at least 2% evangelical Christians. It does not mean everyone in a group is Christian, or that a country is fully reached. The globe shows places; the statistics describe people groups.</p><p>Counts aggregate IMB’s published Engagement Progress categories. The demographic figures are Pew’s 2020 estimates, published in 2025; they are not present-day counts. IMB’s separate population total for {country.name} is {number(country.imb.population)}, across its recorded groups. Estimates, classification and country profiles may change.</p><p>Data: <a href={snapshot.sources.imb.url} target="_blank" rel="noreferrer">IMB Global Research</a>, country aggregates prepared by Bible Project from the {date} snapshot, under <a href={snapshot.sources.imb.licenseUrl} target="_blank" rel="noreferrer">CC BY-NC 4.0</a>. <a href="https://peoplegroups.org/definitions/" target="_blank" rel="noreferrer">Read IMB’s definitions.</a> Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a>; country and territory names follow the source datasets.</p></div></details>
  </section>;
}
