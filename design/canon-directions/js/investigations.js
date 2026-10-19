// "Where the boundaries become visible.": the live page's three close investigations (CanonInvestigations.tsx), every
// line kept. A: the Psalms scroll and two explanations of it, then the Jamnia question. B: Eusebius placing Revelation
// twice. C: the end of Codex Alexandrinus as a strip of leaves, now beside a real photograph of one of its pages.
(() => {
  const { D, pictureFor, imgSrc, pictureWhat, credit } = CNX;
  const { jewish, boundaries, codex } = D.investigations;
  const E = boundaries.eusebius;
  const caseHead = (letter, kicker, title) => `<div class="ci-head"><span class="ci-letter" aria-hidden="true">${letter}</span><div><p class="kicker">${kicker}</p><h3>${title}</h3></div></div>`;

  function caseA() {
    return `<article class="ci-case" data-case="a">${caseHead("A", "Jewish collections · authority and arrangement", esc(jewish.title))}
      <div class="ci-pair">${jewish.observations.map((o) => `<div><h4>${esc(o.label)}</h4><small>${esc(o.date)}</small><p>${esc(o.text)}</p>${cite(o.sourceIds)}</div>`).join("")}</div>
      <div class="ci-hyp"><div><p class="kicker">Change the explanation</p><h4>What kind of collection is 11Q5?</h4><p>The object does not change. The inference does. Compare the assumptions each reading needs.</p>
        <div class="ct-sort" role="radiogroup" aria-label="Interpret the Psalms scroll">${jewish.hypotheses.map((h, i) => `<button type="button" role="radio" data-h="${i}">${esc(h.name)}</button>`).join("")}</div></div>
        <div class="ci-hyp-out" aria-live="polite"></div></div>
      <div class="ci-argument"><p>${esc(jewish.debate)}</p><p>${esc(jewish.correction)}</p>${cite(["loc-psalms", "lim-writings", "mroczek"])}</div>
      <div class="ci-rabbinic"><h4>And what about a council at Jamnia?</h4><div><p>${esc(jewish.rabbinic)}</p><p>${esc(jewish.yavneh)}</p>${cite(["mishnah", "lim-writings"])}<a class="cn-link" href="/study/dead-sea-scrolls">Explore the Dead Sea Scrolls study →</a></div></div>
    </article>`;
  }
  function caseB() {
    return `<article class="ci-case" data-case="b">${caseHead("B", "Eusebius · a conditional classification", "When a writing appears in two categories.")}
      <div class="ci-double"><div><p class="kicker">A source that resists one box</p><h4>Revelation appears twice.</h4><p>${esc(E.intro)}</p><button type="button" class="cn-link ci-clauses" aria-expanded="false">Read the second clause too →</button></div>
        <div class="ci-clause-pair" aria-live="polite"></div></div>
      <div class="ci-eusebius"></div>
    </article>`;
  }
  function caseC() {
    const p = pictureFor.get("alexandrinus");
    return `<article class="ci-case" data-case="c">${caseHead("C", "The material witness · survival and reconstruction", esc(codex.title))}
      <p class="ci-intro">${esc(codex.shelfmark)}. Inspect the final surviving works, then add what the contents list names. A dashed boundary marks a different kind of evidence—not a lower level of religious value.</p>
      <div class="ci-codex">${p ? `<figure class="ci-photo"><button type="button" data-open="alexandrinus" aria-label="Open the Codex Alexandrinus record"><img src="${imgSrc(p.q)}" width="${p.w}" height="${p.h}" alt="${esc(`${p.name}: ${pictureWhat(p)}`)}" loading="lazy"></button>
          <figcaption>A surviving page of the codex (${esc(pictureWhat(p).replace(/^Codex Alexandrinus\s*/, ""))}, from Mark), not one of the leaves below. ${credit(p)}</figcaption></figure>` : ""}
        <div class="ci-codex-work"><label class="ci-switch"><input type="checkbox" class="ci-inventory"> Include the contents-list evidence</label>
          <div class="ci-strip" role="group" aria-label="Inspect the end of Alexandrinus">${codex.segments.map((s, i) => `<button type="button" class="ci-leaf ci-leaf-${s.style}" data-s="${i}"${i === 3 ? " hidden" : ""}><small>${esc(s.location)}</small><b>${esc(s.name)}</b><span>${esc(s.state)}</span></button>`).join("")}</div>
          <div class="ci-leaf-note" aria-live="polite"></div>
          <p class="cn-caption">${esc(codex.limits)}</p>${cite(codex.sourceIds)}</div></div>
      <div class="ci-syriac"><div><p class="kicker">Another language, another collection</p><h4>The Peshitta’s twenty-two</h4><p>The Syriac Peshitta became the standard version around 400. Its New Testament collection does not contain the five writings shown here. This is a version’s contents, not a statement that every later Syriac church has the same boundaries.</p>${cite(["peshitta", "syriac-mss"])}</div>
        <div><p class="cn-caption">Not represented in the twenty-two-book version</p><ul>${["2 Peter", "2 John", "3 John", "Jude", "Revelation"].map((b) => `<li>${b}</li>`).join("")}</ul><p>Compare this with Athanasius’s twenty-seven, not with an assumed universal starting point. A translation’s history and a council’s jurisdiction answer different questions.</p></div></div>
    </article>`;
  }

  function wireA(root) {
    const out = root.querySelector(".ci-hyp-out");
    const draw = (h) => {
      root.querySelectorAll("[data-h]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.h) === h)));
      const r = jewish.hypotheses[h];
      out.innerHTML = `<span class="cn-tag">Interpretation · not a recovered label</span><h4>${esc(r.claim)}</h4><p><strong>It needs:</strong> ${esc(r.requires)}</p><p class="ci-follows"><strong>What follows:</strong> ${esc(r.result)}</p><p class="cn-caption">Neither option is proved merely by comparing this scroll with a modern Psalter.</p>`;
    };
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-h]"); if (b) draw(Number(b.dataset.h)); });
    draw(0);
  }
  function wireB(root) {
    const pair = root.querySelector(".ci-clause-pair"), note = root.querySelector(".ci-eusebius"), button = root.querySelector(".ci-clauses");
    const [one, two] = E.clauses;
    const draw = (open) => {
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Return to the first clause →" : "Read the second clause too →";
      pair.innerHTML = `<div class="ci-clause"><small>${esc(one.label)}</small><blockquote>“${esc(one.excerpt)}”</blockquote><p>${esc(one.text)}</p></div>
        <div class="ci-clause${open ? "" : " ci-unread"}"><small>${open ? esc(two.label) : "Read on before assigning a status"}</small>${open ? `<blockquote>“${esc(two.excerpt)}”</blockquote>` : ""}<p>${open ? esc(two.text) : "A conditional placement is not an unqualified verdict."}</p></div>`;
      note.innerHTML = open ? `<p>${esc(E.explanation)}</p>${cite(E.sourceIds)}` : cite(E.sourceIds);
    };
    button.addEventListener("click", () => draw(button.getAttribute("aria-expanded") !== "true"));
    draw(false);
  }
  function wireC(root) {
    let segment = 0;
    const box = root.querySelector(".ci-inventory"), note = root.querySelector(".ci-leaf-note"), listed = root.querySelector('.ci-leaf[data-s="3"]');
    const draw = () => {
      root.querySelectorAll(".ci-leaf").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.s) === segment)));
      const s = codex.segments[segment];
      note.innerHTML = `<strong>${esc(s.name)}</strong><p>${esc(s.note)}</p>`;
    };
    box.addEventListener("change", () => { listed.hidden = !box.checked; if (!box.checked && segment === 3) segment = 0; draw(); });
    root.querySelector(".ci-strip").addEventListener("click", (e) => { const b = e.target.closest(".ci-leaf"); if (b) { segment = Number(b.dataset.s); draw(); } });
    draw();
  }

  function mount(section, { num }) {
    section.innerHTML = `${head(num, "The evidence room · three close investigations", "Where the boundaries <em>become visible</em>", "A list can look decisive until you ask what its categories mean. A manuscript can look complete until you inspect its ending. Slow down at these three points.")}
      ${caseA()}${caseB()}${caseC()}`;
    wireA(section.querySelector('[data-case="a"]'));
    wireB(section.querySelector('[data-case="b"]'));
    wireC(section.querySelector('[data-case="c"]'));
  }
  Sections.investigations = { mount };
})();
