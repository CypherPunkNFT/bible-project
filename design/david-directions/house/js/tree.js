// The living tree: nodes are bodies on springs that chase their layout targets, push each other apart and sway a
// little in the wind; branches are tapered shapes redrawn every frame from the bodies' positions; crowns are bodies
// too, so they fly from one king to the next. Slow motion (the ticker) slows the springs through Clock.rate.
(() => {
  const D = "david-rut-4-17", SAUL = "saul-1sa-9-2";
  const SVGNS = "http://www.w3.org/2000/svg";
  const K = 58, C = 11.5;            // spring stiffness and damping (a little overshoot, then rest)
  const SIZE = { king: 46, wife: 26, son: 17, sibling: 13, sister: 15, nephew: 16, root: 11, court: 20, child: 22, grandchild: 18, kin: 18, spouse: 16, other: 15 };

  let root, svg, gBranch, gLink, gCrown, gThread, nodeLayer, bodies = new Map(), crowns = {}, st = null, mode = "samuel";
  let W = 800, Ht = 600, raf = 0, last = 0, time = 0, visibleOnPage = true, onPick = () => {}, hoverId = null, branchList = [];

  const el = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const label = (id) => (mode === "chronicles" ? H.chronicles.labels[id] : H.chronicles.samuelLabels[id]) ?? H.people[id].name;
  const sizeOf = (n) => {
    const s = HouseLayout.isWide(W) ? 1 : .74;
    let px = n.id === D ? 58 : n.id === SAUL ? 46 : (n.role === "child" && n.house === "saul" ? 22 : SIZE[n.role] ?? 16);
    if (st && (st.crown.israel === n.id || st.crown.judah === n.id) && n.id !== D && n.id !== SAUL) px = Math.max(px, 34);
    return px * s;
  };
  const tone = (n) => (n.house === "saul" ? "var(--saul)" : n.house === "court" ? "var(--court)" : "var(--gold)");

  function makeNode(n) {
    const b = document.createElement("button");
    b.type = "button"; b.className = `tn tn-${n.role} tn-${n.house}`; b.dataset.id = n.id;
    b.style.setProperty("--c", tone(n));
    const initial = H.people[n.id].name.replace(/^The /, "")[0];
    b.innerHTML = `<i class="tn-dot"><b>${n.role === "son" || n.role === "sibling" || n.role === "root" ? "" : esc(initial)}</b></i><span class="tn-label"></span>`;
    b.addEventListener("click", () => onPick(n.id));
    b.addEventListener("pointerenter", () => { hoverId = n.id; markLineage(); });
    b.addEventListener("pointerleave", () => { hoverId = null; markLineage(); });
    b.addEventListener("focus", () => { hoverId = n.id; markLineage(); });
    b.addEventListener("blur", () => { hoverId = null; markLineage(); });
    nodeLayer.append(b);
    return b;
  }

  // Which body a new person sprouts from: their parent, mother or (for wives and the court) David.
  function sproutFrom(n) {
    const from = n.mother && bodies.get(n.mother)?.on ? n.mother : n.parent ?? (n.house === "court" || n.role === "wife" ? D : null);
    return from && bodies.get(from)?.on ? bodies.get(from) : null;
  }

  // The branches for this state: [from, to, style]. Sons hang from their mother when she is on the tree.
  function branches() {
    const out = [], on = (id) => bodies.get(id)?.on;
    for (const n of H.tree) {
      if (!on(n.id)) continue;
      const wed = st.wed.has(n.id);
      if (wed) out.push([D, n.id, "wed"]);
      if (n.role === "son") out.push([n.mother && on(n.mother) && st.wed.has(n.mother) ? n.mother : D, n.id, st.ghost.has(n.id) ? "ghost" : "twig"]);
      else if (n.parent && on(n.parent)) out.push([n.parent, n.id, n.role === "root" ? "root" : n.id === D ? "trunk" : wed ? "filial" : n.role === "king" ? "trunk" : "limb"]);
      if (n.id === "obed-rut-4-17" && on("ruth-rut-1-4")) out.push(["ruth-rut-1-4", n.id, "root"]);
      if (n.role === "spouse" && n.house === "saul" && on(SAUL)) out.push([SAUL, n.id, "spouse"]);
      if (n.role === "kin" && on(SAUL)) out.push([SAUL, n.id, "spouse"]);
    }
    return out;
  }

  function setState(next) {
    st = next;
    const T = HouseLayout.targets(st, W, Ht, mode);
    for (const n of H.tree) {
      let b = bodies.get(n.id);
      const want = T.has(n.id);
      if (!b && !want) continue;
      if (!b) { b = { n, el: makeNode(n), x: 0, y: 0, vx: 0, vy: 0, on: false, phase: Math.random() * 6.28 }; bodies.set(n.id, b); }
      if (want && !b.on) {
        const src = sproutFrom(n), t = T.get(n.id);
        b.x = src ? src.x : t.x; b.y = src ? src.y : t.y + 40; b.vx = (Math.random() - .5) * 60; b.vy = -40;
        b.el.classList.add("is-born"); setTimeout(() => b.el.classList.remove("is-born"), 900);
      }
      b.on = want;
      if (want) { b.tx = T.get(n.id).x; b.ty = T.get(n.id).y; b.shrink = !!T.get(n.id).shrink; }
      b.r = sizeOf(n) / 2;
      const e = b.el;
      e.hidden = !want;
      e.style.setProperty("--s", `${sizeOf(n)}px`);
      e.querySelector(".tn-label").textContent = label(n.id);
      e.classList.toggle("is-dead", st.dead.has(n.id));
      e.classList.toggle("is-ghost", st.ghost.has(n.id) && !st.visible.has(n.id));
      e.classList.toggle("is-focus", st.focus.includes(n.id));
      e.classList.toggle("is-crowned", st.crown.israel === n.id || st.crown.judah === n.id);
      e.classList.toggle("is-rival", st.rival === n.id);
      e.classList.toggle("is-shrunk", b.shrink);
      e.classList.toggle("lab-l", want && b.tx < 60); e.classList.toggle("lab-r", want && b.tx > W - 90);
      e.classList.toggle("lab-low", want && !!T.get(n.id).low);
      const dead = st.dead.has(n.id) ? ", died in the telling so far" : "";
      e.setAttribute("aria-label", `${label(n.id)}: ${H.people[n.id].brief ?? ""}${dead}. Open their panel.`);
    }
    branchList = branches();
    syncPaths();
    const oil = st.oil;
    root.querySelector(".oil").innerHTML = [1, 2, 3].map((i) => `<i class="${i <= oil ? "on" : ""}" title="${["Bethlehem, by Samuel", "Hebron, by the men of Judah", "Hebron, by the elders of Israel"][i - 1]}"></i>`).join("");
    root.querySelector(".oil").hidden = !oil;
    root.classList.toggle("has-promise", st.promise);
    const merged = st.crown.israel && st.crown.israel === st.crown.judah;
    crowns.israel.g.querySelector("text").style.display = merged ? "none" : "";
    crowns.judah.g.querySelector("text").textContent = merged ? "Israel · Judah" : "Judah";
    crowns.judah.g.querySelector("text").setAttribute("x", merged ? "-6" : "0");
    markLineage();
    kick();
  }

  // One SVG path per branch and per link, created as needed and kept by key.
  const pathPool = new Map();
  function pathFor(keyName, layer, cls) {
    let p = pathPool.get(keyName);
    if (!p) { p = el("path"); pathPool.set(keyName, p); layer.append(p); }
    p.setAttribute("class", cls);
    p.dataset.live = "1";
    return p;
  }
  function syncPaths() {
    for (const p of pathPool.values()) p.dataset.live = "";
    for (const [a, b, kind] of branchList) {
      const dead = st.dead.has(b), house = H.node[b].house === "saul" && kind !== "wed" ? "saul" : "david";
      pathFor(`b:${a}>${b}`, gBranch, `br br-${kind} br-${house}${dead ? " is-dead" : ""}`).dataset.ab = `${a}>${b}`;
    }
    for (const { a, b, kind } of st.links.values()) pathFor(`l:${a}|${b}`, gLink, `ln ln-${kind}`).dataset.ab = `${a}>${b}`;
    for (const p of pathPool.values()) p.style.display = p.dataset.live ? "" : "none";
  }

  // A tapered branch from parent P to child Q: a cubic curve, sampled, widened from w0 to w1.
  function taper(P, Q, w0, w1, horizontal) {
    const dy = P.y - Q.y, dx = Q.x - P.x;
    const c1 = horizontal ? { x: P.x + dx * .5, y: P.y } : { x: P.x, y: P.y - dy * .55 };
    const c2 = horizontal ? { x: Q.x - dx * .5, y: Q.y } : { x: Q.x, y: Q.y + dy * .45 };
    const n = 14, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * u * P.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * Q.x;
      const y = u * u * u * P.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * Q.y;
      const tx = 3 * u * u * (c1.x - P.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (Q.x - c2.x);
      const ty = 3 * u * u * (c1.y - P.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (Q.y - c2.y);
      const len = Math.hypot(tx, ty) || 1, w = (w0 + (w1 - w0) * t) / 2;
      L.push(`${(x - (ty / len) * w).toFixed(1)},${(y + (tx / len) * w).toFixed(1)}`);
      R.push(`${(x + (ty / len) * w).toFixed(1)},${(y - (tx / len) * w).toFixed(1)}`);
    }
    return `M${L.join("L")}L${R.reverse().join("L")}Z`;
  }
  const WIDTH = { trunk: [10, 6], root: [4.5, 3], limb: [4, 1.8], wed: [5, 2.4], twig: [2.4, 1], ghost: [1.2, .8], filial: [1.6, 1], spouse: [1.4, 1] };

  function drawPaths() {
    const s = HouseLayout.isWide(W) ? 1 : .7;
    for (const p of pathPool.values()) {
      if (!p.dataset.live) continue;
      const [a, b] = p.dataset.ab.split(">"), A = bodies.get(a), B = bodies.get(b);
      if (!A?.on || !B?.on) { p.setAttribute("d", ""); continue; }
      if (p.classList.contains("br")) {
        const kind = [...p.classList].find((c) => c.startsWith("br-") && WIDTH[c.slice(3)])?.slice(3) ?? "limb";
        const [w0, w1] = WIDTH[kind];
        p.setAttribute("d", taper(A, B, w0 * s, w1 * s, kind === "root"));
      } else {
        const mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - Math.abs(A.x - B.x) * .18 - 20;
        p.setAttribute("d", `M${A.x.toFixed(1)},${A.y.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`);
      }
    }
  }

  // Crowns: Israel's and Judah's. One holder for both draws them as a single double crown.
  function crownTarget(realm) {
    const holder = st.crown[realm], other = realm === "israel" ? "judah" : "israel", both = holder && st.crown[other] === holder;
    const hb = holder && bodies.get(holder);
    if (hb?.on) return { x: hb.x + (both ? (realm === "israel" ? -13 : 13) : 0), y: hb.y - hb.r - 24, rot: 0, o: 1, sc: HouseLayout.isWide(W) ? 1.5 : 1.2 };
    const lb = bodies.get(st.lastHolder[realm] ?? (realm === "israel" ? SAUL : D));
    if (!lb?.on) return { x: W * .1, y: Ht * .98, rot: .5, o: 0, sc: .7 };
    if (!st.lastHolder[realm]) return { x: lb.x, y: lb.y - lb.r - 24, rot: 0, o: 0, sc: .4 }; // not yet worn: hidden where it will appear
    return { x: lb.x + (realm === "israel" ? 34 : -34), y: Math.min(Ht - 18, lb.y + 64), rot: realm === "israel" ? 1.1 : -1.1, o: .45, sc: 1.1 };
  }
  function rivalTarget() {
    const b = st.rival && bodies.get(st.rival);
    return b?.on ? { x: b.x, y: b.y - b.r - 22, rot: 0, o: 1, sc: 1.35 } : { x: crowns.rival.x, y: crowns.rival.y - 30, rot: .3, o: 0, sc: 2 };
  }

  function step(dt) {
    time += dt;
    const list = [...bodies.values()].filter((b) => b.on), wind = reducedMotion() ? 0 : 1;
    for (const b of list) {
      const lift = 1 - b.ty / Ht, dead = st.dead.has(b.n.id);
      const tx = b.tx + (dead ? 0 : Math.sin(time * .8 + b.phase) * (1.2 + 4.5 * lift) * wind);
      const ty = b.ty + (dead ? 9 : Math.cos(time * .6 + b.phase) * 1.2 * wind);
      b.ax = K * (tx - b.x) - C * b.vx; b.ay = K * (ty - b.y) - C * b.vy;
    }
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r + 8, d2 = dx * dx + dy * dy;
      if (d2 > min * min || d2 < .01) continue;
      const d = Math.sqrt(d2), push = (min - d) * 90 / d;
      a.ax -= dx * push; a.ay -= dy * push; b.ax += dx * push; b.ay += dy * push;
    }
    for (const b of list) { b.vx += b.ax * dt; b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
    for (const [name, c] of Object.entries(crowns)) {
      const t = name === "rival" ? rivalTarget() : crownTarget(name);
      const k = 34, damp = 8.5;
      c.vx += (k * (t.x - c.x) - damp * c.vx) * dt; c.vy += (k * (t.y - c.y) - damp * c.vy) * dt;
      c.x += c.vx * dt; c.y = Math.max(22, c.y + c.vy * dt); c.rot += (t.rot - c.rot) * Math.min(1, dt * 6); c.o += (t.o - c.o) * Math.min(1, dt * 5); c.sc += (t.sc - c.sc) * Math.min(1, dt * 5);
    }
  }

  function draw() {
    for (const b of bodies.values()) if (b.on) b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
    drawPaths();
    for (const [name, c] of Object.entries(crowns)) { c.g.setAttribute("transform", `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${(c.rot * 57.3).toFixed(1)}) scale(${c.sc.toFixed(3)})`); c.g.style.opacity = c.o.toFixed(3); }
    const d = bodies.get(D);
    if (d?.on) {
      root.querySelector(".oil").style.transform = `translate(${(d.x - d.r - 16).toFixed(1)}px, ${(d.y - d.r + 4).toFixed(1)}px)`;
      const top = HouseLayout.isWide(W) ? 0 : Ht * .37, span = d.y - top;
      gThread.setAttribute("d", `M${d.x.toFixed(1)},${(d.y - d.r).toFixed(1)}C${d.x.toFixed(1)},${(top + span * .5).toFixed(1)} ${(d.x + 30).toFixed(1)},${(top + span * .2).toFixed(1)} ${(d.x + 12).toFixed(1)},${top.toFixed(1)}`);
    }
  }

  function loop(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000) * (window.Clock ? Clock.rate : 1);
    last = now;
    for (let i = 0; i < 3; i++) step(dt / 3);
    draw();
    if (visibleOnPage) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && visibleOnPage) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  // Hover or focus: light this person's line back to the root and down to their children; dim the rest.
  function markLineage() {
    const lit = new Set();
    if (hoverId) {
      lit.add(hoverId);
      for (let id = hoverId, n = H.node[id]; n; id = n.mother && bodies.get(n.mother)?.on ? n.mother : n.parent, n = H.node[id]) { lit.add(id); if (n.mother) lit.add(n.parent); }
      for (const n of H.tree) if (n.parent === hoverId || n.mother === hoverId) lit.add(n.id);
      for (const { a, b } of st?.links.values() ?? []) if (a === hoverId || b === hoverId) { lit.add(a); lit.add(b); }
    }
    root.classList.toggle("is-tracing", !!hoverId);
    for (const b of bodies.values()) b.el.classList.toggle("is-lit", lit.has(b.n.id));
    for (const p of pathPool.values()) { const [a, b] = (p.dataset.ab ?? ">").split(">"); p.classList.toggle("is-lit", lit.has(a) && lit.has(b)); }
  }

  const CROWN = "M-13,6 L-15,-8 L-7,-1 L0,-12 L7,-1 L15,-8 L13,6 Z";
  function mount(container, { pick }) {
    root = container; onPick = pick;
    root.innerHTML = `<svg class="tree-svg" aria-hidden="true"><defs>
        <linearGradient id="g-gold" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--gold-deep)"/><stop offset="1" stop-color="var(--gold)"/></linearGradient>
        <linearGradient id="g-saul" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--saul-deep)"/><stop offset="1" stop-color="var(--saul)"/></linearGradient>
        <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path class="thread"/><g class="g-branch"></g><g class="g-link"></g><g class="g-crown"></g></svg>
      <div class="tn-layer"></div><div class="oil" hidden></div>`;
    svg = root.querySelector("svg"); gBranch = svg.querySelector(".g-branch"); gLink = svg.querySelector(".g-link"); gCrown = svg.querySelector(".g-crown"); gThread = svg.querySelector(".thread");
    nodeLayer = root.querySelector(".tn-layer");
    bodies = new Map(); pathPool.clear();
    for (const [name, title] of [["israel", "Israel"], ["judah", "Judah"], ["rival", "A claimed crown"]]) {
      const g = el("g", { class: `crown crown-${name}` });
      g.innerHTML = `<path d="${CROWN}" filter="url(#f-glow)"/><circle cx="0" cy="-12" r="1.8"/><text y="-16">${title === "A claimed crown" ? "claimed" : title}</text>`;
      gCrown.append(g);
      crowns[name] = { g, x: W * .15, y: Ht * .6, vx: 0, vy: 0, rot: 0, o: 0, sc: 1 };
    }
    resize();
    new ResizeObserver(() => { resize(); if (st) setState(st); }).observe(root);
    new IntersectionObserver(([e]) => { visibleOnPage = e.isIntersecting; kick(); }).observe(root);
  }
  function resize() {
    const r = root.getBoundingClientRect();
    W = r.width; Ht = r.height;
    svg.setAttribute("viewBox", `0 0 ${W} ${Ht}`);
  }
  function setMode(m) { mode = m; if (st) setState(st); }
  // Place every body on its target at once (reduced motion, or a first paint without a growth run).
  function settle() { for (const b of bodies.values()) if (b.on) { b.x = b.tx; b.y = b.ty; b.vx = b.vy = 0; } for (const [n, c] of Object.entries(crowns)) { const t = n === "rival" ? rivalTarget() : crownTarget(n); Object.assign(c, { x: t.x, y: t.y, rot: t.rot, o: t.o, sc: t.sc }); } draw(); }

  window.Tree = { mount, setState, setMode, settle, label, get mode() { return mode; }, get state() { return st; } };
})();
