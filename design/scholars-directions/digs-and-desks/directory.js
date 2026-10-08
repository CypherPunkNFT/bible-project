// 04 · Every scholar: all of them grouped by the city where they mainly worked, cities in the order their first scholar
// was born. A small search narrows the list by name, city, field or faith.
(() => {
  const { S, esc, years, tone } = DD;

  DD.mountDirectory = (host) => {
    const cities = {};
    for (const s of S.scholars) (cities[s.place[0]] ||= []).push(s);
    const groups = Object.entries(cities);
    host.insertAdjacentHTML("beforeend", `<section class="dd-sec dd-dir" id="every-scholar">
      <div class="dd-dir-top"><div class="dd-head"><p class="kicker">04 · Every scholar</p><h2>All ${S.scholars.length}, <em>city by city.</em></h2>
        <p>Grouped by the city where each mainly worked. Choose a name to open their profile.</p></div>
        <label class="dd-search">${icon("search", 16)}<input type="search" placeholder="Find a scholar, city or field" aria-label="Find a scholar, city or field"></label></div>
      <div class="dd-dir-cols">${groups.map(([city, people]) => `<div class="dd-city" data-city="${esc(city)}"><h3>${esc(city)}<small>${people.length}</small></h3>
        <ul>${people.map((s) => `<li><button type="button" class="dd-dir-row" data-sid="${s.id}" data-text="${esc(`${s.name} ${city} ${DD.field(s)} ${DD.faith(s)}`.toLowerCase())}" style="--tone:${tone(s)}">
          <span class="dd-dir-name"><i></i><b>${esc(s.name)}</b><small>${years(s)}</small></span>
          <span class="dd-dir-sub">${esc(DD.faith(s))} · ${esc(DD.field(s))}</span></button></li>`).join("")}</ul></div>`).join("")}</div>
      <p class="dd-dir-empty" hidden>No scholar matches that.</p></section>`);
    const sec = host.lastElementChild;
    sec.addEventListener("click", (e) => { const r = e.target.closest("[data-sid]"); if (r) DD.openProfile(r.dataset.sid); });
    sec.querySelector("input").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      let any = false;
      sec.querySelectorAll(".dd-city").forEach((g) => {
        let shown = 0;
        g.querySelectorAll(".dd-dir-row").forEach((r) => { const ok = !q || r.dataset.text.includes(q); r.parentElement.hidden = !ok; shown += ok; });
        g.hidden = !shown; any ||= shown > 0;
      });
      sec.querySelector(".dd-dir-empty").hidden = any;
    });
  };
})();
