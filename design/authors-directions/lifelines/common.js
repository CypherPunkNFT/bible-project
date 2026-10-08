// Lifelines: small pieces every section uses (escaping, colours, the tooltip and the profile drawer).
window.L = (() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SANS = "'Archivo Variable', system-ui, sans-serif";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const toneVar = (p) => `var(${familyOf(p).tone})`;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const plural = (n, one, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

  // Each place a person lived, as a span of years: from arrival until the next arrival (or their death).
  // `end` is exclusive, so a person who died in 1747 is in their last place for the year 1747 itself.
  const stays = (p) => p.places.map((pl, i) => {
    const last = i === p.places.length - 1;
    return { name: pl[0], index: i, start: pl[3], end: last ? lifeEnd(p) + 1 : p.places[i + 1][3], until: last ? lifeEnd(p) : p.places[i + 1][3], last };
  });

  // Where someone was living in a year. For people whose first recorded place is not their birthplace,
  // the years before they arrived there are "not recorded" (index -1), never their first place.
  const whereIn = (p, year) => {
    if (year < p.born || year > lifeEnd(p)) return null;
    if (p.birthplaceKnown === false && year < p.places[0][3]) return { name: null, index: -1, unknown: true };
    return placeIn(p, year);
  };

  const GENRES = { sermon: "Sermons", treatise: "Treatises", commentary: "Commentaries", "collected-works": "Collected works", "systematic-theology": "Systematic theology",
    letter: "Letters", devotional: "Devotional", lecture: "Lectures", biography: "Biography", autobiography: "Autobiography", catechism: "Catechisms", history: "History",
    article: "Articles", bibliography: "Bibliography", hymn: "Hymns", poetry: "Poetry", book: "Books" };
  const genreLabel = (g) => GENRES[g] ?? g.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

  // ── Tooltip: one element, moved with a transform. ──
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "status");
  let tipW = 0, tipH = 0;
  const Tip = {
    show(html, x, y) {
      if (!tip.isConnected) document.body.append(tip);
      if (tip.dataset.html !== html) { tip.innerHTML = html; tip.dataset.html = html; tipW = tip.offsetWidth; tipH = tip.offsetHeight; }
      const left = x + 16 + tipW > innerWidth - 8 ? x - 16 - tipW : x + 16;
      const top = Math.min(innerHeight - tipH - 8, Math.max(8, y + 14));
      tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
      tip.classList.add("show");
    },
    hide() { tip.classList.remove("show"); },
  };

  // ── Profile drawer ──
  let drawer, scrim, lastFocus = null;
  function buildDrawer() {
    scrim = document.createElement("div");
    scrim.className = "scrim";
    drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Profile");
    drawer.innerHTML = `<button type="button" class="round close" aria-label="Close">${icon("x", 16)}</button><div class="drawer-body"></div>`;
    document.body.append(scrim, drawer);
    scrim.addEventListener("click", close);
    drawer.querySelector(".close").addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) close(); });
    drawer.addEventListener("click", (e) => { const b = e.target.closest("[data-person]"); if (b) open(b.dataset.person); });
  }
  function close() {
    drawer.classList.remove("open");
    scrim.classList.remove("open");
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function profileHtml(p) {
    const fam = familyOf(p);
    const age = p.died ? `${p.circa ? "about " : ""}${p.died - p.born} years` : null;
    const genres = Object.entries(p.genres).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const top = genres[0]?.[1] ?? 1;
    const links = AUTHORS.links.filter((l) => l.from === p.id || l.to === p.id).map((l) => personById(l.from === p.id ? l.to : l.from));
    const st = stays(p);
    return `
      <p class="kicker" style="--tone: var(${fam.tone})">${esc(fam.label)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="years">${p.died ? `${lifeLabel(p)} · lived ${age}` : `Born ${p.circa ? "c. " : ""}${p.born}`}</p>
      <p class="line">${esc(p.line)}</p>
      <h3>Where they lived</h3>
      <ul class="places">${st.map((s, i) => `<li><span>${esc(s.name)}</span><small>${i === 0 && p.birthplaceKnown !== false ? `born ${p.born}` : `from ${s.start}`}</small></li>`).join("")}</ul>
      <h3>Known for</h3>
      <ul class="known">${p.known.map((k) => `<li><span>${esc(k.t)} <small>${k.y}</small></span>${k.inLibrary ? '<b class="mark in">In the library</b>' : '<b class="mark out">Not in the library yet</b>'}</li>`).join("")}</ul>
      <h3>In the library</h3>
      ${p.works ? `<div class="works-big"><b>${formatNumber(p.works)}</b><span>${p.works === 1 ? "work" : "works"} catalogued</span></div>
      <div class="genres">${genres.map(([g, n]) => `<div><span>${esc(genreLabel(g))}</span><i style="width: ${Math.max(3, (n / top) * 100)}%"></i><em>${formatNumber(n)}</em></div>`).join("")}</div>`
        : `<p class="plain-line">No works catalogued yet.</p>`}
      ${links.length ? `<h3>Linked with</h3><div class="links">${links.map((o) => `<button type="button" class="chip" data-person="${o.id}" style="--tone: ${toneVar(o)}"><i class="dot"></i>${esc(o.name)}</button>`).join("")}</div>` : ""}`;
  }
  function open(id) {
    const p = personById(id);
    if (!p) { console.error(`profile: no person with id "${id}"`); return; }
    if (!drawer) buildDrawer();
    if (!drawer.classList.contains("open")) lastFocus = document.activeElement;
    drawer.style.setProperty("--tone", toneVar(p));
    const body = drawer.querySelector(".drawer-body");
    body.innerHTML = profileHtml(p);
    body.scrollTop = 0;
    drawer.setAttribute("aria-label", `${p.name}: profile`);
    Tip.hide();
    requestAnimationFrame(() => { drawer.classList.add("open"); scrim.classList.add("open"); drawer.querySelector(".close").focus({ preventScroll: true }); });
  }

  // Section head: number, kicker, title, one plain line.
  const head = (num, kicker, title, sub) => `<header class="sec-head"><span class="sec-num">${num}</span><div>
    <p class="kicker">${kicker}</p><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}</div></header>`;

  // Canvas helpers: crisp at any pixel ratio.
  function sizeCanvas(canvas, width, height) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  // Run fn after resizes settle (one call per frame at most).
  function onResize(el, fn) {
    let lastWidth = 0, pending = 0;
    new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === lastWidth) return;
      lastWidth = w;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => fn(w));
    }).observe(el);
  }

  return { REDUCED, SANS, esc, toneVar, ease, plural, stays, whereIn, genreLabel, Tip, Profile: { open, close }, head, sizeCanvas, roundRect, onResize };
})();
