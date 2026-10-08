// The stage around the tree: the title, the caption console, the year scrubber, the list switch (2 Samuel or
// 1 Chronicles), the succession drama, and the panel that opens when a person is chosen.
(() => {
  const SEG = { pre: { w: .2, name: "Before the throne", short: "Before", sub: "no ages or years given" }, hebron: { w: .76 * 7.5 / 40.5, name: "Hebron", short: "Heb.", sub: "7 years 6 months" },
    jer: { w: .76 * 33 / 40.5, name: "Jerusalem", sub: "33 years" }, after: { w: .04, name: "+", sub: "" } };
  const ORDER = ["pre", "hebron", "jer", "after"];
  let cur = 0, beat = null, tickX = [], dom = {}, dragging = false;

  // Each step's place on the track: spread evenly inside its segment, whose width is its share of the years.
  function layoutTicks() {
    let x = 0; tickX = [];
    for (const seg of ORDER) {
      const idx = H.steps.filter((s) => s.seg === seg).map((s) => s.index), w = SEG[seg].w;
      const a = x + w * (seg === "pre" ? .06 : .02), b = x + w * (seg === "after" ? .7 : .98);
      idx.forEach((i, k) => { tickX[i] = idx.length === 1 ? (a + b) / 2 : a + ((b - a) * k) / (idx.length - 1); });
      x += w;
    }
  }
  function yearLine(s) {
    if (s.seg === "pre") return { big: "—", text: "Before the throne. Scripture gives no ages or years here.", dated: false };
    if (s.seg === "after") return { big: "+", text: "After David: the first acts of Solomon's reign.", dated: false };
    if (s.year === 1) return { big: "1", text: "Year 1 of the reign: king over Judah in Hebron (2 Samuel 2:11).", dated: true };
    if (s.year === 8) return { big: "7½", text: "After seven years and six months in Hebron (2 Samuel 5:5).", dated: true };
    if (s.year === 40) return { big: "40", text: "The fortieth year: “forty years … thirty and three years reigned he in Jerusalem” (1 Kings 2:11).", dated: true };
    return s.seg === "hebron" ? { big: "1–7½", text: "Somewhere in the Hebron years. The text does not date it.", dated: false }
      : { big: "8–40", text: "Somewhere in the Jerusalem years. Undated: shown in the order 2 Samuel tells it.", dated: false };
  }

  function caption(parts, title, kicker, counter) {
    const [first, ...rest] = parts;
    return `<div class="cap-in"><p class="cap-kicker">${kicker}</p><h3 class="cap-title">${esc(title)}</h3>
      ${first ? captionPart(first, "cap-main") : ""}
      ${rest.length ? expander(rest.map((p) => captionPart(p)).join(""), { closed: `More from the text (${rest.length})`, opened: "Less" }) : ""}
      <p class="cap-count">${counter}</p></div>`;
  }

  function show(i, { fromClock = false } = {}) {
    if (!fromClock) Clock.stop();
    beat = null; cur = clamp(i, 0, H.steps.length - 1);
    const s = H.steps[cur], y = yearLine(s);
    Tree.setState(HouseState.at(cur));
    dom.stage.classList.remove("is-drama");
    dom.cap.innerHTML = caption(s.caption, s.title, `<span class="seg-dot seg-${s.seg}"></span>${esc(SEG[s.seg].name)}${SEG[s.seg].sub ? ` · ${esc(SEG[s.seg].sub)}` : ""}`,
      `Step ${cur + 1} of ${H.steps.length}${s.drama ? ' · <button type="button" class="link-btn" data-drama-open>Play this as a drama</button>' : ""}`);
    const gap = s.interval ? ` Since the step before: “${s.interval.text.replace(/[“”]/g, "")}” (${refText(s.interval.span)}).` : "";
    dom.year.innerHTML = `<b class="${y.dated ? "is-dated" : ""}">${y.big}</b><span>${s.seg === "pre" ? "Before the reign" : s.seg === "after" ? "After the reign" : y.dated ? "Year of the reign · dated by the text" : "Year of the reign · not dated"}</span><small>${esc(y.text + gap)}</small>`;
    renderThumb(cur);
    dom.ticks.querySelectorAll(".tick").forEach((t) => t.classList.toggle("is-past", +t.dataset.i <= cur));
    dom.track.setAttribute("aria-valuenow", String(cur + 1));
    dom.track.setAttribute("aria-valuetext", `Step ${cur + 1}: ${s.title}`);
    dom.prev.disabled = cur === 0; dom.next.disabled = cur === H.steps.length - 1;
  }
  function renderThumb(i) {
    const x = typeof i === "number" ? tickX[Math.round(i)] : i;
    dom.thumb.style.left = `${(x * 100).toFixed(3)}%`;
    dom.fill.style.width = `${(x * 100).toFixed(3)}%`;
    dom.thumb.querySelector("span").textContent = H.steps[Math.round(typeof i === "number" ? i : cur)].title;
    dom.thumb.dataset.edge = x > .8 ? "r" : x < .15 ? "l" : "";
  }

  // The succession crisis, 1 Kings 1, as nine scenes on the tree.
  function showBeat(b, { fromClock = false } = {}) {
    if (!fromClock) Clock.stop();
    beat = clamp(b, 0, H.drama.length - 1);
    const base = H.steps.findIndex((s) => s.drama), d = H.drama[beat];
    cur = base;
    Tree.setState(HouseState.drama(beat));
    dom.stage.classList.add("is-drama");
    dom.cap.innerHTML = caption(d.caption, d.title, `${icon("theater", 14)} The succession · 1 Kings 1 · scene ${beat + 1} of ${H.drama.length}`,
      `<span class="beats">${H.drama.map((x, k) => `<button type="button" data-beat="${k}" class="${k === beat ? "is-on" : k < beat ? "is-past" : ""}" aria-label="Scene ${k + 1}: ${esc(x.title)}">${k + 1}</button>`).join("")}</span>
       <button type="button" class="link-btn" data-drama-exit>${icon("x", 13)} Leave the drama</button>`);
    renderThumb(base);
  }
  function playDrama() {
    showBeat(0);
    Clock.run({ label: "The succession crisis, 1 Kings 1 (nine scenes)", duration: H.drama.length * 2600,
      frame: (p) => { const b = Math.min(H.drama.length - 1, Math.floor(p * H.drama.length)); if (b !== beat) showBeat(b, { fromClock: true }); },
      moving: (p) => { const b = Math.min(H.drama.length - 1, Math.floor(p * H.drama.length)); return [`Scene ${b + 1}: ${H.drama[b].title}`, "people moving on springs", ...(b === 7 ? ["the crown flying to Solomon"] : [])]; } });
  }
  // Run the steps from a to b as the main animation the ticker can slow, step and scrub.
  function runSteps(a, b, ms, label) {
    show(a);
    Clock.run({ label, duration: Math.max(1, b - a) * ms,
      frame: (p) => { const i = Math.round(a + (b - a) * easeInOut(p)); if (i !== cur || beat !== null) show(i, { fromClock: true }); },
      moving: (p) => { const i = Math.round(a + (b - a) * easeInOut(p)), s = H.steps[i]; return [`Step ${i + 1}: ${s.title}`, ...(s.ops.add?.length ? [`${s.ops.add.length} sprouting`] : []), ...(s.ops.die?.length ? ["a branch dimming"] : []), ...(s.ops.crown ? ["a crown moving"] : [])]; } });
  }

  function openPanel(id) {
    const p = H.people[id], n = H.node[id], st = Tree.state;
    const died = HouseState.deathStep(id);
    const rel = n.role === "son" ? `${n.daughter ? "Daughter" : "Son"} of David${n.mother ? ` and ${Tree.label(n.mother)}` : ""}` : n.house === "court" ? "At David's court" : n.house === "saul" ? "House of Saul" : "House of David";
    const steps = HouseState.stepsFor(id);
    dom.panel.innerHTML = `<div class="leaf-in"><button type="button" class="leaf-x" data-leaf-close aria-label="Close the panel">${icon("x", 18)}</button>
      <p class="kicker">${esc(rel)}</p><h3>${esc(Tree.label(id))}${Tree.label(id) !== p.name ? ` <small>(${esc(p.name)})</small>` : ""}</h3>
      <p class="leaf-brief">${esc(p.custom ? p.brief : p.short ?? p.brief)}</p>
      ${p.story ? `<p class="leaf-story">${esc(p.story)}</p>` : ""}
      <dl class="leaf-facts">
        ${p.first ? `<div><dt>First named</dt><dd>${refLink([p.first, p.first])}</dd></div>` : ""}
        ${p.verses ? `<div><dt>Verses naming them</dt><dd>${p.verses}</dd></div>` : ""}
        <div><dt>On the tree now</dt><dd>${st.dead.has(id) ? `Died${died ? ` · ${esc(died.title)}` : ""}` : st.ghost.has(id) && !st.visible.has(id) ? "Named, not yet narrated" : "Living"}</dd></div>
      </dl>
      ${steps.length ? `<p class="leaf-sub">In this telling</p><div class="leaf-steps">${steps.map((i) => `<button type="button" data-step="${i}">${esc(H.steps[i].title)}</button>`).join("")}</div>` : ""}
      ${p.custom ? "" : `<a class="leaf-open" href="/people/${esc(id)}">${icon("users", 15)}Open the person page</a>`}
      <p class="leaf-src">${chip(p.custom ? "kjv" : "text")} From the site's people files${p.custom ? " and the KJV" : ""}.</p></div>`;
    dom.panel.classList.add("is-open");
    dom.panel.setAttribute("aria-hidden", "false");
    dom.panel.querySelector(".leaf-x").focus({ preventScroll: true });
  }
  const closePanel = () => { dom.panel.classList.remove("is-open"); dom.panel.setAttribute("aria-hidden", "true"); };

  function html() {
    const P = H.person;
    const segs = ORDER.map((k) => `<div class="seg seg-${k}" style="width:${SEG[k].w * 100}%"><b><span class="long">${SEG[k].name}</span><span class="short">${SEG[k].short ?? SEG[k].name}</span></b><span>${SEG[k].sub}</span></div>`).join("");
    const iv = H.steps.filter((s) => s.interval), a = tickX[iv[0].index - 1], z = tickX[iv.at(-1).index];
    const intervals = `<span class="interval" style="left:${a * 100}%;width:${(z - a) * 100}%">the only intervals given: ${iv.map((s) => esc(s.interval.text)).join(" · ")}</span>`;
    return `<section class="stage" aria-label="The house of David, year by year">
      <div class="stage-title"><p class="kicker">${icon("crown", 14)} ${esc(P.title)}</p>
        <h1>David <em>and his house</em></h1>
        <p class="stage-tag">${esc(P.tagline)} ${P.reign.refs.slice(0, 1).map(refLink).join("")}</p></div>
      <div class="tree-box"><div class="tree" id="tree"></div>
        <div class="house-tags"><span class="ht-saul">House of Saul · Benjamin</span><span class="ht-david">${esc(P.house)} · ${esc(P.tribe)}</span></div>
        <aside class="leaf glass" id="leaf" aria-hidden="true" aria-label="Person"></aside></div>
      <div class="scrub">
        <div class="scrub-ctl">
          <button type="button" class="round" id="prev" aria-label="Previous step">${icon("chevronLeft", 22)}</button>
          <button type="button" class="play" id="play">${icon("play", 22)}<span>Play the house</span></button>
          <button type="button" class="round" id="next" aria-label="Next step">${icon("chevronRight", 22)}</button>
        </div>
        <div class="scrub-main">
          <div class="segs">${segs}</div>
          <div class="track" id="track" role="slider" tabindex="0" aria-label="Year scrubber: step through the telling" aria-valuemin="1" aria-valuemax="${H.steps.length}">
            <i class="fill" id="fill"></i>
            <div class="ticks" id="ticks">${H.steps.map((s) => `<button type="button" tabindex="-1" class="tick${s.year ? " is-dated" : ""}${s.drama ? " is-drama" : ""}" data-i="${s.index}" style="left:${tickX[s.index] * 100}%" aria-label="Step ${s.index + 1}: ${esc(s.title)}"></button>`).join("")}</div>
            <div class="thumb" id="thumb"><span></span></div>
          </div>
          <div class="intervals">${intervals}</div>
        </div>
        <div class="year" id="year"></div>
      </div>
      <div class="console">
        <div class="cap" id="cap" aria-live="polite"></div>
        <div class="ctl">
          <div class="lists" role="group" aria-label="Which list of David's family"><button type="button" data-list="samuel" aria-pressed="true">2 Samuel</button><button type="button" data-list="chronicles" aria-pressed="false">1 Chronicles</button></div>
          <button type="button" class="drama-btn" data-drama-open>${icon("theater", 20)}<span>The succession, as a drama</span></button>
          <ul class="legend">
            <li><i class="lg-dot"></i>Living</li><li><i class="lg-dot is-dead"></i>Death recorded</li><li><i class="lg-dot is-ghost"></i>Named, not yet narrated</li>
            <li><i class="lg-crown"></i>Crown of Israel · of Judah</li><li><i class="lg-crown is-rival"></i>A claimed crown</li><li><i class="lg-tick"></i>Dated by the text</li><li><i class="lg-tick is-und"></i>Undated: order of the telling</li>
          </ul>
        </div>
      </div></section>`;
  }

  function mount(host) {
    layoutTicks();
    host.insertAdjacentHTML("beforeend", html());
    const $ = (id) => host.querySelector(`#${id}`);
    dom = { stage: host.querySelector(".stage"), cap: $("cap"), year: $("year"), track: $("track"), ticks: $("ticks"), thumb: $("thumb"), fill: $("fill"), prev: $("prev"), next: $("next"), panel: $("leaf") };
    Tree.mount($("tree"), { pick: openPanel });
    dom.prev.addEventListener("click", () => (beat !== null ? showBeat(beat - 1) : show(cur - 1)));
    dom.next.addEventListener("click", () => (beat !== null ? showBeat(beat + 1) : show(cur + 1)));
    $("play").addEventListener("click", () => (Clock.running ? Clock.pause() : runSteps(cur >= H.steps.length - 1 ? 0 : cur, H.steps.length - 1, 1700, "The whole telling, step by step")));
    host.addEventListener("click", (e) => {
      const t = e.target.closest("[data-step], [data-beat], [data-drama-open], [data-drama-exit], [data-leaf-close], [data-list]");
      if (!t) return;
      if (t.dataset.step !== undefined) { show(+t.dataset.step); if (t.closest(".leaf")) closePanel(); }
      else if (t.dataset.beat !== undefined) showBeat(+t.dataset.beat);
      else if (t.hasAttribute("data-drama-open")) playDrama();
      else if (t.hasAttribute("data-drama-exit")) show(H.steps.findIndex((s) => s.drama));
      else if (t.hasAttribute("data-leaf-close")) closePanel();
      else if (t.dataset.list) { host.querySelectorAll("[data-list]").forEach((b) => b.setAttribute("aria-pressed", String(b === t))); Tree.setMode(t.dataset.list); }
    });
    // Drag or click anywhere on the track: the nearest step wins; the thumb follows the pointer.
    const nearest = (clientX) => { const r = dom.track.getBoundingClientRect(), f = clamp((clientX - r.left) / r.width, 0, 1); let best = 0; tickX.forEach((x, i) => { if (Math.abs(x - f) < Math.abs(tickX[best] - f)) best = i; }); return { f, best }; };
    dom.track.addEventListener("pointerdown", (e) => { dragging = true; dom.track.setPointerCapture(e.pointerId); const { best } = nearest(e.clientX); show(best); });
    dom.track.addEventListener("pointermove", (e) => { if (!dragging) return; const { f, best } = nearest(e.clientX); if (best !== cur || beat !== null) show(best); renderThumb(f); });
    dom.track.addEventListener("pointerup", () => { dragging = false; renderThumb(cur); });
    dom.track.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (k) { e.preventDefault(); show(cur + k); } else if (e.key === "Home") { e.preventDefault(); show(0); } else if (e.key === "End") { e.preventDefault(); show(H.steps.length - 1); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });
    // The play button says what it will do: play, or pause the run in progress.
    let shown = null;
    setInterval(() => { const r = Clock.running; if (r === shown) return; shown = r; $("play").innerHTML = `${icon(r ? "pause" : "play", 22)}<span>${r ? "Pause" : "Play the house"}</span>`; }, 250);
    // First impression: the house grows from the two roots to the promise of a house "for ever".
    const land = H.steps.findIndex((s) => s.id === "promise");
    if (reducedMotion()) { show(land); Tree.settle(); } else runSteps(0, land, 420, "The house grows: from two houses to the promise");
  }

  // The rooms below call this to send the tree to a step (and bring the stage into view).
  window.Stage = { mount, show: (i) => { show(i); dom.stage.scrollIntoView({ block: "start" }); }, get step() { return cur; } };
})();
