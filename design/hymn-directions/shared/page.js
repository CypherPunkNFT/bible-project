// Shared by the three hymn directions: the site frame with Study selected, the passage panel that slides in beside
// the page, the facts row, the sources line, and the A · B · C switch. Uses the Authors mock-ups' frame (frame.css,
// frame.js) so the header, palette, fonts and theme switch are the site's own.
(() => {
  const H = window.HYMN;

  // The site's current navigation (src/components/Layout.tsx), with Study selected.
  Frame.header = function header() {
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
    const dark = document.documentElement.dataset.theme === "dark";
    return `<header class="site-header">
      <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background: var(--${s})"></span>`).join("")}</div>
      <div class="bar">
        <a href="/" class="logo"><img src="../../letters-shared/favicon.svg" alt=""><span>Bible Project</span></a>
        <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
          <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
        <a href="/search" class="search-btn" aria-label="Search" title="Search">${icon("search", 16)}</a>
        <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
      </div>
    </header>`;
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const readerUrl = (p) => `/read/kjv/${p.code}/${p.chapter}?hl=${p.verses[0].n}${p.verses.length > 1 ? `-${p.verses.at(-1).n}` : ""}`;

  /** The breadcrumb, title and facts row every direction opens with. */
  function intro(extraClass = "") {
    return `<section class="hy-intro ${extraClass}">
      <div>
        <p class="hy-crumb"><a href="/study">Study</a><span>/</span><a href="/study/theology">Living the Christian Life</a><span>/</span><a href="/study/hymns">Hymns</a></p>
        <h1>Amazing grace<em>how sweet the sound</em></h1>
        <p class="hy-lede">John Newton printed it in 1779 in <i>Olney Hymns</i>, the hymn book he made with William Cowper, under a verse
          from 1 Chronicles where David asks how God has brought him this far.</p>
      </div>
      <dl class="hy-facts">
        <div><dt>Written by</dt><dd>John Newton<small>${H.authorDates}</small></dd></div>
        <div><dt>Printed</dt><dd>${H.year}<small>Olney Hymns · Book I, no. ${H.number}</small></dd></div>
        <div><dt>Metre</dt><dd>${H.meterName}<small>${H.meter} · ${H.stanzas.length} stanzas</small></dd></div>
        <div><dt>In hymnals</dt><dd>${H.hymnals.toLocaleString()}<small>listed at Hymnary.org</small></dd></div>
      </dl>
    </section>`;
  }

  /** The passage panel: slides in beside the page, closes by sliding back. */
  function panel() {
    const el = document.createElement("aside");
    el.className = "hy-panel";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<button type="button" class="hy-panel-close" aria-label="Close">${icon("x", 18)}</button><div class="hy-panel-body"></div>`;
    document.body.append(el);
    el.querySelector(".hy-panel-close").addEventListener("click", () => close());
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    function close() { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); document.dispatchEvent(new Event("hy-panel-closed")); }
    return {
      /** Open with a passage, and the hymn line it is beside (if any). */
      open(p, line, note) {
        el.querySelector(".hy-panel-body").innerHTML = `
          <p class="hy-panel-kicker">${note ? esc(note) : "The passage"}</p>
          <h3>${esc(p.ref)}</h3>
          ${line ? `<blockquote class="hy-panel-line">${esc(line)}</blockquote>` : ""}
          <div class="hy-panel-verses">${p.verses.map((v) => `<p><sup>${v.n}</sup>${esc(v.text)}</p>`).join("")}</div>
          <p class="hy-panel-tr">King James Version, the Bible Newton read.</p>
          <a class="hy-panel-go" href="${readerUrl(p)}">Read ${esc(p.ref.split(":")[0])} in the reader ${icon("arrowRight", 15)}</a>`;
        el.classList.add("open");
        el.setAttribute("aria-hidden", "false");
      },
      close,
    };
  }

  /** The closing sources line, collapsed (approved as "Sources · N" at the bottom of a page). */
  function sources() {
    return `<details class="hy-sources"><summary>Sources · 3</summary><ul>
      <li><b>The hymn.</b> ${esc(H.source.title)}, John Newton and William Cowper, London 1779, from the Christian Classics Ethereal Library
        (<a href="${H.source.url}">${H.source.url.replace("https://", "")}</a>). ${esc(H.source.licence)}.</li>
      <li><b>Where hymnals place it.</b> Hymnary.org's catalogue (<a href="${H.source.hymnary}">hymnary.org</a>): the passages hymnal
        editors attach to it, and the number of hymnals that print it. No words were taken from Hymnary.</li>
      <li><b>The verses.</b> King James Version, from this site's own Bible text. Each verse set beside a line is one the hymnal
        editors attach to the hymn; placing it beside the line it echoes is ours.</li></ul></details>`;
  }

  /** The A · B · C switch between directions. */
  function switcher() {
    const here = location.pathname.split("/").filter(Boolean).at(-1);
    const dirs = [["a", "The page and its echoes"], ["b", "Constellation"], ["c", "Six movements"]];
    const nav = document.createElement("nav");
    nav.className = "hy-switch";
    nav.setAttribute("aria-label", "Design directions");
    nav.innerHTML = dirs.map(([k, label]) => `<a href="../${k}/" ${k === here ? 'aria-current="page"' : ""}>${k.toUpperCase()}<span>${label}</span></a>`).join("");
    document.body.append(nav);
  }

  window.Hymn = { H, esc, readerUrl, intro, panel, sources, switcher };
})();
