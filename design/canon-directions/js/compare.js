// "Compare collections without a default Bible.": two named sources side by side, each with its context, scope, naming
// note and sources, then the selected writings as a table, and why 24 and 39 can count the same writings.
(() => {
  const { D } = CNX;
  const T = D.traditions;
  const COUNTS = [["Samuel, Kings, Chronicles, Ezra–Nehemiah", "4 → 8"], ["The Twelve Prophets", "1 → 12"], ["Other books", "19 → 19"], ["Total in these counting conventions", "24 → 39"]];

  const picker = (side, label, t) => `<div class="cc-pick"><label for="cc-${side}">${label}</label><select id="cc-${side}" data-side="${side}">${T.map((x) => `<option value="${x.id}"${x.id === t.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
    <p class="cc-context">${esc(t.context)}</p><p>${esc(t.scope)}</p><details><summary>Scope &amp; naming</summary><p>${esc(t.note)}</p></details>${cite(t.sourceIds)}</div>`;

  function mount(section, { num }) {
    const chosen = { left: "catholic", right: "reformed" };
    section.innerHTML = `${head(num, "Compare traditions", "Compare collections <em>without a default Bible</em>", "Choose two named sources. These are selected writings, not exhaustive inventories. Read each source’s scope before comparing its entries.")}
      <div class="cc-body"></div>
      <details class="cc-counts"><summary>Why 24 and 39 can describe the same set of writings</summary><p>Jewish and many Protestant editions group these writings differently. This arithmetic explains the count; it does not erase differences of order, interpretation or textual tradition.</p>
        <div class="cc-count-grid">${COUNTS.map(([what, n]) => `<span>${what}</span><strong>${n}</strong>`).join("")}</div>${cite(["jewish", "westminster"])}</details>`;
    const body = section.querySelector(".cc-body");
    function draw() {
      const a = T.find((t) => t.id === chosen.left), b = T.find((t) => t.id === chosen.right);
      body.innerHTML = `<div class="cc-pickers">${picker("left", "First collection", a)}${picker("right", "Second collection", b)}</div>
        ${a.id === b.id ? `<p class="cc-same" role="status">You are viewing the same source on both sides. Choose a different source to compare.</p>` : ""}
        <div class="cc-table-wrap" tabindex="0" role="region" aria-label="Selected writings comparison; scroll horizontally on small screens"><table class="cc-table"><caption>Selected writings · ${esc(a.name)} and ${esc(b.name)}</caption>
          <thead><tr><th scope="col">Writing / collection</th><th scope="col">${esc(a.name)}</th><th scope="col">${esc(b.name)}</th></tr></thead>
          <tbody>${D.comparisonRows.map((row, i) => `<tr><th scope="row">${esc(row)}</th><td>${esc(a.states[i])}</td><td>${esc(b.states[i])}</td></tr>`).join("")}</tbody></table></div>
        <p class="cn-caption">“Not specified” and “not individually named” describe this source’s limits, not a church’s rejection. “Greek portions” refers to material in Greek forms of Esther and Daniel beyond their Hebrew/Aramaic forms. No color marks one collection as correct.</p>`;
    }
    body.addEventListener("change", (e) => { const s = e.target.closest("select[data-side]"); if (s) { chosen[s.dataset.side] = s.value; draw(); body.querySelector(`#cc-${s.dataset.side}`).focus(); } });
    draw();
  }
  Sections.compare = { mount };
})();
