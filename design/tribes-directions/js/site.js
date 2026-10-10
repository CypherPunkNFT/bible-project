// The site's frame (header, footer), the theme switch, the ticker, the switcher between the four directions, and
// the route: #land (the guide to all tribes) or #land/judah (one tribe's page). Guide ⇄ tribe slides, never fades.
(() => {
  const ORDER = ["land", "camp", "family", "ledger"];
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
  const switcher = () => `<nav class="switcher" aria-label="Design directions">${ORDER.map((id, i) => `<button type="button" data-dir="${id}" style="--sw: ${DIRECTIONS[id].swatch}"><i></i><span class="sw-l">${"ABCD"[i]}</span><span class="sw-n">${DIRECTIONS[id].name}</span></button>`).join("")}</nav>`;

  window.topline = (tribe) => `<div class="topline"><a href="${tribe ? `#${route().dir}` : "/study/people"}" ${tribe ? "data-go-guide" : ""}>${icon("arrowLeft", 15)}${tribe ? "All twelve tribes" : "Back to People &amp; genealogies"}</a><span>${tribe ? "The tribe · one page per tribe" : "The twelve tribes · the guide"}</span></div>`;

  // The tribe picker: every tribe the data holds, Joseph's two sons beside him.
  window.picker = (current, cls = "") => `<nav class="picker ${cls}" aria-label="Choose a tribe">${tribeList().map((t) => `<a href="#${route().dir}/${t.id}" class="pk" style="--tone:${tone(t.id)}" aria-current="${t.id === current ? "page" : "false"}"><i></i>${esc(t.name)}</a>`).join("")}</nav>`;

  window.route = () => {
    const [dir, tribe] = location.hash.slice(1).split("/");
    return { dir: ORDER.includes(dir) ? dir : ORDER[0], tribe: tribe || null };
  };
  window.go = (tribe) => { location.hash = tribe ? `${route().dir}/${tribe}` : route().dir; };

  let teardown = null, last = null;
  function show() {
    const r = route();
    teardown?.();
    teardown = null;
    Clock.stop();
    document.body.dataset.dir = r.dir;
    document.querySelectorAll(".switcher button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === r.dir)));
    const main = document.getElementById("main");
    // Slide direction: into a tribe from the guide slides left; back to the guide slides right; a new direction slides up.
    const motion = !last || last.dir !== r.dir ? "enter-up" : r.tribe && !last.tribe ? "enter-left" : !r.tribe && last.tribe ? "enter-right" : r.tribe !== last.tribe ? "enter-left" : "enter-up";
    if (last && (last.dir !== r.dir || last.tribe !== r.tribe)) window.scrollTo({ top: 0 });
    last = r;
    main.className = `dir-${r.dir} ${r.tribe ? "is-tribe" : "is-guide"} ${motion}`;
    main.innerHTML = "";
    try { teardown = DIRECTIONS[r.dir].mount(main, r) ?? null; } catch (error) { console.error(`direction ${r.dir}: mount failed`, error); main.innerHTML = `<p class="wrap">This direction failed to draw: ${esc(error.message)}</p>`; }
  }
  window.start = async () => {
    document.documentElement.dataset.theme = savedTheme();
    try { await loadData(); } catch (error) { console.error("tribes-directions: could not load data", error); document.body.textContent = `Could not load the map data: ${error.message}`; return; }
    document.body.innerHTML = `${header()}<main id="main"></main>${footer()}${switcher()}`;
    Clock.mount();
    document.addEventListener("click", (e) => {
      const sw = e.target.closest(".switcher button");
      if (sw) { const t = route().tribe; const next = `#${sw.dataset.dir}${t ? `/${t}` : ""}`; if (location.hash !== next) location.hash = next; return; }
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
