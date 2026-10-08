// The small in-page profile: a drawer from the right with a person's years, places, known works and documented links.
(() => {
  const GENRE = { sermon: ["sermon", "sermons"], treatise: ["treatise", "treatises"], "systematic-theology": ["systematic theology", "volumes of systematic theology"],
    commentary: ["commentary", "commentaries"], history: ["history", "histories"], confession: ["confession", "confessions"], "collected-works": ["collected works", "collected works"],
    letter: ["letter", "letters"], catechism: ["catechism", "catechisms"], biography: ["biography", "biographies"], journal: ["journal", "journals"], hymn: ["hymn", "hymns"],
    devotional: ["devotional", "devotionals"], autobiography: ["autobiography", "autobiographies"], lecture: ["lecture", "lectures"], bibliography: ["bibliography", "bibliographies"],
    article: ["article", "articles"], debate: ["debate", "debates"] };
  const genreLabel = (g, n) => (GENRE[g] ? GENRE[g][n === 1 ? 0 : 1] : g.replace(/-/g, " "));
  let el = {}, current = null, lastFocus = null;

  function build() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="drawer-back" id="drawer-back" hidden></div>
      <aside class="drawer" id="drawer" aria-hidden="true" aria-labelledby="drawer-name" role="dialog">
        <div class="drawer-in" id="drawer-in"></div>
      </aside>`);
    el = { back: document.getElementById("drawer-back"), box: document.getElementById("drawer"), inner: document.getElementById("drawer-in") };
    el.back.addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && current) close(); });
    el.inner.addEventListener("click", (e) => {
      const t = e.target.closest("[data-act]");
      if (!t) return;
      if (t.dataset.act === "close") close();
      if (t.dataset.act === "open") open(personById(t.dataset.id));
      if (t.dataset.act === "follow") { const p = current; close(); TW.hero.follow(p); }
    });
  }

  function content(p) {
    const fam = familyOf(p), stays = TW.staysOf(p);
    const genres = Object.entries(p.genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g, n]) => `${formatNumber(n)} ${genreLabel(g, n)}`).join(" · ");
    const links = AUTHORS.links.filter((l) => l.from === p.id || l.to === p.id).map((l) => {
      const other = personById(l.from === p.id ? l.to : l.from);
      return `<li><button type="button" data-act="open" data-id="${other.id}" style="--tone: var(${TW.tone(other)})"><i></i><b>${TW.esc(other.name)}</b></button><p>${TW.esc(l.note)}</p></li>`;
    }).join("");
    return `
      <div class="drawer-top" style="--tone: var(${fam.tone})">
        <p class="kicker">${fam.label}</p>
        <button type="button" class="drawer-x" data-act="close" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <h2 id="drawer-name">${TW.esc(p.name)}</h2>
      <p class="drawer-years">${lifeLabel(p)}${p.died ? "" : " · living"}</p>
      <p class="drawer-line">${TW.esc(p.line)}</p>
      <button type="button" class="follow-btn" data-act="follow" style="--tone: var(${fam.tone})">${icon("map", 16)}Follow this life on the map</button>
      <h3>Places</h3>${TW.knowsBirthplace(p) ? "" : `<p class="route-note">Birthplace unknown; the first place below is the earliest recorded.</p>`}
      <ol class="route" style="--tone: var(${fam.tone})">${stays.map((s) => `<li><span class="yr">${s.from}</span><span><b>${TW.esc(s.name)}</b><small>${TW.regionOf(s.name)}${s.birth ? " · born" : ""}</small></span></li>`).join("")}</ol>
      <h3>Known for</h3>
      <ul class="known">${p.known.map((k) => `<li><span><b>${TW.esc(k.t)}</b><small>${k.y}</small></span>${k.inLibrary ? `<em>In the library</em>` : ""}</li>`).join("")}</ul>
      <h3>In the library</h3>
      <p class="drawer-works"><b>${formatNumber(p.works)}</b> ${p.works === 1 ? "work" : "works"}${genres ? `<small>${genres}</small>` : ""}</p>
      ${links ? `<h3>Connections</h3><ul class="links">${links}</ul>` : ""}`;
  }

  function open(p) {
    if (!el.box) build();
    if (!current) lastFocus = document.activeElement;
    current = p;
    el.inner.innerHTML = content(p);
    el.inner.scrollTop = 0;
    el.back.hidden = false;
    el.box.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => { el.back.classList.add("on"); el.box.classList.add("on"); el.inner.querySelector(".drawer-x").focus({ preventScroll: true }); });
  }

  function close() {
    if (!current) return;
    current = null;
    el.back.classList.remove("on"); el.box.classList.remove("on");
    el.box.setAttribute("aria-hidden", "true");
    setTimeout(() => { if (!current) el.back.hidden = true; }, 350);
    lastFocus?.focus?.({ preventScroll: true });
  }

  TW.openProfile = open;
  TW.closeProfile = close;
})();
