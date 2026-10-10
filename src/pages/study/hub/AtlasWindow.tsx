import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import world from "@/data/atlas-map.json";
import { FIRST_JOURNEY } from "@/pages/places/layer-stack-data";
import places from "./atlas-places.json";
import { Icon, StudyLink } from "./shared";
type Mode = 'map' | 'cities' | 'paul';
type Camera = {
    scale: number;
    tx: number;
    ty: number;
};
const project = ([lon, lat]: number[]) => [world.translate[0] + world.scale * lon * Math.PI / 180, world.translate[1] - world.scale * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const journey = FIRST_JOURNEY.map(project), labels = ['Antioch', 'Salamis', 'Paphos', 'Perga', 'Antioch in Pisidia', '', '', 'Derbe'];
const regions: [
    string,
    number,
    number
][] = [['ITALY', 13, 43.4], ['GREECE', 23, 40.6], ['ASIA MINOR', 31, 40.4], ['EGYPT', 29.5, 29.9]];
const descriptions: Record<string, string> = { Corinth: 'A city, a church and the questions of its letters. Enter its setting, then return to the text.', Jerusalem: 'Worship, kingship and the Gospel story meet in one city. Explore its biblical connections.', Rome: 'An imperial capital and the destination of a journey. Follow its connections into Scripture.', Alexandria: 'A city named in Acts. Locate it in the Mediterranean world and open its biblical references.', Antioch: 'A community and a point of departure. Follow its place in the story of the early church.' };
function fit(bounds: number[], height: number): Camera { const [x0, y0] = project([bounds[0], bounds[3]]), [x1, y1] = project([bounds[1], bounds[2]]); const scale = Math.min(900 / (x1 - x0), (height - 160) / (y1 - y0)); return { scale, tx: (1000 - (x1 - x0) * scale) / 2 - x0 * scale, ty: (height - (y1 - y0) * scale) / 2 - y0 * scale }; }
function Compass() { return <div className="atlas-compass" role="img" aria-label="Compass rose, north up"><svg viewBox="0 0 100 100" aria-hidden><circle className="compass-ground" cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="38"/><circle className="compass-inner" cx="50" cy="50" r="31"/>{Array.from({ length: 32 }, (_, i) => <path key={i} d={`M50 12v${i % 4 === 0 ? 7 : 3}`} transform={`rotate(${i * 11.25} 50 50)`}/>)}<path className="compass-diagonals" d="m50 50-19-19 19 11 19-11-11 19 11 19-19-11-19 11 11-19Z"/><path className="compass-north" d="m50 24 8 26-8-4-8 4Z"/><path className="compass-south" d="m50 76-8-26 8 4 8-4Z"/><path d="M25 50h16m18 0h16"/><circle cx="50" cy="50" r="3"/><text x="50" y="9">N</text><text x="92" y="53">E</text><text x="50" y="97">S</text><text x="8" y="53">W</text></svg></div>; }
function MapScene({ mode, chosen, choose }: {
    mode: Mode;
    chosen: string;
    choose: (id: string) => void;
}) {
    const host = useRef<HTMLDivElement>(null), camera = useRef<Camera | null>(null), previous = useRef<Mode>('map');
    const [size, setSize] = useState({ width: 0, height: 600 }), [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => { const motion = matchMedia('(prefers-reduced-motion: reduce)'), change = () => setReduced(motion.matches); motion.addEventListener('change', change); const observer = new ResizeObserver(([e]) => { const width = Math.round(e.contentRect.width), height = Math.round(e.contentRect.height); setSize(old => old.width === width && old.height === height ? old : { width, height }); }); observer.observe(host.current!); return () => { observer.disconnect(); motion.removeEventListener('change', change); }; }, []);
    const height = size.width ? Math.round(1000 * size.height / size.width) : 600;
    useLayoutEffect(() => {
        if (!size.width)
            return;
        const root = host.current!, svg = root.querySelector('svg')!, land = root.querySelector('.map-camera')!, grid = root.querySelector('.map-grid')!, route = root.querySelector('.map-route');
        const height = Math.round(1000 * root.clientHeight / root.clientWidth);
        svg.setAttribute('viewBox', `0 0 1000 ${height}`);
        const overview = fit([8, 43, 29, 44.3], height), [ax, ay] = journey[0], scale = fit([28.6, 37.9, 34, 39.2], height).scale * .88;
        const target = mode === 'paul' ? { scale, tx: 500 - ax * scale, ty: height / 2 - ay * scale } : overview, from = camera.current ?? overview;
        const travel = !reduced && (mode !== previous.current || (!camera.current && mode === 'paul'));
        previous.current = mode;
        let frame = 0;
        root.dataset.phase = travel ? 'zooming' : 'settled';
        root.querySelectorAll('.endpoint-thump').forEach(el => el.classList.remove('endpoint-thump'));
        const anchored = Array.from(svg.querySelectorAll<SVGElement>('[data-lon]')).map(el => ({ el, xy: project([Number(el.dataset.lon), Number(el.dataset.lat)]) }));
        function paint(view: Camera, progress = 1) { camera.current = view; const { scale, tx, ty } = view, point = ([x, y]: number[]) => [x * scale + tx, y * scale + ty]; land.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`); let path = ''; for (let lon = 10; lon <= 45; lon += 5) {
            const [x] = point(project([lon, 0]));
            path += `M${x} 0V${height}`;
        } for (let lat = 25; lat <= 45; lat += 5) {
            const [, y] = point(project([0, lat]));
            path += `M0 ${y}H1000`;
        } grid.setAttribute('d', path); anchored.forEach(({ el, xy }) => el.setAttribute('transform', `translate(${point(xy).join(' ')})`)); if (mode === 'paul') {
            root.querySelectorAll('.map-context .halo,.map-route-origin .halo').forEach(el => el.setAttribute('r', String(17 - 6 * progress)));
            root.querySelectorAll('.map-context .dot,.map-route-origin .dot').forEach(el => el.setAttribute('r', String(4 - progress)));
        } route?.setAttribute('d', `M${journey.map(xy => point(xy).join(' ')).join('L')}`); }
        const finish = () => { root.dataset.phase = 'settled'; root.querySelector('.map-route-stops .map-point:last-child')?.classList.add('endpoint-thump'); };
        function settle() { paint(target); root.dataset.phase = mode === 'paul' && travel ? 'drawing' : 'settled'; if (route && travel) {
            root.querySelector('.map-route-origin')?.classList.add('endpoint-thump');
            route.addEventListener('animationend', finish, { once: true });
        } }
        if (travel) {
            const start = performance.now();
            paint(from, 0);
            const tick = (now: number) => { const t = Math.min(1, (now - start) / 1400), ease = t * t * (3 - 2 * t), scale = from.scale * Math.pow(target.scale / from.scale, ease), cx = (500 - from.tx) / from.scale, cy = (height / 2 - from.ty) / from.scale, nx = (500 - target.tx) / target.scale, ny = (height / 2 - target.ty) / target.scale; paint({ scale, tx: 500 - (cx + (nx - cx) * ease) * scale, ty: height / 2 - (cy + (ny - cy) * ease) * scale }, t); if (t < 1)
                frame = requestAnimationFrame(tick);
            else
                settle(); };
            frame = requestAnimationFrame(tick);
        }
        else
            settle();
        return () => { cancelAnimationFrame(frame); route?.removeEventListener('animationend', finish); };
    }, [mode, size.width, reduced]);
    const shown = places.filter(p => mode === 'cities' ? ['Corinth', 'Jerusalem', 'Rome'].includes(p.name) : mode !== 'paul' || p.name !== 'Antioch');
    return <div ref={host} id="atlas-map"><svg viewBox={`0 0 1000 ${height}`} role="group" aria-label={mode === 'paul' ? 'Paul’s first journey outward, from Antioch through Cyprus to Derbe' : 'Select a place in the Mediterranean world'}><path className="map-grid"/><g className="map-camera"><path className="map-land" d={world.land} fillRule="evenodd" vectorEffect="non-scaling-stroke"/></g><g className="map-context" style={{ pointerEvents: mode === 'paul' ? 'none' : undefined }} aria-hidden={mode === 'paul' || undefined}>{regions.map(([name, lon, lat]) => <text key={name} className="map-region" data-lon={lon} data-lat={lat} textAnchor="middle">{name}</text>)}<text className="map-sea" data-lon="21.5" data-lat="34.8" textAnchor="middle">Mediterranean Sea</text>{shown.map(p => <g key={p.id} className="map-point" data-lon={p.lon} data-lat={p.lat} data-place={mode === 'paul' ? undefined : p.id} role={mode === 'paul' ? undefined : 'button'} tabIndex={mode === 'paul' ? undefined : 0} aria-label={`Select ${p.name}`} aria-pressed={mode === 'paul' ? undefined : chosen === p.id} onClick={() => { if (mode !== 'paul')
        choose(p.id); }} onKeyDown={e => { if (mode !== 'paul' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        choose(p.id);
    } }}><circle className="halo" r={mode === 'paul' ? 11 : 17}/><circle className="dot" r={mode === 'paul' ? 3 : 4}/><text x={p.name === 'Alexandria' ? -14 : 14} y="4" textAnchor={p.name === 'Alexandria' ? 'end' : 'start'}>{p.name}</text></g>)}</g>{mode === 'paul' && <><path className="map-route" pathLength="1"/><g className="map-route-stops">{FIRST_JOURNEY.map(([lon, lat], i) => <g key={i} className={`map-point ${i === 0 ? 'map-route-origin' : 'map-route-stop'}`} data-lon={lon} data-lat={lat}><circle className="halo" r="11"/><circle className="dot map-route-dot" r="3"/>{labels[i] && <text className="map-route-label" x={i === 0 ? 14 : i === 7 ? 16 : 0} y={i === 0 ? 4 : i === 1 || i === 2 ? 27 : -18} textAnchor={i === 0 || i === 7 ? 'start' : 'middle'}>{labels[i]}</text>}</g>)}</g></>}</svg><Compass />{mode === 'paul' && <p className="map-route-credit">First journey outward · Acts 13–14<br />Schematic connections between recorded stops.</p>}</div>;
}
export default function AtlasWindow() {
    const [params, setParams] = useSearchParams(), asked = params.get('atlas');
    const mode: Mode = asked === 'cities' || asked === 'paul' ? asked : 'map';
    const requested = places.find(p => p.id === params.get('place')), chosen = requested && (mode !== 'cities' || ['Corinth', 'Rome', 'Jerusalem'].includes(requested.name)) ? requested : places.find(p => p.name === 'Corinth')!;
    function select(next: Mode, id = chosen.id) { const p = new URLSearchParams(params); p.set('atlas', next); if (next === 'paul')
        p.delete('place');
    else
        p.set('place', id); setParams(p); }
    return <section className="hub-section atlas-section" id="world" aria-labelledby="world-title"><div className="section-heading"><div><p className="eyebrow">02 / Time &amp; place</p><h2 id="world-title">Step into <em>their world.</em></h2></div><p>Put a place to the passage. Enter an ancient city.<br />Follow a life across the map.</p></div><div className="atlas-window"><div className="atlas-scene"><div className="atlas-map-title"><span id="map-kicker">{mode === 'paul' ? 'FOLLOW THE JOURNEY' : mode === 'cities' ? 'ENTER AN ANCIENT CITY' : 'THE BIBLICAL WORLD'}</span></div><MapScene mode={mode} chosen={chosen.id} choose={id => select(mode, id)}/><div className="map-legend"><span><i /><span>{mode === 'paul' ? 'From Antioch, through Cyprus, into Asia Minor' : 'Select a place on the map'}</span></span><span className="atlas-invitation">A passage has a setting. A city has a story. Follow either into the other.</span></div></div><div className="atlas-story"><p className="eyebrow">The Atlas</p><div className="atlas-tabs" role="group" aria-label="Choose a way into Atlas">{([{ id: 'map', icon: 'map', title: 'Explore the map', small: 'A place for every passage', href: '/study/atlas/map' }, { id: 'cities', icon: 'church', title: 'Ancient cities', small: 'The world behind the words', href: '/study/atlas/cities' }, { id: 'paul', icon: 'branch', title: 'Follow Paul', small: 'The road, the churches, the letters', href: '/study/atlas/journeys?focus=paul&lens=story' }] as const).map(item => <div className="atlas-option" key={item.id}><button data-map={item.id} aria-pressed={mode === item.id} onClick={() => { if (mode !== item.id)
        select(item.id); }}><Icon name={item.icon}/><span>{item.title}<small>{item.small}</small></span></button><StudyLink className="atlas-go" to={item.href} aria-label={`Open ${item.title} in the Atlas`}><Icon name="arrow"/></StudyLink></div>)}</div><div className="atlas-copy" aria-live="polite">{mode === 'paul' ? <><h3>The road and<br />the letters.</h3><p>Follow Paul’s recorded journeys, or connect his correspondence with the places in its story.</p><StudyLink to="/study/atlas/journeys?focus=paul&lens=story">Follow Paul’s story<Icon name="arrowUp"/></StudyLink><br /><StudyLink to="/study/atlas/journeys?focus=paul&lens=letters">Explore the letters<Icon name="arrowUp"/></StudyLink></> : <><h3>{chosen.name}</h3><p>{descriptions[chosen.name]}</p><StudyLink to={mode === 'cities' ? `/study/atlas/cities?focus=${chosen.name.toLowerCase()}&view=city` : `/study/atlas/map?place=${chosen.id}`}>{mode === 'cities' ? 'Enter the city' : 'Explore this place'}<Icon name="arrowUp"/></StudyLink></>}</div><StudyLink className="atlas-all" to="/study/atlas"><Icon name="map"/><span>Enter the full Atlas</span><Icon name="arrow"/></StudyLink></div></div></section>;
}
