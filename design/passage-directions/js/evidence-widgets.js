// The study's other pieces of evidence, as small interactive drawings shared by the three directions:
// the broken edge of P46 (θελ[ημα]), the GA 304 sequence, the invented copying model, the P45 question and the
// editions on a line from 1857 to 2021.
(() => {
  const { EDGE, GA304, COPYING, QUIZ, EDITIONS } = PM;
  const { cite, recButton, choice, inkLines } = PMX;

  // A torn papyrus edge: θελ survives in ink; [ημα] is drawn as dashed ghost letters past the break.
  function edgeArt({ big = false, loop = false } = {}) {
    const tear = "M300 18 l-8 22 10 18 -12 26 9 20 -14 30 11 22 -8 26 12 30 -10 24 8 24";
    return `<svg class="ed-art${big ? " is-big" : ""}${loop ? " is-loop" : ""}" viewBox="0 0 440 280" aria-hidden="true">
      <defs><clipPath id="ed-clip-${big ? "b" : "s"}"><path d="M30 18 H300 ${tear.slice(8)} V262 H30Z"/></clipPath></defs>
      <path class="ed-sheet" d="M30 18 H300 ${tear.slice(8)} V262 H30Z"/>
      <g clip-path="url(#ed-clip-${big ? "b" : "s"})"><g class="ed-fibres">${Array.from({ length: 30 }, (_, i) => `<path d="M24 ${22 + i * 8}h300"/>`).join("")}${Array.from({ length: 30 }, (_, i) => `<path d="M${34 + i * 10} 14v260"/>`).join("")}</g>
        <g class="ed-ink">${inkLines(52, 46, 236, 6, 17, 3, "5 1.5 2.5 1.5")}${inkLines(52, 178, 236, 5, 17, 5, "5 1.5 2.5 1.5")}</g></g>
      <text class="ed-greek" x="290" y="160" text-anchor="end" lang="grc">θελ</text>
      <g class="ed-supplied"><text class="ed-bracket" x="304" y="160">[</text><text class="ed-ghost" x="318" y="160" lang="grc">ημα</text><text class="ed-bracket" x="404" y="160">]</text></g>
      ${big ? `<path class="ed-lost" d="M302 18H424V262H304"/>` : ""}<path class="ed-gapline" d="M306 168h112" />
      <g class="ed-flakes"><path d="M318 64l6-3 3 5-5 3z"/><path d="M334 214l5-2 2 4-4 2z"/><path d="M322 120l3-1 2 3-3 1z"/></g>
      <path class="ed-mark" d="M14 30h10m-5-5v10M420 254h10m-5-5v10"/>
    </svg>`;
  }
  function edge(el, { big = false } = {}) {
    el.classList.add("ed");
    el.innerHTML = `<div class="ed-stage"><p class="kicker">${esc(EDGE.where)}</p>${edgeArt({ big })}
        <label class="pm-switch"><input type="checkbox" data-restore><span></span>Show supplied letters</label></div>
      <div class="ed-say" role="status"><p>${esc(EDGE.off)}</p></div>
      <small class="pm-note">${esc(EDGE.note)}</small>${cite(EDGE.links)}${recButton("Q1513469", "Open the record for P46")}`;
    el.querySelector("[data-restore]").addEventListener("change", (e) => {
      el.classList.toggle("is-restored", e.target.checked);
      el.querySelector(".ed-say p").textContent = e.target.checked ? EDGE.on : EDGE.off;
    });
  }

  // GA 304 as a page: the biblical extract, then (revealed) commentary, blank space and an erased verse.
  function ga304Art() {
    return `<svg class="g3-art" viewBox="0 0 300 360" aria-hidden="true">
      <path class="g3-leaf" d="M24 14 Q150 6 276 16 V346 Q150 338 24 348Z"/>
      <g class="g3-zone g3-z0"><text class="g3-label" x="44" y="40">BIBLICAL TEXT · MARK 16:1–8</text>${inkLines(44, 56, 212, 6, 10, 1)}<text class="g3-greek" x="44" y="128" lang="grc">ἐφοβοῦντο γάρ</text></g>
      <g class="g3-zone g3-z1"><text class="g3-label" x="44" y="158">COMMENTARY FOLLOWS · A SCHOLIUM</text>${inkLines(56, 172, 200, 6, 8, 4, "3 1.5 2 1.5")}<circle class="g3-dot" cx="150" cy="226" r="2"/></g>
      <g class="g3-zone g3-z2"><text class="g3-label" x="44" y="252">BLANK SPACE REMAINS</text><rect class="g3-blank" x="44" y="260" width="212" height="30" rx="2"/></g>
      <g class="g3-zone g3-z3"><text class="g3-label" x="44" y="310">A CLOSING VERSE, ADDED AND ERASED</text><path class="g3-erased" d="M60 324h180" /><path class="g3-erase-mark" d="M56 318l188 12M56 330l188-12"/></g>
    </svg>`;
  }
  function ga304(el, { loop = false } = {}) {
    el.classList.add("g3");
    if (loop) el.classList.add("is-loop");
    el.innerHTML = `<div class="g3-stage"><p class="kicker">Sequence diagram · not to scale</p>${ga304Art()}</div>
      <div class="g3-copy"><p class="g3-meta">${esc(GA304.meta)}</p><p>${GA304.lead}</p>
        <button type="button" class="pm-action" data-reveal aria-pressed="false">Reveal the surrounding evidence <span aria-hidden="true">→</span></button>
        <div class="g3-find" aria-live="polite"><p>${esc(GA304.before)}</p></div>
        ${cite(GA304.links)}${recButton(GA304.rec, "Open the record for GA 304")}<small class="pm-note">${GA304.credit}</small></div>`;
    el.querySelector("[data-reveal]").addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      e.currentTarget.setAttribute("aria-pressed", String(on));
      e.currentTarget.firstChild.textContent = on ? "Hide the surrounding evidence " : "Reveal the surrounding evidence ";
      el.classList.toggle("is-revealed", on);
      el.querySelector(".g3-find").innerHTML = on ? `<b>Houghton’s reassessment, 2023</b><p>${esc(GA304.finding)}</p><p><strong>Still unknown:</strong> ${esc(GA304.unknown)}</p>` : `<p>${esc(GA304.before)}</p>`;
    });
  }

  function copying(el) {
    const xs = [38, 81, 124, 167, 210, 253, 296, 339, 430, 484];
    el.classList.add("cp");
    el.innerHTML = `<div class="cp-copy"><h3>${COPYING.title}</h3><p>${esc(COPYING.lead)}</p>
        <button type="button" class="pm-action" data-trace aria-pressed="false">Trace the copying paths <span aria-hidden="true">→</span></button>${cite(COPYING.links)}</div>
      <div class="cp-model"><p class="kicker">${esc(COPYING.tag)}</p>
        <svg viewBox="0 0 560 235" role="img" aria-label="Schematic: eight copies with reading A and two with reading B; tracing the paths shows the eight descend from one intermediate source, the two from another, and the earlier text is unknown.">
          <g class="cp-paths"><path class="cp-top" d="M280 30L188 87M280 30L455 87"/>${xs.slice(0, 8).map((x) => `<path class="cp-a" d="M188 100L${x} 172"/>`).join("")}${xs.slice(8).map((x) => `<path class="cp-b" d="M455 100L${x} 172"/>`).join("")}
            <circle cx="280" cy="28" r="17"/><text x="280" y="34">?</text><circle cx="188" cy="93" r="19"/><text x="188" y="99">A</text><circle cx="455" cy="93" r="19"/><text x="455" y="99">B</text></g>
          ${xs.map((x, i) => `<g class="${i < 8 ? "cp-copy-a" : "cp-copy-b"}"><rect x="${x - 15}" y="172" width="30" height="40" rx="2"/><text x="${x}" y="198">${i < 8 ? "A" : "B"}</text></g>`).join("")}
        </svg><div class="cp-say" role="status"><b>${esc(COPYING.hidden[0])}</b><p>${esc(COPYING.hidden[1])}</p></div></div>`;
    el.querySelector("[data-trace]").addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      e.currentTarget.setAttribute("aria-pressed", String(on));
      e.currentTarget.firstChild.textContent = on ? "Hide the copying paths " : "Trace the copying paths ";
      el.classList.toggle("is-traced", on);
      const [h, p] = on ? COPYING.shown : COPYING.hidden;
      el.querySelector(".cp-say").innerHTML = `<b>${esc(h)}</b><p>${esc(p)}</p>`;
    });
  }

  function quiz(el) {
    el.classList.add("qz");
    el.innerHTML = `<div><p class="kicker">Try the distinction</p><h3>${QUIZ.title}</h3><p>${esc(QUIZ.lead)}</p></div>
      <div><div class="qz-options" role="group" aria-label="What does P45 establish?">${QUIZ.options.map((t, i) => `<button type="button" data-answer="${i}" aria-pressed="false"><span>${"ABC"[i]}</span>${esc(t)}</button>`).join("")}</div>
      <div class="qz-say" role="status"></div></div>`;
    choice(el, "[data-answer]", (b) => {
      const right = Number(b.dataset.answer) === QUIZ.right;
      el.querySelector(".qz-say").innerHTML = `<b class="${right ? "is-right" : ""}">${esc(right ? QUIZ.yes : QUIZ.no)}</b><p>${esc(QUIZ.explain)}</p>${cite(QUIZ.links)}${recButton("Q697885", "Open the record for P45")}`;
    });
  }

  // The editions as a lane from 1850 to 2025: each step a span or a point; choosing one names it on the line below.
  function editions(el) {
    const x = (y) => ((y - 1850) / (2025 - 1850)) * 100;
    el.classList.add("eds");
    el.innerHTML = `<div class="eds-lane" role="group" aria-label="The editions, 1857 to 2021">
        <div class="eds-axis">${[1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025].map((y) => `<span style="left:${x(y)}%">${y}</span>`).join("")}</div>
        ${EDITIONS.steps.map((s, i) => `<button type="button" class="eds-step" data-step="${i}" aria-pressed="${i === 0}" style="--a:${x(s.from)}%;--b:${x(s.to)}%"><i></i>${s.marks.map(([y, n]) => `<span class="eds-mark${x(y) > 80 ? " is-flip" : ""}" style="left:${x(y)}%"><b>${esc(n)}</b><small>${y}</small></span>`).join("")}</button>`).join("")}
      </div>
      <div class="eds-say ms-say" aria-live="polite"></div>
      <div class="eds-cbgm"><p class="kicker">${esc(EDITIONS.cbgm.title)}</p>${EDITIONS.cbgm.text.map((t) => `<p>${esc(t)}</p>`).join("")}${cite(EDITIONS.cbgm.links)}</div>`;
    const show = (i) => {
      const s = EDITIONS.steps[i];
      el.querySelector(".eds-say").innerHTML = `<p class="kicker">${esc(s.when)}</p><b>${esc(s.title)}</b><p>${esc(s.text)}</p>${cite(s.links)}`;
    };
    choice(el, "[data-step]", (b) => show(Number(b.dataset.step)));
    el.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-step]"); if (b) { el.querySelectorAll("[data-step]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); show(Number(b.dataset.step)); } });
    show(0);
  }

  window.Evidence = { edge, edgeArt, ga304, ga304Art, copying, quiz, editions };
})();
