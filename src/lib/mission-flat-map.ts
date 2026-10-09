import { geoCentroid, geoEqualEarth, geoPath } from 'd3-geo';
import { loadMissionAtlas, missionOutlines } from './mission-atlas';
import { missionCountryColor, missionMapColors as colors } from './mission-map-colors';
import type { GlobeCountry, MissionGlobe } from './mission-globe';

const NS = 'http://www.w3.org/2000/svg', SIZE = 960, HALF = SIZE / 2;

export async function createMissionFlatMap(
  host: HTMLElement, svg: SVGSVGElement, countries: readonly GlobeCountry[],
  options: { selected: string; onSelect(code: string): void; onPause(): void; onHover(name: string): void },
  signal: AbortSignal,
): Promise<MissionGlobe> {
  const atlas = await loadMissionAtlas(signal);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const projection = geoEqualEarth().fitExtent([[16, 240], [SIZE - 16, SIZE - 240]], atlas.land);
  const path = geoPath(projection).digits(1);
  const group = document.createElementNS(NS, 'g');
  const targets = new Map<string, SVGPathElement>();
  const centers = new Map<string, [number, number]>();
  const names = new Map(countries.map(country => [country.code, country.name]));
  const appendPath = (d: string | null, className: string) => {
    const element = document.createElementNS(NS, 'path');
    element.setAttribute('d', d ?? ''); element.setAttribute('class', className);
    element.setAttribute('vector-effect', 'non-scaling-stroke'); group.append(element); return element;
  };
  appendPath(path({ type: 'Sphere' }), 'mw-flat-ocean').setAttribute('fill', colors.ocean);
  appendPath(path(atlas.land), 'mw-flat-land').setAttribute('fill', colors.land);
  appendPath(path(missionOutlines(atlas.land)), 'mw-flat-coast');
  for (const country of atlas.countries) {
    const { code, selectable } = country.properties;
    const target = appendPath(path(country), 'mw-flat-border' + (selectable ? ' mw-flat-country' : ' is-minority'));
    target.style.setProperty('--mw-country-fill', missionCountryColor(code));
    target.dataset.country = code;
    if (!selectable) continue;
    targets.set(code, target);
    const center = projection(geoCentroid(country));
    if (center) centers.set(code, center);
  }
  const marker = document.createElementNS(NS, 'circle');
  marker.setAttribute('class', 'mw-flat-marker'); marker.setAttribute('r', '4.5'); marker.setAttribute('vector-effect', 'non-scaling-stroke'); group.append(marker);
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`); svg.replaceChildren(group);
  let selected = options.selected, zoom = 1, panX = 0, panY = 0;
  let pointer: { id: number; x: number; y: number; panX: number; panY: number; moved: boolean } | null = null;
  let hover = '';
  const transform = () => {
    const bound = HALF * (zoom - 1);
    panX = Math.max(-bound, Math.min(bound, panX)); panY = Math.max(-bound, Math.min(bound, panY));
    group.setAttribute('transform', `translate(${HALF + panX} ${HALF + panY}) scale(${zoom}) translate(${-HALF} ${-HALF})`);
    marker.setAttribute('r', String(4.5 / zoom));
  };
  const select = (code: string, center = true) => {
    targets.get(selected)?.classList.remove('is-selected');
    selected = code;
    targets.get(code)?.classList.add('is-selected');
    const position = centers.get(code);
    marker.style.display = position ? '' : 'none';
    if (position) {
      marker.setAttribute('cx', String(position[0])); marker.setAttribute('cy', String(position[1]));
      if (center && zoom > 1) { panX = (HALF - position[0]) * zoom; panY = (HALF - position[1]) * zoom; }
    }
    transform();
  };
  const hit = (event: PointerEvent): string => {
    const target = event.target instanceof Element ? event.target.closest<SVGElement>('[data-country]') : null;
    const code = target?.dataset.country;
    if (code && targets.has(code)) return code;
    const box = host.getBoundingClientRect(), x = (event.clientX - box.left) * SIZE / box.width, y = (event.clientY - box.top) * SIZE / box.height;
    let closest = '', distance = 10 * SIZE / box.width;
    for (const [code, center] of centers) {
      const gap = Math.hypot((center[0] - HALF) * zoom + HALF + panX - x, (center[1] - HALF) * zoom + HALF + panY - y);
      if (gap < distance) { closest = code; distance = gap; }
    }
    return closest;
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || pointer) return;
    options.onPause(); pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, panX, panY, moved: false };
    host.setPointerCapture(event.pointerId); host.classList.add('is-dragging');
  };
  const move = (event: PointerEvent) => {
    if (pointer && event.pointerId === pointer.id) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (Math.hypot(dx, dy) > 5) pointer.moved = true;
      const scale = SIZE / host.getBoundingClientRect().width;
      panX = pointer.panX + dx * scale; panY = pointer.panY + dy * scale; transform(); return;
    }
    const code = hit(event);
    if (code !== hover) { targets.get(hover)?.classList.remove('is-hovered'); hover = code; targets.get(hover)?.classList.add('is-hovered'); options.onHover(names.get(code) ?? ''); }
    host.classList.toggle('over-country', !!code);
  };
  const up = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    // Pointer capture retargets pointerup to the host; use the actual element below it.
    if (!pointer.moved) {
      const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<SVGElement>('[data-country]');
      const code = element?.dataset.country ?? hit(event); if (code && targets.has(code)) options.onSelect(code);
    }
    pointer = null; host.classList.remove('is-dragging');
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
  };
  const cancel = () => { pointer = null; host.classList.remove('is-dragging'); };
  const leave = () => { if (!pointer) { targets.get(hover)?.classList.remove('is-hovered'); hover = ''; host.classList.remove('over-country'); options.onHover(''); } };
  const adjustZoom = (next: number) => {
    const clamped = Math.max(1, Math.min(8, next));
    panX *= clamped / zoom; panY *= clamped / zoom; zoom = clamped; transform();
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault(); options.onPause();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
    adjustZoom(zoom * Math.exp(-delta * .001));
  };
  const key = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=', 'Home', ' '].includes(event.key)) return;
    event.preventDefault(); options.onPause();
    if (event.key === 'ArrowLeft') panX += 40;
    if (event.key === 'ArrowRight') panX -= 40;
    if (event.key === 'ArrowUp') panY += 40;
    if (event.key === 'ArrowDown') panY -= 40;
    if (event.key === '+' || event.key === '=') adjustZoom(zoom * 1.25);
    if (event.key === '-') adjustZoom(zoom / 1.25);
    if (event.key === 'Home') { zoom = 1; panX = panY = 0; } transform();
  };
  host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', cancel); host.addEventListener('pointerleave', leave);
  host.addEventListener('wheel', wheel, { passive: false }); host.addEventListener('keydown', key);
  select(selected, false);
  return {
    select, rotate() {}, zoom(delta) { adjustZoom(zoom + delta); }, reset() { zoom = 1; panX = panY = 0; transform(); },
    destroy() {
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', cancel); host.removeEventListener('pointerleave', leave);
      host.removeEventListener('wheel', wheel); host.removeEventListener('keydown', key); svg.replaceChildren();
      host.classList.remove('is-dragging', 'over-country');
    },
  };
}
