// The strings: glowing lines drawn in an SVG layer between two anchor elements (a = the record's end, b = the voice's
// end). A pluck makes a string vibrate as a real string does: a standing wave (first three modes) under a decaying
// envelope, with the blur of its swing drawn as a faint lens. Every pluck runs through the Clock, so the ticker can
// slow it down, step it and scrub it.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const N = 40;
  const all = new Map();
  let uid = 0, current = null;

  const el = (name, attrs = {}) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

  function bezier(g, s) {
    const u = 1 - s;
    const x = u * u * u * g.p0[0] + 3 * u * u * s * g.p1[0] + 3 * u * s * s * g.p2[0] + s * s * s * g.p3[0];
    const y = u * u * u * g.p0[1] + 3 * u * u * s * g.p1[1] + 3 * u * s * s * g.p2[1] + s * s * s * g.p3[1];
    const dx = 3 * u * u * (g.p1[0] - g.p0[0]) + 6 * u * s * (g.p2[0] - g.p1[0]) + 3 * s * s * (g.p3[0] - g.p2[0]);
    const dy = 3 * u * u * (g.p1[1] - g.p0[1]) + 6 * u * s * (g.p2[1] - g.p1[1]) + 3 * s * s * (g.p3[1] - g.p2[1]);
    const len = Math.hypot(dx, dy) || 1;
    return [x, y, -dy / len, dx / len];
  }
  // Displacement of the string at position s (0..1) and time t (ms since the pluck).
  function shape(st, s, t) {
    const env = st.amp * Math.exp(-t / st.decay) * Math.min(1, t / 40 + 0.25);
    if (st.loose) return env * Math.sin((Math.PI * s) / 2) * Math.sin(t * 0.05);
    const w = 2 * Math.PI * st.freq / 1000;
    return env * (Math.sin(Math.PI * s) * Math.sin(w * t) + 0.42 * Math.sin(2 * Math.PI * s) * Math.sin(2.01 * w * t + 0.7) + 0.16 * Math.sin(3 * Math.PI * s) * Math.sin(3.02 * w * t + 1.9))
      + (st.beat ? env * 0.6 * Math.sin(Math.PI * s) * Math.sin(w * 1.07 * t + 0.3) : 0);
  }
  function envAt(st, t) { return st.amp * Math.exp(-t / st.decay) * Math.min(1, t / 40 + 0.25); }

  function draw(st, { t = Infinity, drawn = 1 } = {}) {
    const g = st.geo;
    if (!g) return;
    const end = (st.loose ? st.reach : 1) * drawn;
    const resting = !Number.isFinite(t) || envAt(st, t) < 0.05;
    const line = [], up = [], down = [];
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * end;
      const [x, y, nx, ny] = bezier(g, s);
      const local = st.loose ? s / st.reach : s;
      const d = resting ? 0 : shape(st, local, t);
      line.push(`${(x + nx * d).toFixed(1)},${(y + ny * d).toFixed(1)}`);
      if (!resting) {
        const e = envAt(st, t) * (st.loose ? Math.sin((Math.PI * local) / 2) : Math.sin(Math.PI * local)) * 1.15;
        up.push(`${(x + nx * e).toFixed(1)},${(y + ny * e).toFixed(1)}`);
        down.unshift(`${(x - nx * e).toFixed(1)},${(y - ny * e).toFixed(1)}`);
      }
    }
    const d = `M${line.join("L")}`;
    st.line.setAttribute("d", d);
    st.glow.setAttribute("d", d);
    st.lens.setAttribute("d", resting ? "" : `M${up.join("L")}L${down.join("L")}Z`);
  }

  function geometry(st) {
    const box = st.layer.host.getBoundingClientRect();
    const ra = st.a.getBoundingClientRect(), rb = st.b.getBoundingClientRect();
    if (!ra.width && !ra.height) { st.geo = null; st.g.style.display = "none"; return; }
    st.g.style.display = "";
    const p0 = [ra.left + ra.width / 2 - box.left, ra.top + ra.height / 2 - box.top];
    const p3 = [rb.left + rb.width / 2 - box.left, rb.top + rb.height / 2 - box.top];
    const dx = p3[0] - p0[0], dy = p3[1] - p0[1];
    const flat = st.orient === "h" || (st.orient !== "v" && Math.abs(dx) >= Math.abs(dy) * 0.5);
    const k = st.bend ?? 0.48;
    const p1 = flat ? [p0[0] + dx * k, p0[1]] : [p0[0], p0[1] + dy * k];
    const p2 = flat ? [p3[0] - dx * k, p3[1]] : [p3[0], p3[1] - dy * k];
    st.geo = { p0, p1, p2, p3 };
    st.length = Math.hypot(dx, dy);
    if (st.loose) st.reach = Math.min(st.reachMax, st.maxLen ? st.maxLen / Math.max(1, st.length) : 1);
    st.amp = st.ampFixed ?? Math.max(7, Math.min(18, st.length * (st.loose ? st.reach : 1) * 0.08));
    st.grad.setAttribute("x1", p0[0]); st.grad.setAttribute("y1", p0[1]); st.grad.setAttribute("x2", p3[0]); st.grad.setAttribute("y2", p3[1]);
  }

  class Layer {
    constructor(host, cls = "") {
      this.host = host;
      this.svg = el("svg", { class: `strings ${cls}`, "aria-hidden": "true" });
      this.defs = el("defs");
      this.svg.append(this.defs);
      host.prepend(this.svg);
      this.items = [];
      this.ro = new ResizeObserver(() => this.layout());
      this.ro.observe(host);
    }
    // a, b: anchor elements. opts: { id, loose, reach, orient, cls, freq, beat, label, drawn }
    add(a, b, opts = {}) {
      const id = opts.id ?? `s${++uid}`;
      const g = el("g", { class: `str ${opts.cls ?? ""}`, "data-id": id });
      const grad = el("linearGradient", { id: `g-${id}`, gradientUnits: "userSpaceOnUse" });
      grad.append(el("stop", { offset: "0", class: "stop-a" }), el("stop", { offset: "1", class: "stop-b" }));
      this.defs.append(grad);
      const lens = el("path", { class: "str-lens", fill: `url(#g-${id})` });
      const glow = el("path", { class: "str-glow", stroke: `url(#g-${id})` });
      const line = el("path", { class: "str-line", stroke: `url(#g-${id})` });
      g.append(lens, glow, line);
      this.svg.append(g);
      const st = { id, layer: this, a, b, g, grad, lens, glow, line, loose: !!opts.loose, reach: opts.reach ?? 0.62, reachMax: opts.reach ?? 0.62, maxLen: opts.maxLen, orient: opts.orient, bend: opts.bend,
        freq: opts.freq ?? 8, decay: opts.decay ?? 850, beat: !!opts.beat, label: opts.label ?? id, ampFixed: opts.amp, drawn: opts.drawn ?? 1 };
      all.set(id, st);
      this.items.push(st);
      geometry(st); draw(st, { drawn: st.drawn });
      return st;
    }
    layout() { for (const st of this.items) { geometry(st); draw(st, { drawn: st.drawn }); } }
  }

  function settle(job) {
    for (const st of job.strings) { st.drawn = 1; draw(st); st.g.classList.remove("is-sounding"); st.g.classList.add("is-sounded"); }
    job.onSettle?.();
  }
  // Runs a pluck (or any string animation) through the Clock. Replacing a running one settles its strings first.
  function run(job) {
    if (current && current !== job) settle(current);
    current = job;
    Clock.run({
      label: job.label, duration: job.duration,
      frame: (p) => job.frame(p),
      moving: (p) => job.moving ? job.moving(p) : [],
      done: () => { if (current === job) { settle(job); current = null; } },
    });
  }

  window.Strings = {
    Layer, run, all,
    get: (id) => all.get(id),
    drawAt: (st, opts) => draw(st, opts),
    envAt,
    // Plucks some strings together (staggered by `stagger` ms). Lights them while they sound.
    pluck(ids, label, { duration = 2600, stagger = 0, onStart, onSettle } = {}) {
      const strings = ids.map((id) => all.get(id)).filter((st) => st && st.geo);
      if (!strings.length) return;
      for (const st of strings) { st.g.classList.add("is-sounding", "is-sounded"); }
      onStart?.();
      const total = duration + stagger * (strings.length - 1);
      run({
        label, duration: total, strings, onSettle,
        frame: (p) => strings.forEach((st, i) => draw(st, { t: Math.max(0, p * total - i * stagger) })),
        moving: (p) => strings.map((st, i) => [st, envAt(st, p * total - i * stagger)]).filter(([, e]) => e > 0.3).map(([st, e]) => `${st.label} (swing ${e.toFixed(1)} px)`),
      });
    },
    relayout() { for (const st of all.values()) { geometry(st); draw(st, { drawn: st.drawn }); } },
    restyle() { Strings.relayout(); },
  };
})();
