import { geoCentroid, geoContains, geoDistance, geoOrthographic, geoPath } from 'd3-geo';
import { loadMissionAtlas, missionOutlines } from './mission-atlas';
import { spherePalette, type SphereDesign } from './mission-sphere-themes';

export interface GlobeCountry { code: string; numeric: string | null; name: string }
export interface MissionGlobe {
  select(code: string, center?: boolean): void;
  rotate(value: boolean): void;
  zoom(delta: number): void;
  reset(): void;
  setPalette?(design: SphereDesign): void;
  destroy(): void;
}
const MIN_ZOOM = 1, MAX_ZOOM = 8;
export async function createMissionGlobe(
  host: HTMLElement, canvas: HTMLCanvasElement,
  countries: readonly GlobeCountry[],
  options: { selected: string; spinning: boolean; palette?: SphereDesign; onSelect(code: string): void; onPause(): void; onHover(name: string): void },
  signal: AbortSignal,
): Promise<MissionGlobe> {
  const atlas = await loadMissionAtlas(signal);
  const coastlines = missionOutlines(atlas.land);
  const borders = atlas.countries.map(country => ({ country, lines: missionOutlines(country.geometry) }));
  const available = new Map(atlas.countries.filter(c => c.properties.selectable).map(c => [c.properties.code, c]));
  const centroids = new Map([...available].map(([code, country]) => [code, geoCentroid(country)]));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable. Use the country selector.');
  const projection = geoOrthographic().clipAngle(90).precision(.3);
  const path = geoPath(projection, ctx);
  let destroyed = false, visible = true, pageVisible = !document.hidden;
  let width = 1, height = 1, dpr = 1, radius = 1, zoom = MIN_ZOOM, zoomTarget = MIN_ZOOM, lon = 45, lat = 22;
  let selected = options.selected, spinning = options.spinning, dirty = true, raf = 0, last = 0;
  let hover = '', pointer: { id: number; x: number; y: number; lon: number; lat: number; moved: boolean } | null = null;
  let fly: { lon: number; lat: number; startLon: number; startLat: number; start: number } | null = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const darkTheme = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && scheme.matches);
  let dark = darkTheme();
  let palette = options.palette ?? 'a';
  function invalidate() {
    dirty = true;
    if (!destroyed && visible && pageVisible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  const center = (code: string, animate = true) => {
    const target = centroids.get(code);
    if (!target) return;
    if (Math.abs(((target[0] - lon + 540) % 360) - 180) < .01 && Math.abs(target[1] - lat) < .01) { fly = null; return; }
    if (!animate || reduced.matches) { [lon, lat] = target; fly = null; }
    else fly = { lon: target[0], lat: target[1], startLon: lon, startLat: lat, start: performance.now() };
    invalidate();
  };
  function resize() {
    const box = host.getBoundingClientRect(); width = box.width; height = box.height;
    if (!width || !height) return;
    // Minimum zoom fills the available map width, with room for the horizon stroke.
    dpr = Math.min(devicePixelRatio || 1, 1.5); radius = width / 2 - 1;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    invalidate();
  }
  function draw() {
    const colors = spherePalette(palette, dark);
    // The square globe viewport fits the full Earth at minimum zoom.
    // Line geometry avoids inventing polygon borders at the crop edge.
    projection.rotate([-lon, -lat]).scale(radius * zoom).clipAngle(90).clipExtent([[0, 0], [width, height]]).translate([width / 2, height / 2]);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); ctx!.clearRect(0, 0, width, height);
    ctx!.save(); ctx!.beginPath(); ctx!.rect(0, 0, width, height); ctx!.clip();
    // Colour only the Earth; outside the sphere stays transparent.
    const ocean = ctx!.createRadialGradient(width * .3, height * .22, 0, width * .45, height * .5, width * .9);
    ocean.addColorStop(0, colors.oceanLight); ocean.addColorStop(.55, colors.ocean); ocean.addColorStop(1, colors.oceanDeep);
    ctx!.beginPath(); path({ type: 'Sphere' }); ctx!.fillStyle = ocean; ctx!.fill();
    ctx!.beginPath(); path(atlas.land); ctx!.fillStyle = colors.land; ctx!.fill();
    ctx!.save(); ctx!.clip();
    for (const wash of colors.washes) {
      const facing = Math.cos(geoDistance(wash.position, [lon, lat]));
      const point = projection(wash.position);
      if (facing <= 0 || !point) continue;
      const size = projection.scale() * Math.sin(wash.radius * Math.PI / 180);
      ctx!.save(); ctx!.translate(point[0], point[1]);
      ctx!.rotate(Math.atan2(point[1] - height / 2, point[0] - width / 2)); ctx!.scale(Math.max(.15, facing), 1);
      const gradient = ctx!.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, wash.color); gradient.addColorStop(1, wash.color + '00');
      ctx!.globalAlpha = wash.opacity * Math.min(1, facing * 3); ctx!.fillStyle = gradient; ctx!.fillRect(-size, -size, size * 2, size * 2); ctx!.restore();
    }
    ctx!.restore();
    // A projected coastline and country lines give the sphere its shape without
    // raster imagery, WebGL contexts, shaders or a second canvas.
    ctx!.beginPath(); path(coastlines); ctx!.strokeStyle = colors.coast; ctx!.lineWidth = .8; ctx!.stroke();
    for (const { country, lines } of borders) {
      const code = country.properties.code;
      const active = selected === code, hovered = hover === code;
      if (hovered) { ctx!.beginPath(); path(country); ctx!.fillStyle = colors.hover; ctx!.fill(); }
      ctx!.beginPath(); path(lines);
      ctx!.strokeStyle = active ? colors.selected : !country.properties.selectable ? colors.minority : colors.border; ctx!.lineWidth = active ? 1.9 : .85; ctx!.stroke();
    }
    const position = centroids.get(selected);
    if (position && geoDistance(position, [lon, lat]) < Math.PI / 2) {
      const point = projection(position);
      if (point) {
        ctx!.beginPath(); ctx!.arc(point[0], point[1], 4.5, 0, Math.PI * 2);
        ctx!.fillStyle = colors.selected; ctx!.fill(); ctx!.strokeStyle = colors.markerEdge; ctx!.lineWidth = 1.5; ctx!.stroke();
      }
    }
    ctx!.restore();
    // The outline follows the physical Earth at every zoom, never a fixed crop.
    ctx!.beginPath(); ctx!.arc(width / 2, height / 2, radius * zoom, 0, Math.PI * 2);
    ctx!.strokeStyle = colors.horizon; ctx!.lineWidth = 1; ctx!.stroke();
    dirty = false;
  }
  const hit = (x: number, y: number) => {
    if (x < 0 || y < 0 || x > width || y > height || Math.hypot(x - width / 2, y - height / 2) > radius * zoom) return null;
    const point = projection.invert?.([x, y]); if (!point) return null;
    // Polygon hit takes precedence; enlarged targets make small islands usable.
    for (const [code, country] of available) if (geoContains(country, point)) return code;
    let closest: string | null = null, distance = 10;
    for (const [code, centerPoint] of centroids) {
      if (geoDistance(centerPoint, [lon, lat]) >= Math.PI / 2) continue;
      const screen = projection(centerPoint); if (!screen) continue;
      const gap = Math.hypot(screen[0] - x, screen[1] - y);
      if (gap < distance) { distance = gap; closest = code; }
    }
    if (geoDistance([45.16, -12.82], [lon, lat]) < Math.PI / 2) {
      const mayotte = projection([45.16, -12.82]);
      if (mayotte && Math.hypot(mayotte[0] - x, mayotte[1] - y) < distance) return 'MYT';
    }
    return closest;
  };
  const pause = () => { spinning = false; options.onPause(); fly = null; };
  const coords = (event: PointerEvent) => { const box = host.getBoundingClientRect(); return [event.clientX - box.left, event.clientY - box.top]; };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || pointer) return;
    pause(); const [x, y] = coords(event);
    pointer = { id: event.pointerId, x, y, lon, lat, moved: false };
    host.setPointerCapture(event.pointerId); host.classList.add('is-dragging');
  };
  const move = (event: PointerEvent) => {
    const [x, y] = coords(event);
    if (pointer && pointer.id === event.pointerId) {
      const dx = x - pointer.x, dy = y - pointer.y;
      if (Math.hypot(dx, dy) > 5) pointer.moved = true;
      lon = pointer.lon - dx * 180 / Math.PI / (radius * zoom);
      lat = Math.max(-75, Math.min(75, pointer.lat + dy * 180 / Math.PI / (radius * zoom)));
      invalidate();
    } else {
      const code = hit(x, y) ?? '';
      if (hover !== code) { hover = code; invalidate(); options.onHover(countries.find(c => c.code === code)?.name ?? ''); }
      host.classList.toggle('over-country', !!code);
    }
  };
  const up = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!pointer.moved) { const [x, y] = coords(event); const code = hit(x, y); if (code) options.onSelect(code); }
    pointer = null; host.classList.remove('is-dragging');
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
  };
  const cancel = () => { pointer = null; host.classList.remove('is-dragging'); };
  const leave = () => { if (!pointer) { hover = ''; invalidate(); options.onHover(''); } };
  const adjustZoom = (delta: number) => {
    zoomTarget = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomTarget + delta));
    if (reduced.matches) zoom = zoomTarget;
    invalidate();
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault(); pause();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomTarget * Math.exp(-delta * .001)));
    if (next === zoomTarget) return;
    adjustZoom(next - zoomTarget);
  };
  const key = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=', 'Home', ' '].includes(event.key)) return;
    if (event.key === ' ') { event.preventDefault(); fly = null; spinning = !spinning; invalidate(); return; }
    event.preventDefault(); pause();
    if (event.key === 'ArrowLeft') lon -= 10;
    if (event.key === 'ArrowRight') lon += 10;
    if (event.key === 'ArrowUp') lat = Math.min(75, lat + 10);
    if (event.key === 'ArrowDown') lat = Math.max(-75, lat - 10);
    if (event.key === '+' || event.key === '=') adjustZoom(zoomTarget * .25);
    if (event.key === '-') adjustZoom(-zoomTarget * .2);
    if (event.key === 'Home') { zoom = zoomTarget = 1; center(selected); }
    invalidate();
  };
  const observer = new ResizeObserver(resize); observer.observe(host);
  const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; invalidate(); }, { rootMargin: '50px' }); viewport.observe(host);
  const updateTheme = () => { dark = darkTheme(); invalidate(); };
  const theme = new MutationObserver(updateTheme); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const visibility = () => { pageVisible = !document.hidden; invalidate(); };
  const motion = () => { if (reduced.matches) { pause(); zoom = zoomTarget; } invalidate(); };
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', motion);
  host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', cancel);
  host.addEventListener('pointerleave', leave); host.addEventListener('keydown', key);
  host.addEventListener('wheel', wheel, { passive: false }); scheme.addEventListener('change', updateTheme);
  function frame(time: number) {
    raf = 0;
    if (destroyed || !visible || !pageVisible) { last = time; return; }
    const elapsed = Math.min(Math.max(time - last, 0), 100);
    const zooming = zoom !== zoomTarget;
    // Gestures and country transitions follow display frames; only unattended
    // rotation is capped at 30 fps. Idle and offscreen globes schedule no frames.
    if (dirty || pointer || fly || zooming || elapsed + .5 >= 1000 / 30) {
      if (zooming) {
        zoom += (zoomTarget - zoom) * (1 - Math.exp(-elapsed / 35));
        if (Math.abs(zoomTarget - zoom) < .0005) zoom = zoomTarget;
        dirty = true;
      }
      if (fly) {
        const t = Math.min(1, (time - fly.start) / 650), smooth = t * t * (3 - 2 * t);
        const delta = ((fly.lon - fly.startLon + 540) % 360) - 180;
        lon = fly.startLon + delta * smooth; lat = fly.startLat + (fly.lat - fly.startLat) * smooth;
        if (t === 1) fly = null; dirty = true;
      } else if (spinning && !pointer) { lon += elapsed * .0025; dirty = true; }
      if (dirty) draw(); last = time;
    } else if (!visible || !pageVisible) last = time;
    if (dirty || fly || zoom !== zoomTarget || (spinning && !pointer)) raf = requestAnimationFrame(frame);
  }
  resize(); if (!spinning) center(selected, false); draw(); invalidate();
  return {
    select(code, shouldCenter = true) { selected = code; if (shouldCenter) center(code); invalidate(); },
    rotate(value) { spinning = value; invalidate(); },
    zoom: adjustZoom,
    reset() { zoom = zoomTarget = 1; center(selected); invalidate(); },
    setPalette(design) { if (palette !== design) { palette = design; invalidate(); } },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); observer.disconnect(); viewport.disconnect(); theme.disconnect();
      document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', cancel);
      host.removeEventListener('pointerleave', leave); host.removeEventListener('keydown', key);
      host.removeEventListener('wheel', wheel); scheme.removeEventListener('change', updateTheme);
      host.classList.remove('is-dragging', 'over-country');
    },
  };
}
