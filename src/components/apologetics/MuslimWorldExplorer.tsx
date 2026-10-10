import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Globe2, Map } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import type { MissionGlobe } from '@/lib/mission-globe';
import { groupLabels, type GroupStatus } from '@/lib/mission-groups';
import { countryPanelDesigns, type CountryPanelDesign } from '@/lib/country-panel-designs';
import './muslim-world.css';

const CountryPanelPrototype = lazy(() => import('./CountryPanelPrototype'));
const countries = snapshot.countries;
const number = (value: number) => new Intl.NumberFormat('en').format(value);
const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(snapshot.snapshotDate + 'T12:00:00Z'));

function CountryMap({ code, spinning, onSelect, onPause }: { code: string; spinning: boolean; onSelect(code: string): void; onPause(): void }) {
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), svg = useRef<SVGSVGElement>(null);
  const [viewParams, setViewParams] = useSearchParams();
  const view = viewParams.get('map') === 'flat' ? 'flat' : 'globe';
  const setView = (nextView: 'globe' | 'flat') => {
    onPause();
    const next = new URLSearchParams(viewParams);
    if (nextView === 'flat') next.set('map', 'flat'); else next.delete('map');
    setViewParams(next, { replace: true, preventScrollReset: true });
  };
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
    if (!active || !stage.current) return;
    const abort = new AbortController();
    let globe: MissionGlobe | undefined;
    const host = stage.current, map = canvas.current, flat = svg.current;
    setReady(false); setError(false); setHover('');
    const options = {
        selected: latest.current.code, spinning: latest.current.spinning,
        onSelect: (value: string) => latest.current.onSelect(value), onPause: () => latest.current.onPause(),
        onHover: (value: string) => { if (!abort.signal.aborted) setHover(value); },
    };
    const loading = view === 'globe' && map
      ? import('@/lib/mission-globe').then(({ createMissionGlobe }) => abort.signal.aborted ? undefined : createMissionGlobe(host, map, countries, options, abort.signal))
      : flat ? import('@/lib/mission-flat-map').then(({ createMissionFlatMap }) => abort.signal.aborted ? undefined : createMissionFlatMap(host, flat, countries, options, abort.signal)) : Promise.resolve(undefined);
    void loading.then(result => {
      if (!result) return;
      globe = result;
      if (abort.signal.aborted) { result.destroy(); return; }
      controller.current = result; result.select(latest.current.code, !latest.current.spinning); result.rotate(latest.current.spinning); setReady(true);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { abort.abort(); globe?.destroy(); controller.current = undefined; };
  }, [active, view]);
  useEffect(() => { controller.current?.select(code); }, [code]);
  useEffect(() => { controller.current?.rotate(spinning); }, [spinning]);
  return <figure className="mw-globe">
    <div className={'mw-globe-stage' + (view === 'flat' ? ' is-flat' : '')} ref={stage} tabIndex={0} role="group" aria-busy={!ready && !error} aria-label={view === 'globe' ? 'Interactive globe. Scroll to zoom; arrow keys turn; plus and minus zoom; Space pauses or starts rotation; Home resets. Use the country selector to choose a country.' : 'Interactive flat map. Scroll to zoom; drag or use arrow keys to pan; plus and minus zoom; Home resets. Use the country selector to choose a country.'}>
      {view === 'globe' ? <canvas ref={canvas} aria-hidden="true" /> : <svg ref={svg} className="mw-flat-map" aria-hidden="true" />}
      {!ready && <div className="mw-globe-loading" role="status"><Globe2 size={90} strokeWidth={.5} /><p>{error ? 'The map is unavailable. Choose a country from the selector.' : 'Opening the atlas…'}</p></div>}
      {hover && <span className="mw-map-hover" aria-hidden="true">{hover} <ArrowUpRight size={12} /></span>}
    </div>
    <div className="mw-view-switch" role="group" aria-label="Map view">
      <button type="button" aria-label="Globe view" title="Globe view" aria-pressed={view === 'globe'} onClick={() => setView('globe')}><Globe2 size={20} strokeWidth={1.5} aria-hidden="true" /></button>
      <button type="button" aria-label="Flat map view" title="Flat map view" aria-pressed={view === 'flat'} onClick={() => setView('flat')}><Map size={20} strokeWidth={1.5} aria-hidden="true" /></button>
    </div>
  </figure>;
}

