// The compact way to reach everyone: all scholars grouped by era (by the year they were born), each with years,
// faith label and field, and a small mark when the site uses or holds their work. Each row opens the profile.
(() => {
  const { scholars, ERAS, esc, tone, years, faith, field } = Yrs;

  function mount(section) {
    const groups = ERAS.map((e) => ({ e, people: scholars.filter((s) => s.era === e.key) })).filter((g) => g.people.length);
    section.innerHTML = `<header class="yr-head"><p class="kicker">Every scholar</p>
        <h2>All ${scholars.length}, <em>by era.</em></h2>
        <p>Grouped by the era they were born in. The coloured dot is their faith; “On this site” means a live feature uses their work, “In the library” that it is held for a planned one.</p></header>
      <div class="dr-grid">${groups.map(({ e, people }) => `<section class="dr-col" aria-label="${esc(e.label)}">
          <h3><span>${esc(e.short)} · ${e.key === "modern" ? "1800 on" : `${e.from || "AD 1"}–${e.to}`}</span><small>${people.length}</small></h3>
          <ul>${people.map((s) => `<li><button type="button" data-open="${esc(s.id)}" style="--tone:${tone(s)}">
              <span class="dr-top"><b>${esc(s.name)}</b><span class="dr-years">${years(s)}</span></span>
              <span class="dr-meta"><i></i>${esc(faith(s))} · ${esc(field(s))}${s.site ? `<em class="${s.site.status === "in-use" ? "dr-live" : ""}">${s.site.status === "in-use" ? "On this site" : "In the library"}</em>` : ""}</span>
            </button></li>`).join("")}</ul></section>`).join("")}</div>`;
  }

  Yrs.sections.directory = { mount };
})();
