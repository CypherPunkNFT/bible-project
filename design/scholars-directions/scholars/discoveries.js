// 03 · The discoveries: the seven finds in date order beside a map of the Holy Land and Sinai (direction C's flying map),
// merged with C's "From the dig to your screen". Choosing a find, or scrolling the list, flies the map to it; each find's
// card traces it on: who found or studied it, what came of it, and where it reaches this site (or plainly, that it does
// not yet). Ramsay's find lies outside that map, so an edge marker points to it and choosing it crossfades to the wider map.
// Built only from window.SCHOLARS: the finds, the scholars' works and site notes, and the chain of the text.
window.Sections = window.Sections || {};
(() => {
  const S = window.SCHOLARS;
  const byId = Object.fromEntries(S.scholars.map((s) => [s.id, s]));
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FIELD_TONE = { history: "--gospels", texts: "--prophets", places: "--history", reference: "--epistles", theology: "--acts" };
  const AREA_ROUTE = { "Letters study": "/study/letters", Apologetics: "/apologetics", Topics: "/topics", "People pages": "/study/people", Rulers: "/study/rulers" };
  const tone = (s) => `var(${FIELD_TONE[s.field]})`;
  const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];
  const word = (n) => WORDS[n] || String(n);
  const chain = S.chain.steps;
  const finds = [...S.finds].sort((a, b) => a.year - b.year);
  const pt = (view, key) => S.views[view].points[key];
  const inHoly = (f) => Boolean(pt("holyland", `find:${f.id}`));
  const outside = finds.filter((f) => !inHoly(f));
  const items = [{ overview: true }, ...finds];

  // ── From the dig to your screen: each find's thread, derived from the data only ──────────────────────────────────────
  // A scholar's listed work counts as "what came of" a find when it is their only find, or when its title names the find.
  function workFor(s, find) {
    const theirs = S.finds.filter((f) => f.by.includes(s.id));
    if (theirs.length === 1) return s.works[0] || null;
    return s.works.find(([title]) => title.toLowerCase().includes(find.name.toLowerCase())) || null;
  }
  // The site is reached through the scholar's own work, or else through the next scholar in the chain of the text whose
  // work the site uses (Codex Sinaiticus → Tischendorf → Westcott → the Letters study).
  function threadOf(find) {
    const steps = [], reached = [];
    for (const id of find.by) {
      const s = byId[id];
      steps.push({ kind: "who", s });
      const work = workFor(s, find);
      if (work) steps.push({ kind: "came", work });
      if (s.site) { reached.push(s); continue; }
      const at = chain.findIndex(([cid]) => cid === id);
      const later = at >= 0 ? chain.slice(at + 1).find(([cid]) => byId[cid].site) : null;
      if (later) { steps.push({ kind: "next", s: byId[later[0]], what: later[1] }); reached.push(byId[later[0]]); }
    }
    for (const s of reached) steps.push({ kind: "site", s });
    if (!reached.length) steps.push({ kind: "none" });
    return { steps, reached, people: new Set(steps.filter((st) => st.s).map((st) => st.s.id)) };
  }
  const threads = Object.fromEntries(finds.map((f) => [f.id, threadOf(f)]));

  const chip = (s) => `<button type="button" class="dsc-chip" data-sid="${s.id}" style="--tone:${tone(s)}"><i></i><span><b>${esc(s.name)}</b>
    <small>${esc(S.faiths[s.faith])} · ${esc(S.fields[s.field])}</small></span>${icon("arrowRight", 14)}</button>`;

  function stepHtml(st) {
    if (st.kind === "who") return `<li class="dsc-step"><p class="dsc-step-k">Found or studied by</p>${chip(st.s)}</li>`;
    if (st.kind === "came") return `<li class="dsc-step"><p class="dsc-step-k">What came of it</p><p class="dsc-step-v"><i>${esc(st.work[0])}</i>, ${st.work[1]}</p></li>`;
    if (st.kind === "next") return `<li class="dsc-step"><p class="dsc-step-k">Next in the chain of the text</p>${chip(st.s)}<p class="dsc-step-v dsc-step-sub">${esc(st.what)}</p></li>`;
    if (st.kind === "none") return `<li class="dsc-step dsc-step-none"><p class="dsc-step-k">On this site</p><p class="dsc-step-v">Not used on this site yet.</p></li>`;
    const area = Object.keys(AREA_ROUTE).find((a) => st.s.site.note.includes(a));
    return `<li class="dsc-step dsc-step-site"><p class="dsc-step-k">${st.s.site.status === "in-use" ? "Where it reaches this site" : "In the library, planned"}</p>
      ${area ? `<a class="dsc-site-link" href="${AREA_ROUTE[area]}">${esc(area)}${icon("arrowUp", 14)}</a>` : ""}<p class="dsc-step-v dsc-step-sub">${esc(st.s.site.note)}</p></li>`;
  }

  function cardHtml(item, i) {
    if (item.overview) {
      const reach = finds.filter((f) => threads[f.id].reached.length), holyCount = finds.length - outside.length;
      const through = reach.map((f) => `${esc(f.name)}, through ${esc(threads[f.id].reached.map((s) => s.short).join(" and "))}`).join("; ");
      const areas = [...new Set(reach.flatMap((f) => threads[f.id].reached.map((s) => Object.keys(AREA_ROUTE).find((a) => s.site.note.includes(a)) || "this site")))];
      return `<article class="dsc-find dsc-find-all" data-i="0"><button type="button" class="dsc-find-hit" aria-label="Show all ${finds.length} discoveries"></button>
        <div class="dsc-find-top"><span class="dsc-year">${finds[0].year}–${finds.at(-1).year}</span><span class="dsc-where">All ${finds.length}</span></div>
        <h3>The ${word(finds.length).toLowerCase()} discoveries</h3>
        <p>From ${esc(byId[finds[0].by[0]].name)} at ${esc(finds[0].where[0])} in ${finds[0].year} to ${esc(byId[finds.at(-1).by[0]].name)} at ${esc(finds.at(-1).where[0])} in ${finds.at(-1).year}.
        ${word(holyCount)} lie in the Holy Land and Sinai; ${outside.map((f) => `${esc(byId[f.by[0]].short)}'s lies beyond this map, at ${esc(f.where[0])}`).join("; ")}.</p>
        <div class="dsc-sum"><p class="dsc-step-k">From the dig to your screen</p>
          <p>${word(reach.length)} reach this site's ${esc(areas.join(" and "))}: ${through}. The other ${word(finds.length - reach.length).toLowerCase()} are not used on this site yet.</p></div>
        <p class="dsc-find-hint">Scroll the list, or choose one.</p></article>`;
    }
    return `<article class="dsc-find" data-i="${i}"><button type="button" class="dsc-find-hit" aria-label="Show ${esc(item.name)} on the map"></button>
      <div class="dsc-find-top"><span class="dsc-year">${item.year}</span><span class="dsc-where">${esc(item.where[0])}${inHoly(item) ? "" : ` <em>· beyond this map</em>`}</span></div>
      <h3>${esc(item.name)}</h3><p>${esc(item.line)}</p>
      <div class="dsc-thread"><p class="kicker">From the dig to your screen</p><ol>${threads[item.id].steps.map(stepHtml).join("")}</ol></div></article>`;
  }

  function railHtml() {
    const lo = 1830, hi = 1970, pos = (y) => ((y - lo) / (hi - lo)) * 100;
    return `<div class="dsc-rail" aria-label="The discoveries by year"><span class="dsc-rail-line"></span>
      ${finds.map((f, i) => `<button type="button" class="dsc-rail-pt" data-i="${i + 1}" style="--p:${pos(f.year).toFixed(2)}" title="${f.year} · ${esc(f.name)}" aria-label="${f.year}, ${esc(f.name)}"><i></i></button>`).join("")}
      <span class="dsc-rail-end" style="--p:${pos(finds[0].year).toFixed(2)}">${finds[0].year}</span><span class="dsc-rail-end" style="--p:${pos(finds.at(-1).year).toFixed(2)}">${finds.at(-1).year}</span>
      <span class="dsc-rail-now" style="--p:0"></span></div>`;
  }

  // ── The map (ported from C's map.js) ────────────────────────────────────────────────────────────────────────────────
  // Each pre-projected view is Mercator; two known finds give the projection, so the sea labels and the off-map marker
  // can be placed in the same coordinates as the data.
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  function mercatorFrom(a, b) {
    const A = (b[2] - a[2]) / (b[0] - a[0]), B = a[2] - A * a[0];
    const C = (b[3] - a[3]) / (mercY(b[1]) - mercY(a[1])), D = a[3] - C * mercY(a[1]);
    return {
      project: (lon, lat) => [A * lon + B, C * mercY(lat) + D],
      invert: (x, y) => [(x - B) / A, ((2 * Math.atan(Math.exp((y - D) / C)) - Math.PI / 2) * 180) / Math.PI],
    };
  }
  const fromFind = (view, id) => { const f = S.finds.find((x) => x.id === id), p = pt(view, `find:${id}`); return [f.where[2], f.where[1], p[0], p[1]]; };
  const PROJ = {
    holyland: mercatorFrom(fromFind("holyland", "sinaiticus"), fromFind("holyland", "hazor")),
    med: mercatorFrom(fromFind("med", "sinaiticus"), fromFind("med", "hazor")),
  };
  // [label, lon, lat]; the Dead Sea and the Sea of Galilee are holes in the land outline.
  const WATERS = {
    holyland: [["Mediterranean Sea", 33.55, 32.35], ["Sinai", 33.75, 29.75], ["Dead Sea", 35.5, 31.5], ["Sea of Galilee", 35.59, 32.83]],
    med: [["Mediterranean Sea", 18.5, 35.2], ["Asia Minor", 33, 39.3], ["Black Sea", 34.5, 43.2]],
  };

  // d3's smooth zoom (van Wijk and Nuij): pans out a little on long moves so the eye keeps its place.
  function interpolateZoom(p0, p1) {
    const rho = Math.SQRT2, [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1, dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-12) {
      const S0 = Math.log(w1 / w0) / rho;
      const f = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S0)];
      f.duration = Math.abs(S0) * 1000; return f;
    }
    const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + 4 * d2) / (2 * w0 * 2 * d1), b1 = (w1 * w1 - w0 * w0 - 4 * d2) / (2 * w1 * 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), S1 = (r1 - r0) / rho;
    const f = (t) => {
      const s = t * S1, c0 = Math.cosh(r0), u = (w0 / (2 * d1)) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(rho * s + r0)];
    };
    f.duration = S1 * 1000; return f;
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // A map whose land is an SVG (its viewBox is the camera, animated in requestAnimationFrame) with markers and labels in
  // an HTML layer above it, moved by transforms only.
  class MapStage {
    constructor(host, view, { minW = 60, margin = 12, cls = "" } = {}) {
      this.view = S.views[view]; this.minW = minW; this.margin = margin;
      this.markers = []; this.cam = { x: this.view.width / 2, y: this.view.height / 2, w: this.view.width };
      this.el = document.createElement("div");
      this.el.className = `dsc-stage ${cls}`;
      this.el.innerHTML = `<svg class="dsc-land" aria-hidden="true"><rect class="dsc-water" x="-4000" y="-4000" width="9000" height="9000"/>
        <use href="#dsc-land-${view}" class="dsc-landpath"/></svg><div class="dsc-layer"></div>`;
      host.append(this.el);
      this.svg = this.el.firstElementChild; this.layer = this.el.lastElementChild;
      this.size();
      new ResizeObserver(() => { this.size(); this.cam = this.clamp(this.cam); this.render(); }).observe(this.el);
    }
    size() { this.cw = this.el.clientWidth || 1; this.ch = this.el.clientHeight || 1; }
    clamp({ x, y, w }) {
      const m = this.margin, W = this.view.width, H = this.view.height, a = this.ch / this.cw;
      w = Math.max(this.minW, Math.min(w, W + 2 * m, (H + 2 * m) / a));
      const h = w * a;
      x = Math.min(Math.max(x, -m + w / 2), W + m - w / 2);
      y = Math.min(Math.max(y, -m + h / 2), H + m - h / 2);
      return { x, y, w };
    }
    // The camera that holds these points with `pad` screen pixels to spare on every side.
    fit(points, pad = 48, minW = this.minW) {
      const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
      const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
      const px = Math.min(pad, this.cw / 4), py = Math.min(pad, this.ch / 4);
      const w = Math.max(minW, (bw * this.cw) / (this.cw - 2 * px), (bh * this.cw) / (this.ch - 2 * py));
      return this.clamp({ x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2, w });
    }
    toScreen(x, y) { const s = this.cw / this.cam.w, h = this.cam.w * (this.ch / this.cw); return [(x - (this.cam.x - this.cam.w / 2)) * s, (y - (this.cam.y - h / 2)) * s]; }
    add(marker) {
      marker.el.classList.toggle("dsc-left", Boolean(marker.labelLeft));
      marker.el.classList.toggle("dsc-center", Boolean(marker.center));
      this.layer.append(marker.el); this.markers.push(marker); return marker;
    }
    jump(cam) { cancelAnimationFrame(this.raf); this.cam = this.clamp(cam); this.render(); }
    fly(target, { max = 1500 } = {}) {
      cancelAnimationFrame(this.raf);
      target = this.clamp(target);
      if (reduced()) { this.jump(target); return; }
      const z = interpolateZoom([this.cam.x, this.cam.y, this.cam.w], [target.x, target.y, target.w]);
      const duration = Math.min(max, Math.max(650, z.duration * 0.9)), start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration), [x, y, w] = z(ease(t));
        this.cam = { x, y, w }; this.render();
        if (t < 1) this.raf = requestAnimationFrame(step); else { this.cam = target; this.render(); }
      };
      this.raf = requestAnimationFrame(step);
    }
    render() {
      const { x, y, w } = this.cam, h = w * (this.ch / this.cw);
      this.svg.setAttribute("viewBox", `${(x - w / 2).toFixed(2)} ${(y - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
      for (const m of this.markers) {
        const [sx, sy] = this.toScreen(m.x, m.y);
        m.sx = sx; m.sy = sy;
        m.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      }
      // Every dot is an obstacle a label may not cover; labels go highest priority first, and one that would overlap a
      // label already shown, or leave the map, is hidden. The chosen place always keeps its name.
      const placed = this.markers.filter((m) => !m.center).map((m) => [m.sx - 6, m.sy - 6, m.sx + 6, m.sy + 6]);
      for (const m of [...this.markers].sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
        if (!m.label) continue;
        if (!m.lw) { m.lw = m.label.offsetWidth; m.lh = m.label.offsetHeight; }
        const sides = m.center ? ["center"] : m.labelLeft ? ["left", "right"] : ["right", "left"];
        let shown = null;
        for (const side of sides) {
          const left = side === "center" ? m.sx - m.lw / 2 : side === "left" ? m.sx - 10 - m.lw : m.sx + 10;
          const box = [left - 2, m.sy - m.lh / 2 - 1, left + m.lw + 2, m.sy + m.lh / 2 + 1];
          const out = box[0] < 2 || box[2] > this.cw - 2 || box[1] < 2 || box[3] > this.ch - 2;
          if (out || placed.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
          shown = side; placed.push(box); break;
        }
        if (!shown && m.force) shown = sides[0];
        m.label.classList.toggle("dsc-lab-off", !shown);
        if (shown && !m.center) m.el.classList.toggle("dsc-left", shown === "left");
      }
      if (this.onRender) this.onRender(this);
    }
  }

  function addMarkers(stage, view) {
    for (const f of finds) {
      const p = pt(view, `find:${f.id}`);
      if (!p) continue;
      const el = document.createElement("button");
      el.type = "button"; el.className = "dsc-mk dsc-mk-find"; el.dataset.find = f.id; el.setAttribute("aria-label", `${f.name}, ${f.year}`);
      el.innerHTML = `<i class="dsc-mk-pulse"></i><i class="dsc-mk-dot"></i><span class="dsc-lab"><b>${esc(f.name)}</b><small>${f.year}</small></span>`;
      stage.add({ el, x: p[0], y: p[1], label: el.querySelector(".dsc-lab"), priority: 10, find: f, labelLeft: f.id === "robinsons-arch" || f.id === "hazor" });
    }
    for (const [name, lon, lat] of WATERS[view]) {
      const [x, y] = PROJ[view].project(lon, lat), el = document.createElement("div");
      el.className = "dsc-mk dsc-mk-sea"; el.innerHTML = `<span class="dsc-lab">${esc(name)}</span>`;
      stage.add({ el, x, y, label: el.firstElementChild, priority: 1, center: true });
    }
  }

  // Move a camera from one view's coordinates to the other's through longitude and latitude.
  function convertCam(from, to, cam) {
    const [lonA, latA] = PROJ[from].invert(cam.x - cam.w / 2, cam.y), [lonB] = PROJ[from].invert(cam.x + cam.w / 2, cam.y);
    const [lon, lat] = PROJ[from].invert(cam.x, cam.y), [x, y] = PROJ[to].project(lon, lat);
    return { x, y, w: Math.abs(PROJ[to].project(lonB, latA)[0] - PROJ[to].project(lonA, latA)[0]) };
  }

  function mount(sec) {
    sec.style.setProperty("--tone", "var(--history)");
    const edgeFind = outside[0];
    sec.innerHTML = `<svg class="dsc-defs" aria-hidden="true"><defs>${["holyland", "med"].map((v) => `<path id="dsc-land-${v}" d="${S.views[v].land}" fill-rule="evenodd" vector-effect="non-scaling-stroke"/>`).join("")}
        <linearGradient id="dsc-land-fill" x1="0" y1="0" x2=".5" y2="1"><stop class="dsc-stop-a"/><stop offset="1" class="dsc-stop-b"/></linearGradient></defs></svg>
      <header class="s-head"><p class="kicker"><span class="s-num">03</span>The discoveries</p>
        <h2>${word(finds.length)} discoveries, <em>from the dig to your screen.</em></h2>
        <p>Choose a discovery, or scroll the list: the map flies to the place, and its card follows the find through the scholar who found or studied it to where it reaches this site.</p></header>
      <div class="dsc-grid">
        <div class="dsc-list-wrap"><div class="dsc-list">${items.map(cardHtml).join("")}<div class="dsc-list-end"></div></div></div>
        <figure class="dsc-mapcard">
          <div class="dsc-tools"><div class="dsc-seg" role="group" aria-label="Map"><button type="button" data-mode="holyland" aria-pressed="true">Holy Land &amp; Sinai</button><button type="button" data-mode="med" aria-pressed="false">Wider map</button></div>
            <p class="dsc-now" aria-live="polite"></p></div>
          <div class="dsc-stages">${edgeFind ? `<button type="button" class="dsc-edge"><span class="dsc-edge-arrow">${icon("arrowRight", 15)}</span><span><b>${esc(edgeFind.where[0])}</b><small>${esc(byId[edgeFind.by[0]].short)} · ${edgeFind.year}</small></span></button>` : ""}</div>
          ${railHtml()}
        </figure>
      </div>
      <div class="dsc-chain"><span class="dsc-chain-k">${esc(S.chain.about.replace(/\.$/, ""))}</span>
        <ol>${chain.map(([id, what]) => `<li><button type="button" data-sid="${id}" style="--tone:${tone(byId[id])}" title="${esc(what)}">${esc(byId[id].short)}</button></li>`).join("")}</ol></div>`;

    const list = sec.querySelector(".dsc-list"), cards = [...list.querySelectorAll(".dsc-find")];
    const stagesEl = sec.querySelector(".dsc-stages"), edge = sec.querySelector(".dsc-edge"), now = sec.querySelector(".dsc-now");
    const railPts = [...sec.querySelectorAll(".dsc-rail-pt")], railNow = sec.querySelector(".dsc-rail-now");
    const chainBtns = [...sec.querySelectorAll(".dsc-chain button")], segBtns = [...sec.querySelectorAll(".dsc-seg button")];
    const stages = { holyland: new MapStage(stagesEl, "holyland", { minW: 90, cls: "dsc-on-stage" }), med: new MapStage(stagesEl, "med", { minW: 120 }) };
    addMarkers(stages.holyland, "holyland");
    addMarkers(stages.med, "med");
    if (edge) stagesEl.append(edge);
    let mode = "holyland", active = -1, programmatic = 0;

    const overviewCam = (m) => stages[m].fit(finds.map((f) => pt(m, `find:${f.id}`)).filter(Boolean), 40, m === "med" ? 300 : 90);
    // Sit the chosen place a little left of centre so its name, to the right, has room.
    const findCam = (f, m) => { const p = pt(m, `find:${f.id}`), w = m === "med" ? 300 : f.id === "sinaiticus" ? 420 : 250; return { x: p[0] + w * 0.14, y: p[1], w }; };

    // The off-map marker sits on the map's edge, on the line from the centre towards the place.
    stages.holyland.onRender = (st) => {
      if (!edge || mode !== "holyland") return;
      const [tx, ty] = PROJ.holyland.project(edgeFind.where[2], edgeFind.where[1]), [sx, sy] = st.toScreen(tx, ty);
      const cx = st.cw / 2, cy = st.ch / 2, dx = sx - cx, dy = sy - cy, ew = edge.offsetWidth / 2 + 14, eh = edge.offsetHeight / 2 + 14;
      const k = Math.min((cx - ew) / Math.abs(dx || 1e-6), (cy - eh) / Math.abs(dy || 1e-6));
      edge.style.transform = `translate3d(${(cx + dx * k - edge.offsetWidth / 2).toFixed(1)}px, ${(cy + dy * k - edge.offsetHeight / 2).toFixed(1)}px, 0)`;
      edge.querySelector(".dsc-edge-arrow").style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    };

    function setMode(next, cam) {
      if (next !== mode) {
        stages[next].jump(convertCam(mode, next, stages[mode].cam));
        stages[mode].el.classList.remove("dsc-on-stage");
        stages[next].el.classList.add("dsc-on-stage");
        mode = next;
        if (edge) edge.hidden = mode !== "holyland";
        segBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      }
      stages[mode].fly(cam);
    }

    function select(i, { scroll = false } = {}) {
      if (i < 0 || i === active) return;
      active = i;
      const f = items[i].overview ? null : items[i];
      cards.forEach((c, n) => c.classList.toggle("dsc-on", n === i));
      for (const st of Object.values(stages)) for (const m of st.markers) {
        if (!m.find) continue;
        const on = Boolean(f && m.find.id === f.id);
        m.el.classList.remove("dsc-pulse");
        m.el.classList.toggle("dsc-on", on);
        m.priority = on ? 20 : 10;
        if (on !== Boolean(m.force)) m.lw = 0; // the chosen label is larger: measure it again
        m.force = on;
        if (on) { void m.el.offsetWidth; m.el.classList.add("dsc-pulse"); }
      }
      stagesEl.classList.toggle("dsc-has-active", Boolean(f));
      railPts.forEach((b) => b.classList.toggle("dsc-on", Number(b.dataset.i) === i));
      railNow.textContent = f ? f.year : "";
      railNow.style.setProperty("--p", f ? railPts[i - 1].style.getPropertyValue("--p") : "0");
      railNow.classList.toggle("dsc-on", Boolean(f));
      now.textContent = f ? f.where[0] : `All ${finds.length} discoveries`;
      // The chain of the text lights the names this find's thread passes through.
      const people = f ? threads[f.id].people : new Set();
      chainBtns.forEach((b) => b.classList.toggle("dsc-hl", people.has(b.dataset.sid)));
      if (!f) setMode("holyland", overviewCam("holyland"));
      else setMode(inHoly(f) ? "holyland" : "med", findCam(f, inHoly(f) ? "holyland" : "med"));
      if (scroll) scrollToCard(i);
    }

    const horizontal = () => getComputedStyle(list).flexDirection === "row";
    function scrollToCard(i) {
      programmatic = performance.now();
      const c = cards[i];
      if (horizontal()) list.scrollTo({ left: c.offsetLeft - list.clientWidth / 2 + c.offsetWidth / 2, behavior: reduced() ? "auto" : "smooth" });
      else list.scrollTo({ top: c.offsetTop - 14, behavior: reduced() ? "auto" : "smooth" });
    }
    // Scrolling the list makes the card under the reading line (a third of the way down, or the middle across) the active one.
    let pending = false;
    list.addEventListener("scroll", () => {
      if (pending || performance.now() - programmatic < 900) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const h = horizontal(), line = h ? list.scrollLeft + list.clientWidth / 2 : list.scrollTop + Math.min(140, list.clientHeight * 0.3);
        let best = 0;
        cards.forEach((c, n) => { const start = h ? c.offsetLeft : c.offsetTop; if (start <= line) best = n; });
        select(best);
      });
    }, { passive: true });
    // A spacer after the last card lets it scroll up to the reading line.
    const end = list.querySelector(".dsc-list-end");
    const fitEnd = () => { end.style.height = horizontal() ? "" : `${Math.max(0, list.clientHeight - cards.at(-1).offsetHeight - 40)}px`; };
    new ResizeObserver(fitEnd).observe(list);

    sec.addEventListener("click", (e) => {
      const person = e.target.closest("[data-sid]");
      if (person) { window.Scholars?.openProfile(person.dataset.sid, person); return; }
      if (e.target.closest(".dsc-site-link")) return;
      const card = e.target.closest(".dsc-find"), marker = e.target.closest(".dsc-mk-find"), rail = e.target.closest(".dsc-rail-pt"), seg = e.target.closest(".dsc-seg button");
      if (card) select(Number(card.dataset.i), { scroll: true });
      else if (marker) select(items.findIndex((it) => it.id === marker.dataset.find), { scroll: true });
      else if (rail) select(Number(rail.dataset.i), { scroll: true });
      else if (e.target.closest(".dsc-edge")) select(items.indexOf(edgeFind), { scroll: true });
      else if (seg && seg.dataset.mode !== mode) setMode(seg.dataset.mode, overviewCam(seg.dataset.mode));
    });

    stages.holyland.jump(overviewCam("holyland"));
    stages.med.jump(overviewCam("med"));
    requestAnimationFrame(() => { select(0); fitEnd(); });
  }

  Sections.discoveries = { mount };
})();
