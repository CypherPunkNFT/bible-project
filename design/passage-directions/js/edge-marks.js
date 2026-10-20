// "Reading the marks", direction D's right-hand column beside the torn edge of P46. Each row shows θελ[ημα in one of
// three records and, while you point at it, lights the matching part of the drawing. Below the rows, the word sits in
// its verse. Only what the sources show: Michigan's "Opening Text of Galatians" page gives the papyrus, a diplomatic
// text (a close transcription as in papyrological publications) and a Greek text with accents and breathings, plus
// its English translation. Its nomina sacra page explains θυ for θεοῦ. SBLGNT gives the printed verse.
(() => {
  const SRC = {
    wholetext: ["Michigan · the opening text of Galatians", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/wholetext.html"],
    nomina: ["Michigan · nomina sacra in P46", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/nominasacra.html"],
  };
  const link = ([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}<span aria-hidden="true">↗</span></a>`;
  const ROWS = [
    { id: "ink", label: "The ink", word: `θελ<i class="em-tear" aria-hidden="true"></i>`, line: "What the papyrus itself still shows: three letters, then the break." },
    { id: "dip", label: "The diplomatic text", word: `θελ<span class="em-br">[</span><span class="em-sup">ημα</span>`, line: "A close transcription, as in papyrological publications: no accents, the bracket where the ink stops, and the letters after it supplied." },
    { id: "ed", label: "The printed text", word: `θέλημα`, line: "Accents and breathings, as in a modern edition. SBLGNT prints the whole word." },
  ];

  const HINT = "Tap a record to light its part of the drawing.";
  // At phone width the three rows sit side by side and their explanations share this one line.
  function mount(panel, box) {
    panel.innerHTML = `<p class="kicker">Reading the marks</p><h4 class="em-h">One word, <em>three records.</em></h4>
      <ol class="em-rows" role="group" aria-label="Three records of the word">${ROWS.map((r) => `<li><button type="button" data-mark="${r.id}" aria-pressed="false">
        <span class="em-label">${esc(r.label)}</span><span class="em-word" lang="grc">${r.word}</span><span class="em-line">${esc(r.line)}</span></button></li>`).join("")}</ol>
      <p class="em-say" aria-live="polite">${HINT}</p>
      <div class="em-verse"><p class="kicker">In its verse · Galatians 1:4</p>
        <p class="em-v em-v-dip" lang="grc" title="Michigan’s diplomatic text">κατα το <mark>θελ[ημα</mark> του θ(εο)υ και π(ατρο)ϲ ημων</p>
        <p class="em-v em-v-ed" lang="grc" title="SBLGNT">κατὰ τὸ <mark>θέλημα</mark> τοῦ θεοῦ καὶ πατρὸς ἡμῶν</p>
        <p class="em-v em-v-en">according to the <mark>will</mark> of God our Father</p>
        <small class="pm-note">The diplomatic line is Michigan’s; θ(εο)υ and π(ατρο)ϲ expand the scribe’s shortened sacred names. The printed line is SBLGNT’s; the English is Michigan’s translation.</small>
        <p class="pm-cites">${link(SRC.wholetext)}${link(SRC.nomina)}<a href="${PM.SOURCES.gal[1]}" target="_blank" rel="noopener noreferrer">${esc(PM.SOURCES.gal[0])}<span aria-hidden="true">↗</span></a></p></div>`;
    let pinned = null;
    const set = (id) => {
      if (id) box.dataset.mark = id; else delete box.dataset.mark;
      panel.querySelectorAll("[data-mark]").forEach((b) => b.classList.toggle("is-lit", b.dataset.mark === id));
      panel.querySelector(".em-say").textContent = ROWS.find((r) => r.id === id)?.line ?? HINT;
    };
    panel.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-mark]"); if (b) set(b.dataset.mark); });
    panel.querySelector(".em-rows").addEventListener("pointerleave", () => set(pinned));
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mark]"); if (!b) return;
      pinned = pinned === b.dataset.mark ? null : b.dataset.mark;
      panel.querySelectorAll("[data-mark]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mark === pinned)));
      set(pinned);
    });
  }
  window.EdgeMarks = { mount };
})();
