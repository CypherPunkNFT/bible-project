// "Five claims that are not interchangeable.": the five kinds of evidence, each with its own small drawing, and what it
// can establish. Text from the live page and the research file's evidenceKinds.
(() => {
  const { D } = CNX;
  const ART = {
    Quoted: '<path d="M8 10c-2 0-3 1.5-3 3.5S6 17 8 17s3-1.5 3-3.5c0-3-2-6-5-7M19 10c-2 0-3 1.5-3 3.5s1 3.5 3 3.5 3-1.5 3-3.5c0-3-2-6-5-7"/>',
    "Public reading": '<path d="M5 9.5 12 6l7 3.5M7 8.5V20M17 8.5V20M9 13h6M10 16h4"/>',
    Copied: '<path d="M12 6.5c-2-1.6-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20M6.5 9h3M6.5 12h3M14.5 9h3M14.5 12h3"/>',
    Recommended: '<path d="M7 4h10l2 2v14H5V6z"/><path d="M9 10h6M9 13h6M9 16h3"/><path d="M16 15.5l1.2 1.2 2.3-2.6"/>',
    Canonical: '<path d="M7 4h10l2 2v14H5V6z"/><path d="M8.5 9.5l1 1 1.8-2M13 9.5h3M8.5 13.5l1 1 1.8-2M13 13.5h3M8.5 17.5l1 1 1.8-2M13 17.5h3"/>',
  };
  const art = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ART[id] ?? ART.Copied}</svg>`;

  function mount(section, { num }) {
    let kind = 0;
    section.innerHTML = `${head(num, "Read the evidence", "Five claims that are <em>not interchangeable</em>", "Here, canon means a recognized collection of scriptural books. Select a kind of evidence to see what it can establish.")}
      <div class="ce-row" role="group" aria-label="Kinds of evidence">${D.evidenceKinds.map((k, i) => `<button type="button" class="ce-kind" data-k="${i}"><span class="ce-art">${art(k.id)}</span><small>0${i + 1}</small><b>${esc(k.id)}</b></button>`).join("")}</div>
      <div class="ce-say" aria-live="polite"></div>`;
    const say = section.querySelector(".ce-say");
    function draw() {
      section.querySelectorAll(".ce-kind").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.k) === kind)));
      const k = D.evidenceKinds[kind];
      say.innerHTML = `<p class="kicker">What does this establish?</p><h3>${esc(k.example)}</h3><p>${esc(k.meaning)}</p>${cite(k.sourceIds)}<small>These are kinds of evidence, not a five-step ladder every book climbed.</small>`;
    }
    section.querySelector(".ce-row").addEventListener("click", (e) => { const b = e.target.closest(".ce-kind"); if (b) { kind = Number(b.dataset.k); draw(); } });
    draw();
  }
  Sections.evidence = { mount };
})();
