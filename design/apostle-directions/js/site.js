// The site's frame (header, footer), the theme switch, the ticker, and the dock: four directions (#score, #globe,
// #thread, #strata) and three apostles (?who=peter|paul|thaddaeus). Switching either remounts the page in place.
(() => {
  const ORDER = ["score", "globe", "thread", "strata"];
  window.DIRECTIONS = {};
  function savedTheme() {
    try { const v = localStorage.getItem("bp-theme"); if (v === "dark" || v === "light") return v; } catch (error) { console.warn("theme: localStorage unavailable", error); }
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  const header = () => {
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/topics", "Topics", "tags"], ["/study/atlas", "Atlas", "map"]];
    const dark = document.documentElement.dataset.theme === "dark";
    return `<header class="site-header">
      <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background: var(--strip-${s})"></span>`).join("")}</div>
      <div class="bar">
        <a href="/" class="logo"><img src="favicon.svg" alt=""><span>Bible Project</span></a>
        <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
          <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
        <a href="/search" class="round-btn" aria-label="Search" title="Search">${icon("search", 16)}</a>
        <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
        <a href="https://churchfamily.io" class="cf-link" target="_blank" rel="noreferrer" title="ChurchFamily (opens in a new tab)">${icon("church", 16)}<span>ChurchFamily</span></a>
      </div>
    </header>`;
  };
  const footer = () => {
    const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
      ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
    return `<footer class="site-footer"><div class="foot-inner"><div class="foot-grid">
      <div class="foot-brand"><a href="/"><img src="favicon.svg" alt="">Bible Project</a><h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
        <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p></div>
      <nav class="foot-nav" aria-label="Footer">${paths.map(([title, links]) => `<div><h3>${title}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
    </div></div></footer>`;
  };
  const dock = () => `<nav class="dock" aria-label="Design directions and apostles">
    <div class="dock-group dirs">${ORDER.map((id) => `<button type="button" data-dir="${id}" style="--sw: ${DIRECTIONS[id].swatch}"><i></i><span class="sw-l">${DIRECTIONS[id].letter}</span>${DIRECTIONS[id].name}</button>`).join("")}</div>
    <span class="dock-sep" aria-hidden="true"></span>
    <div class="dock-group who">${Object.keys(WHO).map((k) => `<button type="button" data-who="${k}">${WHO_LABEL[k]}</button>`).join("")}</div>
  </nav>`;
  // The breadcrumb every direction shares.
  window.topline = (extra = "") => `<div class="topline"><a href="/study/people">${icon("arrowLeft", 15)}Back to People &amp; genealogies</a><span>${esc(P.title)} · the apostle's own page${extra}</span></div>`;

  let teardown = null, who = "peter";
  const dirNow = () => (ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : ORDER[0]);
  async function show() {
    const t0 = performance.now();
    const id = dirNow();
    try { window.P = await loadPerson(who); } catch (error) { console.error(`apostle-directions: could not load ${who}`, error); document.getElementById("main").textContent = `Could not load ${who}: ${error.message}`; return; }
    teardown?.(); teardown = null;
    Clock.stop();
    document.body.dataset.dir = id;
    document.body.dataset.who = who;
    document.querySelectorAll(".dock [data-dir]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === id)));
    document.querySelectorAll(".dock [data-who]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.who === who)));
    document.title = `${P.first} · ${DIRECTIONS[id].name} · Bible Project`;
    const main = document.getElementById("main");
    main.className = `dir-${id} dir-enter`;
    main.innerHTML = "";
    try { teardown = DIRECTIONS[id].mount(main) ?? null; } catch (error) { console.error(`direction ${id}: mount failed for ${who}`, error); main.innerHTML = `<p class="wrap">This direction failed to draw: ${esc(error.message)}</p>`; }
    requestAnimationFrame(() => { window.__mountMs = Math.round(performance.now() - t0); window.__mounted = `${id}:${who}`; });
  }
  window.start = async () => {
    document.documentElement.dataset.theme = savedTheme();
    who = whoFromUrl();
    try { await Promise.all([loadShared(), loadPerson(who)]); } catch (error) { console.error("apostle-directions: could not load the data", error); document.body.textContent = `Could not load the data: ${error.message}`; return; }
    document.body.innerHTML = `${header()}<main id="main"></main>${footer()}${dock()}`;
    Clock.mount();
    Object.keys(WHO).filter((k) => k !== who).forEach((k) => loadPerson(k).catch((error) => console.error(`prefetch ${k} failed`, error)));
    document.addEventListener("click", (e) => {
      const d = e.target.closest(".dock [data-dir]");
      if (d) { if (location.hash !== `#${d.dataset.dir}`) { location.hash = d.dataset.dir; window.scrollTo({ top: 0 }); } return; }
      const w = e.target.closest(".dock [data-who]");
      if (w) {
        if (w.dataset.who !== who) { who = w.dataset.who; history.replaceState(null, "", `?who=${who}${location.hash}`); window.scrollTo({ top: 0 }); show(); }
        return;
      }
      if (e.target.closest("#theme-switch")) {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
        document.documentElement.dataset.theme = next;
        const t = document.getElementById("theme-switch");
        t.setAttribute("aria-checked", String(next === "dark")); t.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
        document.dispatchEvent(new CustomEvent("themechange"));
      }
    });
    addEventListener("hashchange", show);
    show();
  };
})();
