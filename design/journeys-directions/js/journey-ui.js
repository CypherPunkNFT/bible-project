// What every direction shares: the page state (person, lens, chapter, stop), the clicks, and the map wiring.
// Each direction supplies its own markup; elements carry data-j (an action), data-stop, data-progress and so on.
window.DIRECTIONS = {};
const state = { person: "paul", lens: "story", chapter: 1, stop: 0 };
window.JSTATE = state;

const chapterOf = () => CHAPTERS[state.chapter];
window.layerBadge = (layer, cls = "layer") => `<span class="${cls} ${cls}-${layer}">${LAYER[layer]}</span>`;

/** The chapter's overview words (title, years, summary, dating) and the stop's words, as the real page shows them. */
window.stopWords = (stop) => {
  const parts = [];
  if (stop.note && stop.note !== stop.name) parts.push(`<p class="stop-note">${esc(stop.note)}</p>`);
  if (stop.refs.length) parts.push(`<p class="stop-refs">${icon("open", 15)}<span>${stop.refs.map((r) => `<a href="#" data-j="noop">${esc(r)}</a>`).join("")}</span></p>`);
  if (stop.layer === "tradition" && stop.refs.length) parts.push(`<p class="stop-dating">The passage is Scripture; this event and its place are told by later writers, not by the passage.</p>`);
  if (stop.cites?.length) parts.push(`<p class="stop-dating">${stop.layer === "tradition" ? "Told by" : "Sources"}: ${stop.cites.map(esc).join("; ")}</p>`);
  return parts.join("");
};
window.stepButtons = (cls = "steps") => {
  const ch = chapterOf(), last = state.chapter === CHAPTERS.length - 1, n = state.stop, N = ch.stops.length, next = CHAPTERS[state.chapter + 1];
  const label = n === 0 ? "Begin" : n < N ? "Next stop" : next ? `Next: ${next.title}` : "Next";
  return `<div class="${cls}">
    <button type="button" data-j="back" ${state.chapter === 0 && n === 0 ? "disabled" : ""}>${icon("arrowLeft", 15)} Back</button>
    ${n ? `<button type="button" data-j="overview" class="${cls}-all">All stops</button>` : ""}
    <button type="button" data-j="next" class="${cls}-go" ${last && n === N ? "disabled" : ""}>${label} ${icon("arrowRight", 15)}</button></div>`;
};

function mountJourney(root, dir) {
  const host = root.querySelector("[data-map]");
  if (!host) return null;
  const map = new JourneyMap(host, {
    ...dir.mapOptions,
    onReach: (n) => {
      root.querySelectorAll("[data-stop]").forEach((item) => {
        const k = Number(item.dataset.stop);
        item.classList.toggle("is-reached", k <= n);
        item.classList.toggle("is-current", k === n);
      });
      root.querySelectorAll("[data-count]").forEach((c) => { c.textContent = `${n} of ${chapterOf().stops.length}`; });
      root.querySelectorAll("[data-here]").forEach((c) => { c.textContent = chapterOf().stops[n - 1]?.name ?? ""; });
      dir.onReach?.(root, n, chapterOf(), map);
    },
    onProgress: (f) => root.querySelectorAll("[data-progress]").forEach((p) => p.style.setProperty("--p", f.toFixed(4))),
    onPlay: (on) => root.querySelectorAll("[data-j='toggle']").forEach((b) => { b.innerHTML = icon(on ? "pause" : "play", 16); b.setAttribute("aria-label", on ? "Pause" : "Play"); }),
    onFrame: (info) => dir.onFrame?.(root, info, map),
    onDone: () => dir.onDone?.(root),
  });
  map.setChapter(chapterOf(), { animate: false });
  // The route plays itself the first time the map comes into view.
  const seen = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { seen.disconnect(); if (state.stop === 0) map.play(); }
  }, { threshold: 0.35 });
  seen.observe(host);
  map.observer = seen;
  return map;
}

