// The site's frame (header, footer), the theme switch, the ticker, and the switcher between the directions.
(() => {
  const ORDER = ["road", "forties", "cinema", "constellation", "voices", "objects", "memory"];
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
  const switcher = () => `<nav class="switcher" aria-label="Design directions">${ORDER.map((id, i) => `<button type="button" data-dir="${id}" style="--sw: ${DIRECTIONS[id].swatch}"><i></i><span class="sw-l">${"ABCDEFG"[i]}</span><span class="sw-n">${DIRECTIONS[id].name}</span></button>`).join("")}</nav>`;
  // The breadcrumb every direction shares: back to People, and the page's own three old views now merged.
  window.topline = () => `<div class="topline"><a href="/study/people">${icon("arrowLeft", 15)}Back to People &amp; genealogies</a><span>Person · leader · prophet, one page</span></div>`;

  let teardown = null;
  function show() {
    const id = ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : ORDER[0];
    teardown?.();
    Clock.stop();
    document.body.dataset.dir = id;
    document.querySelectorAll(".switcher button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === id)));
    const main = document.getElementById("main");
    main.className = `dir-${id} dir-enter`;
    main.innerHTML = "";
    try { teardown = DIRECTIONS[id].mount(main) ?? null; } catch (error) { console.error(`direction ${id}: mount failed`, error); main.innerHTML = `<p class="wrap">This direction failed to draw: ${esc(error.message)}</p>`; }
  }
  window.start = async () => {
    document.documentElement.dataset.theme = savedTheme();
    try { await loadMoses(); } catch (error) { console.error("moses-directions: could not load data/moses.json", error); document.body.textContent = `Could not load data/moses.json: ${error.message}`; return; }
    document.body.innerHTML = `${header()}<main id="main"></main>${footer()}${switcher()}`;
    Clock.mount();
    document.addEventListener("click", (e) => {
      const sw = e.target.closest(".switcher button");
      if (sw) { if (location.hash !== `#${sw.dataset.dir}`) { location.hash = sw.dataset.dir; window.scrollTo({ top: 0 }); } return; }
      if (e.target.closest("#theme-switch")) {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
        document.documentElement.dataset.theme = next;
        const t = document.getElementById("theme-switch");
        t.setAttribute("aria-checked", String(next === "dark")); t.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
      }
    });
    addEventListener("hashchange", show);
    show();
  };
})();
