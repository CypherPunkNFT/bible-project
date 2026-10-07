// The animated journey map shared by every direction: the route draws itself leg by leg, a traveller walks it (a ship
// whenever it is at sea), each stop lights up as it is reached, and the camera eases to each chapter.
// Sizes stay constant on screen: --u on the <svg> is "user units per CSS pixel", and the CSS multiplies by it.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const easeLeg = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
  const keyOf = ([lon, lat]) => `${lon.toFixed(2)},${lat.toFixed(2)}`;

  // Sea crossings that a straight line would draw over land (lon, lat waypoints between two named stops).
  const WAY = {
    "Seleucia>Salamis, Cyprus": [[34.75, 35.32]],
    "Paphos, Cyprus>Perga in Pamphylia": [[31.75, 35.55], [31.0, 36.6]],
    "Attalia>Antioch in Syria": [[31.25, 36.42], [32.6, 35.92], [34.2, 35.88], [35.55, 35.95], [35.95, 36.12]],
    "Ephesus>Caesarea": [[27.6, 36.5], [29.5, 35.75], [32.0, 34.35], [34.3, 33.0]],
    "Patara>Cyprus": [[31.4, 35.55]],
    "Cyprus>Tyre": [[34.4, 34.3]],
    "Myra in Lycia>Cnidus": [[29.5, 36.02], [28.4, 36.35]],
    "Crete, off Salmone>The Fair Havens, near Lasea": [[26.45, 35.02], [25.6, 34.8]],
  };
  const SHIP = '<path d="M-11 2h22l-4 6h-14z"/><path d="M0 2v-17"/><path d="M0-14c6 3 8 8 8 14H0z" class="jm-sail"/><path d="M0-12c-4 2-6 6-6.5 12H0z" class="jm-sail"/>';

  class JourneyMap {
    constructor(host, opts = {}) {
      this.host = host; this.opts = opts; this.token = 0; this.cur = 0; this.legs = []; this.stops = [];
      this.uid = Math.random().toString(36).slice(2, 8);
      const svg = (this.svg = el("svg", { class: `jm ${opts.className ?? ""}`, viewBox: `0 0 ${GEO.W} ${GEO.H}`, preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": opts.label ?? "Map of the journey" }));
      const defs = el("defs", {}, svg);
      defs.innerHTML = `
        <linearGradient id="jm-land-${this.uid}" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0" class="jm-g1"/><stop offset=".55" class="jm-g2"/><stop offset="1" class="jm-g3"/></linearGradient>
        <pattern id="jm-dots-${this.uid}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.25" class="jm-dot-fill"/></pattern>
        <pattern id="jm-hatch-${this.uid}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v5" class="jm-hatch-line"/></pattern>
        <filter id="jm-glow-${this.uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="jm-relief-${this.uid}" x="-2%" y="-2%" width="104%" height="104%"><feFlood class="jm-relief-flood"/><feComposite in2="SourceAlpha" operator="out"/><feGaussianBlur stdDeviation="4"/><feOffset dy="1.5"/><feComposite in2="SourceAlpha" operator="in" result="s"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s"/></feMerge></filter>
        <filter id="jm-soft-${this.uid}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>
        <radialGradient id="jm-sea-${this.uid}" cx=".5" cy=".45" r=".75"><stop offset="0" class="jm-s1"/><stop offset="1" class="jm-s2"/></radialGradient>
        `;
      defs.querySelector("linearGradient").setAttribute("y2", GEO.H);
      this.defs = defs;
      el("rect", { class: "jm-sea", x: -4000, y: -4000, width: 9000, height: 9000 }, svg);
      this.seaGlow = el("rect", { class: "jm-sea-glow", x: 0, y: 0, width: GEO.W, height: GEO.H, fill: `url(#jm-sea-${this.uid})` }, svg);
      const shallows = el("g", { class: "jm-shallows", filter: `url(#jm-soft-${this.uid})` }, svg);
      this.grat = el("g", { class: "jm-grat" }, svg);
      const shadow = el("g", { class: "jm-land-depth" }, svg);
      const land = el("g", { class: "jm-land", fill: `url(#jm-land-${this.uid})` }, svg);
      const texture = el("g", { class: "jm-land-texture", fill: `url(#jm-dots-${this.uid})` }, svg);
      for (const { d } of GEO.landPaths()) { el("path", { d }, shallows); el("path", { d }, shadow); el("path", { d, filter: opts.relief ? `url(#jm-relief-${this.uid})` : "" }, land); el("path", { d }, texture); }
      const lakes = el("g", { class: "jm-lakes" }, svg);
      for (const d of GEO.lakePaths()) el("path", { d }, lakes);
      this.labels = el("g", { class: "jm-labels" }, svg);
      for (const [name, at, kind] of GEO.LABELS) {
        const [x, y] = GEO.project(at), g = el("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, class: `jm-label jm-label-${kind}` }, this.labels);
        el("text", { "text-anchor": "middle" }, g).textContent = name;
      }
      if (opts.graticule) this.drawGraticule();
      this.ghost = el("g", { class: "jm-ghost" }, svg);
      this.trailGlow = el("g", { class: "jm-trail-glow", filter: `url(#jm-glow-${this.uid})` }, svg);
      this.trail = el("g", { class: "jm-trail" }, svg);
      this.stopLayer = el("g", { class: "jm-stops" }, svg);
      this.traveller = el("g", { class: "jm-traveller" }, svg);
      const inner = (this.travellerInner = el("g", { class: "jm-t-inner" }, this.traveller));
      inner.innerHTML = `<circle class="jm-t-halo" r="13"/><g class="jm-walker"><circle class="jm-t-ring" r="7.5"/><circle class="jm-t-core" r="4.5"/></g><g class="jm-ship"><g transform="scale(1.35)">${SHIP}</g></g>`;
      host.appendChild(svg);
      this.vb = [0, 0, GEO.W, GEO.H];
      // A resized map reframes its chapter (phone rotation, a panel opening beside it).
      this.resize = new ResizeObserver(() => {
        this.applyScale();
        if (this.stops.length && !this.tweening) { this.setView(this.frameOf(this.stops)); this.place(); }
      });
      this.resize.observe(svg);
    }

    drawGraticule() {
      for (let lon = 12; lon <= 37; lon += 1) {
        const [x] = GEO.project([lon, 0]);
        el("path", { d: `M${x.toFixed(1)} -400V${GEO.H + 400}`, class: lon % 5 === 0 ? "jm-grat-major" : "" }, this.grat);
      }
      for (let lat = 30; lat <= 42; lat += 1) {
        const [, y] = GEO.project([0, lat]);
        el("path", { d: `M-600 ${y.toFixed(1)}H${GEO.W + 600}`, class: lat % 5 === 0 ? "jm-grat-major" : "" }, this.grat);
      }
    }

    /** User units per CSS pixel for the current viewBox and the rendered size (meet keeps the whole box in view). */
    applyScale() {
      const r = this.svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.scale = Math.min(r.width / this.vb[2], r.height / this.vb[3]);
      this.svg.style.setProperty("--u", (1 / this.scale).toFixed(4));
      // On a narrow map only the stop the traveller stands at keeps its name; the list beside it names the rest.
      this.svg.classList.toggle("jm-compact", r.width < 560);
    }
    setView(vb) { this.vb = vb; this.svg.setAttribute("viewBox", vb.map((v) => v.toFixed(2)).join(" ")); this.applyScale(); }

    /** The box around a chapter's stops, padded, never smaller than a region. */
    frameOf(stops) {
      const pts = stops.map((s) => GEO.project(s.at));
      let [x0, y0, x1, y1] = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
      let w = Math.max(x1 - x0, 150), h = Math.max(y1 - y0, 110);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, pad = this.opts.pad ?? 0.2;
      w *= 1 + pad * 2; h *= 1 + pad * 2;
      const r = this.svg.getBoundingClientRect(), aspect = r.width && r.height ? r.width / r.height : 1.6;
      // Room kept clear for a panel or a bar floating over the map (fractions of its width / height).
      const res = typeof this.opts.reserve === "function" ? this.opts.reserve() : this.opts.reserve ?? {};
      const rr = res.right ?? 0, rb = res.bottom ?? 0, rt = res.top ?? 0, avail = (aspect * (1 - rr)) / (1 - rb - rt);
      if (w / h < avail) w = h * avail; else h = w / avail;
      this.visibleRight = cx + w / 2; this.visibleLeft = cx - w / 2;
      const fullH = h / (1 - rb - rt);
      return [cx - w / 2, cy - h / 2 - rt * fullH, w / (1 - rr), fullH];
    }

    setChapter(chapter, { animate = true } = {}) {
      this.cancel();
      this.chapter = chapter;
      this.stops = chapter.stops;
      this.buildRoute();
      const target = this.frameOf(this.stops), from = this.vb.slice();
      if (!animate || REDUCED()) { this.setView(target); this.place(); this.showAt(1); return Promise.resolve(); }
      this.showAt(1);
      const token = this.token, start = performance.now(), dur = 1100;
      this.tweening = true;
      return new Promise((resolve) => {
        const frame = (now) => {
          if (token !== this.token) { this.tweening = false; return resolve(); }
          const t = Math.min(1, (now - start) / dur), e = ease(t);
          this.setView(from.map((v, i) => v + (target[i] - v) * e));
          this.place();
          if (t < 1) requestAnimationFrame(frame); else { this.tweening = false; resolve(); }
        };
        requestAnimationFrame(frame);
      });
    }

    buildRoute() {
      for (const g of [this.ghost, this.trail, this.trailGlow, this.stopLayer]) g.replaceChildren();
      this.defs.querySelectorAll("mask").forEach((m) => m.remove());
      this.places = new Map();
      this.stops.forEach((s, i) => {
        const key = keyOf(s.at);
        if (!this.places.has(key)) {
          const [x, y] = GEO.project(s.at);
          const g = el("g", { class: "jm-stop", transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})` }, this.stopLayer);
          g.innerHTML = `<g class="jm-s"><circle class="jm-pulse" r="6"/><circle class="jm-dot-halo" r="10"/><circle class="jm-dot" r="5"/><text class="jm-num" y="3.2" text-anchor="middle"></text><g class="jm-name"><rect class="jm-name-bg" rx="6"/><text></text></g></g>`;
          g.querySelector(".jm-name text").textContent = s.name.replace(/, Cyprus$/, "");
          this.places.set(key, { g, x, y, first: i + 1, numbers: [] });
        }
        this.places.get(key).numbers.push(i + 1);
      });
      for (const p of this.places.values()) p.g.querySelector(".jm-num").textContent = p.first;
      this.legs = [];
      for (let i = 0; i < this.stops.length - 1; i++) {
        const a = this.stops[i], b = this.stops[i + 1];
        if (!this.chapter.route || keyOf(a.at) === keyOf(b.at)) { this.legs.push(null); continue; }
        const way = WAY[`${a.name}>${b.name}`];
        let d;
        if (way) d = GEO.smooth([a.at, ...way, b.at], false);
        else {
          const [x1, y1] = GEO.project(a.at), [x2, y2] = GEO.project(b.at), len = Math.hypot(x2 - x1, y2 - y1);
          // Always bend to the left of travel, so a road walked back is drawn beside the way out, not on top of it.
          const bend = Math.min(0.16 * len, 22);
          const cx = (x1 + x2) / 2 + (-(y2 - y1) / len) * bend, cy = (y1 + y2) / 2 + ((x2 - x1) / len) * bend;
          d = `M${x1.toFixed(2)},${y1.toFixed(2)}Q${cx.toFixed(2)},${cy.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
        }
        el("path", { d }, this.ghost);
        const id = `jm-m-${this.uid}-${i}`, mask = el("mask", { id, maskUnits: "userSpaceOnUse", x: -4000, y: -4000, width: 9000, height: 9000 }, this.defs);
        const m = el("path", { d, class: "jm-mask-leg" }, mask);
        const path = el("path", { d, class: "jm-leg", mask: `url(#${id})` }, this.trail);
        el("path", { d, mask: `url(#${id})` }, this.trailGlow);
        const len = path.getTotalLength(), samples = [];
        for (let k = 0; k <= 40; k++) { const p = path.getPointAtLength((len * k) / 40); samples.push(GEO.onLand(GEO.unproject([p.x, p.y]))); }
        // Ends sit on the coast; a leg is "at sea" where its middle is.
        samples[0] = samples[1]; samples[40] = samples[39];
        m.style.strokeDasharray = `${len} ${len}`;
        m.style.strokeDashoffset = len;
        this.legs.push({ path, mask: m, len, samples, from: a, to: b });
      }
    }

    /** Stop labels go right, or left when a neighbour sits there; dots stay a constant size on screen. */
    place() {
      const list = [...this.places.values()], u = 1 / (this.scale || 1);
      for (const p of list) {
        const w = (p.g.querySelector(".jm-name text").getComputedTextLength?.() || 60) + 24;
        const crowdedRight = list.some((q) => q !== p && q.x > p.x && (q.x - p.x) / u < w && Math.abs(q.y - p.y) / u < 22);
        const offEdge = p.x + w * u > (this.visibleRight ?? this.vb[0] + this.vb[2]);
        const crowdedLeft = list.some((q) => q !== p && q.x < p.x && (p.x - q.x) / u < w && Math.abs(q.y - p.y) / u < 22);
        const offLeft = p.x - w * u < (this.visibleLeft ?? this.vb[0]);
        const left = (crowdedRight || offEdge) && !(crowdedLeft && !offEdge) && !offLeft;
        p.g.classList.toggle("jm-left", left);
        p.g.classList.toggle("jm-up", (crowdedRight || offEdge) && (crowdedLeft || offLeft));
        // Dots packed tightly together keep their names for when the traveller stands there.
        const near = list.filter((q) => q !== p && Math.hypot(q.x - p.x, q.y - p.y) / u < 30).length;
        p.g.classList.toggle("jm-crowd", near >= 1 && crowdedLeft && crowdedRight || near >= 2);
      }
      for (const p of list) {
        const t = p.g.querySelector(".jm-name text"), r = p.g.querySelector(".jm-name-bg");
        const w = t.getComputedTextLength?.() || 40;
        const left = p.g.classList.contains("jm-left"), up = p.g.classList.contains("jm-up");
        if (up) {
          t.setAttribute("x", 0); t.setAttribute("text-anchor", "middle"); t.setAttribute("y", -15);
          r.setAttribute("x", -w / 2 - 6); r.setAttribute("y", -28); r.setAttribute("width", w + 12); r.setAttribute("height", 18);
          continue;
        }
        t.setAttribute("x", left ? -14 : 14); t.setAttribute("text-anchor", left ? "end" : "start"); t.setAttribute("y", 4);
        r.setAttribute("x", left ? -20 - w : 8); r.setAttribute("y", -9); r.setAttribute("width", w + 12); r.setAttribute("height", 18);
      }
    }

    placeTraveller(x, y, sea, dx = 1) {
      this.traveller.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      this.traveller.classList.toggle("is-sea", !!sea);
      this.travellerInner.style.setProperty("--flip", dx < 0 ? -1 : 1);
    }

    mark(n) {
      const reached = new Set(this.stops.slice(0, n).map((s) => keyOf(s.at))), here = n ? keyOf(this.stops[n - 1].at) : null;
      for (const [key, p] of this.places) {
        p.g.classList.toggle("is-reached", reached.has(key));
        const wasCurrent = p.g.classList.contains("is-current");
        p.g.classList.toggle("is-current", key === here);
        if (key === here && !wasCurrent) { p.g.classList.remove("is-pulse"); void p.g.getBBox(); p.g.classList.add("is-pulse"); }
      }
      this.cur = n;
      this.opts.onReach?.(n, this.stops[n - 1]);
    }

    /** Instantly: the route drawn up to stop n, the traveller standing there. */
    showAt(n) {
      this.cancel();
      this.legs.forEach((leg, i) => { if (leg) leg.mask.style.strokeDashoffset = i < n - 1 ? 0 : leg.len; });
      const [x, y] = GEO.project(this.stops[n - 1].at);
      const prev = this.legs[n - 2];
      this.placeTraveller(x, y, prev ? prev.samples[40] === false && prev.samples[39] === false : false);
      this.mark(n);
      this.opts.onProgress?.(this.stops.length > 1 ? (n - 1) / (this.stops.length - 1) : 1);
    }

    cancel() { this.token++; this.setPlaying(false); }
    setPlaying(on) { this.playing = on; this.host.classList.toggle("is-playing", on); this.opts.onPlay?.(on); }
    wait(ms, token) { return new Promise((r) => setTimeout(() => r(token === this.token), ms)); }

    animateLeg(i, token) {
      const leg = this.legs[i];
      if (!leg) return this.wait(260, token);
      const dur = Math.max(520, Math.min(2600, ((leg.len * (this.scale || 1)) / (this.opts.speed ?? 230)) * 1000));
      const start = performance.now(), total = this.stops.length - 1;
      return new Promise((resolve) => {
        let last = leg.path.getPointAtLength(0);
        const frame = (now) => {
          if (token !== this.token) return resolve(false);
          const t = Math.min(1, (now - start) / dur), e = easeLeg(t), at = leg.len * e;
          leg.mask.style.strokeDashoffset = leg.len - at;
          const p = leg.path.getPointAtLength(at), sea = !leg.samples[Math.round(e * 40)];
          if (Math.abs(p.x - last.x) > 0.01) this.dir = Math.sign(p.x - last.x);
          this.placeTraveller(p.x, p.y, sea, this.dir);
          this.opts.onFrame?.({ x: p.x, y: p.y, lonlat: GEO.unproject([p.x, p.y]), sea, leg: i, t: e, from: leg.from, to: leg.to });
          this.opts.onProgress?.((i + e) / total);
          last = p;
          if (t < 1) requestAnimationFrame(frame); else resolve(true);
        };
        requestAnimationFrame(frame);
      });
    }

    /** Play from stop `from` to the end (or to `until`), leg by leg. */
    async play(from = 1, until = this.stops.length) {
      if (REDUCED()) { this.showAt(until); this.opts.onDone?.(); return; }
      this.showAt(from);
      const token = this.token;
      this.setPlaying(true);
      for (let i = from - 1; i < until - 1; i++) {
        if (!(await this.animateLeg(i, token))) return;
        this.mark(i + 2);
        if (!(await this.wait(this.opts.dwell ?? 380, token))) return;
      }
      this.setPlaying(false);
      this.opts.onDone?.();
    }
    /** One step forward animates the leg; anything else jumps. */
    stepTo(n) { if (n === this.cur + 1 && !REDUCED()) return this.play(this.cur, n); this.showAt(n); return Promise.resolve(); }
    toScreen(x, y) {
      const r = this.svg.getBoundingClientRect(), s = this.scale || 1;
      const ox = (r.width - this.vb[2] * s) / 2, oy = (r.height - this.vb[3] * s) / 2;
      return [ox + (x - this.vb[0]) * s, oy + (y - this.vb[1]) * s];
    }
    destroy() { this.cancel(); this.resize.disconnect(); this.svg.remove(); }
  }
  window.JourneyMap = JourneyMap;
})();
