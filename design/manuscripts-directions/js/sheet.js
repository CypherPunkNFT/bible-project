// The record sheet: any manuscript, opened from any section, slides in from the right with everything the open record
// holds: date (and how it was reached), material, contents, where it is now, its picture with credit, and its sources.
(() => {
  const { byId, holderText, booksText, sigla } = MSX;
  const BASIS = {
    century: "dated by century in the catalogue", "century-from-year": "Wikidata gives a round year, read here as the century it stands for",
    year: "a single year, as the catalogue gives it", range: "a range given by the catalogue", "reparsed-range": "the range as the catalogue's own text states it",
    reparsed: "read from the catalogue's text", note: "from the note that identifies it in the corpus", corrected: "corrected on this page",
    radiocarbon: "radiocarbon, the full 2-sigma calibrated range", "palaeographic-estimate": "a palaeographer's estimate from the handwriting",
    "ai-script-model": "an AI model's estimate from the handwriting", "palaeographic-period": "the period of its script, read as a span of years",
    "explicit-year": "a date written in the document itself",
  };
  // Who supplied a scroll's date (the corpus picks one claim of several by a stated rule; the others stay in the corpus).
  const DSS_DATE = {
    pp: `Popović et al. 2025, <a href="https://doi.org/10.1371/journal.pone.0323185" target="_blank" rel="noopener">PLOS ONE e0323185</a>, CC BY 4.0`,
    wc: `the English Wikipedia article <a href="https://en.wikipedia.org/wiki/Carbon_dating_the_Dead_Sea_Scrolls" target="_blank" rel="noopener">Carbon dating the Dead Sea Scrolls</a>, CC BY-SA 4.0`,
    wq: `the English Wikipedia lists of manuscripts from the Qumran caves, CC BY-SA 4.0`,
  };
  const BOOK_SOURCE = { catalogue: "read from the catalogue's own words", note: "from its name or the note that identifies it in the corpus",
    etcbc: "as the ETCBC transcription identifies it", corrected: "corrected on this page" };

  let sheet, lastFocus = null;
  function build() {
    sheet = document.createElement("aside");
    sheet.className = "ms-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "false");
    sheet.setAttribute("aria-label", "Manuscript record");
    sheet.innerHTML = `<button type="button" class="ms-sheet-close" aria-label="Close the record">${icon("x", 18)}</button><div class="ms-sheet-body"></div>`;
    document.body.append(sheet);
    sheet.querySelector(".ms-sheet-close").addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) close(); });
    document.addEventListener("click", (e) => {
      if (!sheet.classList.contains("open") || sheet.contains(e.target) || e.target.closest("[data-open]")) return;
      close();
    });
  }
  function close() {
    sheet.classList.remove("open");
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }

  function picture(r) {
    const im = r.im && MS.images[r.im];
    if (!im) return `<figure class="ms-sheet-fig ms-noimg">${Art.draw(r)}<figcaption>No openly licensed picture of this manuscript is held here.</figcaption></figure>`;
    const what = im.file.replace(/\.(jpe?g|png|gif)$/i, "");
    return `<figure class="ms-sheet-fig"><img src="${imgSrc(r.im)}" width="${im.w}" height="${im.h}" alt="${esc(`${r.n}: ${what}`)}">
      <figcaption>${esc(what)}${im.via ? ` (from the ${esc(im.via)})` : ""}. ${esc(im.by)} · ${esc(im.lic)} · <a href="${esc(im.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>`;
  }
  function facts(r) {
    const k = KIND[r.k];
    const rows = [];
    rows.push(["Date", r.d ? `${esc(r.d)}<small>${esc(BASIS[r.db] ?? "")}${r.dw ? ` (the source says “${esc(r.dw)}”)` : ""}</small>${r.why ? `<small class="ms-fix">${esc(r.why)}</small>` : ""}`
      : `<span class="muted">Not given in the open record${r.dr ? ` (it says “${esc(r.dr)}”)` : ""}</span>`]);
    if (r.m) rows.push(["Material", esc(r.m[0].toUpperCase() + r.m.slice(1))]);
    if (r.sc || r.la) rows.push(["Writing", esc([r.la, r.sc].filter(Boolean).join(", "))]);
    const bt = booksText(r);
    rows.push(["Contents", bt ? `${esc(bt[0].toUpperCase() + bt.slice(1))}<small>${esc(BOOK_SOURCE[r.bs] ?? "")}</small>${r.bwhy ? `<small class="ms-fix">${esc(r.bwhy)}</small>` : ""}${r.c ? `<small>The catalogue says: “${esc(r.c)}”</small>` : ""}`
      : r.lect ? `Readings for the church year${r.c ? `<small>The catalogue says: “${esc(r.c)}”</small>` : ""}` : `<span class="muted">Not itemised in the open record</span>`]);
    if (r.ch) rows.push(["Chapters", Object.entries(r.ch).map(([b, list]) => `${esc(MS.books[b].name)} ${esc(ranges(list))}`).join("; ")]);
    if (r.f) rows.push(["Found", `${esc(r.f)}<small>${plural(r.x[0], "fragment")}, ${plural(r.x[1], "line")} of transcribed text</small>`]);
    const held = holderText(r);
    rows.push(["Where it is now", held ? `${esc(held)}${r.sh ? `<small>Shelfmark ${esc(r.sh)}</small>` : ""}${r.h && r.hr && !held.includes(r.hr) ? `<small>The catalogue says: “${esc(r.hr)}”</small>` : ""}`
      : `<span class="muted">${r.src === "dss" ? "The scroll records do not name a holder" : "Not given in the open record"}</span>`]);
    rows.push(["Kind", `${esc(k.label)}${r.L.length > 1 ? `<small>Also counted with: ${esc(r.L.filter((x) => x !== r.k).map((x) => KIND[x].label).join(", "))}</small>` : ""}`]);
    return `<dl class="ms-facts">${rows.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>`;
  }
  function ranges(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      let j = i;
      while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
      out.push(i === j ? `${list[i]}` : `${list[i]}–${list[j]}`);
      i = j;
    }
    return out.join(", ");
  }
  function sources(r) {
    if (r.src === "dss") return `<p class="ms-src">Record: ETCBC Dead Sea Scrolls, transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook; Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda. CC BY-NC 4.0, non-commercial. <a href="https://github.com/ETCBC/dss" target="_blank" rel="noopener">github.com/ETCBC/dss</a>${r.ds ? `. Date: ${DSS_DATE[r.ds]}${r.dn > 1 ? `, chosen from ${r.dn} dated claims` : ""}` : ""}</p>`;
    if (r.src === "syr") return `<p class="ms-src">Record: <a href="${esc(r.su)}" target="_blank" rel="noopener">Syriaca.org</a>, The Syriac Reference Portal, from William Wright's catalogue of the British Museum's Syriac manuscripts. CC BY 3.0.</p>`;
    return `<p class="ms-src">Record: <a href="https://www.wikidata.org/wiki/${esc(r.i)}" target="_blank" rel="noopener">Wikidata ${esc(r.i)}</a> (CC0)${r.wp ? `, with details from the English Wikipedia article <a href="https://en.wikipedia.org/w/index.php?oldid=${esc(r.wr)}" target="_blank" rel="noopener">${esc(r.wp)}</a> (CC BY-SA 4.0)` : ""}.</p>`;
  }

  function open(id, from) {
    const r = byId.get(id);
    if (!r) { console.error(`record sheet: no record with id "${id}" in data.js`); return; }
    if (!sheet) build();
    lastFocus = from ?? document.activeElement;
    const k = KIND[r.k], sig = sigla(r);
    sheet.style.setProperty("--tone", `var(${k.tone})`);
    sheet.querySelector(".ms-sheet-body").innerHTML = `
      <p class="kicker">${esc(k.label)}${sig ? ` · ${esc(sig)}` : ""}</p>
      <h2>${esc(r.n)}</h2>
      ${picture(r)}${facts(r)}${sources(r)}`;
    sheet.querySelector(".ms-sheet-body").scrollTop = 0;
    requestAnimationFrame(() => sheet.classList.add("open"));
    sheet.querySelector(".ms-sheet-close").focus({ preventScroll: true });
  }

  // Any element with data-open="<record id>" opens that record.
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (t && !t.closest("svg[data-svg-open]")) { e.preventDefault(); open(t.dataset.open, t); }
  });
  window.Sheet = { open, close, ranges };
})();