/** Draws a direction into #main and wires it. Returns a teardown. */
window.mountDirection = (main, dir) => {
  main.innerHTML = `<div class="wrap dir-${dir.id} dir-enter">${dir.render(state)}</div>`;
  const root = main.firstElementChild;
  let map = state.person === "paul" ? mountJourney(root, dir) : null;
  const panel = () => { const p = root.querySelector("[data-panel]"); if (p) p.innerHTML = dir.panel(state, chapterOf()); dir.afterPanel?.(root, state); };
  const pressed = (sel, test) => root.querySelectorAll(sel).forEach((b) => b.setAttribute("aria-pressed", String(test(b))));
  const journey = () => {
    map?.observer?.disconnect(); map?.destroy();
    const region = root.querySelector("[data-region='journey']");
    region.innerHTML = dir.journey(state);
    map = state.person === "paul" ? mountJourney(root, dir) : null;
    dir.afterJourney?.(root, state);
  };
  const act = {
    person: (b) => { state.person = b.dataset.person; state.stop = 0; if (!LENSES.find((l) => l.id === state.lens && (!l.only || l.only.includes(state.person)))) state.lens = "story"; pressed("[data-person]", (x) => x.dataset.person === state.person); dir.onPerson?.(root, state); journey(); },
    lens: (b) => { state.lens = b.dataset.lens; pressed("[data-lens]", (x) => x.dataset.lens === state.lens); },
    chapter: (b) => {
      state.chapter = Number(b.dataset.i); state.stop = 0;
      pressed("[data-j='chapter']", (x) => Number(x.dataset.i) === state.chapter);
      dir.onChapter?.(root, state); panel();
      map?.setChapter(chapterOf()).then(() => map.play());
    },
    begin: () => { state.stop = 1; panel(); map?.showAt(1); },
    next: () => {
      const N = chapterOf().stops.length;
      if (state.stop < N) { state.stop += 1; panel(); map?.stepTo(state.stop); }
      else if (state.chapter < CHAPTERS.length - 1) act.chapter({ dataset: { i: state.chapter + 1 } });
    },
    back: () => {
      if (state.stop > 1) { state.stop -= 1; panel(); map?.showAt(state.stop); }
      else if (state.stop === 1) act.overview();
      else if (state.chapter > 0) { act.chapter({ dataset: { i: state.chapter - 1 } }); }
    },
    stop: (b) => { const n = Number(b.dataset.n); state.stop = n; panel(); map?.stepTo(n); },
    overview: () => { state.stop = 0; panel(); map?.showAt(chapterOf().stops.length); },
    replay: () => { if (state.stop) { state.stop = 0; panel(); } map?.play(); },
    toggle: () => { if (!map) return; if (map.playing) map.cancel(); else map.play(map.cur >= chapterOf().stops.length ? 1 : map.cur); },
    noop: () => {},
  };
  const onClick = (e) => {
    const b = e.target.closest("[data-j]");
    if (!b || !root.contains(b) || b.disabled) return;
    e.preventDefault();
    act[b.dataset.j]?.(b);
  };
  root.addEventListener("click", onClick);
  dir.afterMount?.(root, state);
  // Illustrations that move by SMIL stand still for readers who ask for less motion.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) root.querySelectorAll("svg").forEach((s) => s.pauseAnimations?.());
  return () => { map?.observer?.disconnect(); map?.destroy(); dir.teardown?.(root); };
};

// Shared bits of markup the directions reuse.
window.lensButtons = (cls = "lenses") => `<div class="${cls}" role="group" aria-label="Choose a lens">${LENSES.filter((l) => !l.only || l.only.includes(state.person))
  .map((l) => `<button type="button" data-j="lens" data-lens="${l.id}" aria-pressed="${state.lens === l.id}">${l.label}</button>`).join("")}</div>`;
window.keyList = (cls = "key") => `<ul class="${cls}" aria-label="How to read the journey">${KEY.map(([k, text]) => `<li><i class="${cls}-${k}"></i>${text}</li>`).join("")}<li>Years are scholars' dating; the Bible gives none</li></ul>`;
window.personOf = (id = state.person) => PEOPLE.find((p) => p.id === id);
