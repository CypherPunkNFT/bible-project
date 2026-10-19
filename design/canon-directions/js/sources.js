// "Keep the sources in the conversation.": every source with what was actually read, the scholarship guide, what remains
// open, the picture credit line (the live page said "no manuscript images reproduced"; this version does show some), and
// the closing question.
(() => {
  const { D } = CNX;
  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Keep the sources", "Keep the sources <em>in the conversation</em>", "The links beside each record lead to the evidence. This directory records what was actually consulted.")}
      <details class="cs-list"><summary>Sources &amp; access notes · ${D.sources.length} records</summary><div class="cs-grid">${D.sources.map((s) => `<div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}<span aria-hidden="true"> ↗</span></a><p>${esc(s.access)}.</p></div>`).join("")}</div></details>
      <div class="cs-guide"><h3>Follow the arguments, not just the bibliography.</h3>${D.scholarshipGuide.map((w) => `<div class="cs-row"><h4>${esc(w.question)}</h4><div><strong>${esc(w.work)}</strong><p>${esc(w.contribution)}</p><small>${esc(w.access)}</small>${cite(w.sourceIds)}</div></div>`).join("")}
        <div class="cs-open"><h4>What remains open</h4><p>${esc(D.investigations.jewish.limits)}</p><p>${esc(D.expansionLimits.join(" "))}</p></div></div>
      <p class="cn-caption">Manuscript pictures are public-domain photographs from Wikimedia Commons, credited where shown; the diagrams are our own. Expanded research checked 14 October 2026.</p>
      <footer class="cn-end"><p>Ask of every list:<br><em>Whose collection? When? For what use?</em></p><a href="/study/academic?area=texts">Return to Academic studies →</a></footer>`;
  }
  Sections.sources = { mount };
})();
