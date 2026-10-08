// The journey: a tall scroll track with the helix stage pinned inside it. Scrolling rides the camera up David's
// years; the HUD carries the title, the crystal kinds, the year gauge and the panel for whatever is chosen.
import { esc, KINDS, kindVar, yearText, prefersReduced, span } from "./util.js";
import { travel, progressForYear } from "./helix-geometry.js";
import { panelHtml } from "./panel.js";

const icon = (...a) => window.icon(...a);

export function mountJourney(root, data, makeStage) {
  const counts = Object.fromEntries(KINDS.map((k) => [k.id, data.crystals.filter((c) => c.kind === k.id).length]));
  const p = data.person;
  root.innerHTML = `
  <div class="stage" id="stage">
    <div class="stage-host" id="stage-host"></div>
    <div class="stage-scrim" aria-hidden="true"></div>
    <div class="stage-labels" id="stage-labels"></div>
    <header class="hud-title">
      <p class="kicker">${icon("crown", 15)}${esc(p.title)} · ${esc(p.house)}</p>
      <h1>David<span>.</span></h1>
      <p class="hud-tag">${esc(p.tagline)}</p>
      <blockquote class="hud-verse"><p>“${esc(data.hero.verse.text)}”</p><a class="ref" href="/read/kjv/2SA/5?v=4">2 Samuel 5:4 · KJV</a></blockquote>
    </header>
    <div class="hud-kinds" role="group" aria-label="Show crystals by kind"><p class="hud-kinds-h">Crystals by kind · tap to filter</p>
      ${KINDS.map((k) => `<button type="button" class="kind" data-kind="${k.id}" aria-pressed="false" style="--c:${kindVar(k.id)}" title="${esc(k.label)}: ${counts[k.id]} crystals, shaped as ${esc(k.shape.toLowerCase())}">
        <span class="kind-gem">${icon(k.icon, 20, 1.7)}</span><span class="kind-l">${esc(k.label)}</span><b>${counts[k.id]}</b></button>`).join("")}
      <button type="button" class="kind kind-all" data-kind="all" hidden>${icon("x", 15)}Show all</button>
    </div>
    <div class="hud-gauge" id="gauge" role="slider" tabindex="0" aria-label="Travel through David's years" aria-valuemin="0" aria-valuemax="70" aria-valuenow="0">
      <div class="g-track">
        <i class="g-seg g-before" style="--a:0;--b:${30 / 70}"></i><i class="g-seg g-hebron" style="--a:${30 / 70};--b:${37.5 / 70}"></i><i class="g-seg g-jer" style="--a:${37.5 / 70};--b:1"></i>
        ${data.crystals.map((c) => `<i class="g-tick${c.dated ? " is-dated" : ""}" style="--p:${c.year / 70};--c:${kindVar(c.kind)}"></i>`).join("")}
        <b class="g-mark" id="g-mark"><span id="g-read">0</span></b>
      </div>
      <div class="g-names"><span style="--p:${15 / 70}">Before the throne</span><span style="--p:${33.75 / 70}">Hebron</span><span style="--p:${54 / 70}">Jerusalem</span></div>
    </div>
    <div class="hud-focus" id="hud-focus" hidden></div>
    <aside class="hud-panel" id="hud-panel" aria-live="polite"></aside>
    <button type="button" class="hud-replay" id="replay" title="Grow the helix again (slow it down with the Ticker)" aria-label="Grow the helix again">${icon("replay", 18)}</button>
  </div>`;

  const stageEl = root.querySelector("#stage"), host = root.querySelector("#stage-host"), panel = root.querySelector("#hud-panel");
  const gauge = root.querySelector("#gauge"), mark = root.querySelector("#g-mark"), read = root.querySelector("#g-read");
  const focusBar = root.querySelector("#hud-focus");
  const st = { selected: null, pinned: null, flight: null, filter: new Set(), highlight: null, panelKey: "", s: 0 };
  const order = [...data.crystals].sort((a, b) => a.year - b.year);

  const stage = makeStage({ host, labelsEl: root.querySelector("#stage-labels"), data, onPick: pick, onHover: () => {} });
  stageEl.dataset.renderer = stage.kind;

  // ── Composition: keep the sculpture in the open space between the HUD blocks ──
  function compose() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (w >= 1024) stage.setOffset(Math.round((330 - Math.min(440, w * 0.32)) / 2), 0);
    else if (w >= 900) stage.setOffset(Math.round((220 - 380) / 2), 0);
    else stage.setOffset(0, Math.round(h * 0.01));
    const kinds = root.querySelector(".hud-kinds");
    if (w >= 900) stage.setSafeArea(kinds.offsetLeft + kinds.offsetWidth + 12, panel.offsetLeft - 92); else stage.setSafeArea(-Infinity, Infinity);
  }
  new ResizeObserver(compose).observe(stageEl);
  compose();

  // ── Scroll travel ──
  const journeyTop = () => root.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(stageEl).top) || 0);
  const travelLength = () => Math.max(1, root.offsetHeight - stageEl.offsetHeight);
  const progress = () => Math.max(0, Math.min(1, (scrollY - journeyTop()) / travelLength()));
  function scrollToProgress(s, smooth = true) { window.scrollTo({ top: journeyTop() + s * travelLength() + 1, behavior: smooth && !prefersReduced() ? "smooth" : "auto" }); }

  function onScroll() {
    const s = progress();
    st.s = s;
    const t = travel(s);
    stage.setView(t);
    const y = t.year;
    mark.style.setProperty("--p", y / 70);
    read.textContent = t.overview > 0.5 ? "All" : t.summit > 0.3 ? "70" : yearText(Math.round(y * 2) / 2);
    gauge.setAttribute("aria-valuenow", String(Math.round(y)));
    stageEl.classList.toggle("is-overview", t.overview > 0.5);
    if (st.flight) { if (Math.abs(s - st.flight.s) < 0.003) st.flight = null; else return; }
    if (st.pinned) {
      const c = data.crystalById[st.pinned] ?? data.rungById[st.pinned];
      if (c && Math.abs(c.year - y) < 1.4 && t.overview < 0.5 && t.summit < 0.3) return;
      if (st.pinned === "cap" && t.summit > 0.3) return;
      st.pinned = null;
    }
    if (t.overview > 0.5) return show(null, "overview");
    if (t.summit > 0.3) return show("cap", "cap");
    const live = order.filter((c) => (!st.filter.size || st.filter.has(c.kind)) && (!st.highlight || st.highlight.has(c.id)));
    let best = null, bd = 0.8;
    for (const c of live) { const d = Math.abs(c.year - y); if (d < bd) { bd = d; best = c; } }
    if (best) show(best.id, "crystal");
    else show(null, y < 30 ? "before" : y < 37.5 ? "hebron" : "jerusalem");
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  // ── Choosing ──
  function show(id, type) {
    const key = `${type}:${id}`;
    if (key === st.panelKey) return;
    st.panelKey = key;
    st.selected = id;
    stage.setSelected(id);
    panel.innerHTML = panelHtml(type, id, data, { index: order.findIndex((c) => c.id === id), total: order.length });
    panel.dataset.type = type;
    panel.classList.remove("is-enter"); void panel.offsetWidth; panel.classList.add("is-enter");
    panel.scrollTop = 0;
  }
  function pick({ type, id }) {
    if (type === "crystal") goToCrystal(id);
    else if (type === "rung") goToRung(id);
    else if (type === "cap") { st.pinned = "cap"; show("cap", "cap"); fly(0.985); }
  }
  function fly(s) { st.flight = { s }; clearTimeout(st.flightTimer); st.flightTimer = setTimeout(() => { st.flight = null; }, 2600); scrollToProgress(s); }
  function goToCrystal(id) {
    const c = data.crystalById[id];
    if (!c) return;
    st.pinned = id; show(id, "crystal"); fly(progressForYear(c.year));
  }
  function goToRung(id) {
    const r = data.rungById[id];
    if (!r) return;
    st.pinned = id; show(id, "rung"); fly(progressForYear(r.year));
  }
  function step(d) {
    const i = order.findIndex((c) => c.id === st.selected);
    const next = order[i < 0 ? (d > 0 ? 0 : order.length - 1) : Math.max(0, Math.min(order.length - 1, i + d))];
    if (next) goToCrystal(next.id);
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest(".pn-head") && innerWidth < 900) { panel.classList.toggle("is-open"); return; }
    const k = e.target.closest(".kind");
    if (k) return toggleKind(k.dataset.kind);
    const lbl = e.target.closest("[data-pick]");
    if (lbl && root.querySelector("#stage-labels").contains(lbl)) return pick({ type: lbl.dataset.pick, id: lbl.dataset.id });
    const go = e.target.closest("[data-go]");
    if (go) {
      const v = go.dataset.go;
      if (v === "prev") step(-1); else if (v === "next") step(1);
      else if (v === "start") { st.pinned = null; fly(progressForYear(0) + 0.0005); }
      else if (v.startsWith("crystal:")) goToCrystal(v.slice(8));
      else if (v.startsWith("rung:")) goToRung(v.slice(5));
      else if (v === "cap") pick({ type: "cap", id: "cap" });
      else if (v.startsWith("facet:")) document.dispatchEvent(new CustomEvent("facet:open", { detail: v.slice(6) }));
      return;
    }
    if (e.target.closest("#replay")) { st.pinned = null; st.flight = null; scrollToProgress(0, false); grow(); }
    if (e.target.closest("[data-clear-focus]")) setHighlight(null);
  });
  stageEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" && e.target === gauge) { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp" && e.target === gauge) { e.preventDefault(); step(-1); }
  });

  // ── Kinds filter ──
  function toggleKind(id) {
    if (id === "all") st.filter.clear(); else if (st.filter.has(id)) st.filter.delete(id); else st.filter.add(id);
    root.querySelectorAll(".kind[data-kind]").forEach((b) => b.dataset.kind !== "all" && b.setAttribute("aria-pressed", String(st.filter.has(b.dataset.kind))));
    root.querySelector(".kind-all").hidden = !st.filter.size;
    stageEl.classList.toggle("is-filtered", st.filter.size > 0);
    stage.setFilter(st.filter.size ? new Set(st.filter) : null);
    st.panelKey = ""; onScroll();
  }

  // ── Gauge: click or drag to travel ──
  function gaugeTo(e) {
    const r = gauge.querySelector(".g-track").getBoundingClientRect();
    const vertical = r.height > r.width;
    const f = vertical ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    st.pinned = null; st.flight = null;
    scrollToProgress(progressForYear(Math.max(0, Math.min(1, f)) * 70), false);
  }
  gauge.addEventListener("pointerdown", (e) => { gauge.setPointerCapture(e.pointerId); gaugeTo(e); const move = (ev) => gaugeTo(ev); gauge.addEventListener("pointermove", move); gauge.addEventListener("pointerup", () => gauge.removeEventListener("pointermove", move), { once: true }); });

  // ── Highlight from the facets ("show on the helix") ──
  function setHighlight(ids, label) {
    st.highlight = ids ? new Set(ids) : null;
    stage.setHighlight(st.highlight);
    focusBar.hidden = !ids;
    focusBar.innerHTML = ids ? `${icon("target", 16)}<span>Showing on the helix: <b>${esc(label)}</b></span><button type="button" data-clear-focus>${icon("x", 14)}Show everything</button>` : "";
    st.panelKey = "";
  }
  function focus(ids, label) {
    setHighlight(ids, label);
    const first = ids.map((id) => data.crystalById[id] ?? data.rungById[id]).filter(Boolean).sort((a, b) => a.year - b.year)[0];
    root.scrollIntoView({ behavior: "auto" });
    if (first) (data.crystalById[first.id] ? goToCrystal : goToRung)(first.id);
  }

  // ── The main animation: the helix grows (inspect it with the ticker) ──
  function grow() {
    const active = (pp) => {
      const out = [];
      const sk = span(pp, 0, 0.55), chr = span(pp, 0.3, 0.7);
      if (sk > 0 && sk < 1) out.push(`gold strand rising to year ${Math.round(sk * 70)}`);
      if (chr > 0 && chr < 1) out.push(`silver strand rising to year ${Math.round(30 + chr * 40)}`);
      const popping = data.crystals.filter((c) => { const t = 0.04 + 0.55 * (c.year / 70); return pp > t && pp < t + 0.07; }).map((c) => c.label);
      if (popping.length) out.push(`crystal: ${popping.slice(0, 2).join(", ")}`);
      const rungsOn = data.rungs.filter((r, i) => pp > 0.6 + i * 0.016 && pp < 0.7 + i * 0.016).length;
      if (rungsOn) out.push(`${rungsOn} rung${rungsOn > 1 ? "s" : ""} reaching across`);
      if (pp > 0.86 && pp < 1) out.push("the crown of the verdict");
      return out;
    };
    window.Clock.run({ label: "The helix grows", duration: 6400, frame: (pp) => stage.setBuild(pp), moving: active });
  }

  show(null, "overview");
  onScroll();
  grow();
  return { focus, goToCrystal, goToRung, stage, applyTheme: () => stage.applyTheme() };
}
