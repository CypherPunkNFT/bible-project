// The site's frame (header, Atlas topline and tiles, footer), the theme switch, and the switcher between directions.
(() => {
  const ORDER = ["pilgrim", "starlight", "voyage", "meridian"];
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
        <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Atlas" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
          <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
        <a href="/search" class="round-btn" aria-label="Search" title="Search">${icon("search", 16)}</a>
        <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
        <a href="https://churchfamily.io" class="cf-link" target="_blank" rel="noreferrer" title="ChurchFamily — a church community site (opens in a new tab)">${icon("church", 16)}<span>ChurchFamily</span></a>
      </div>
    </header>`;
  };
  const TILES = [["Atlas", "map", "poetry"], ["Journeys", "route", "accent"], ["Ancient Cities", "landmark", "history"], ["Gospel Events", "book", "gospels"],
    ["The Early Church", "church", "gospels"], ["Apostolic Church", "split", "prophets"], ["The Reformation", "scroll", "history"], ["Global Missions", "earth", "poetry"]];
  window.atlasFrame = () => `
    <div class="topline"><a href="/study/atlas">${icon("arrowLeft", 15)}Back to Atlas</a><a href="/study/atlas/map">Open the map ${icon("arrowUp", 13)}</a></div>
    <nav class="tiles" aria-label="Explore the collection">${TILES.map(([t, i, tone]) => `<a href="/study/atlas" style="--tone: var(--${tone})" ${t === "Journeys" ? 'aria-current="page"' : ""}>${icon(i, 40, 1.35)}<span>${t}</span>${icon("arrowUp", 14)}</a>`).join("")}</nav>`;
  const footer = () => {
    const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
      ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
    return `<footer class="site-footer"><div class="foot-inner"><div class="foot-grid">
      <div class="foot-brand"><a href="/"><img src="favicon.svg" alt="">Bible Project</a><h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
        <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p></div>
      <nav class="foot-nav" aria-label="Footer">${paths.map(([title, links]) => `<div><h3>${title}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
    </div></div></footer>`;
  };
  const switcher = () => `<nav class="switcher" aria-label="Design directions">${ORDER.map((id) => `<button type="button" data-dir="${id}" style="--sw: ${DIRECTIONS[id].swatch}">${"<i></i>"}${DIRECTIONS[id].name}</button>`).join("")}</nav>`;

  let teardown = null;
  function show() {
    const id = ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : ORDER[0];
    teardown?.();
    document.body.dataset.dir = id;
    document.querySelectorAll(".switcher button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === id)));
    teardown = mountDirection(document.getElementById("main"), DIRECTIONS[id]);
  }
  window.start = () => {
    document.documentElement.dataset.theme = savedTheme();
    document.body.innerHTML = `${header()}<main id="main"></main>${footer()}${switcher()}`;
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
