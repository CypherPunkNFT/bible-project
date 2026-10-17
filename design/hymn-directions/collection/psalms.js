// 03 · Through the Psalms: the 150 psalms as tiles, each lit by how many of our hymns sing it; choose one to see them,
// each opening its own page. The recommendation's Psalms view, as a section of this page rather than a page of its own.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;

  function mount(section) {
    const { hymns, groups, books } = HYMNS;
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const psa = books.findIndex((b) => b.code === "PSA");
    const byPsalm = Array.from({ length: 150 }, () => []);
    for (const h of hymns) if (Math.floor(h.v / 1e6) === psa + 1) byPsalm[(Math.floor(h.v / 1e3) % 1000) - 1].push(h);
    const max = Math.max(...byPsalm.map((l) => l.length));
    const sung = byPsalm.filter((l) => l.length).length;
    const href = (h) => `/study/hymns/${h.id}`;

    section.style.setProperty("--tone", "var(--poetry)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">03</span><div><p class="kicker">The Psalms</p>
        <h2>Through <em>the Psalms</em></h2>
        <p>${sung} of the 150 psalms have at least one hymn made from them here, most by Isaac Watts, who set the psalms "in the language of the
          New Testament": his are paraphrases, not translations. Choose a psalm to see how it was sung.</p></div></header>
      <div class="bib-grid">
        <div class="bib-card"><div class="ps-grid">${byPsalm.map((list, i) => `<button type="button" class="ps-tile" data-ps="${i}" style="--k: ${list.length ? (0.35 + 0.65 * list.length / max).toFixed(2) : 0}" aria-label="Psalm ${i + 1}, ${plural(list.length, "hymn")}"><span class="n">${i + 1}</span>${list.length ? `<small>${list.length} ${list.length === 1 ? "hymn" : "hymns"}</small>` : ""}</button>`).join("")}</div>
          <p class="ps-key">One tile is one psalm, 1 to 150, with the number of hymns that sing it. The deeper it is, the more hymns; pale tiles have none here yet.</p></div>
        <aside class="bib-detail" aria-live="polite"></aside>
      </div>`;

    const detail = section.querySelector(".bib-detail");
    function show(i) {
      const list = byPsalm[i];
      section.querySelectorAll(".ps-tile").forEach((t) => t.classList.toggle("on", Number(t.dataset.ps) === i));
      detail.innerHTML = `<div class="bib-inner" style="--tone: var(--poetry)"><p class="kicker">Poetry & Wisdom</p>
        <h3>Psalm ${i + 1}<small>${books[psa].chapters[i]} verses</small></h3>
        <p class="bib-note">${list.length ? `${plural(list.length, "hymn")} here sing this psalm.` : "No hymn here sings this psalm yet."}</p>
        ${list.length ? `<p class="bib-mini">Open a hymn</p><ul class="bib-titles">${list.map((h) => `<li><a class="bib-work" href="${href(h)}"><span>${esc(h.t)}</span>${icon("arrowRight", 13)}</a><small>${esc(h.r)} · ${esc(groupById.get(h.g).short)} · ${h.y}${h.m ? ` · metre ${esc(h.m.replace(/,/g, "."))}` : ""}</small></li>`).join("")}</ul>` : ""}
        <a class="bib-read" href="/read/kjv/PSA/${i + 1}">${icon("book", 15)}Read Psalm ${i + 1}${icon("arrowRight", 15)}</a></div>`;
    }
    section.addEventListener("click", (event) => { const t = event.target.closest("[data-ps]"); if (t) show(Number(t.dataset.ps)); });
    section.addEventListener("pointerover", (event) => { const t = event.target.closest("[data-ps]"); if (t) show(Number(t.dataset.ps)); });
    show(22);
  }

  Sections.psalms = { mount };
})();
