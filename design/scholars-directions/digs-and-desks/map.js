// Shared pieces for Digs and desks: data helpers and MapStage, a map whose land is an SVG (its viewBox is the camera,
// animated in requestAnimationFrame) with markers and labels in an HTML layer above it, moved by transforms only.
window.DD = window.DD || {};
(() => {
  const S = window.SCHOLARS;
  const FIELD_TONE = { history: "--gospels", texts: "--prophets", places: "--history", reference: "--epistles", theology: "--acts" };
  const AREA_ROUTE = { "Letters study": "/study/letters", Apologetics: "/apologetics", Topics: "/topics", "People pages": "/study/people", Rulers: "/study/rulers" };
  const byId = Object.fromEntries(S.scholars.map((s) => [s.id, s]));
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const tone = (s) => `var(${FIELD_TONE[s.field]})`;
  const eraParts = (key) => { const m = S.eras[key].match(/^(.*?)\s*\((.*)\)$/); return m ? [m[1], m[2]] : [S.eras[key], ""]; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Each pre-projected view is Mercator (except world); two known points give the projection, so labels for seas and
  // regions, and the off-map Asia Minor marker, can be placed in the same coordinates as the data.
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  function mercatorFrom(a, b) {
    const A = (b[2] - a[2]) / (b[0] - a[0]), B = a[2] - A * a[0];
    const C = (b[3] - a[3]) / (mercY(b[1]) - mercY(a[1])), D = a[3] - C * mercY(a[1]);
    return {
      project: (lon, lat) => [A * lon + B, C * mercY(lat) + D],
      invert: (x, y) => [(x - B) / A, ((2 * Math.atan(Math.exp((y - D) / C)) - Math.PI / 2) * 180) / Math.PI],
    };
  }
  const pt = (view, key) => S.views[view].points[key];
  const findOf = (id) => S.finds.find((f) => f.id === id);
  const fromFind = (view, id) => { const f = findOf(id), p = pt(view, `find:${id}`); return [f.where[2], f.where[1], p[0], p[1]]; };
  const PROJ = {
    holyland: mercatorFrom(fromFind("holyland", "sinaiticus"), fromFind("holyland", "hazor")),
    med: mercatorFrom(fromFind("med", "sinaiticus"), fromFind("med", "hazor")),
  };

  // The land outlines are defined once in a hidden SVG and reused by every map through <use>.
  function defineLand() {
    const holder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    holder.setAttribute("aria-hidden", "true");
    holder.setAttribute("class", "dd-defs");
    holder.innerHTML = `<defs>${Object.entries(S.views).map(([name, v]) => `<path id="dd-land-${name}" d="${v.land}" vector-effect="non-scaling-stroke"/>`).join("")}
      <linearGradient id="dd-land-fill" x1="0" y1="0" x2=".5" y2="1"><stop class="dd-stop-a"/><stop offset="1" class="dd-stop-b"/></linearGradient></defs>`;
    document.body.append(holder);
  }

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

  class MapStage {
    constructor(host, view, { minW = 60, margin = 12, cls = "" } = {}) {
      this.view = S.views[view]; this.name = view; this.minW = minW; this.margin = margin;
      this.markers = []; this.cam = { x: this.view.width / 2, y: this.view.height / 2, w: this.view.width };
      this.el = document.createElement("div");
      this.el.className = `dd-stage ${cls}`;
      this.el.innerHTML = `<svg class="dd-land" aria-hidden="true"><rect class="dd-water" x="-4000" y="-4000" width="9000" height="9000"/>
        <use href="#dd-land-${view}" class="dd-landpath"/></svg><div class="dd-layer"></div>`;
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
      marker.el.classList.toggle("dd-left", Boolean(marker.labelLeft));
      marker.el.classList.toggle("dd-center", Boolean(marker.center));
      this.layer.append(marker.el); this.markers.push(marker); return marker; }
    jump(cam) { cancelAnimationFrame(this.raf); this.cam = this.clamp(cam); this.render(); }
    fly(target, { max = 1500 } = {}) {
      cancelAnimationFrame(this.raf);
      target = this.clamp(target);
      if (reduced()) { this.jump(target); return; }
      const z = interpolateZoom([this.cam.x, this.cam.y, this.cam.w], [target.x, target.y, target.w]);
      const duration = Math.min(max, Math.max(650, z.duration * 0.9)), start = performance.now();
      this.el.classList.add("dd-moving");
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration), [x, y, w] = z(ease(t));
        this.cam = { x, y, w }; this.render();
        if (t < 1) this.raf = requestAnimationFrame(step); else { this.cam = target; this.render(); this.el.classList.remove("dd-moving"); }
      };
      this.raf = requestAnimationFrame(step);
    }
    render() {
      const { x, y, w } = this.cam, h = w * (this.ch / this.cw);
      this.svg.setAttribute("viewBox", `${(x - w / 2).toFixed(2)} ${(y - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
      const placed = [];
      const order = [...this.markers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      for (const m of this.markers) {
        const [sx, sy] = this.toScreen(m.x, m.y);
        m.sx = sx + (m.dx || 0); m.sy = sy + (m.dy || 0);
        m.el.style.transform = `translate3d(${m.sx.toFixed(1)}px, ${m.sy.toFixed(1)}px, 0)`;
      }
      // Every visible dot is an obstacle a label may not cover.
      for (const m of this.markers) if (!m.center && !m.el.classList.contains("dd-dim")) placed.push([m.sx - 6, m.sy - 6, m.sx + 6, m.sy + 6]);
      // Labels: highest priority first; a label that would overlap one already shown, or leave the map, is hidden.
      for (const m of order) {
        if (!m.label) continue;
        if (m.hideLabel) { m.label.classList.add("dd-lab-off"); continue; }
        if (!m.lw) { m.lw = m.label.offsetWidth; m.lh = m.label.offsetHeight; }
        // Try the preferred side first, then the other; centred labels have only one place.
        const sides = m.center ? ["center"] : m.labelLeft ? ["left", "right"] : ["right", "left"];
        let shown = null;
        for (const side of sides) {
          const left = side === "center" ? m.sx - m.lw / 2 : side === "left" ? m.sx - (m.gap || 10) - m.lw : m.sx + (m.gap || 10);
          const box = [left - 2, m.sy - m.lh / 2 - 1, left + m.lw + 2, m.sy + m.lh / 2 + 1];
          const out = box[0] < 2 || box[2] > this.cw - 2 || box[1] < 2 || box[3] > this.ch - 2;
          if (out || placed.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
          shown = side; placed.push(box); break;
        }
        if (!shown && m.force) shown = sides[0]; // the chosen place always keeps its name
        m.label.classList.toggle("dd-lab-off", !shown);
        if (shown && !m.center) m.el.classList.toggle("dd-left", shown === "left");
      }
      if (this.onRender) this.onRender(this);
    }
  }

  Object.assign(DD, { S, byId, esc, years, tone, eraParts, reduced, PROJ, pt, findOf, MapStage, defineLand, FIELD_TONE, AREA_ROUTE,
    faith: (s) => S.faiths[s.faith], field: (s) => S.fields[s.field] });
})();
