// The record sheet: any of the eighteen records, or any pictured codex, opened from any section, slides in from the
// right. A record shows everything the live page's register shows (kind, number, date, place, title, evidence,
// interpretation, limit, the collection or passage, sources) plus its picture where one exists, and pages earlier/later.
(() => {
  const { records, byId, name, pictureFor, tone, imgSrc, pictureWhat, credit } = CNX;
  let sheet, lastFocus = null;

  function build() {
    sheet = document.createElement("aside");
    sheet.className = "ms-sheet cn-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "false");
    sheet.setAttribute("aria-label", "Historical record");
    sheet.innerHTML = `<button type="button" class="ms-sheet-close" aria-label="Close the record">${icon("x", 18)}</button><div class="ms-sheet-body"></div>`;
    document.body.append(sheet);
    sheet.querySelector(".ms-sheet-close").addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) close(); });
    document.addEventListener("click", (e) => {
      if (!sheet.classList.contains("open") || sheet.contains(e.target) || e.target.closest("[data-open],[data-picture]")) return;
      close();
    });
    sheet.addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b) show(b.dataset.page); });
  }
  function close() {
    sheet.classList.remove("open");
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  const figure = (p) => `<figure class="ms-sheet-fig"><img src="${imgSrc(p.q)}" width="${p.w}" height="${p.h}" alt="${esc(`${p.name}: ${pictureWhat(p)}`)}">
    <figcaption>${esc(p.name)}, ${esc(pictureWhat(p))}. ${credit(p)}</figcaption></figure>`;

  function recordBody(r) {
    const i = records.indexOf(r), p = pictureFor.get(r.id);
    return `<div class="cn-sheet-top"><span class="cn-tag">${esc(r.kind)}</span><span>${String(i + 1).padStart(2, "0")} / ${records.length}</span></div>
      <p class="kicker">${esc(name(r.id))}</p><h2>${esc(r.title)}</h2>
      ${p ? figure(p) : ""}
      <dl class="ms-facts"><div><dt>Date</dt><dd>${esc(r.date)}</dd></div><div><dt>Place</dt><dd>${esc(r.place)}</dd></div>
        <div><dt>Evidence</dt><dd>${esc(r.evidence)}</dd></div><div><dt>Interpretation</dt><dd>${esc(r.interpretation)}<small>This study's inference, not a quotation.</small></dd></div>
        <div class="cn-limit"><dt>The limit</dt><dd>${esc(r.limit)}</dd></div></dl>
      <details class="cn-contents" open><summary>Inspect the collection or passage</summary><p class="cn-caption">Selected observations · not a complete transcription of the source.</p><ul>${r.contents.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></details>
      ${cite(r.sourceIds)}
      <div class="cn-paging"><button type="button" data-page="${records[i - 1]?.id ?? ""}" ${i === 0 ? "disabled" : ""}>← Earlier record</button><button type="button" data-page="${records[i + 1]?.id ?? ""}" ${i === records.length - 1 ? "disabled" : ""}>Later record →</button></div>`;
  }
  // A pictured codex the study has no record for: catalogue facts only, and a plain note saying so.
  function pictureBody(p) {
    const rows = [["Date", p.date], ["Holds", p.holds], ["Material", p.material], ["Where it is now", [p.holder, p.shelf && `shelfmark ${p.shelf}`].filter(Boolean).join(", ")]].filter(([, v]) => v);
    return `<p class="kicker">A surviving witness</p><h2>${esc(p.name)}</h2>${figure(p)}
      <dl class="ms-facts">${rows.map(([t, v]) => `<div><dt>${t}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <p class="ms-src">Shown as a surviving copy of the kind this study discusses; it is not one of the study's eighteen records. Facts from <a href="https://www.wikidata.org/wiki/${esc(p.q)}" target="_blank" rel="noopener">Wikidata ${esc(p.q)}</a> (CC0) via the Manuscripts collection.</p>`;
  }
  function show(id) {
    const r = byId.get(id);
    if (!r) { console.error(`record sheet: no record "${id}" in the research file`); return; }
    sheet.style.setProperty("--tone", tone(r.id));
    sheet.querySelector(".ms-sheet-body").innerHTML = recordBody(r);
    sheet.querySelector(".ms-sheet-body").scrollTop = 0;
  }
  function open(id, from, isPicture = false) {
    if (!sheet) build();
    lastFocus = from ?? document.activeElement;
    if (isPicture) {
      const p = CN.pictured.find((x) => x.q === id);
      if (!p) { console.error(`record sheet: no pictured codex "${id}" in data.js`); return; }
      if (p.record) return open(p.record, from);
      sheet.style.setProperty("--tone", "var(--accent)");
      sheet.querySelector(".ms-sheet-body").innerHTML = pictureBody(p);
    } else show(id);
    requestAnimationFrame(() => sheet.classList.add("open"));
    sheet.querySelector(".ms-sheet-close").focus({ preventScroll: true });
  }

  // data-open="<record id>" opens a record; data-picture="<Wikidata id>" opens a pictured codex.
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open],[data-picture]");
    if (!t || t.closest(".cn-sheet")) return;
    e.preventDefault();
    if (t.dataset.open) open(t.dataset.open, t); else open(t.dataset.picture, t, true);
  });
  window.Sheet = { open, close };
})();
