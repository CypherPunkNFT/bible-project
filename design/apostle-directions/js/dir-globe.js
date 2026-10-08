// F · The globe. An orthographic globe of the Roman world (Natural Earth land via world-atlas, d3-geo), drawn on a
// canvas as a halftone of land dots, with an SVG layer on top for the arcs and pins. Scripture's journeys are solid
// arcs; tradition's routes are dashed and labelled with who said it and when. Scrolling the chapters turns the globe
// to each place (the main animation, on the ticker); the globe can be grabbed and spun, and any arc or pin clicked.
(() => {
  const RAD = Math.PI / 180;
  const G = window.__globe ?? (window.__globe = { land110: null, land50: null, grids: null, loading: null });

  // ── Land: load once. The light 110m outline and a world dot grid come first; the 50m outline and the finer
  // Mediterranean and Levant grids follow in idle time, so a first visit never stalls a frame. ──
  const GRIDS = [{ step: 1.1, box: [-180, -58, 180, 78], z: [0, 2.1] }, { step: .36, box: [-28, 4, 82, 72], z: [2.1, 5.2] }, { step: .14, box: [8, 18, 58, 50], z: [5.2, 99] }];
  const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 700 }) : setTimeout(r, 300)));
  function loadLand() {
    if (!G.loading) G.loading = (async () => {
      const get = async (f) => { const r = await fetch(`data/${f}`); if (!r.ok) throw new Error(`${f}: expected 200, got ${r.status}`); return r.json(); };
      const t110 = await get("land-110m.json");
      G.land110 = topojson.feature(t110, t110.objects.land);
      G.grids = [{ ...GRIDS[0], pts: rasterDots(G.land110, GRIDS[0]) }];
      G.onStep?.();
      const t50 = await get("land-50m.json");
      await idle();
      G.land50 = topojson.feature(t50, t50.objects.land);
      await idle();
      G.grids = GRIDS.map((g) => ({ ...g, pts: rasterDots(G.land50, g) }));
      G.onStep?.();
    })();
    return G.loading;
  }
  function rasterDots(land, { step, box: [x0, y0, x1, y1] }) {
    const W = Math.ceil((x1 - x0) / step), H = Math.ceil((y1 - y0) / step);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const proj = d3.geoIdentity().reflectY(true).scale(1 / step).translate([-x0 / step, y1 / step]);
    ctx.beginPath(); d3.geoPath(proj, ctx)(land); ctx.fill();
    const data = ctx.getImageData(0, 0, W, H).data, out = [];
    for (let j = 0; j < H; j++) {
      const lat = y1 - (j + .5) * step, stride = Math.max(1, Math.round(1 / Math.max(.05, Math.cos(lat * RAD)))); // equal-area: fewer dots towards the poles
      for (let i = j % stride; i < W; i += stride) {
      if (data[(j * W + i) * 4 + 3] <= 110) continue;
      const lon = x0 + (i + .5) * step;
      out.push(lon * RAD, Math.sin(lat * RAD), Math.cos(lat * RAD));
    } }
    return new Float32Array(out);
  }

  // ── Arc geometry: a great circle, lifted off the surface in proportion to its length ──
  function arcSamples(a, b) {
    const it = d3.geoInterpolate(a, b), n = 44, pts = [];
    for (let k = 0; k <= n; k++) pts.push(it(k / n));
    return { pts, lift: Math.min(.16, d3.geoDistance(a, b) * .32) };
  }

  DIRECTIONS.globe = {
    name: "The globe", letter: "F", swatch: "#3fd0c0",
    mount(main) {
      const narrow = isNarrow();
      const gl = P.globe, chapters = gl.chapters;
      const trad = P.ending.tradition;
      // Every arc, with the chapter that first shows it.
      const arcs = [];
      const firstChapter = (id, journey) => chapters.findIndex((c) => (c.arcs ?? []).includes(id) || (journey && c.journey === journey));
      // Arc geometry is cached on the data, so switching back to an apostle is instant.
      for (const a of gl.arcs) arcs.push({ ...a, ch: firstChapter(a.id), geo: (a.geo ??= arcSamples(a.a, a.b)) });
      for (const j of gl.journeys) for (const a of j.arcs) arcs.push({ ...a, ch: firstChapter(a.id, j.id), geo: (a.geo ??= arcSamples(a.a, a.b)) });
      arcs.forEach((a) => { if (a.ch < 0) a.ch = chapters.length - 1; });
      const scrArcs = arcs.filter((a) => a.kind === "scripture").length, tradArcs = arcs.length - scrArcs;
      const pinned = P.places.filter((p) => p.ll), unpinned = P.places.filter((p) => !p.ll);

      main.innerHTML = `<div class="gl-top">${topline()}</div>
        <div class="gl-grid">
          <div class="gl-stage" aria-label="Globe: drag to turn it; click an arc or a place">
            <canvas></canvas><svg class="gl-over"></svg>
            <span class="gl-hint">${icon("hand", 14)}Drag to spin · click an arc</span>
            <div class="gl-legend"><span><i></i>Scripture <small>(${scrArcs} arcs)</small></span><span><i class="is-trad"></i>Tradition <small>(${tradArcs}, labelled · drawn from the last place Scripture names)</small></span></div>
            <div class="gl-hud"><button type="button" data-gl="in" aria-label="Zoom in">${icon("plus", 16)}</button><button type="button" data-gl="out" aria-label="Zoom out"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14"/></svg></button><button type="button" data-gl="home" aria-label="Back to this chapter's view">${icon("rotate", 16)}</button></div>
          </div>
          <div class="gl-chapters">${heroHTML(pinned.length, scrArcs, tradArcs)}${chapters.map((c, k) => chapterHTML(c, k, unpinned)).join("")}</div>
        </div>`;

      const stage = main.querySelector(".gl-stage"), canvas = stage.querySelector("canvas"), svg = stage.querySelector("svg");
      const ctx = canvas.getContext("2d");
      const proj = d3.geoOrthographic().clipAngle(90).precision(.4);
      const path = d3.geoPath(proj, ctx), grat = d3.geoGraticule10();
      // The view: centre (lon, lat) and zoom. The hero shows the whole life, centred on its places.
      const centroid = pinned.length ? d3.geoCentroid({ type: "MultiPoint", coordinates: pinned.map((p) => p.ll) }) : [30, 35];
      const HERO = { lon: centroid[0] - 4, lat: Math.max(22, centroid[1] - 4), zoom: narrow ? 1.15 : 1.3 };
      const view = { ...HERO };
      let active = -1, reveal = 1, moving = true, idleTimer = 0, W = 0, H = 0, R = 0, dpr = 1, colors = {}, spin = true, hotArc = null, hotTrad = null;

      function readColors() { const cs = getComputedStyle(main); const v = (n) => cs.getPropertyValue(n).trim(); colors = { sea1: v("--gl-sea-1"), sea2: v("--gl-sea-2"), atmo: v("--gl-atmo"), dot: v("--gl-dot"), land: v("--gl-land"), coast: v("--gl-coast"), grat: v("--gl-grat") }; }
      function resize() {
        const r = stage.getBoundingClientRect();
        W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        R = Math.min(W, H) * (narrow ? .42 : .4);
        render();
      }
      // Faster land while moving; the 50m outline once still.
      const settle = () => { clearTimeout(idleTimer); moving = true; idleTimer = setTimeout(() => { moving = false; render(); }, 160); };

      function render() {
        if (!W) return;
        const k = R * view.zoom, cx = W / 2, cy = H / 2;
        proj.scale(k).translate([cx, cy]).rotate([-view.lon, -view.lat]);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        // Atmosphere, sphere, graticule.
        if (k < Math.max(W, H) * 1.2) {
          const g = ctx.createRadialGradient(cx, cy, k * .96, cx, cy, k * 1.16);
          g.addColorStop(0, colors.atmo); g.addColorStop(1, "transparent");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, k * 1.16, 0, Math.PI * 2); ctx.fill();
        }
        const s = ctx.createRadialGradient(cx - k * .35, cy - k * .4, k * .05, cx, cy, k);
        s.addColorStop(0, colors.sea1); s.addColorStop(1, colors.sea2);
        ctx.fillStyle = s; ctx.beginPath(); path({ type: "Sphere" }); ctx.fill();
        ctx.strokeStyle = colors.grat; ctx.lineWidth = .7; ctx.beginPath(); path(grat); ctx.stroke();
        const land = moving || !G.land50 ? G.land110 : G.land50;
        if (land) { ctx.fillStyle = colors.land; ctx.beginPath(); path(land); ctx.fill(); }
        drawDots(k, cx, cy);
        if (land) { ctx.strokeStyle = colors.coast; ctx.lineWidth = view.zoom > 4 ? 1 : .7; ctx.beginPath(); path(land); ctx.stroke(); }
        drawOverlay(k, cx, cy);
      }
      function drawDots(k, cx, cy) {
        if (!G.grids) return;
        const grid = G.grids.find((g) => view.zoom >= g.z[0] && view.zoom < g.z[1]) ?? G.grids[G.grids.length - 1];
        const p = grid.pts, l0 = view.lon * RAD, sp0 = Math.sin(view.lat * RAD), cp0 = Math.cos(view.lat * RAD);
        const r = Math.max(.55, Math.min(1.7, grid.step * RAD * k * .2));
        // One pass, four brightness bands (dots fade towards the rim), each band one Path2D.
        const bands = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
        for (let i = 0; i < p.length; i += 3) {
          const dl = p[i] - l0, cosd = Math.cos(dl), sf = p[i + 1], cf = p[i + 2];
          const c = sp0 * sf + cp0 * cf * cosd;
          if (c <= 0) continue;
          const x = cx + k * cf * Math.sin(dl), y = cy - k * (cp0 * sf - sp0 * cf * cosd);
          if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
          bands[c >= .7 ? 3 : c >= .45 ? 2 : c >= .2 ? 1 : 0].rect(x - r, y - r, r * 2, r * 2);
        }
        ctx.fillStyle = colors.dot;
        const fine = view.zoom >= 5.2 ? .75 : 1;
        bands.forEach((b, a) => { ctx.globalAlpha = [.1, .3, .55, .88][a] * fine; ctx.fill(b); });
        ctx.globalAlpha = 1;
      }
      // Screen point for [lon, lat], lifted by h (a fraction of the radius); null on the far side.
      function screen(ll, h = 0) {
        const l0 = view.lon * RAD, sp0 = Math.sin(view.lat * RAD), cp0 = Math.cos(view.lat * RAD);
        const dl = ll[0] * RAD - l0, sf = Math.sin(ll[1] * RAD), cf = Math.cos(ll[1] * RAD), cosd = Math.cos(dl);
        const c = sp0 * sf + cp0 * cf * cosd;
        if (c < -.02) return null;
        const k = R * view.zoom, x = k * cf * Math.sin(dl), y = -k * (cp0 * sf - sp0 * cf * cosd);
        return [W / 2 + x * (1 + h), H / 2 + y * (1 + h), c];
      }
      function arcPath(a, upto) {
        const { pts, lift } = a.geo, n = pts.length - 1, last = Math.max(0, Math.round(upto * n));
        let d = "", pen = false, head = null;
        for (let i = 0; i <= last; i++) {
          const q = screen(pts[i], lift * Math.sin((Math.PI * i) / n));
          if (!q) { pen = false; continue; }
          d += `${pen ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`; pen = true; head = q;
        }
        return { d, head, mid: screen(pts[Math.round(n / 2)], lift) };
      }
      function drawOverlay() {
        const o = [], labels = [];
        const showAll = active < 0 || chapters[active]?.all;
        for (const a of arcs) {
          const vis = showAll || a.ch <= active;
          if (!vis) continue;
          const cur = !showAll && a.ch === active;
          const { d, head, mid } = arcPath(a, cur ? reveal : 1);
          if (!d) continue;
          const dim = active < 0 ? "" : !showAll && a.ch < active ? "is-dim" : "";
          const hot = hotArc === a.id || (hotTrad != null && a.trad === hotTrad) ? "is-hot" : "";
          o.push(`<path class="arc ${a.kind === "tradition" ? "is-trad" : "is-scr"} ${dim} ${hot}" d="${d}"/><path class="arc-hit" data-arc="${esc(a.id)}" d="${d}"/>`);
          if (cur && head && reveal < 1) o.push(`<circle class="head ${a.kind === "tradition" ? "is-trad" : ""}" cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="3.4"/>`);
          if (a.kind === "tradition" && mid && (cur || showAll || hot) && reveal > .6) {
            const t = trad[a.trad], txt = `${t.who.split(",")[0].replace(/^The /, "")} · ${yearBadge(t.when).big}`;
            labels.push({ x: mid[0], y: mid[1], txt });
          }
        }
        // Pins: every place with coordinates, faint; the chapter's own, bright and named.
        const mine = new Set((active >= 0 ? chapters[active].pins ?? [] : []).map((p) => p.placeId));
        const journey = active >= 0 && chapters[active].journey ? gl.journeys.find((j) => j.id === chapters[active].journey) : null;
        const pinList = [];
        const seen = new Set();
        const add = (id, name, ll, isTrad, major) => { if (!ll || seen.has(id)) return; seen.add(id); pinList.push({ id, name, ll, isTrad, major }); };
        (active >= 0 ? chapters[active].pins ?? [] : []).forEach((p) => add(p.placeId, p.name, p.ll, P.places.find((x) => x.placeId === p.placeId)?.tradition, true));
        journey?.stops.forEach((s) => add(s.placeId, s.name.split(",")[0], s.ll, false, false));
        pinned.forEach((p) => add(p.placeId, p.name, p.ll, p.tradition, active < 0 && pinned.length < 16));
        const boxes = [];
        const fits = (b) => b.x0 > 2 && b.x1 < W - 2 && b.y0 > 2 && b.y1 < H - 2 && !boxes.some((q) => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
        for (const pin of pinList) {
          const q = screen(pin.ll);
          if (!q || q[2] < .05) continue;
          const lit = mine.has(pin.id) || pin.major;
          let label = "";
          if (lit || journey) {
            const w = pin.name.length * (lit ? 6.6 : 5.6) + 6;
            for (const side of [1, -1]) {
              const b = side > 0 ? { x0: q[0] + 8, x1: q[0] + 8 + w, y0: q[1] - 9, y1: q[1] + 6 } : { x0: q[0] - 8 - w, x1: q[0] - 8, y0: q[1] - 9, y1: q[1] + 6 };
              if (fits(b)) { boxes.push(b); label = `<text x="${side * 9}" y="4" text-anchor="${side > 0 ? "start" : "end"}">${esc(pin.name)}</text>`; break; }
            }
          }
          boxes.push({ x0: q[0] - 4, x1: q[0] + 4, y0: q[1] - 4, y1: q[1] + 4 });
          o.push(`<g class="pin ${pin.isTrad ? "is-trad" : ""} ${lit ? "" : "is-faint is-minor"}" data-pin="${esc(pin.id)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})">${mine.has(pin.id) ? `<circle class="ring" r="5"/>` : ""}<circle class="dot" r="${lit ? 4.4 : 2.8}"/>${label}</g>`);
        }
        for (const l of labels) {
          const w = l.txt.length * 6.3 + 14;
          const b = { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y - 22, y1: l.y - 4 };
          if (!fits(b)) continue;
          boxes.push(b);
          o.push(`<g class="alabel" transform="translate(${l.x.toFixed(1)} ${(l.y - 13).toFixed(1)})"><rect x="${(-w / 2).toFixed(1)}" y="-9" width="${w.toFixed(1)}" height="18" rx="9"/><text text-anchor="middle" y="3.6">${esc(l.txt)}</text></g>`);
        }
        svg.innerHTML = o.join("");
      }

      // ── Flying to a chapter: the main animation (on the ticker) ──
      const targetOf = (k) => (k < 0 ? HERO : { lon: chapters[k].focusLL[0], lat: chapters[k].focusLL[1], zoom: narrow ? chapters[k].zoom * .9 : chapters[k].zoom });
      function flyTo(k) {
        const from = { ...view }, to = targetOf(k);
        let dl = to.lon - from.lon; dl = ((dl + 540) % 360) - 180;
        const far = d3.geoDistance([from.lon, from.lat], [to.lon, to.lat]);
        const bump = Math.min(.55, far * .9);
        const name = k < 0 ? "the whole life" : chapters[k].title;
        Clock.run({
          label: `The globe turns to ${name}`, duration: 1150,
          frame(p) {
            const e = easeInOut(span01(p, 0, .8));
            view.lon = from.lon + dl * e; view.lat = from.lat + (to.lat - from.lat) * e;
            view.zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * e) * (1 - bump * Math.sin(Math.PI * e));
            reveal = easeOut(span01(p, .45, 1));
            settle(); render();
          },
          moving: (p) => [p < .8 ? "the globe, turning and zooming" : "", p > .45 && p < 1 ? "this chapter's arcs, drawing" : ""].filter(Boolean),
        });
      }
      function activate(k) {
        if (k === active) return;
        active = k; spin = k < 0; hotArc = null; hotTrad = null;
        main.querySelectorAll(".gl-ch").forEach((el) => el.classList.toggle("is-active", Number(el.dataset.ch) === k));
        closePop();
        flyTo(k);
      }

      // ── Interaction: drag to spin, zoom buttons, clicks on arcs and pins ──
      let drag = null;
      stage.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".gl-hud, .gl-pop, [data-arc], [data-pin]")) return;
        drag = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat }; spin = false;
        stage.setPointerCapture(e.pointerId); stage.classList.add("is-dragging"); Clock.stop();
      });
      stage.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const k = R * view.zoom, f = 180 / Math.PI / k;
        view.lon = drag.lon - (e.clientX - drag.x) * f; view.lat = Math.max(-75, Math.min(75, drag.lat + (e.clientY - drag.y) * f));
        reveal = 1; settle(); render();
      });
      const up = () => { drag = null; stage.classList.remove("is-dragging"); };
      stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
      let popEl = null;
      function closePop() { popEl?.remove(); popEl = null; }
      function openPop(html, x, y, c) {
        closePop();
        popEl = document.createElement("div");
        popEl.className = "gl-pop glass"; popEl.style.setProperty("--c", c);
        popEl.innerHTML = `<button type="button" class="x" data-gl="close" aria-label="Close">${icon("x", 14)}</button>${html}`;
        stage.append(popEl);
        const w = popEl.offsetWidth, h = popEl.offsetHeight;
        popEl.style.left = `${Math.max(10, Math.min(W - w - 10, x - w / 2))}px`; popEl.style.top = `${Math.max(10, Math.min(H - h - 10, y + 14))}px`;
      }
      function arcPop(a, x, y) {
        const head = `<h4>${esc(a.label)}</h4><p class="route">${esc(a.fromName)} → ${esc(a.toName)}</p>`;
        if (a.kind === "tradition") { const t = trad[a.trad]; const also = (a.also ?? []).map((i) => trad[i]); return openPop(`${head}<p>${esc(t.text)}</p>${claimFoot(t)}${also.map((u) => `<p>${esc(u.text)}</p>${claimFoot(u)}`).join("")}<p class="route">Drawn from the last place Scripture names him: the writer gives the place, not the road.</p>`, x, y, "var(--gl-trad)"); }
        openPop(`${head}${claimFoot({ layer: "scripture", refs: a.refs })}`, x, y, "var(--gl-scr)");
      }
      function pinPop(id, x, y) {
        const pl = P.places.find((p) => p.placeId === id);
        const stop = gl.journeys.flatMap((j) => j.stops).find((s) => s.placeId === id);
        const name = pl?.name ?? stop?.name ?? "";
        const note = pl?.note ?? stop?.note ?? "";
        openPop(`<h4>${esc(name)}</h4><p class="route">${pl?.tradition ? "Known from tradition" : "Named in Scripture"}</p>${note ? `<p>${esc(note)}</p>` : ""}${claimFoot({ layer: pl?.tradition ? "tradition" : "scripture", refs: pl?.refs ?? stop?.refs ?? [] })}`, x, y, pl?.tradition ? "var(--gl-trad)" : "var(--gl-scr)");
      }
      stage.addEventListener("click", (e) => {
        const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        const arcEl = e.target.closest("[data-arc]"), pinEl = e.target.closest("[data-pin]");
        if (arcEl) { const a = arcs.find((q) => q.id === arcEl.dataset.arc); hotArc = a.id; render(); arcPop(a, x, y); return; }
        if (pinEl) { pinPop(pinEl.dataset.pin, x, y); return; }
        const b = e.target.closest("[data-gl]");
        if (!b) return;
        const act = b.dataset.gl;
        if (act === "close") { closePop(); hotArc = null; render(); }
        if (act === "in" || act === "out") { view.zoom = Math.max(.8, Math.min(14, view.zoom * (act === "in" ? 1.5 : 1 / 1.5))); spin = false; settle(); render(); }
        if (act === "home") { const k = active; active = -2; activate(k); }
      });
      // Chapters: place chips turn the globe; tradition items light their arcs; moments open their words.
      main.querySelector(".gl-chapters").addEventListener("click", (e) => {
        const chipEl = e.target.closest("[data-goto]");
        if (chipEl) { const ll = JSON.parse(chipEl.dataset.goto); const from = { ...view }; spin = false; Clock.run({ label: `The globe turns to ${chipEl.textContent.trim()}`, duration: 800, frame(p) { const q = easeInOut(p); let dl = ll[0] - from.lon; dl = ((dl + 540) % 360) - 180; view.lon = from.lon + dl * q; view.lat = from.lat + (ll[1] - from.lat) * q; view.zoom = from.zoom + (Math.max(from.zoom, 5) - from.zoom) * q; settle(); render(); }, moving: () => ["the globe, turning to a place"] }); return; }
        const m = e.target.closest("[data-mo]");
        if (m) { m.closest("li").classList.toggle("is-open"); return; }
        const tab = e.target.closest("[data-calltab]");
        if (tab) { const box = tab.closest(".gl-block"); box.querySelectorAll("[data-calltab]").forEach((b) => b.setAttribute("aria-pressed", String(b === tab))); box.querySelectorAll("[data-callpane]").forEach((p) => { p.hidden = p.dataset.callpane !== tab.dataset.calltab; }); return; }
        const t = e.target.closest("[data-trad]");
        if (t) { hotTrad = Number(t.dataset.trad); main.querySelectorAll(".gl-trad-item").forEach((x) => x.classList.toggle("is-hot", x === t)); render(); }
      });

      // Which chapter is in the reading line: the middle of the screen beside the globe, or below it on a phone.
      const io = new IntersectionObserver((entries) => {
        for (const en of entries) if (en.isIntersecting) activate(Number(en.target.dataset.ch));
      }, { rootMargin: narrow ? "-70% 0px -28% 0px" : "-48% 0px -50% 0px" });
      main.querySelectorAll(".gl-ch").forEach((el) => io.observe(el));

      // The slow turn while the hero is in view.
      let raf = 0, last = performance.now();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      function tick(now) {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(64, now - last); last = now;
        if (!spin || reduce || drag || Clock.active || document.hidden) return;
        view.lon += dt * .004; settle(); render();
      }
      raf = requestAnimationFrame(tick);
      const onTheme = () => { readColors(); render(); };
      document.addEventListener("themechange", onTheme);
      const ro = new ResizeObserver(resize);
      readColors();
      ro.observe(stage);
      resize();
      G.onStep = () => { if (main.isConnected && main.classList.contains("dir-globe")) render(); };
      loadLand().then(() => G.onStep?.()).catch((error) => console.error("globe: could not load the land outline", error));
      // The opening: the globe rises into view and the whole life draws itself.
      Clock.run({
        label: "The globe rises and every route draws", duration: 1200,
        frame(p) { view.zoom = HERO.zoom * (.55 + .45 * easeOut(span01(p, 0, .6))); reveal = easeOut(span01(p, .3, 1)); active = -1; settle(); render(); },
        moving: (p) => [p < .6 ? "the globe, rising" : "", p > .3 ? "the arcs, drawing" : ""].filter(Boolean),
      });
      return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener("themechange", onTheme); clearTimeout(idleTimer); closePop(); };
    },
  };

  // ── The chapter cards ──
  function heroHTML(nPins, nScr, nTrad) {
    const scarce = isScarce() ? `<p class="gl-scarce"><b>Scripture tells little about him.</b> ${esc(P.notSaid[0])} Most of this globe is tradition, and it is drawn dashed.</p>` : "";
    return `<section class="gl-ch gl-hero" data-ch="-1"><div>
      <p class="k">${icon("globe", 15)}F · The globe · ${esc(P.title)}</p>
      <h1>The world of<b style="--fit: ${Math.round(420 / (P.first.length * .72))}px">${esc(P.first)}</b></h1>
      <p class="aka">${esc(P.otherNames.join(" · "))}</p>
      <p class="tag">${esc(P.tagline)}</p>${scarce}
      <div class="gl-stats"><div><b>${nPins}</b><span>places with coordinates</span></div><div><b class="is-scr">${nScr}</b><span>Scripture arcs</span></div><div><b class="is-trad">${nTrad}</b><span>tradition arcs</span></div></div>
      <p class="gl-scroll">${icon("chevronDown", 16)}Scroll, and the globe turns to each place</p></div></section>`;
  }
  function placeChips(c) {
    return (c.pins ?? []).length ? `<div class="gl-places">${c.pins.filter((p) => p.ll).map((p) => `<button type="button" class="${P.places.find((x) => x.placeId === p.placeId)?.tradition ? "is-trad" : ""}" data-goto="${esc(JSON.stringify(p.ll))}">${icon("pin", 13)}${esc(p.name)}</button>`).join("")}</div>` : "";
  }
  const block = (title, body) => (body ? `<div class="gl-block"><h3>${title}</h3>${body}</div>` : "");
  function momentRows(list) {
    return `<ol class="gl-moments">${list.map(({ m, i }) => {
      const t = P.threadByKey[`m${i}`], lines = t ? (t.lines ?? t.tabs[0].lines) : null;
      const from = t?.tabs ? ` <span class="mono" style="font-size:.66rem;color:var(--muted)">(${esc(tabLabel(t.tabs[0]))}${t.tabs.length > 1 ? `; ${t.tabs.length - 1} more in the other Gospels` : ""})</span>` : "";
      return `<li><button type="button" data-mo><span class="n">${m.h ? `§${esc(m.h.n)}` : "·"}</span><span class="l">${esc(m.label)}</span>${icon("chevronDown", 15)}</button>
        <div class="more">${lines ? dialogue(lines) + from : ""}<p class="refs">${chip("scripture")} ${refList(m.refs)}</p></div></li>`;
    }).join("")}</ol>`;
  }
  function actsBlock(idx) {
    return idx.map((i) => {
      const c = P.acts[i], t = P.threadByKey[`a${i}`];
      return `<div class="claim"><p>${esc(c.text)}</p>${claimFoot(c)}${t ? dialogue(t.lines ?? t.tabs[0].lines) : ""}</div>`;
    }).join("");
  }
  function partHTML(part, unpinned) {
    switch (part) {
      case "home": return block("Home", P.home ? claimHTML(P.home) : `<p class="claim">Scripture does not say where he came from.</p>`);
      case "trade": return block("Trade", P.trade ? claimHTML(P.trade) : "");
      case "family": return block("Family", P.family.map((c) => claimHTML(c)).join(""));
      case "identifications": return block("Names", P.identifications.map((c) => claimHTML(c)).join(""));
      case "lists": return block("In the lists of the Twelve", P.lists.length ? `<div class="claim"><p>${P.lists.map((l) => `${esc({ MAT: "Matthew 10", MRK: "Mark 3", LUK: "Luke 6", ACT: "Acts 1" }[l.book])}: <b>${ordinal(l.position)}</b>, “${esc(l.name)}”`).join("; ")}.</p>${claimFoot({ layer: "scripture", refs: P.lists.map((l) => l.span) })}</div>` : "");
      case "calling": return block("The call", `<div class="gl-tabs" role="tablist">${P.calling.map((c, k) => `<button type="button" data-calltab="${k}" aria-pressed="${k === 0}">${esc(c.label)}</button>`).join("")}</div>${P.calling.map((c, k) => `<div data-callpane="${k}" ${k ? "hidden" : ""}><blockquote class="gl-quote">${esc(c.quote.text)}<footer>${refLink(c.quote.span)} · KJV</footer></blockquote>${c.claim ? claimHTML(c.claim) : ""}</div>`).join("")}`);
      case "moments": return block(`${P.moments.length} moments with Jesus · tap one to read the words`, momentRows(P.moments.map((m, i) => ({ m, i }))));
      case "acts": return block("In Acts", actsBlock(P.acts.map((_, i) => i)));
      case "writings": return block("Writings · links only", P.writings.length ? `<div class="gl-writings">${P.writings.map((w) => `<a href="${writingHref(w)}">${icon("scroll", 18)}${esc(w.title)}${icon("arrowUp", 14)}</a>`).join("")}</div>` : "");
      case "ending": return block("How the story ends", `<div class="gl-ends"><div><h3 class="gl-block-h"><i></i>Scripture</h3>${P.ending.scripture.map((c) => claimHTML(c)).join("")}</div>
        <div><h3 class="gl-block-h"><i class="is-trad"></i>Tradition, by who said it and when</h3>${P.ending.tradition.map((c, i) => { const has = P.globe.arcs.some((a) => a.trad === i); return `<div class="gl-trad-item ${has ? "has-arc" : ""}" ${has ? `data-trad="${i}"` : ""}><span class="when">${esc(yearBadge(c.when).big)} ${has ? "· on the globe" : ""}</span><p>${esc(c.text)}</p>${claimFoot(c)}</div>`; }).join("")}</div></div>
        ${unpinned.length ? `<p class="gl-unpinned"><b>Not pinned.</b> These places have no coordinates in our places data, so the globe does not draw them: ${unpinned.map((p) => `<b>${esc(p.name)}</b>${p.note ? ` (${esc(p.note)})` : ""}`).join("; ")}.</p>` : ""}`);
      case "companions": return block("Companions", `<div class="gl-people">${P.companions.map((c) => `<div><b><a href="${personHref(c.person.personId)}">${esc(c.person.name)}</a></b>${esc(c.claim.text)}${claimFoot(c.claim)}</div>`).join("")}</div>`);
      case "questions": return block("Open questions", P.questions.map((q) => `<div class="gl-q"><h4>${esc(q.question)}</h4><ul>${q.views.map((v) => `<li style="--c:var(--l-${{ "early-church": "early" }[v.argument.layer] ?? v.argument.layer})"><b>${esc(v.label)}</b><small>${esc(v.holders)}</small>${esc(v.argument.text)}${claimFoot(v.argument)}</li>`).join("")}</ul></div>`).join(""));
      case "notSaid": return block("What Scripture does not say", `<ul class="gl-notsaid">${P.notSaid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`);
      case "sources": return block("Sources", sourceList("gl-src"));
      default: return "";
    }
  }
  const ordinal = (n) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;
  function chapterHTML(c, k, unpinned) {
    const journey = c.journey ? P.globe.journeys.find((j) => j.id === c.journey) : null;
    const jStops = journey ? `<div class="gl-block"><h3>${journey.stops.length} stops on the route</h3><p class="claim">${journey.stops.map((s) => esc(s.name)).join(" → ")}</p>${journey.unpinned.length ? `<p class="gl-unpinned"><b>Regions without a pin:</b> ${journey.unpinned.map(esc).join(", ")}.</p>` : ""}</div>` : "";
    const moments = c.moments ? block("With the risen Lord", momentRows(c.moments.map((i) => ({ m: P.moments[i], i })))) : "";
    const acts = c.acts ? block("Acts and the letters", actsBlock(c.acts)) : "";
    const pinsForChips = journey ? { pins: journey.stops.filter((s, i, a) => a.findIndex((x) => x.placeId === s.placeId) === i).map((s) => ({ placeId: s.placeId, name: s.name.split(",")[0], ll: s.ll })) } : c;
    return `<section class="gl-ch" data-ch="${k}"><article class="gl-card glass">
      <p class="k"><i>${k + 1}</i>${esc(c.kicker)}</p><h2>${esc(c.title)}</h2>${placeChips(pinsForChips)}
      ${jStops}${(c.parts ?? []).map((p) => partHTML(p, unpinned)).join("")}${moments}${acts}</article></section>`;
  }
})();
