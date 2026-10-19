// The close reading for each case: the Galatians apparatus decoded part by part (a leader line runs from the chosen part
// to its note), the Romans argument weighed under three questions, and the Mark endings read at the join.
(() => {
  const { APPARATUS, LENSES, ENDINGS } = PM;
  const { cite, choice } = PMX;

  function apparatus(el) {
    let part = 0;
    el.classList.add("cr", "cr-app");
    el.innerHTML = `<p class="kicker">Read the apparatus · Galatians 1:3</p><h3>A small line <em>with several jobs.</em></h3><p class="cr-lead">${APPARATUS.lead}</p>
      <div class="cr-app-stage"><div class="cr-app-line" role="group" aria-label="Decode the Galatians apparatus">${APPARATUS.parts.map((p, i) => `<button type="button" data-part="${i}" aria-pressed="${i === 0}"><sup>${i + 1}</sup><span${p.greek ? ' lang="grc"' : ""}>${esc(p.text)}</span></button>`).join("")}</div>
        <svg class="cr-leader" aria-hidden="true"></svg><div class="cr-app-note" aria-live="polite"></div></div>
      <p class="cr-limit">${esc(APPARATUS.limit)}</p>${cite(APPARATUS.links)}`;
    const note = el.querySelector(".cr-app-note"), svg = el.querySelector(".cr-leader"), stage = el.querySelector(".cr-app-stage");
    function show() {
      const p = APPARATUS.parts[part];
      note.innerHTML = `<span class="cr-n">0${part + 1}</span><div><b>${esc(p.title)}</b><p>${esc(p.note)}</p></div>`;
      requestAnimationFrame(leader);
    }
    function leader() {
      const btn = el.querySelector(`[data-part="${part}"]`);
      if (!btn || !stage.isConnected) return; // the section was re-rendered for another passage
      const box = stage.getBoundingClientRect(), b = btn.getBoundingClientRect(), n = note.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const x1 = b.left + b.width / 2 - box.left, y1 = b.bottom - box.top + 4, x2 = n.left - box.left + 14, y2 = n.top - box.top + 2;
      svg.innerHTML = `<path d="M${x1} ${y1}V${(y1 + y2) / 2}H${x2}V${y2}"/><circle cx="${x1}" cy="${y1}" r="2.5"/><circle cx="${x2}" cy="${y2}" r="2.5"/>`;
    }
    choice(el, "[data-part]", (b) => { part = Number(b.dataset.part); show(); });
    new ResizeObserver(leader).observe(stage);
    show();
  }

  function lenses(el) {
    let lens = 0;
    el.classList.add("cr", "cr-lens");
    el.innerHTML = `<p class="kicker">Follow the argument · Romans 5:1</p><h3>Three questions. <em>No automatic winner.</em></h3><p class="cr-lead">${esc(LENSES.lead)}</p>
      <div class="ct-sort cr-lens-pick" role="group" aria-label="Examine editorial criteria">${LENSES.items.map((l, i) => `<button type="button" data-lens="${i}" aria-pressed="${i === 0}">${esc(l.title)}</button>`).join("")}</div>
      <div class="cr-scale" aria-live="polite">
        <svg class="cr-beam" viewBox="0 0 400 40" aria-hidden="true"><path d="M200 38V8M40 14h320"/><circle cx="200" cy="8" r="3"/><path d="M40 14v14M360 14v14" stroke-dasharray="2 3"/></svg>
        <div class="cr-pan"><b lang="grc">ἔχωμεν</b><small>Let us have peace</small><p data-side="left"></p></div>
        <div class="cr-pan"><b lang="grc">ἔχομεν</b><small>We have peace</small><p data-side="right"></p></div>
        <p class="cr-take"></p>
      </div>
      <p class="cr-limit">${esc(LENSES.limit)}</p>${cite(LENSES.links)}`;
    const show = () => {
      const l = LENSES.items[lens];
      el.querySelector('[data-side="left"]').textContent = l.left;
      el.querySelector('[data-side="right"]').textContent = l.right;
      el.querySelector(".cr-take").textContent = l.takeaway;
      el.querySelector(".cr-scale").classList.remove("is-in"); void el.offsetWidth; el.querySelector(".cr-scale").classList.add("is-in");
    };
    choice(el, "[data-lens]", (b) => { lens = Number(b.dataset.lens); show(); });
    show();
  }

  function endings(el) {
    let ending = "stop";
    el.classList.add("cr", "cr-join");
    el.innerHTML = `<p class="kicker">Read the join · Mark 16</p><h3>What kind of ending <em>does each text create?</em></h3><p class="cr-lead">${esc(ENDINGS.lead)}</p>
      <div class="ct-sort cr-end-pick" role="group" aria-label="Read different endings">${ENDINGS.items.map((x) => `<button type="button" data-end="${x.id}" aria-pressed="${x.id === ending}">${esc(x.title)}</button>`).join("")}</div>
      <div class="cr-verses" aria-live="polite">
        <div class="cr-v"><span>16:7</span><p>${esc(ENDINGS.v7)}</p></div>
        <div class="cr-v"><span>16:8</span><p>${esc(ENDINGS.v8)}</p></div>
        <div class="cr-v cr-cont"><span></span><p></p></div>
      </div>
      <div class="cr-comment" role="status"></div>${cite(ENDINGS.links)}
      <details class="sr-more cr-ancients"><summary>Earlier than the surviving codices: Irenaeus and Eusebius</summary>
        ${ENDINGS.ancients.map((a) => `<div class="cr-voice"><b>${esc(a.who)}</b><p>${a.text}</p>${cite(a.links)}</div>`).join("")}
        <p>${esc(ENDINGS.versions)}</p>${cite(ENDINGS.versionLinks)}</details>`;
    const show = () => {
      const x = ENDINGS.items.find((i) => i.id === ending);
      const cont = el.querySelector(".cr-cont");
      cont.dataset.end = ending;
      cont.querySelector("span").textContent = x.tag;
      cont.querySelector("p").textContent = x.text;
      el.querySelector(".cr-comment").innerHTML = `<b>${esc(x.head)}</b><p>${esc(x.comment)}</p>`;
    };
    choice(el, "[data-end]", (b) => { ending = b.dataset.end; show(); });
    show();
  }

  const BY_CASE = { galatians: apparatus, romans: lenses, mark: endings };
  window.CloseReading = { apparatus, lenses, endings, mount: (el, id) => BY_CASE[id](el) };
})();
