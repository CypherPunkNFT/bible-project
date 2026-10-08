// The site's frame (header and footer copied from the site's Layout), the theme switch, the bar linking the four
// David directions, and the start-up.
(() => {
  const DIRS = [["two-voices", "A", "Two voices"], ["house", "B", "The house of David"], ["war-table", "C", "War table"], ["helix", "D", "Life helix"]];
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
  const dirbar = () => `<nav class="dirbar" aria-label="The four David directions">${DIRS.map(([id, letter, name]) =>
    `<a href="/mockups/david-directions/${id}/"${id === "house" ? ' aria-current="page"' : ""}><b>${letter}</b><span>${name}</span></a>`).join("")}</nav>`;
  const topline = () => `<div class="wrap topline"><a href="/people/david-rut-4-17">${icon("arrowLeft", 15)}Back to David</a><span>People / David / The reign · direction B, the house</span></div>`;

  window.start = async () => {
    document.documentElement.dataset.theme = savedTheme();
    try { await loadHouse(); } catch (error) { console.error("house: could not load data/david.json", error); document.body.textContent = `Could not load data/david.json: ${error.message}`; return; }
    document.body.innerHTML = `${header()}<main id="main">${topline()}</main>${footer()}${dirbar()}`;
    Clock.mount();
    const main = document.getElementById("main");
    try { Stage.mount(main); Rooms.mount(main); } catch (error) { console.error("house: the page failed to draw", error); main.insertAdjacentHTML("beforeend", `<p class="wrap">This page failed to draw: ${esc(error.message)}</p>`); }
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#theme-switch")) return;
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
      document.documentElement.dataset.theme = next;
      const t = document.getElementById("theme-switch");
      t.setAttribute("aria-checked", String(next === "dark")); t.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
    });
  };
})();
