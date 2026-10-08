// The site's own frame (src/components/Layout.tsx and SiteFooter.tsx, as the Authors mock-ups copy it): header with
// Study active, footer, and the theme switch. Frame.mount() returns the <main> the page draws into. A "themechange"
// event fires on window whenever the switch is flipped, so canvas and WebGL drawings can repaint.
window.Frame = {
  savedTheme() {
    try { const v = localStorage.getItem("bp-theme"); if (v === "dark" || v === "light") return v; } catch (error) { console.warn("theme: localStorage unavailable", error); }
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },
  header() {
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "users"], ["/resources", "Resources", "heart"], ["/study/atlas", "Atlas", "map"]];
    const dark = document.documentElement.dataset.theme === "dark";
    return `<header class="site-header">
      <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background: var(--${s})"></span>`).join("")}</div>
      <div class="bar">
        <a href="/" class="logo"><img src="../letters-shared/favicon.svg" alt=""><span>Bible Project</span></a>
        <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
          <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
        <a href="/search" class="search-btn" aria-label="Search" title="Search">${icon("search", 16)}</a>
        <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
      </div>
    </header>`;
  },
  footer() {
    const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
      ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
    return `<footer class="site-footer"><div class="foot-inner">
      <div class="foot-grid">
        <div class="foot-brand"><a href="/"><img src="../letters-shared/favicon.svg" alt="">Bible Project</a>
          <h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
          <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p>
          <a href="/read" class="foot-cta">${icon("book", 16)}Return to the Word${icon("arrowRight", 16)}</a></div>
        <nav class="foot-nav" aria-label="Footer">${paths.map(([title, links]) => `<div><h3>${title}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
      </div>
      <div class="foot-cards">
        <a href="/sources"><span style="color: var(--accent)">${icon("library", 28)}</span><div style="flex:1"><h3>A library with a paper trail.</h3><p>Meet the authors. Explore the collection. Trace each work to its source.</p></div><span class="go-text">Sources & references${icon("arrowUp", 16)}</span></a>
        <a href="https://github.com/CypherPunkNFT/bible-project"><div><h3>Download the code.</h3><p>Open source on GitHub.</p></div><span class="go-text">${icon("arrowUp", 16)}</span></a>
      </div>
    </div></footer>`;
  },
  mount() {
    document.documentElement.dataset.theme = Frame.savedTheme();
    document.body.insertAdjacentHTML("afterbegin", Frame.header());
    const main = document.createElement("main");
    main.id = "main";
    document.querySelector(".site-header").after(main);
    document.body.insertAdjacentHTML("beforeend", Frame.footer());
    document.getElementById("theme-switch").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
      document.documentElement.dataset.theme = next;
      const sw = document.getElementById("theme-switch");
      sw.setAttribute("aria-checked", String(next === "dark"));
      sw.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
      dispatchEvent(new Event("themechange"));
    });
    return main;
  },
  color(token) { return getComputedStyle(document.documentElement).getPropertyValue(token).trim(); },
};
