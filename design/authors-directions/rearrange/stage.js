// The main event: one set of 47 person tiles that rearranges itself. Positions come from LAYOUTS; every switch is a
// FLIP move (the tile is set to its new box, then animated from where it was using transform only), staggered.
window.Stage = (() => {
  const { LIST, stageHeight } = LAYOUTS;
  const EASE = "cubic-bezier(.16, 1, .3, 1)", DURATION = 720, STAGGER = 260;
  const tiles = new Map(), boxes = new Map();
  let stage, layers, seg, noteEl, hoverEl, current = LIST[0].key, W = 0, H = 0, result = null, settleTimer = 0;

  function inner(p, b, node) {
    if (node) return `<span class="ti t-line">${R.mono(p)}<span class="tx"><span class="nm">${R.esc(p.short)}</span></span></span>`;
    if (b.w >= 140 && b.h >= 92) {
      const fs = Math.max(15, Math.min(34, Math.sqrt(b.w * b.h) / 11));
      return `<span class="ti t-big" style="--fs:${fs.toFixed(1)}px">${R.mono(p)}<span class="nm">${R.esc(b.w >= 230 ? p.name : p.short)}</span><span class="sb">${b.sub}</span></span>`;
    }
    if (b.w >= 70 && b.h >= 28) {
      const two = b.h >= 40 && b.sub, inline = !two && b.sub && b.w >= 200, withMono = b.w >= 92;
      // The full name only when it fits beside the monogram (and the years, when they share the line).
      const room = b.w - 20 - (withMono ? 32 : 0) - (inline ? b.sub.length * 6 + 10 : 0), name = p.name.length * 7.2 <= room ? p.name : p.short;
      return `<span class="ti ${two ? "t-two" : "t-line"}">${withMono ? R.mono(p) : ""}<span class="tx"><span class="nm">${R.esc(name)}</span>${two || inline ? `<span class="sb">${b.sub}</span>` : ""}</span></span>`;
    }
    if (b.w >= 22 && b.h >= 22) return `<span class="ti t-mono"><span class="ini">${R.initials(p)}</span></span>`;
    return `<span class="ti"></span>`;
  }

  function measure() {
    W = Math.round(stage.clientWidth);
    H = stageHeight(W);
    stage.style.height = `${H}px`;
    layers.innerHTML = LIST.map((l) => `<div class="layer" data-for="${l.key}">${l.run(W, H).layer}</div>`).join("");
  }

  function arrange(key, animate) {
    current = key;
    result = LIST.find((l) => l.key === key).run(W, H);
    const move = animate && !R.reduced && boxes.size;
    stage.classList.toggle("moving", Boolean(move));
    stage.dataset.arrangement = key;
    const order = [...result.boxes.entries()].sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x).map(([id]) => id);
    order.forEach((id, i) => {
      const el = tiles.get(id), b = result.boxes.get(id), old = boxes.get(id), p = personById(id);
      el.innerHTML = inner(p, b, result.node);
      el.classList.toggle("node", Boolean(result.node));
      el.style.width = `${b.w}px`;
      el.style.height = `${b.h}px`;
      el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      el.getAnimations().forEach((a) => a.cancel());
      if (move) {
        el.animate([{ transform: `translate(${old.x}px, ${old.y}px) scale(${old.w / b.w}, ${old.h / b.h})` }, { transform: `translate(${b.x}px, ${b.y}px)` }],
          { duration: DURATION, delay: (i / order.length) * STAGGER, easing: EASE, fill: "backwards" });
      } else if (animate && !R.reduced) {
        el.animate([{ transform: `translate(${W / 2 - 20}px, ${H / 2 - 20}px) scale(.2)`, opacity: 0 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1 }],
          { duration: 900, delay: (i / order.length) * 420, easing: EASE, fill: "backwards" });
      }
      boxes.set(id, { ...b });
    });
    layers.querySelectorAll(".layer").forEach((l) => l.classList.toggle("on", l.dataset.for === key));
    noteEl.textContent = result.note;
    hoverEl.innerHTML = "";
    clearTimeout(settleTimer);
    if (move) settleTimer = setTimeout(() => stage.classList.remove("moving"), DURATION + STAGGER - 160);
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key)));
    slideIndicator();
  }

  function slideIndicator() {
    const active = seg.querySelector('[aria-pressed="true"]'), ind = seg.querySelector(".seg-ind");
    if (!active) return;
    ind.style.width = `${active.offsetWidth}px`;
    ind.style.transform = `translateX(${active.offsetLeft - 4}px)`;
    if (seg.scrollWidth > seg.clientWidth) seg.scrollTo({ left: active.offsetLeft - 24, behavior: R.reduced ? "auto" : "smooth" });
  }

  // Hovering a person or a link explains it in the caption line; in the network it also lights the person's links.
  function showPerson(id) {
    const p = id && personById(id);
    stage.querySelectorAll(".link.on").forEach((l) => l.classList.remove("on"));
    stage.classList.toggle("focus", Boolean(p) && current === "network");
    if (!p) { hoverEl.innerHTML = ""; return; }
    if (current === "network") stage.querySelectorAll(`.layer.on .link[data-a="${id}"], .layer.on .link[data-b="${id}"]`).forEach((l) => l.classList.add("on"));
    hoverEl.innerHTML = `${R.dot(p)}<b>${R.esc(p.name)}</b> <span>${lifeLabel(p)} · ${R.esc(familyOf(p).label)} · ${R.plural(p.works, "work")} in the library</span>`;
  }
  function showLink(index) {
    const l = R.links[index];
    stage.querySelectorAll(".link.on").forEach((x) => x.classList.remove("on"));
    tiles.forEach((t) => t.classList.remove("lit"));
    if (!l) { stage.classList.remove("focus"); hoverEl.innerHTML = ""; return; }
    stage.classList.add("focus");
    stage.querySelector(`.layer.on .link[data-link="${index}"]`)?.classList.add("on");
    [l.from, l.to].forEach((id) => tiles.get(id).classList.add("lit"));
    hoverEl.innerHTML = `<b>${R.esc(personById(l.from).short)} → ${R.esc(personById(l.to).short)}</b> <span>${R.esc(l.note)}</span>`;
  }

  function mount(host) {
    host.innerHTML = `
      <div class="stage-bar">
        <div class="seg" role="group" aria-label="Arrange the people"><span class="seg-ind" aria-hidden="true"></span>
          ${LIST.map((l) => `<button type="button" data-key="${l.key}" aria-pressed="false">${l.label}</button>`).join("")}</div>
        <p class="stage-hint">Choose anyone to open their profile.</p>
      </div>
      <div class="stage" id="stage"><div class="layers"></div></div>
      <div class="caption"><p class="cap-note"></p><p class="cap-hover"></p></div>`;
    stage = host.querySelector(".stage");
    layers = host.querySelector(".layers");
    seg = host.querySelector(".seg");
    noteEl = host.querySelector(".cap-note");
    hoverEl = host.querySelector(".cap-hover");
    for (const p of R.people) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "tile";
      el.dataset.id = p.id;
      el.style.setProperty("--tone", R.tone(p));
      el.setAttribute("aria-label", `${p.name}, ${lifeLabel(p)}`);
      stage.append(el);
      tiles.set(p.id, el);
    }
    stage.addEventListener("click", (e) => {
      const tile = e.target.closest(".tile");
      if (tile) return R.open(tile.dataset.id);
      const hit = e.target.closest(".hit");
      if (hit) showLink(Number(hit.dataset.link));
    });
    stage.addEventListener("pointerover", (e) => {
      const tile = e.target.closest(".tile"), hit = e.target.closest(".hit");
      if (tile) showPerson(tile.dataset.id); else if (hit) showLink(Number(hit.dataset.link));
    });
    stage.addEventListener("pointerout", (e) => {
      if (e.relatedTarget && stage.contains(e.relatedTarget) && (e.relatedTarget.closest(".tile") || e.relatedTarget.closest(".hit"))) return;
      showPerson(null); showLink(null);
    });
    seg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.key !== current) arrange(b.dataset.key, true); });
    R.bus.addEventListener("light", (e) => tiles.forEach((t, id) => t.classList.toggle("lit", id === e.detail)));
    measure();
    arrange(current, true);
    let lastW = W;
    new ResizeObserver(() => {
      if (Math.round(stage.clientWidth) === lastW) return;
      measure(); lastW = W; arrange(current, false);
    }).observe(stage);
    addEventListener("load", slideIndicator);
    document.fonts?.ready.then(slideIndicator);
  }

  return { mount, arrange, get current() { return current; } };
})();