export default function MuslimWorldExplorer() {
  const section = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const requested = params.get('country');
  const requestedDesign = params.get('atlasDesign');
  const prototypeDesign = countryPanelDesigns.find(design => design.id === requestedDesign)?.id;
  const setDesign = (value: CountryPanelDesign) => { const next = new URLSearchParams(params); next.set('atlasDesign', value); setParams(next, { replace: true, preventScrollReset: true }); };
  const country = countries.find(entry => entry.code === requested) ?? countries.find(entry => entry.code === 'PAK')!;
  const [spinning, setSpinning] = useState(() => !requested && !matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(pointer: coarse), (max-width: 760px)').matches);
  const panel = params.get('panel') === 'groups' ? 'groups' : 'gospel';
  const setPanel = (value: 'gospel' | 'groups') => {
    const next = new URLSearchParams(params);
    if (value === 'groups') next.set('panel', 'groups'); else next.delete('panel');
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const requestedFilter = params.get('engagement');
  const filter = requestedFilter && Object.keys(groupLabels).includes(requestedFilter) ? requestedFilter as GroupStatus : 'all';
  const setFilter = (value: GroupStatus | 'all') => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('engagement'); else next.set('engagement', value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const openGroups = (value: GroupStatus) => {
    const next = new URLSearchParams(params); next.set('panel', 'groups'); next.set('engagement', value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
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
  return <div ref={section} className="mw-atlas-container">
    {prototypeDesign && <aside className="mw-design-review" aria-label="Atlas design review">
      <div><span>Country panel options</span><p>{countryPanelDesigns.find(design => design.id === prototypeDesign)?.name}</p></div>
      <div role="group" aria-label="Country panel mock-up">{countryPanelDesigns.map(design => <button key={design.id} type="button" aria-label={`Design ${design.id.toUpperCase()}`} title={design.name} aria-pressed={prototypeDesign === design.id} onClick={() => setDesign(design.id)}>{design.id.toUpperCase()}</button>)}</div>
    </aside>}
    <section id="muslim-world" className="mw-explorer" aria-labelledby="mw-heading">
    <header className="mw-introduction"><div><p className="ap-eyebrow"><Globe2 size={15} aria-hidden="true" /> An atlas for understanding the Muslim world</p><h2 id="mw-heading">A world of people.<br /><em>Learn the place.</em></h2></div><p>A neighbour’s faith has a context. Explore 53 Muslim-majority countries and territories, meet some of their people groups, and understand where a gospel witness is present.</p></header>
    <div className="mw-explorer-layout">
      <CountryMap code={country.code} spinning={spinning} onSelect={choose} onPause={pause} />
      <Suspense fallback={<div className="mw-country-panel" role="status">Opening the country panel…</div>}>
        <CountryPanelPrototype country={country} design={prototypeDesign ?? 'c'} adopted={!prototypeDesign} panel={panel} filter={filter} setFilter={setFilter} openGroups={openGroups} choose={choose} setPanel={setPanel} />
      </Suspense>
    </div>
    <details className="mw-method"><summary>What do “unreached” and “engaged” mean?</summary><div><p>IMB describes a people group as a community within which the gospel can spread without substantial barriers of understanding or acceptance. An unreached group has less than 2% evangelical Christians. “Unengaged” indicates no known effort focused on establishing self-sustaining evangelical churches; engagement describes sustained work toward that goal.</p><p>“No longer unreached” means at least 2% evangelical Christians. It does not mean everyone in a group is Christian, or that a country is fully reached. The globe shows places; the statistics describe people groups.</p><p>Counts aggregate IMB’s published Engagement Progress categories. The demographic figures are Pew’s 2020 estimates, published in 2025; they are not present-day counts. IMB’s separate population total for {country.name} is {number(country.imb.population)}, across its recorded groups. Estimates, classification and country profiles may change.</p><p>Data: <a href={snapshot.sources.imb.url} target="_blank" rel="noreferrer">IMB Global Research</a>, country aggregates prepared by Bible Project from the {date} snapshot, under <a href={snapshot.sources.imb.licenseUrl} target="_blank" rel="noreferrer">CC BY-NC 4.0</a>. <a href="https://peoplegroups.org/definitions/" target="_blank" rel="noreferrer">Read IMB’s definitions.</a> Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a>; country and territory names follow the source datasets.</p></div></details>
    </section>
  </div>;
}
