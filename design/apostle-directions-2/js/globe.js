// The mission globe. One WebGL canvas for the whole page (moved between sections, so its textures load once): an
// orthographic sphere whose every pixel samples NASA's Blue Marble, reprojected to longitude/latitude by
// build/../globe/textures.json. Two images: the region (Atlantic to India) and a sharper mosaic of the Mediterranean
// and the Near East for close zoom; both are tinted in the shader to the site's parchment (light) or a night tone
// (dark). Outside the region the earth is drawn from Natural Earth land in the same tones, feathered into the photo.
// An SVG layer on top carries the arcs (Scripture solid, tradition dashed and labelled who and when) and the pins.
(() => {
  const RAD = Math.PI / 180;
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec2 uCenter; uniform float uR; uniform vec2 uRot;
uniform sampler2D uLand; uniform sampler2D uRegion; uniform sampler2D uCore;
uniform vec4 uRegionBox; uniform vec4 uCoreBox; uniform vec2 uReady;
uniform vec3 uSea; uniform vec3 uLandLo; uniform vec3 uLandHi; uniform vec3 uInk; uniform float uDark; uniform float uPhoto;
out vec4 o;
const float PI = 3.14159265;
float inBox(vec2 ll, vec4 b, float f){
  vec2 a = smoothstep(b.xy, b.xy + f, ll) * (1.0 - smoothstep(b.zw - f, b.zw, ll));
  return a.x * a.y;
}
vec3 tone(vec3 c, vec3 soft){
  float l = dot(c, vec3(.299, .587, .114)), ls = dot(soft, vec3(.299, .587, .114));
  // water is judged on a blurred sample (a coarser mip level), so JPEG blocks in the sea never show
  float water = smoothstep(.01, .08, soft.b - soft.r) * (1.0 - smoothstep(.14, .34, ls));
  vec3 land = mix(uLandLo, uLandHi, smoothstep(.04, .62, l));
  land = mix(land, land * (c / max(l, .04)), uPhoto);       // a little of the photo's own colour
  vec3 sea = uSea * (0.94 + .2 * l);
  return mix(land, sea, water);
}
void main(){
  vec2 p = (gl_FragCoord.xy - uCenter) / uR;
  float rho = length(p);
  float edge = 1.0 - smoothstep(1.0 - 1.4 / uR, 1.0, rho);
  if (edge <= 0.0) { o = vec4(0.0); return; }
  float c = asin(min(rho, 1.0)), sc = sin(c), cc = cos(c);
  float la0 = uRot.y, lo0 = uRot.x;
  float lat = asin(clamp(cc * sin(la0) + (rho > 1e-6 ? p.y * sc * cos(la0) / rho : 0.0), -1.0, 1.0));
  float lon = lo0 + atan(p.x * sc, rho * cc * cos(la0) - p.y * sc * sin(la0));
  lon = mod(lon + PI, 2.0 * PI) - PI;
  vec2 ll = vec2(lon, lat) / PI * 180.0;
  float m = texture(uLand, vec2((ll.x + 180.0) / 360.0, (90.0 - ll.y) / 180.0)).r;
  vec3 col = mix(uSea, mix(uLandLo, uLandHi, .4), m);
  float wR = uReady.x * inBox(ll, uRegionBox, 3.5);
  if (wR > 0.0) {
    vec2 uv = vec2((ll.x - uRegionBox.x) / (uRegionBox.z - uRegionBox.x), (uRegionBox.w - ll.y) / (uRegionBox.w - uRegionBox.y));
    col = mix(col, tone(texture(uRegion, uv).rgb, texture(uRegion, uv, 2.5).rgb), wR);
  }
  float wC = uReady.y * inBox(ll, uCoreBox, .8);
  if (wC > 0.0) {
    vec2 uv = vec2((ll.x - uCoreBox.x) / (uCoreBox.z - uCoreBox.x), (uCoreBox.w - ll.y) / (uCoreBox.w - uCoreBox.y));
    col = mix(col, tone(texture(uCore, uv).rgb, texture(uCore, uv, 3.0).rgb), wC);
  }
  // graticule every 15 degrees, hairline
  vec2 g = abs(fract(ll / 15.0 + .5) - .5) * 15.0;
  vec2 fw = fwidth(ll);
  float line = 1.0 - min(1.0, min(g.x / fw.x, g.y / fw.y));
  col = mix(col, uInk, line * (uDark > .5 ? .07 : .06));
  // a soft limb so the sphere reads as round, without a glow
  col *= mix(uDark > .5 ? .62 : .84, 1.0, pow(cc, .55));
  o = vec4(col * edge, edge);
}`;

  const G = { el: null, gl: null, prog: null, tex: {}, meta: null, ready: [0, 0], loading: null, host: null, opts: null, d: null };
  const view = { lon: 30, lat: 36, zoom: 1, target: null };
  let W = 0, H = 0, dpr = 1, R0 = 1, raf = 0, dirty = true, reveal = 1, fly = null, drag = null, pinch = null, palette = null, selected = null;
  let arcs = [], pins = [], period = 0, cardEl, svg, canvas, anchor = null;

  function build() {
    G.el = document.createElement("div");
    G.el.className = "globe";
    G.el.innerHTML = `<canvas class="globe-gl"></canvas><svg class="globe-over" aria-hidden="false"></svg>
      <div class="globe-card" hidden></div>
      <p class="globe-hint">${icon("hand", 13)}Drag to turn · scroll or pinch to zoom · click a route or a place</p>
      <p class="globe-credit">Earth: NASA Blue Marble</p>`;
    canvas = G.el.querySelector("canvas"); svg = G.el.querySelector("svg"); cardEl = G.el.querySelector(".globe-card");
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) { console.error("globe: WebGL2 is not available; the globe shows routes on a plain sphere"); G.el.classList.add("no-gl"); }
    else {
      G.gl = gl;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`globe shader: ${gl.getShaderInfoLog(s)}`); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`globe program: ${gl.getProgramInfoLog(prog)}`);
      G.prog = prog;
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      G.u = Object.fromEntries(["uRes", "uCenter", "uR", "uRot", "uLand", "uRegion", "uCore", "uRegionBox", "uCoreBox", "uReady", "uSea", "uLandLo", "uLandHi", "uInk", "uDark", "uPhoto"].map((n) => [n, gl.getUniformLocation(prog, n)]));
      for (const [name, unit] of [["land", 0], ["region", 1], ["core", 2]]) { G.tex[name] = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, G.tex[name]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); }
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); console.error("globe: the WebGL context was lost"); });
    }
    bindInput();
    new ResizeObserver(() => resize()).observe(G.el);
    addEventListener("themechange", () => { palette = null; dirty = true; });
  }

  // ── Textures: the land mask (drawn here from Natural Earth), then the two Blue Marble images ──
  function upload(name, unit, source) {
    const gl = G.gl; if (!gl) return;
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, G.tex[name]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, name === "land" ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    dirty = true;
  }
  const loadImage = async (src) => { const r = await fetch(src); if (!r.ok) throw new Error(`globe: ${src}: expected 200, got ${r.status}`); const j = await r.json(); const im = new Image(); im.src = `data:${j.type};base64,${j.data}`; await im.decode(); return im; };
  function fitTexture(im) {
    const max = G.gl ? G.gl.getParameter(G.gl.MAX_TEXTURE_SIZE) : 4096;
    if (im.naturalWidth <= max && im.naturalHeight <= max) return im;
    const k = max / Math.max(im.naturalWidth, im.naturalHeight), c = document.createElement("canvas");
    c.width = Math.floor(im.naturalWidth * k); c.height = Math.floor(im.naturalHeight * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    console.warn(`globe: texture scaled to ${c.width}×${c.height} for this device (max ${max})`);
    return c;
  }
  function loadAll() {
    if (G.loading) return G.loading;
    G.loading = (async () => {
      const [meta, land] = await Promise.all([fetch("globe/textures.json").then((r) => r.json()), fetch("globe/land-110m.json").then((r) => r.json())]);
      G.meta = meta;
      const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 2048, 1024);
      const proj = d3.geoEquirectangular().scale(2048 / (2 * Math.PI)).translate([1024, 512]);
      ctx.filter = "blur(1.2px)"; ctx.fillStyle = "#fff"; ctx.beginPath(); d3.geoPath(proj, ctx)(topojson.feature(land, land.objects.land)); ctx.fill();
      G.landGeo = topojson.feature(land, land.objects.land);
      upload("land", 0, c);
      const region = await loadImage("globe/region.json"); upload("region", 1, fitTexture(region)); G.ready[0] = 1; dirty = true;
      const core = await loadImage("globe/core.json"); upload("core", 2, fitTexture(core)); G.ready[1] = 1; dirty = true;
    })().catch((error) => console.error("globe: textures failed to load", error));
    return G.loading;
  }

  // ── Colours from the theme ──
  function readPalette() {
    const cs = getComputedStyle(G.el);
    const rgb = (n) => { const ctx = rgb.ctx ??= document.createElement("canvas").getContext("2d"); ctx.fillStyle = "#000"; ctx.fillStyle = cs.getPropertyValue(n).trim() || "#888"; const h = ctx.fillStyle; if (h.startsWith("#")) return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); const m = h.match(/[\d.]+/g); return m.slice(0, 3).map((x) => x / 255); };
    palette = { sea: rgb("--g-sea"), lo: rgb("--g-land-lo"), hi: rgb("--g-land-hi"), ink: rgb("--g-ink"), dark: document.documentElement.dataset.theme === "dark" ? 1 : 0, photo: parseFloat(cs.getPropertyValue("--g-photo")) || .25 };
  }

  function resize() {
    if (!G.el?.isConnected) return;
    const r = G.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    // Full width where there is room: the sphere spans the stage's width (cropped top and bottom, never sideways).
    R0 = W > 820 ? Math.min(W * .47, H * 1.1) : Math.min(W, H) * .46;
    dirty = true;
  }
  const minZoom = () => Math.min(1, (Math.min(W, H) * .46) / R0);
  const MAX_ZOOM = 26;

  // ── Projection (same formulas as the shader) ──
  function screen(ll, h = 0) {
    const l0 = view.lon * RAD, sp0 = Math.sin(view.lat * RAD), cp0 = Math.cos(view.lat * RAD);
    const dl = ll[0] * RAD - l0, sf = Math.sin(ll[1] * RAD), cf = Math.cos(ll[1] * RAD), cosd = Math.cos(dl);
    const c = sp0 * sf + cp0 * cf * cosd;
    if (c < -.02) return null;
    const k = R0 * view.zoom;
    return [W / 2 + k * cf * Math.sin(dl) * (1 + h), H / 2 - k * (cp0 * sf - sp0 * cf * cosd) * (1 + h), c];
  }

  // Screen point → [lon, lat] on the sphere (null off the sphere): the shader's inverse, for zooming at the cursor.
  function unproject(sx, sy) {
    const k = R0 * view.zoom, x = (sx - W / 2) / k, y = -(sy - H / 2) / k, rho = Math.hypot(x, y);
    if (rho > 1) return null;
    const c = Math.asin(rho), sc = Math.sin(c), cc = Math.cos(c), la0 = view.lat * RAD;
    const lat = Math.asin(cc * Math.sin(la0) + (rho ? y * sc * Math.cos(la0) / rho : 0));
    const lon = view.lon * RAD + Math.atan2(x * sc, rho * cc * Math.cos(la0) - y * sc * Math.sin(la0));
    return [lon / RAD, lat / RAD];
  }
  // Keep the anchored place under the cursor while the zoom changes.
  function holdAnchor() {
    if (!anchor) return;
    for (let i = 0; i < 2; i++) {
      const q = screen(anchor.ll); if (!q) { anchor = null; return; }
      const k = R0 * view.zoom, dx = q[0] - anchor.sx, dy = q[1] - anchor.sy;
      view.lon += (dx / (k * Math.max(.2, Math.cos(view.lat * RAD)))) / RAD;
      view.lat = Math.max(-70, Math.min(78, view.lat - (dy / k) / RAD));
    }
  }

  function draw() {
    if (!W) return;
    if (!palette) readPalette();
    const gl = G.gl;
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(G.prog);
      const u = G.u, m = G.meta;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform2f(u.uCenter, canvas.width / 2, canvas.height / 2);
      gl.uniform1f(u.uR, R0 * view.zoom * dpr);
      gl.uniform2f(u.uRot, view.lon * RAD, view.lat * RAD);
      gl.uniform1i(u.uLand, 0); gl.uniform1i(u.uRegion, 1); gl.uniform1i(u.uCore, 2);
      if (m) { gl.uniform4f(u.uRegionBox, m.region.lon0, m.region.lat0, m.region.lon1, m.region.lat1); gl.uniform4f(u.uCoreBox, m.core.lon0, m.core.lat0, m.core.lon1, m.core.lat1); }
      gl.uniform2f(u.uReady, G.ready[0], G.ready[1]);
      gl.uniform3fv(u.uSea, palette.sea); gl.uniform3fv(u.uLandLo, palette.lo); gl.uniform3fv(u.uLandHi, palette.hi); gl.uniform3fv(u.uInk, palette.ink);
      gl.uniform1f(u.uDark, palette.dark); gl.uniform1f(u.uPhoto, palette.photo);
      for (const [name, unit] of [["land", 0], ["region", 1], ["core", 2]]) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, G.tex[name]); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    overlay();
  }

  // ── Arcs, pins and labels ──
  function arcPath(a, upto) {
    const n = a.pts.length - 1, last = Math.max(0, Math.round(upto * n));
    let d = "", pen = false;
    for (let i = 0; i <= last; i++) {
      const q = screen(a.pts[i], a.lift * Math.sin((Math.PI * i) / n));
      if (!q) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`; pen = true;
    }
    return { d, mid: screen(a.pts[Math.round(n / 2)], a.lift) };
  }
  function overlay() {
    const o = [], boxes = [], labels = [];
    const k = R0 * view.zoom;
    o.push(`<circle class="rim" cx="${W / 2}" cy="${H / 2}" r="${k.toFixed(1)}"/>`);
    const fits = (b) => b.x0 > 4 && b.x1 < W - 4 && b.y0 > 4 && b.y1 < H - 4 && !boxes.some((q) => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
    for (const a of arcs) {
      const on = !period || a.period === period;
      const { d, mid } = arcPath(a, reveal);
      if (!d) continue;
      const cls = `${a.kind === "tradition" ? "trad" : "scr"} ${on ? "" : "dim"} ${selected === a.id ? "hot" : ""}`;
      o.push(`<path class="arc ${cls}" d="${d}"/>${on ? `<path class="hit" data-arc="${esc(a.id)}" d="${d}"><title>${esc(a.label)}</title></path>` : ""}`);
      if (a.kind === "tradition" && on && mid && reveal > .7) labels.push({ x: mid[0], y: mid[1], txt: a.short });
    }
    for (const p of pins) {
      const q = screen(p.ll);
      if (!q || q[2] < .06) continue;
      const on = !period || p.periods.includes(period);
      let label = "";
      const w = p.name.length * 6.4 + 8;
      for (const side of [1, -1]) {
        const b = side > 0 ? { x0: q[0] + 8, x1: q[0] + 8 + w, y0: q[1] - 9, y1: q[1] + 7 } : { x0: q[0] - 8 - w, x1: q[0] - 8, y0: q[1] - 9, y1: q[1] + 7 };
        if (on && fits(b)) { boxes.push(b); label = `<text x="${side * 9}" y="4" text-anchor="${side > 0 ? "start" : "end"}">${esc(p.name)}</text>`; break; }
      }
      boxes.push({ x0: q[0] - 4, x1: q[0] + 4, y0: q[1] - 4, y1: q[1] + 4 });
      o.push(`<g class="pin ${p.tradition ? "trad" : ""} ${on ? "" : "dim"} ${selected === `p:${p.i}` ? "hot" : ""}" data-pin="${p.i}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})"><circle class="hit" r="10"/><circle class="dot" r="${on ? 3.6 : 2.4}"/>${label}</g>`);
    }
    for (const l of labels) {
      const w = l.txt.length * 6 + 16, b = { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y - 24, y1: l.y - 6 };
      if (!fits(b)) continue;
      boxes.push(b);
      o.push(`<g class="alabel" transform="translate(${l.x.toFixed(1)} ${(l.y - 15).toFixed(1)})"><rect x="${(-w / 2).toFixed(1)}" y="-9" width="${w.toFixed(1)}" height="18" rx="9"/><text text-anchor="middle" y="3.5">${esc(l.txt)}</text></g>`);
    }
    svg.innerHTML = o.join("");
  }

  // ── The loop: draws only when something changed ──
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (fly) {
      const t = Math.min(1, (now - fly.t0) / fly.ms), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      view.lon = fly.from.lon + fly.dl * e; view.lat = fly.from.lat + (fly.to.lat - fly.from.lat) * e;
      view.zoom = Math.exp(Math.log(fly.from.zoom) + (Math.log(fly.to.zoom) - Math.log(fly.from.zoom)) * e) * (1 - fly.bump * Math.sin(Math.PI * e));
      if (fly.reveal) reveal = Math.min(1, Math.max(0, (t - .35) / .65));
      dirty = true;
      if (t >= 1) fly = null;
    } else if (view.target != null) {
      const z = view.zoom + (view.target - view.zoom) * .2;
      view.zoom = Math.abs(view.target - z) < .001 ? view.target : z;
      holdAnchor();
      if (view.zoom === view.target) { view.target = null; anchor = null; }
      dirty = true;
    }
    if (dirty && G.el?.isConnected) { dirty = false; draw(); }
  }

  function flyTo(to, ms = 1100, withReveal = false) {
    const from = { lon: view.lon, lat: view.lat, zoom: view.zoom };
    to = { lon: to.lon, lat: to.lat, zoom: Math.max(minZoom(), Math.min(MAX_ZOOM, to.zoom)) };
    const dl = ((to.lon - from.lon + 540) % 360) - 180;
    const far = d3.geoDistance([from.lon, from.lat], [to.lon, to.lat]);
    view.target = null;
    fly = { from, to, dl, t0: performance.now(), ms: REDUCED ? 1 : ms, bump: Math.min(.45, far * .7), reveal: withReveal };
    if (withReveal) reveal = 0;
  }

  // ── Input: drag to turn, wheel and pinch to zoom, click a route or a place ──
  function bindInput() {
    const el = G.el;
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".globe-card, [data-arc], [data-pin]")) return;
      if (e.pointerType === "touch") { (pinch ??= new Map()).set(e.pointerId, [e.clientX, e.clientY]); if (pinch.size === 2) { const [a, b] = [...pinch.values()]; pinch.d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); pinch.z0 = view.zoom; drag = null; return; } }
      drag = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat, moved: false, id: e.pointerId, touch: e.pointerType === "touch" };
      fly = null; el.classList.add("dragging");
    });
    addEventListener("pointermove", (e) => {
      if (pinch?.has(e.pointerId)) { pinch.set(e.pointerId, [e.clientX, e.clientY]); if (pinch.size === 2 && pinch.d0) { const [a, b] = [...pinch.values()]; view.zoom = Math.max(minZoom(), Math.min(MAX_ZOOM, pinch.z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0)); view.target = null; dirty = true; return; } }
      if (!drag || drag.id !== e.pointerId) return;
      const k = R0 * view.zoom, f = 180 / Math.PI / k;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      view.lon = drag.lon - dx * f;
      if (!drag.touch) view.lat = Math.max(-70, Math.min(78, drag.lat + dy * f));
      dirty = true;
    });
    const up = (e) => { pinch?.delete(e.pointerId); if (pinch && pinch.size < 2) pinch.d0 = 0; if (drag?.id === e.pointerId) { drag = null; el.classList.remove("dragging"); } };
    addEventListener("pointerup", up); addEventListener("pointercancel", up);
    el.addEventListener("wheel", (e) => {
      const z = view.target ?? view.zoom, f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? .05 : .0016));
      const next = Math.max(minZoom(), Math.min(MAX_ZOOM, z * f));
      if (Math.abs(next - z) < 1e-4) return; // at the limit: let the page scroll on
      e.preventDefault(); fly = null; view.target = next;
      const r = el.getBoundingClientRect(), ll = unproject(e.clientX - r.left, e.clientY - r.top);
      anchor = ll ? { ll, sx: e.clientX - r.left, sy: e.clientY - r.top } : null;
    }, { passive: false });
    el.addEventListener("click", (e) => {
      const a = e.target.closest("[data-arc]"), p = e.target.closest("[data-pin]"), x = e.target.closest("[data-gx]");
      if (x) { closeCard(); return; }
      if (a) { const arc = arcs.find((q) => q.id === a.dataset.arc); selected = arc.id; dirty = true; showCard(arcCard(arc)); G.opts?.onPick?.({ arc }); return; }
      if (p) { const pin = pins[Number(p.dataset.pin)]; selected = `p:${pin.i}`; dirty = true; showCard(pinCard(pin)); G.opts?.onPick?.({ place: pin.place }); }
    });
  }
  function showCard(html) { cardEl.innerHTML = `<button type="button" class="round globe-x" data-gx aria-label="Close">${icon("x", 14)}</button>${html}`; cardEl.hidden = false; }
  function closeCard() { cardEl.hidden = true; selected = null; dirty = true; }
  function arcCard(a) {
    const head = `<p class="kicker">${a.kind === "tradition" ? "Tradition · dashed" : "Scripture · solid"}</p><h4>${esc(a.label)}</h4><p class="route">${esc(a.fromName ?? "")} → ${esc(a.toName ?? "")}</p>`;
    if (a.kind === "tradition") {
      const recs = [a.trad, ...(a.also ?? [])].map((i) => G.d.ending.tradition[i]).filter(Boolean);
      return `${head}${recs.map((t) => `<p class="txt">${esc(t.text)}</p>${claimFoot(t)}`).join("")}<p class="route">Drawn from the last place Scripture names: the writer gives the place, not the road.</p>`;
    }
    const first = (a.refs ?? []).map((r) => r[0]), dest = (a.toName ?? "").split(/[ ,(]/)[0];
    const v = first.find((id) => dest && vtext(id).includes(dest)) ?? first[0];
    return `${head}${v ? `<p class="txt kjv-line">“${esc(vtext(v))}”</p>` : ""}${claimFoot({ layer: "scripture", refs: a.refs })}`;
  }
  function pinCard(p) {
    const pl = p.place, ents = (pl.entries ?? []).map((k) => G.d.byKey[k]).filter(Boolean).slice(0, 5);
    return `<p class="kicker">${pl.tradition ? "Known from tradition" : "Named in Scripture"}</p><h4>${esc(pl.name)}</h4>${pl.from ? `<p class="route">${pl.from.km.toLocaleString("en-GB")} km ${pl.from.dir} of Jerusalem</p>` : ""}
      ${pl.note ? `<p class="txt">${esc(pl.note)}</p>` : ""}${ents.length ? `<ul class="globe-ents">${ents.map((e) => `<li>${esc(e.title)}</li>`).join("")}</ul>` : ""}${claimFoot({ layer: pl.tradition ? "tradition" : "scripture", refs: pl.refs })}`;
  }

  function setData(d) {
    G.d = d;
    const sample = (a, b) => { const it = d3.geoInterpolate(a, b), n = 40; return Array.from({ length: n + 1 }, (_, i) => it(i / n)); };
    arcs = [...d.globe.arcs, ...d.globe.journeys.flatMap((j) => j.arcs.map((x) => ({ ...x, period: 3 })))].filter((a) => a.a && a.b).map((a) => {
      const t = a.kind === "tradition" ? d.ending.tradition[a.trad] : null;
      return { ...a, pts: (a.pts ??= sample(a.a, a.b)), lift: Math.min(.14, d3.geoDistance(a.a, a.b) * .3), short: t ? `${whoShort(t.who)} · ${whenShort(t.when)}` : "" };
    });
    const periodsOf = (pl) => [...new Set([...(pl.entries ?? []).map((k) => d.byKey[k]?.period), pl.tradition ? 4 : null, ...arcs.filter((a) => a.from === pl.placeId || a.to === pl.placeId).map((a) => a.period)].filter(Boolean))];
    pins = d.places.filter((p) => p.ll).map((p, i) => ({ i, ll: p.ll, name: p.name.replace(/\s*\(.*\)$/, ""), tradition: p.tradition, place: p, periods: periodsOf(p) }));
    selected = null; cardEl.hidden = true;
  }

  window.Globe = {
    // Moves the one globe into host. opts: { d, view: "all"|"p1".."p4", period, onPick }
    attach(host, opts) {
      if (!G.el) build();
      G.opts = opts;
      host.append(G.el);
      resize();
      if (G.d !== opts.d) setData(opts.d);
      period = opts.period ?? 0;
      const v = opts.d.globe.views[opts.view ?? "all"];
      if (!G.attachedOnce) { view.lon = v.center[0] - 25; view.lat = v.center[1] - 6; view.zoom = minZoom() * .9; G.attachedOnce = true; }
      flyTo({ lon: v.center[0], lat: v.center[1], zoom: v.zoom }, 1300, true);
      palette = null; dirty = true;
      if (!raf) raf = requestAnimationFrame(loop);
      loadAll();
      return G.el;
    },
    setPeriod(p, viewName) { period = p; closeCard(); const v = G.d.globe.views[viewName ?? (p ? `p${p}` : "all")]; if (v) flyTo({ lon: v.center[0], lat: v.center[1], zoom: v.zoom }, 1100, false); dirty = true; },
    flyToPlace(pl) { if (!pl.ll) return; flyTo({ lon: pl.ll[0], lat: pl.ll[1], zoom: Math.max(view.zoom, 6) }, 1000); const pin = pins.find((p) => p.place === pl); if (pin) { selected = `p:${pin.i}`; showCard(pinCard(pin)); } },
    counts(d) { const all = [...d.globe.arcs, ...d.globe.journeys.flatMap((j) => j.arcs)]; return { scr: all.filter((a) => a.kind === "scripture").length, trad: all.filter((a) => a.kind === "tradition").length }; },
    redraw() { resize(); dirty = true; },
    project(ll) { return screen(ll); }, // for tests: where a place is drawn, relative to the stage
  };
})();
