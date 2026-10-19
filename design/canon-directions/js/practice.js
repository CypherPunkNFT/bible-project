// "How far can this evidence take you?": the live page's three questions, one at a time. Choose a conclusion to hear
// whether the source supports it, why, and where to check.
(() => {
  const Q = CN.questions;
  function mount(section, { num }) {
    let question = 0, answer = null;
    section.innerHTML = `<div class="cq"><div><p class="kicker"><span class="ms-num">${num}</span><span class="ms-dot" aria-hidden="true">·</span>Try the historical reasoning</p><h2>How far can <em>this evidence take you?</em></h2><p>Choose the conclusion the source supports.</p></div><div class="cq-card"></div></div>`;
    const card = section.querySelector(".cq-card");
    function draw() {
      const q = Q[question];
      card.innerHTML = `<p class="kicker">Question ${question + 1} of ${Q.length}</p><h3>${esc(q.prompt)}</h3>
        <div class="cq-answers" role="group" aria-label="Choose a conclusion">${q.answers.map((text, i) => `<button type="button" data-a="${i}" aria-pressed="${answer === i}" class="${answer !== null && i === q.correct ? "cq-right" : ""}"><span>${"ABC"[i]}</span>${esc(text)}</button>`).join("")}</div>
        <div class="cq-feedback" aria-live="polite">${answer === null ? "" : `<strong>${answer === q.correct ? "That is the supported conclusion." : "That goes beyond what this evidence establishes."}</strong><p>${esc(q.why)}</p>${cite(q.ids)}
          <button type="button" class="cn-link cq-next">${question === Q.length - 1 ? "Try the first question again" : "Next question"} →</button>`}</div>`;
    }
    card.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]");
      if (a) { answer = Number(a.dataset.a); draw(); card.querySelector(".cq-feedback").focus?.(); return; }
      if (e.target.closest(".cq-next")) { question = (question + 1) % Q.length; answer = null; draw(); card.querySelector("[data-a]").focus({ preventScroll: true }); }
    });
    draw();
  }
  Sections.practice = { mount };
})();
