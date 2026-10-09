import { geoCentroid, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

export interface GlobeCountry { code: string; numeric: string | null; name: string }
export interface MissionGlobe {
  select(code: string, center?: boolean): void;
  rotate(value: boolean): void;
  zoom(delta: number): void;
  reset(): void;
  destroy(): void;
}
type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;
const RAD = Math.PI / 180;
const VERTEX = `#version 300 es
in vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
// Adapted from design/apostle-directions-2/js/globe.js. Its orthographic inverse
// matches d3's country projection, so geography, surface imagery and picking agree.
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 resolution; uniform vec2 rotation; uniform float radius;
uniform sampler2D earth; uniform float ready; uniform float dark;
out vec4 color;
const float PI=3.14159265359;
void main(){
 vec2 p=(gl_FragCoord.xy-resolution*.5)/radius;
 float rho=length(p), edge=1.-smoothstep(1.-1.5/radius,1.,rho);
 if(edge<=0.){color=vec4(0.);return;}
 float c=asin(min(rho,1.)),sc=sin(c),cc=cos(c),la0=rotation.y;
 float lat=asin(clamp(cc*sin(la0)+(rho>1e-6?p.y*sc*cos(la0)/rho:0.),-1.,1.));
 float lon=rotation.x+atan(p.x*sc,rho*cc*cos(la0)-p.y*sc*sin(la0));
 lon=mod(lon+PI,2.*PI)-PI;
 vec2 uv=vec2((lon+PI)/(2.*PI),(.5-lat/PI));
 vec3 photo=texture(earth,uv).rgb,soft=texture(earth,uv,2.).rgb;
 float light=dot(photo,vec3(.299,.587,.114));
 float water=smoothstep(.01,.08,soft.b-soft.r)*(1.-smoothstep(.14,.34,dot(soft,vec3(.299,.587,.114))));
 vec3 sea=mix(vec3(.78,.83,.80),vec3(.065,.12,.14),dark);
 vec3 lo=mix(vec3(.43,.49,.37),vec3(.22,.29,.24),dark);
 vec3 hi=mix(vec3(.86,.80,.64),vec3(.63,.59,.45),dark);
 vec3 land=mix(lo,hi,smoothstep(.04,.7,light));
 land=mix(land,land*(photo/max(light,.05)),.24);
 vec3 col=mix(land,sea,water);
 col=mix(sea,col,ready);
 col*=mix(mix(.77,.54,dark),1.,pow(cc,.55));
 color=vec4(col*edge,edge);
}`;

export async function createMissionGlobe(
  host: HTMLElement, surface: HTMLCanvasElement, overlay: HTMLCanvasElement,
  countries: readonly GlobeCountry[],
  options: { selected: string; spinning: boolean; onSelect(code: string): void; onPause(): void; onHover(name: string): void; onFallback(): void },
  signal: AbortSignal,
): Promise<MissionGlobe> {
  const response = await fetch('/assets/muslim-world/countries-50m.json', { signal });
  if (!response.ok) throw new Error('Country map could not be loaded.');
  const topology = await response.json() as Topology<{ countries: GeometryCollection }>;
  const all = feature(topology, topology.objects.countries) as FeatureCollection<Polygon | MultiPolygon, { name: string }>;
  const boundaries = mesh(topology, topology.objects.countries, (a, b) => a !== b);
  const available = new Map<string, CountryFeature>();
  for (const country of countries) {
    const found = all.features.find(f => country.numeric ? String(f.id) === country.numeric : f.properties.name === country.name);
    if (found) available.set(country.code, found);
  }
  // Natural Earth includes Mayotte in France's multipart geometry. Extract its
  // actual island polygons, without inventing a border or moving a country pin.
  const france = all.features.find(f => String(f.id) === '250');
  if (france?.geometry.type === 'MultiPolygon') {
    const islands = france.geometry.coordinates.filter(p => p[0].some(([lon, lat]) => lon > 44 && lon < 46 && lat > -14 && lat < -12));
    if (islands.length) available.set('MYT', { type: 'Feature', properties: { name: 'Mayotte' }, geometry: { type: 'MultiPolygon', coordinates: islands } });
  }
  const ctx = overlay.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable. Use the country selector.');
  const projection = geoOrthographic().clipAngle(90).precision(.3);
  const path = geoPath(projection, ctx);
  const graticule = geoGraticule10();
  let gl: WebGL2RenderingContext | null = surface.getContext('webgl2', { alpha: true, antialias: true });
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, texture: WebGLTexture | null = null;
  const shaders: WebGLShader[] = [];
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let photoReady = false, destroyed = false, visible = true, pageVisible = !document.hidden;
  let width = 1, height = 1, dpr = 1, radius = 1, zoom = 1, lon = 45, lat = 22;
  let selected = options.selected, spinning = options.spinning, dirty = true, raf = 0, last = 0;
  let hover = '', pointer: { id: number; x: number; y: number; lon: number; lat: number; moved: boolean } | null = null;
  let fly: { lon: number; lat: number; startLon: number; startLat: number; start: number } | null = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const darkTheme = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const dropGL = () => {
    if (gl) {
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach(shader => gl?.deleteShader(shader));
    }
    gl = null; photoReady = false; surface.hidden = true; dirty = true; options.onFallback();
  };
  if (gl) {
    try {
      const compile = (type: number, source: string) => {
        const shader = gl!.createShader(type)!; shaders.push(shader);
        gl!.shaderSource(shader, source); gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error('Globe shader failed.');
        return shader;
      };
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Globe shader linking failed.');
      gl.useProgram(program);
      buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['resolution', 'rotation', 'radius', 'earth', 'ready', 'dark'].map(name => [name, gl!.getUniformLocation(program!, name)]));
      texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([30, 55, 60, 255]));
      const image = new Image(); image.src = '/assets/muslim-world/earth.jpg';
      void image.decode().then(() => {
        if (!gl || destroyed || signal.aborted) return;
        const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        let source: TexImageSource = image;
        if (image.width > max) {
          const fitted = document.createElement('canvas'); fitted.width = max; fitted.height = Math.round(image.height * max / image.width);
          fitted.getContext('2d')!.drawImage(image, 0, 0, fitted.width, fitted.height); source = fitted;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        photoReady = true; dirty = true;
      }).catch(() => { if (!destroyed && !signal.aborted) dropGL(); });
    } catch { dropGL(); }
  } else options.onFallback();

  const center = (code: string) => {
    const country = available.get(code);
    const target = country ? geoCentroid(country) : code === 'MYT' ? [45.16, -12.82] : null;
    if (!target) return;
    if (reduced.matches) { [lon, lat] = target; fly = null; }
    else fly = { lon: target[0], lat: target[1], startLon: lon, startLat: lat, start: performance.now() };
    dirty = true;
  };
  function resize() {
    const box = host.getBoundingClientRect(); width = box.width; height = box.height;
    if (!width || !height) return;
    dpr = Math.min(devicePixelRatio || 1, 2); radius = Math.min(width, height) * .46;
    for (const canvas of [surface, overlay]) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); }
    dirty = true;
  }
  function draw() {
    const dark = darkTheme();
    projection.rotate([-lon, -lat]).scale(radius * zoom).translate([width / 2, height / 2]);
    if (gl && program) {
      gl.viewport(0, 0, surface.width, surface.height); gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, surface.width, surface.height);
      gl.uniform2f(uniforms.rotation, lon * RAD, lat * RAD);
      gl.uniform1f(uniforms.radius, radius * zoom * dpr);
      gl.uniform1f(uniforms.dark, dark ? 1 : 0); gl.uniform1f(uniforms.ready, photoReady ? 1 : 0);
      gl.uniform1i(uniforms.earth, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); ctx!.clearRect(0, 0, width, height);
    if (!gl || !photoReady) {
      ctx!.beginPath(); path({ type: 'Sphere' }); ctx!.fillStyle = dark ? '#183136' : '#c8d5cf'; ctx!.fill();
      ctx!.beginPath(); path(all); ctx!.fillStyle = dark ? '#4d5f4b' : '#8b987c'; ctx!.fill();
    }
    ctx!.beginPath(); path(graticule); ctx!.strokeStyle = dark ? '#ffffff10' : '#28484418'; ctx!.lineWidth = .5; ctx!.stroke();
    ctx!.beginPath(); path(boundaries); ctx!.strokeStyle = dark ? '#e7ecdb40' : '#273b3860'; ctx!.lineWidth = .55; ctx!.stroke();
    for (const [code, country] of available) {
      ctx!.beginPath(); path(country);
      const active = selected === code, hovered = hover === code;
      ctx!.fillStyle = active ? '#e3b77362' : hovered ? '#cdece966' : dark ? '#8eb7b032' : '#578e8638'; ctx!.fill();
      ctx!.strokeStyle = active ? '#f0c47e' : dark ? '#a4cfbd88' : '#47695eaa'; ctx!.lineWidth = active ? 1.7 : .75; ctx!.stroke();
    }
    const current = available.get(selected);
    const position: [number, number] | null = current ? geoCentroid(current) : selected === 'MYT' ? [45.16, -12.82] : null;
    if (position && geoDistance(position, [lon, lat]) < Math.PI / 2) {
      const point = projection(position);
      if (point) {
        ctx!.beginPath(); ctx!.arc(point[0], point[1], 4.5, 0, Math.PI * 2);
        ctx!.fillStyle = '#f0c47e'; ctx!.fill(); ctx!.strokeStyle = '#332b20'; ctx!.lineWidth = 1.5; ctx!.stroke();
      }
    }
    ctx!.beginPath(); path({ type: 'Sphere' }); ctx!.strokeStyle = dark ? '#8eb7b056' : '#53766956'; ctx!.lineWidth = 1; ctx!.stroke();
    dirty = false;
  }
  const hit = (x: number, y: number) => {
    if (Math.hypot(x - width / 2, y - height / 2) > radius * zoom) return null;
    const point = projection.invert?.([x, y]); if (!point) return null;
    // Polygon hit takes precedence; enlarged targets make small islands usable.
    for (const [code, country] of available) if (geoContains(country, point)) return code;
    let closest: string | null = null, distance = 10;
    for (const [code, country] of available) {
      const centerPoint = geoCentroid(country);
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
      dirty = true;
    } else {
      const code = hit(x, y) ?? '';
      if (hover !== code) { hover = code; dirty = true; options.onHover(countries.find(c => c.code === code)?.name ?? ''); }
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
  const leave = () => { if (!pointer) { hover = ''; dirty = true; options.onHover(''); } };
  const key = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=', 'Home'].includes(event.key)) return;
    event.preventDefault(); pause();
    if (event.key === 'ArrowLeft') lon -= 10;
    if (event.key === 'ArrowRight') lon += 10;
    if (event.key === 'ArrowUp') lat = Math.min(75, lat + 10);
    if (event.key === 'ArrowDown') lat = Math.max(-75, lat - 10);
    if (event.key === '+' || event.key === '=') zoom = Math.min(3, zoom + .25);
    if (event.key === '-') zoom = Math.max(1, zoom - .25);
    if (event.key === 'Home') { zoom = 1; center(selected); }
    dirty = true;
  };
  const contextLost = (event: Event) => { event.preventDefault(); dropGL(); };
  const observer = new ResizeObserver(resize); observer.observe(host);
  const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; }, { rootMargin: '50px' }); viewport.observe(host);
  const theme = new MutationObserver(() => { dirty = true; }); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const visibility = () => { pageVisible = !document.hidden; dirty = true; };
  const motion = () => { if (reduced.matches) pause(); dirty = true; };
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', motion);
  host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', cancel);
  host.addEventListener('pointerleave', leave); host.addEventListener('keydown', key);
  surface.addEventListener('webglcontextlost', contextLost);
  function frame(time: number) {
    if (destroyed) return;
    const elapsed = Math.min(time - last, 100);
    if (elapsed >= 1000 / 24 && visible && pageVisible) {
      if (fly) {
        const t = Math.min(1, (time - fly.start) / 650), smooth = t * t * (3 - 2 * t);
        const delta = ((fly.lon - fly.startLon + 540) % 360) - 180;
        lon = fly.startLon + delta * smooth; lat = fly.startLat + (fly.lat - fly.startLat) * smooth;
        if (t === 1) fly = null; dirty = true;
      } else if (spinning && !pointer) { lon += elapsed * .0025; dirty = true; }
      if (dirty) draw(); last = time;
    } else if (!visible || !pageVisible) last = time;
    raf = requestAnimationFrame(frame);
  }
  resize(); if (!spinning) center(selected); raf = requestAnimationFrame(frame);
  return {
    select(code, shouldCenter = true) { selected = code; if (shouldCenter) center(code); dirty = true; },
    rotate(value) { spinning = value; },
    zoom(delta) { zoom = Math.max(1, Math.min(3, zoom + delta)); dirty = true; },
    reset() { zoom = 1; center(selected); dirty = true; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); observer.disconnect(); viewport.disconnect(); theme.disconnect();
      document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', cancel);
      host.removeEventListener('pointerleave', leave); host.removeEventListener('keydown', key);
      surface.removeEventListener('webglcontextlost', contextLost);
      if (gl) { gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(shader => gl?.deleteShader(shader)); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
    },
  };
}
