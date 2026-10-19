// "Follow a writing. Watch the claim change.": pick Hermas, Esther or Revelation and walk the records that speak to it, in
// date order, as a path of stops. Each stop shows what that record says of the writing and opens the full record.
(() => {
  const { records, name, tone } = CNX;
  const BOOKS = [["Hermas", "Shepherd of Hermas"], ["Esther", "Esther"], ["Revelation", "Revelation"]];

  function mount(section, { num }) {
    let book = "Hermas";
    section.innerHTML = `${head(num, "Follow a writing", "Follow a writing. <em>Watch the claim change.</em>", "The writing stays the same; the kind and reach of the evidence change. Open any stop to inspect its full record.")}
      <div class="ct-sort" role="radiogroup" aria-label="Follow a writing">${BOOKS.map(([id, label]) => `<button type="button" role="radio" data-b="${id}">${label}</button>`).join("")}</div>
      <p class="ct-note" aria-live="polite"></p>
      <ol class="ct-path"></ol>
      <p class="cn-caption">Only records relevant to this trail are shown. Silence in another selected record is not counted as rejection.</p>`;
    const path = section.querySelector(".ct-path");
    function draw() {
      section.querySelectorAll("[data-b]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.b === book)));
      section.querySelector(".ct-note").textContent = CN.trailNotes[book];
      path.innerHTML = records.filter((r) => r.books?.[book]).map((r, i) => `<li style="--tone:${tone(r.id)};--i:${i}"><button type="button" data-open="${r.id}">
        <span class="ct-dot" aria-hidden="true"></span><span class="ct-when"><small>${esc(r.date)}</small><b>${esc(name(r.id))}</b></span><p>${esc(r.books[book])}</p><span class="ct-go" aria-hidden="true">↗</span><span class="sr-only">Inspect record and sources</span></button></li>`).join("");
    }
    section.addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (b) { book = b.dataset.b; draw(); } });
    draw();
  }
  Sections.trail = { mount };
})();
