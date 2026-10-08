// The site's frame (header and footer, copied from the Moses mock-ups), the theme switch, and the bar that links
// the four David directions.
const icon = (...a) => window.icon(...a);

export function savedTheme() {
  try { const v = localStorage.getItem("bp-theme"); if (v === "dark" || v === "light") return v; } catch (error) { console.warn("theme: localStorage unavailable", error); }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function header() {
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/topics", "Topics", "tags"], ["/study/atlas", "Atlas", "map"]];
  const dark = document.documentElement.dataset.theme === "dark";
  return `<header class="site-header" id="site-header">
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
}

export function footer() {
  const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
    ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
  return `<footer class="site-footer"><div class="foot-inner"><div class="foot-grid">
    <div class="foot-brand"><a href="/"><img src="favicon.svg" alt="">Bible Project</a><h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
      <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p></div>
    <nav class="foot-nav" aria-label="Footer">${paths.map(([title, links]) => `<div><h3>${title}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
  </div></div></footer>`;
}

const DIRECTIONS = [["two-voices", "Two voices", "#c48d14"], ["house", "The house of David", "#18716a"], ["war-table", "War table", "#b3263c"], ["helix", "Life helix", "#6b38a3"]];
export const dirBar = (current) => `<nav class="dirbar" aria-label="David design directions">${DIRECTIONS.map(([id, name, sw], i) =>
  `<a href="/mockups/david-directions/${id}/" style="--sw:${sw}" ${id === current ? 'aria-current="page"' : ""}><i></i><span class="sw-l">${"ABCD"[i]}</span>${name}</a>`).join("")}</nav>`;

// Theme switch: flips data-theme, saves it, and tells the page (the 3D scene repaints its materials).
export function wireTheme(onChange) {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#theme-switch")) return;
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
    document.documentElement.dataset.theme = next;
    const t = document.getElementById("theme-switch");
    t.setAttribute("aria-checked", String(next === "dark"));
    t.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
    onChange(next);
  });
}
