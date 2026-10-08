// Design gallery: reads design/catalog.json and draws one section per part of the site, one card per mock-up.
// Thumbnails come from scripts/mockup-gallery.mjs (design/_gallery/thumbs/<id>-light.png and -dark.png).
(() => {
  const STATUS = { chosen: "Chosen", built: "Chosen · built", option: "Option" };
  const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const theme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const arrow = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  function card(c) {
    const thumb = `_gallery/thumbs/${c.id}-${theme()}.png`;
    return `<article class="g-card" data-status="${esc(c.status)}">
      <a class="g-cover" href="${esc(c.url)}" aria-label="Open ${esc(c.title)}"></a>
      <span class="g-thumb"><img src="${thumb}" data-id="${esc(c.id)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'g-none', textContent: 'No picture yet' }))">
        <span class="g-badge">${STATUS[c.status] ?? esc(c.status)}</span></span>
      <div class="g-body"><h3>${esc(c.title)}</h3><p>${esc(c.line)}</p>
        <div class="g-meta"><time datetime="${esc(c.date)}">${day(c.date)}</time>
          <a href="${esc(c.url)}">Open mock-up ${arrow}</a>${c.built ? `<a href="${esc(c.built)}">On the site ${arrow}</a>` : ""}</div></div>
    </article>`;
  }

  function render(catalog) {
    const count = catalog.sections.reduce((n, s) => n + s.cards.length, 0);
    document.getElementById("g-lead").textContent = `${count} mock-ups in ${catalog.sections.length} sections. Open a card to try the mock-up; chosen designs are marked, and built ones link to the real page.`;
    document.getElementById("g-jump").innerHTML = catalog.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.title)} <b>${s.cards.length}</b></a>`).join("");
    document.getElementById("g-sections").innerHTML = catalog.sections.map((s) => `<section class="g-section" id="${esc(s.id)}">
      <div class="g-section-head"><div><h2>${esc(s.title)}</h2><p>${esc(s.line)}</p></div>${s.page ? `<a href="${esc(s.page)}">The page on the site ${arrow}</a>` : ""}</div>
      <div class="g-cards">${s.cards.map(card).join("")}</div></section>`).join("");
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  document.getElementById("g-theme").addEventListener("click", () => {
    const next = theme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("gallery: could not save the theme", error); }
    document.querySelectorAll(".g-thumb img[data-id]").forEach((img) => { img.src = `_gallery/thumbs/${img.dataset.id}-${next}.png`; });
  });

  fetch("catalog.json", { cache: "no-cache" })
    .then((response) => { if (!response.ok) throw new Error(`catalog.json: HTTP ${response.status}`); return response.json(); })
    .then(render)
    .catch((error) => {
      console.error("gallery: could not load the catalog", error);
      document.getElementById("g-sections").innerHTML = '<p class="g-status" role="alert">The gallery list (design/catalog.json) could not be loaded.</p>';
    });
})();
