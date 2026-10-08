// The site's frame for the Learning mock-ups: header (Resources active, as on the live site), footer, theme switch,
// the Resources crumbs, and small helpers every direction uses.
(() => {
  const ICONS = {
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    graduation: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
    map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15M9 3.236v15"/>',
    branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    arrowUp: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>',
  };
  const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const say = (n) => words[n] ?? String(n);
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  function header() {
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "users"], ["/resources", "Resources", "tag"], ["/study/atlas", "Atlas", "map"]];
    const dark = document.documentElement.dataset.theme === "dark";
    return `<header class="site-header">
      <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background: var(--${s})"></span>`).join("")}</div>
      <div class="bar">
        <a href="/" class="logo"><img src="../letters-shared/favicon.svg" alt=""><span>Bible Project</span></a>
        <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Resources" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
          <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
        <a href="/search" class="search-btn" aria-label="Search">${icon("search", 16)}</a>
        <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
        <a href="https://churchfamily.io" class="church-pill">${icon("home", 14)}ChurchFamily</a>
      </div></header>`;
  }
  function footer() {
    const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
      ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
    return `<footer class="site-footer"><div class="foot-inner"><div class="foot-grid">
      <div class="foot-brand"><a href="/"><img src="../letters-shared/favicon.svg" alt="">Bible Project</a>
        <h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
        <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p></div>
      <nav class="foot-nav" aria-label="Footer">${paths.map(([t, links]) => `<div><h3>${t}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
    </div></div></footer>`;
  }
  const crumbs = (here) => `<nav class="crumbs" aria-label="Resources"><a href="/resources">${icon("arrowLeft", 14)}Resources</a><a class="on" href="#">Learning materials</a><a href="/resources/fellowships">Fellowships</a><a href="/resources/life">Help for life</a>${here ? `<span class="here">${here}</span>` : ""}</nav>`;

  window.Frame = {
    icon, esc, say, plural, crumbs,
    mount() {
      document.body.insertAdjacentHTML("afterbegin", header());
      const main = document.createElement("main");
      main.id = "main";
      document.querySelector(".site-header").after(main);
      document.body.insertAdjacentHTML("beforeend", footer());
      document.getElementById("theme-switch").addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save the choice", error); }
        document.documentElement.dataset.theme = next;
        const sw = document.getElementById("theme-switch");
        sw.setAttribute("aria-checked", String(next === "dark"));
        sw.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
        dispatchEvent(new Event("themechange"));
      });
      return main;
    },
    // Item helpers shared by every direction.
    status: (it) => `<span class="tag ${it.status}">${it.status === "ready" ? "Ready" : "Planned"}</span>`,
    facts(it) {
      const k = LEARN.K[it.kind], a = LEARN.A[it.audience];
      const bits = [k.name, `${a.name} ${a.age !== "Together" && a.age !== "Who teach" ? `(${a.age})` : ""}`.trim()];
      if (it.status === "ready") bits.push(plural(it.sessions, "session"), plural(it.pages, "page"));
      else if (it.sessions) bits.push(`${plural(it.sessions, "session")} planned`);
      return bits.join(" · ");
    },
    sources: (it) => it.builtFrom.map((b) => `<a class="textlink" href="${b.path}">${esc(b.title)}</a>`).join(", "),
    downloads: (it) => it.status !== "ready" ? "" : `<div class="dl-row"><a class="btn solid" href="${MOSES.pdf.a4}" target="_blank" rel="noreferrer">${icon("download", 16)}Download <small>A4</small></a><a class="btn" href="${MOSES.pdf.letter}" target="_blank" rel="noreferrer">${icon("download", 16)}Download <small>US Letter</small></a></div>`,
    // The full record of one item (section 6.6 of the plan).
    record(it) {
      const a = LEARN.A[it.audience], k = LEARN.K[it.kind], t = LEARN.T[it.track];
      const series = it.series.map(([s, n]) => `${LEARN.S[s].name} <span class="muted">(${n} of ${LEARN.inSeries(s).length})</span>`).join("<br>") || "—";
      const rows = [["For", `${a.name}${a.setting ? "" : ` · ${a.age}`}`], ["Kind", k.name], ["Subject", t.name], ["Series", series],
        ["Sessions", it.sessions ? `${it.sessions}${it.minutes ? ` · about ${it.minutes} minutes each` : ""}${it.status === "planned" ? " (planned)" : ""}` : "To be set when written"],
        ["Leader guide", it.guide ? "Yes" : it.status === "ready" ? "Not yet; the “How to use” page covers groups" : "No"],
        ["Paper", it.status === "ready" ? "A4 and US Letter, same page numbers" : "A4 and US Letter, when written"],
        ["Built from", Frame.sources(it)], ["Status", `${Frame.status(it)} <span class="muted">${it.status === "ready" ? esc(it.review) : "Not written. Nothing to download yet."}</span>`]];
      return `<dl class="record">${rows.map(([dt, dd]) => `<dt>${dt}</dt><dd>${dd}</dd>`).join("")}</dl>`;
    },
    page: (n) => `shared/pages/p${String(n).padStart(2, "0")}.png`,
  };
})();
