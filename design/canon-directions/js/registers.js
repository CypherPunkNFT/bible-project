// "The same writings. Different boundaries.": three writers (Athanasius, Augustine, Jerome) as three leaves side by side.
// Choose a writing and its line lights up on every leaf; open a line for the passage, its excerpt and its limits.
// All text is the live page's (CanonRegisters.tsx) and the research file's.
(() => {
  const { D, byId } = CNX;
  const B = D.investigations.boundaries;
  const kindOf = (label) => (label === "Canonical" ? "canon" : /^(Instruction|Edifying)/.test(label) ? "instruction" : "silence");
  const RECORD = ["athanasius", "augustine", "jerome"];

  function mount(section, { num }) {
    let writing = 0, witness = null;
    section.innerHTML = `${head(num, "Begin with a comparison · AD 367–c. 400", "The same writings. <em>Different boundaries.</em>", "Three selected passages. No universal baseline.")}
      <div class="cr-controls"><div><span class="kicker">Follow a writing</span><div class="ct-sort" role="group" aria-label="Compare ancient judgments">${B.books.map((b, i) => `<button type="button" role="radio" data-w="${i}">${esc(b)}</button>`).join("")}</div></div>
        <button type="button" class="cr-reset">Reset view ↺</button></div>
      <div class="cr-legend" aria-label="Diagram key"><span><i class="cr-mark canon"></i>Canonical</span><span><i class="cr-mark instruction"></i>Instruction / edifying reading</span><span><i class="cr-mark silence"></i>Not enumerated / not addressed</span></div>
      <div class="cr-leaves">${B.witnesses.map((p, i) => `<article class="cr-leaf"><header><p class="cr-no"><span>Selected witness</span><span>${"ABC"[i]}</span></p><h3>${esc(p.name)}</h3><p class="cr-date">${esc(p.date)}</p></header>
        <div class="cr-entries">${p.states.map((s, j) => `<button type="button" class="cr-entry" data-i="${i}" data-j="${j}" aria-label="${esc(`${p.name}: ${B.books[j]}. ${s.label}. Inspect passage`)}"><i class="cr-mark ${kindOf(s.label)}"></i><span><b>${esc(B.books[j])}</b><small>${esc(s.label)}</small></span><span class="cr-down" aria-hidden="true">↓</span></button>`).join("")}</div>
        <footer>${esc(p.passage)}</footer></article>`).join("")}</div>
      <p class="cr-caption"><span>Schematic registers · not manuscript facsimiles or complete book lists.</span><span>Each mark represents one writing or named pair in a selected passage.</span></p>
      <div class="cr-finding"><span class="kicker">Read across</span><p aria-live="polite"></p></div>
      <div class="cr-inspect" hidden></div>
      ${cite(["athanasius", "augustine", "jerome-solomon"])}
      <p class="cr-bridge">${esc(B.insight)}</p>`;
    const panel = section.querySelector(".cr-inspect");
    function draw() {
      section.querySelectorAll("[data-w]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.w) === writing)));
      section.querySelectorAll(".cr-entry").forEach((b) => {
        b.classList.toggle("match", Number(b.dataset.j) === writing);
        b.setAttribute("aria-expanded", String(witness === Number(b.dataset.i) && writing === Number(b.dataset.j)));
      });
      section.querySelector(".cr-finding p").textContent = CN.findings[writing];
      panel.hidden = witness === null;
      if (witness === null) return;
      const w = B.witnesses[witness], record = byId.get(RECORD[witness]);
      panel.innerHTML = `<header><div><p class="kicker">${esc(w.date)} · ${esc(w.passage)}</p><h3>${esc(w.name)} / ${esc(B.books[writing])}</h3></div><button type="button" class="cr-close" aria-label="Close source inspection">×</button></header>
        <div class="cr-grid"><div><p class="kicker">What this passage establishes</p><p>${esc(w.states[writing].text)}</p><blockquote>“${esc(w.excerpt)}”</blockquote><small>${esc(w.translation)} · excerpt from this passage's general criterion</small></div>
        <div><p class="kicker">Read within its limits</p><p>${esc(w.principle)} ${esc(record?.limit ?? "")}</p>${cite(w.sourceIds)}<button type="button" class="cn-link" data-open="${RECORD[witness]}">Open the full record →</button></div></div>`;
    }
    section.addEventListener("click", (e) => {
      const w = e.target.closest("[data-w]"), entry = e.target.closest(".cr-entry");
      if (w) { writing = Number(w.dataset.w); draw(); }
      else if (entry) { writing = Number(entry.dataset.j); witness = Number(entry.dataset.i); draw(); panel.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      else if (e.target.closest(".cr-reset")) { writing = 0; witness = null; draw(); }
      else if (e.target.closest(".cr-close")) { const from = witness; witness = null; draw(); section.querySelector(`.cr-entry[data-i="${from}"][data-j="${writing}"]`)?.focus({ preventScroll: true }); }
    });
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") { witness = null; draw(); } });
    draw();
  }
  Sections.registers = { mount };
})();
