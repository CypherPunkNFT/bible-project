// 05 · Everyone: all the people, grouped by the century they were born in.
window.Directory = (() => {
  function mount(container) {
    const byCentury = new Map();
    for (const p of AUTHORS.people) { const c = Math.floor(p.born / 100) * 100; if (!byCentury.has(c)) byCentury.set(c, []); byCentury.get(c).push(p); }
    const root = document.createElement("section");
    root.className = "sec small";
    root.innerHTML = `${L.head("05", "Everyone", `All ${AUTHORS.people.length}, <em>century by century</em>`, "Grouped by the century each was born in, with their years and the number of their works catalogued in the library. Choose a name to open their profile.")}
      <div class="dir-tools"><input class="find" type="search" placeholder="Find a name" aria-label="Find a name"><span class="plain-line count"></span></div>
      <div class="dir">${[...byCentury].map(([c, list]) => `<div class="cent"><h3>${c}s <small>${L.plural(list.length, "person", "people")}</small></h3><ul>${list.map((p) => `
        <li data-name="${L.esc(p.name.toLowerCase())}"><button type="button" data-person="${p.id}" style="--tone: ${L.toneVar(p)}"><i class="dot"></i><span>${L.esc(p.name)}<small>${lifeLabel(p)}</small></span><em>${p.works ? formatNumber(p.works) : "—"}</em></button></li>`).join("")}
        </ul><p class="none" hidden>No match</p></div>`).join("")}</div>`;
    container.append(root);
    const find = root.querySelector(".find"), count = root.querySelector(".count");
    const filter = () => {
      const q = find.value.trim().toLowerCase();
      let shown = 0;
      root.querySelectorAll(".cent").forEach((cent) => {
        let n = 0;
        cent.querySelectorAll("li").forEach((li) => { const hit = !q || li.dataset.name.includes(q); li.hidden = !hit; n += hit; });
        cent.querySelector(".none").hidden = n > 0;
        shown += n;
      });
      count.textContent = q ? `${L.plural(shown, "match", "matches")}` : "Number = works in the library";
    };
    find.addEventListener("input", filter);
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-person]"); if (b) L.Profile.open(b.dataset.person); });
    filter();
  }
  return { mount };
})();
