// A compact A–Z of all 47 by surname, with a name filter and family chips. Choosing a name opens the profile.
window.Directory = (() => {
  const sorted = [...R.people].sort((a, b) => R.surname(a).localeCompare(R.surname(b), "en") || a.born - b.born);
  const letterOf = (p) => R.surname(p).replace(/^M[’']/, "Mc")[0].toUpperCase();
  let list, count, query = "", family = null;

  function render() {
    const q = query.trim().toLowerCase();
    const shown = sorted.filter((p) => (!family || familyOf(p).key === family) && (!q || p.name.toLowerCase().includes(q)));
    const letters = new Map();
    shown.forEach((p) => { const l = letterOf(p); if (!letters.has(l)) letters.set(l, []); letters.get(l).push(p); });
    list.innerHTML = shown.length ? [...letters].map(([l, people]) => `<section><h4>${l}</h4><ul>${people.map((p) => `<li><button type="button" data-id="${p.id}">
        ${R.dot(p)}<span class="nm"><b>${R.esc(R.surname(p))}</b>, ${R.esc(R.given(p))}</span><span class="yr">${lifeLabel(p)}</span><span class="wk">${formatNumber(p.works)}<small> ${p.works === 1 ? "work" : "works"}</small></span></button></li>`).join("")}</ul></section>`).join("")
      : `<p class="empty">No one matches “${R.esc(query)}”.</p>`;
    count.textContent = `${shown.length} of 47`;
  }

  function mount(host) {
    host.innerHTML = `<div class="dir-tools">
        <label class="dir-search">${icon("search", 15)}<input type="search" placeholder="Find a name" aria-label="Find a name"></label>
        <div class="dir-chips">${FAMILIES.map((f) => `<button type="button" data-family="${f.key}" aria-pressed="false" style="--tone:var(${f.tone})"><i></i>${f.label}</button>`).join("")}</div>
        <span class="dir-count"></span></div>
      <div class="dir-list"></div>`;
    list = host.querySelector(".dir-list");
    count = host.querySelector(".dir-count");
    host.querySelector("input").addEventListener("input", (e) => { query = e.target.value; render(); });
    host.querySelector(".dir-chips").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      family = family === b.dataset.family ? null : b.dataset.family;
      host.querySelectorAll(".dir-chips button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.family === family)));
      render();
    });
    list.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) R.open(b.dataset.id); });
    list.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-id]"); if (b) R.light(b.dataset.id); });
    list.addEventListener("pointerleave", () => R.light(null));
    render();
  }

  return { mount };
})();
