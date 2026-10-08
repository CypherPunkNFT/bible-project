// The page shell: ?d=a|b|c picks the direction and ?who=peter|paul|thaddaeus the apostle. Switching either redraws in
// place (no reload): the data for all three apostles is cached after the first load, and the globe keeps its
// textures. The floating A · B · C switch sits at the bottom, as on the Authors mock-ups.
(() => {
  const DIRS = [["a", "Lifeline"], ["b", "Chapters"], ["c", "Side by side"]];
  const params = new URLSearchParams(location.search);
  const state = { d: DIRS.some(([k]) => k === params.get("d")) ? params.get("d") : (location.hash.match(/^#([abc])$/)?.[1] ?? "a"), who: WHO.includes(params.get("who")) ? params.get("who") : "peter" };
  const main = Frame.mount();
  let cleanup = null, token = 0;
  const url = (d, who) => `?d=${d}&who=${who}`;

  window.topline = () => `<div class="topline"><a class="back" href="/study/people?view=apostles">${icon("arrowLeft", 14)}Back to the apostles</a>
    <nav class="who-switch" aria-label="Apostle">${WHO.map((w) => `<a href="${url(state.d, w)}" data-who="${w}" ${w === state.who ? 'aria-current="page"' : ""}>${WHO_NAME[w]}</a>`).join("")}</nav></div>`;
  window.secondPageHref = () => `people.html?who=${state.who}&from=${state.d}`;

  const sw = document.createElement("nav");
  sw.className = "dir-switch"; sw.setAttribute("aria-label", "Directions");
  document.body.append(sw);
  const drawSwitch = () => { sw.innerHTML = DIRS.map(([k, t]) => `<a href="${url(k, state.who)}" data-dir="${k}" title="${k.toUpperCase()} · ${t}" ${k === state.d ? 'aria-current="page"' : ""}>${k.toUpperCase()}<span>${t}</span></a>`).join(""); };

  async function render(scrollTop = true) {
    const mine = ++token, t0 = performance.now();
    let d;
    try { d = await loadApostle(state.who); } catch (error) { console.error(`apostle page: could not load ${state.who}`, error); main.innerHTML = `<div class="wrap"><p class="plain-line">This page could not load its data (${esc(error.message)}).</p></div>`; return; }
    if (mine !== token) return;
    window.D = d;
    try { cleanup?.(); } catch (error) { console.error("apostle page: cleanup failed", error); }
    Tip.hide(); Sheet.close();
    main.innerHTML = "";
    main.className = `dir-${state.d}`;
    document.title = `${d.short} · ${DIRS.find(([k]) => k === state.d)[1]} · Bible Project`;
    try { cleanup = DIRECTIONS[state.d].mount(main, d); } catch (error) { console.error(`apostle page: direction ${state.d} failed to draw`, error); }
    drawSwitch();
    if (scrollTop) scrollTo(0, 0);
    window.__lastSwitchMs = Math.round(performance.now() - t0);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-dir], a[data-who]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (a.dataset.dir) state.d = a.dataset.dir;
    if (a.dataset.who) state.who = a.dataset.who;
    history.replaceState(null, "", url(state.d, state.who));
    render(!a.dataset.who);
  });

  (async () => {
    try { await loadBooks(); } catch (error) { console.error("apostle page: could not load the book list", error); }
    await render(false);
    // Warm the other two apostles so switching is instant.
    setTimeout(() => WHO.filter((w) => w !== state.who).forEach((w) => loadApostle(w).catch((error) => console.error(`apostle page: preload ${w}`, error))), 400);
  })();
})();
